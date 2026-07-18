"""Lesson engine service for starting, retrieving, answering, and completing attempts."""
from __future__ import annotations

import math
import random
from datetime import datetime, timedelta
from typing import Any, Callable

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, func, or_
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import joinedload, selectinload

from app.models.user import User
from app.models.course import Skill, Lesson, Exercise
from app.models.progress import LessonAttempt, ExerciseAnswer
from app.core.errors import NotFoundError, ConflictError
from app.core.clock import get_clock
from app.services import hearts
from app.services import xp as xp_service
from app.services import streak as streak_service
from app.services import skill_progress as skill_progress_service
from app.services import achievements as achievements_service
from app.services.answer_grading import grade_answer
from app.services.hearts import ensure_utc_aware
from app.services.course_path import (
    get_skill_progress, has_active_attempt, derive_skill_state,
)
from app.schemas.lesson import (
    LessonAttemptResponse,
    PublicExercise,
    TerminalSummary,
    AnswerResponse,
    CompletionResponse,
    CompletionSkillSummary,
    CompletionXpSummary,
    CompletionStreakSummary,
    CompletionDailyGoalSummary,
    CompletionAchievementSummary,
    CompletionUserTotals,
)
from app.schemas.course import ExerciseOption, MatchPairsOptions


ATTEMPT_EXERCISE_COUNT = 10
TIMED_PRACTICE_DURATION_SECONDS = 120
REQUIRED_EXERCISE_TYPES = [
    "multiple_choice",
    "translate_word_bank",
    "match_pairs",
    "fill_blank",
    "type_answer",
]

# Test-only hook: raise after earlier completion mutations to verify rollback.
_completion_failure_hook: Callable[[], None] | None = None


def set_completion_failure_hook(hook: Callable[[], None] | None) -> None:
    """Install or clear a test-only failure injector for complete_attempt."""
    global _completion_failure_hook
    _completion_failure_hook = hook


def build_public_exercise(exercise: Exercise, position: int) -> PublicExercise:
    """Build public exercise without correct_answer."""
    options_data = None

    if exercise.type == "match_pairs" and exercise.options:
        left_options = [
            ExerciseOption(id=opt["id"], text=opt["text"])
            for opt in exercise.options.get("left", [])
        ]
        right_options = [
            ExerciseOption(id=opt["id"], text=opt["text"])
            for opt in exercise.options.get("right", [])
        ]
        options_data = MatchPairsOptions(left=left_options, right=right_options)
    elif exercise.options and isinstance(exercise.options, list):
        options_data = [
            ExerciseOption(id=opt["id"], text=opt["text"])
            for opt in exercise.options
        ]

    return PublicExercise(
        id=exercise.id,
        position=position,
        type=exercise.type,
        prompt=exercise.prompt,
        audio_url=exercise.audio_url,
        tts_text=exercise.tts_text,
        tts_lang=exercise.tts_lang,
        metadata=exercise.exercise_metadata,
        options=options_data,
    )


def _remaining_seconds(expires_at: datetime | None, now: datetime) -> int | None:
    """Server-authoritative countdown; null for standard attempts."""
    if expires_at is None:
        return None
    delta = (ensure_utc_aware(expires_at) - ensure_utc_aware(now)).total_seconds()
    return max(0, int(math.floor(delta)))


def _is_timed_expired(attempt: LessonAttempt, now: datetime) -> bool:
    """True when timed mode and logical_now > expires_at."""
    if getattr(attempt, "mode", "standard") != "timed":
        return False
    if attempt.expires_at is None:
        return True
    return ensure_utc_aware(now) > ensure_utc_aware(attempt.expires_at)


async def _fail_time_expired(
    session: AsyncSession,
    attempt: LessonAttempt,
    now: datetime,
) -> None:
    """Atomically mark a timed attempt failed for expiry (idempotent)."""
    if attempt.status != "in_progress":
        return
    claim = await session.execute(
        update(LessonAttempt)
        .where(
            LessonAttempt.id == attempt.id,
            LessonAttempt.status == "in_progress",
        )
        .values(
            status="failed",
            failure_reason="time_expired",
            completed_at=now,
        )
    )
    if claim.rowcount == 1:
        attempt.status = "failed"
        attempt.failure_reason = "time_expired"
        attempt.completed_at = now
        await session.flush()
    else:
        await session.refresh(attempt)


async def select_stratified_exercises(
    session: AsyncSession,
    lesson_id: int,
) -> list[int]:
    """
    Select 10 unique active exercises with all five required types represented.

    Raises ConflictError(INSUFFICIENT_EXERCISES) if the pool cannot build a playable attempt.
    """
    result = await session.execute(
        select(Exercise).where(
            Exercise.lesson_id == lesson_id,
            Exercise.is_active == True,  # noqa: E712
        )
    )
    all_exercises = list(result.scalars().all())

    if len(all_exercises) < ATTEMPT_EXERCISE_COUNT:
        raise ConflictError(
            f"Insufficient exercises: need {ATTEMPT_EXERCISE_COUNT}, found {len(all_exercises)}",
            code="INSUFFICIENT_EXERCISES",
        )

    by_type: dict[str, list[Exercise]] = {}
    for ex in all_exercises:
        by_type.setdefault(ex.type, []).append(ex)

    for req_type in REQUIRED_EXERCISE_TYPES:
        if req_type not in by_type or len(by_type[req_type]) == 0:
            raise ConflictError(
                f"Missing required exercise type: {req_type}",
                code="INSUFFICIENT_EXERCISES",
            )

    selected: list[int] = []
    remaining = list(all_exercises)

    for req_type in REQUIRED_EXERCISE_TYPES:
        candidates = by_type[req_type]
        chosen = random.choice(candidates)
        selected.append(chosen.id)
        remaining.remove(chosen)

    slots_remaining = ATTEMPT_EXERCISE_COUNT - len(selected)
    if slots_remaining > 0:
        additional = random.sample(remaining, min(slots_remaining, len(remaining)))
        selected.extend(ex.id for ex in additional)

    random.shuffle(selected)
    return selected


async def _resolve_skill_for_start(
    session: AsyncSession,
    user: User,
    skill_id: int,
) -> Skill:
    result = await session.execute(
        select(Skill)
        .where(Skill.id == skill_id)
        .options(
            joinedload(Skill.unit),
            selectinload(Skill.lessons),
        )
    )
    skill = result.scalar_one_or_none()
    if skill is None:
        raise NotFoundError("Skill", skill_id)
    if user.active_course_id != skill.unit.course_id:
        raise NotFoundError("Skill not in active course", skill_id)
    return skill


async def _assert_skill_unlocked(
    session: AsyncSession,
    user: User,
    skill: Skill,
) -> None:
    progress = await get_skill_progress(session, user.id, skill.id)
    crowns = progress.crowns if progress else 0

    prereq_crowns = None
    if skill.unlock_requires_skill_id is not None:
        prereq_progress = await get_skill_progress(
            session, user.id, skill.unlock_requires_skill_id
        )
        prereq_crowns = prereq_progress.crowns if prereq_progress else 0

    status = derive_skill_state(skill, crowns, False, prereq_crowns)
    if status == "locked":
        raise ConflictError(
            "Skill is locked. Complete the prerequisite skill first.",
            code="SKILL_LOCKED",
            details={"prerequisite_skill_id": skill.unlock_requires_skill_id},
        )


async def start_or_resume_standard(
    session: AsyncSession,
    user: User,
    skill_id: int,
) -> tuple[LessonAttemptResponse, bool]:
    """Start a new standard-mode attempt or resume an existing one."""
    clock = get_clock()
    now = clock.now()

    hearts.apply_lazy_regeneration(user, now)
    await session.flush()

    skill = await _resolve_skill_for_start(session, user, skill_id)

    existing_attempt_id = await has_active_attempt(session, user.id, skill_id)
    if existing_attempt_id:
        return await retrieve_attempt(session, user, existing_attempt_id, resumed=True)

    await _assert_skill_unlocked(session, user, skill)

    if user.hearts == 0:
        next_heart_at = hearts.calculate_next_heart_at(user)
        raise ConflictError(
            f"Out of hearts. Next heart at {next_heart_at}",
            code="OUT_OF_HEARTS",
            details={"next_heart_at": next_heart_at.isoformat() if next_heart_at else None},
        )

    lesson = skill.lessons[0] if skill.lessons else None
    if lesson is None:
        raise NotFoundError("Lesson", f"skill_{skill_id}")

    exercise_ids = await select_stratified_exercises(session, lesson.id)

    new_attempt = LessonAttempt(
        user_id=user.id,
        lesson_id=lesson.id,
        started_at=now,
        status="in_progress",
        mode="standard",
        expires_at=None,
        failure_reason=None,
        exercise_order=exercise_ids,
        current_index=0,
        mistakes_count=0,
        hearts_lost=0,
        xp_earned=None,
    )
    session.add(new_attempt)
    await session.flush()
    await session.refresh(new_attempt)

    return await retrieve_attempt(session, user, new_attempt.id, resumed=False)


async def start_timed_practice(
    session: AsyncSession,
    user: User,
    skill_id: int,
) -> tuple[LessonAttemptResponse, bool]:
    """
    Start a timed-practice attempt for an unlocked skill.

    Does not check hearts. Returns an existing active attempt for the skill when
    present (duplicate/concurrent protection). Duration is always backend-set.
    """
    clock = get_clock()
    now = clock.now()

    skill = await _resolve_skill_for_start(session, user, skill_id)

    existing_attempt_id = await has_active_attempt(session, user.id, skill_id)
    if existing_attempt_id:
        return await retrieve_attempt(session, user, existing_attempt_id, resumed=True)

    await _assert_skill_unlocked(session, user, skill)

    lesson = skill.lessons[0] if skill.lessons else None
    if lesson is None:
        raise NotFoundError("Lesson", f"skill_{skill_id}")

    exercise_ids = await select_stratified_exercises(session, lesson.id)
    expires_at = ensure_utc_aware(now) + timedelta(seconds=TIMED_PRACTICE_DURATION_SECONDS)

    new_attempt = LessonAttempt(
        user_id=user.id,
        lesson_id=lesson.id,
        started_at=now,
        status="in_progress",
        mode="timed",
        expires_at=expires_at,
        failure_reason=None,
        exercise_order=exercise_ids,
        current_index=0,
        mistakes_count=0,
        hearts_lost=0,
        xp_earned=None,
    )
    session.add(new_attempt)
    await session.flush()

    # Concurrent create race: keep the earliest attempt; discard extras with no answers.
    race_result = await session.execute(
        select(LessonAttempt)
        .join(Lesson, LessonAttempt.lesson_id == Lesson.id)
        .where(
            LessonAttempt.user_id == user.id,
            Lesson.skill_id == skill_id,
            LessonAttempt.status == "in_progress",
        )
        .order_by(LessonAttempt.id.asc())
    )
    actives = list(race_result.scalars().all())
    if len(actives) > 1:
        winner = actives[0]
        for loser in actives[1:]:
            await session.delete(loser)
        await session.flush()
        return await retrieve_attempt(session, user, winner.id, resumed=True)

    await session.refresh(new_attempt)
    return await retrieve_attempt(session, user, new_attempt.id, resumed=False)


async def retrieve_attempt(
    session: AsyncSession,
    user: User,
    attempt_id: int,
    resumed: bool = True,
) -> tuple[LessonAttemptResponse, bool]:
    """Retrieve an attempt for refresh/resume; enforce timed expiry on read."""
    clock = get_clock()
    now = clock.now()

    result = await session.execute(
        select(LessonAttempt)
        .where(LessonAttempt.id == attempt_id)
        .options(
            joinedload(LessonAttempt.lesson).joinedload(Lesson.skill)
        )
    )
    attempt = result.scalar_one_or_none()

    if attempt is None:
        raise NotFoundError("Attempt", attempt_id)
    if attempt.user_id != user.id:
        raise NotFoundError("Attempt", attempt_id)

    if attempt.status == "in_progress" and _is_timed_expired(attempt, now):
        await _fail_time_expired(session, attempt, now)

    exercise_ids = attempt.exercise_order
    exercises_result = await session.execute(
        select(Exercise).where(Exercise.id.in_(exercise_ids))
    )
    exercises_map = {ex.id: ex for ex in exercises_result.scalars().all()}

    public_exercises = []
    for position, exercise_id in enumerate(exercise_ids):
        exercise = exercises_map.get(exercise_id)
        if exercise:
            public_exercises.append(build_public_exercise(exercise, position))

    terminal_summary = None
    if attempt.status in ("completed", "failed"):
        terminal_summary = TerminalSummary(
            outcome=attempt.status,  # type: ignore[arg-type]
            xp_earned=attempt.xp_earned or 0,
            perfect=attempt.mistakes_count == 0,
            failure_reason=attempt.failure_reason,  # type: ignore[arg-type]
            completed_at=attempt.completed_at,
        )
        resumed = False

    hearts.apply_lazy_regeneration(user, now)
    next_heart_at = hearts.calculate_next_heart_at(user)

    mode = getattr(attempt, "mode", None) or "standard"
    expires_at = attempt.expires_at if mode == "timed" else None
    remaining = _remaining_seconds(expires_at, now) if mode == "timed" else None

    is_new = not resumed and attempt.status == "in_progress"

    response = LessonAttemptResponse(
        attempt_id=attempt.id,
        skill_id=attempt.lesson.skill_id,
        lesson_id=attempt.lesson_id,
        skill_title=attempt.lesson.skill.title,
        status=attempt.status,  # type: ignore[arg-type]
        mode=mode,  # type: ignore[arg-type]
        expires_at=expires_at,
        remaining_seconds=remaining,
        resumed=resumed,
        started_at=attempt.started_at,
        completed_at=attempt.completed_at,
        current_index=attempt.current_index,
        total_exercises=len(attempt.exercise_order),
        hearts=user.hearts,
        max_hearts=user.max_hearts,
        next_heart_at=next_heart_at,
        mistakes_count=attempt.mistakes_count,
        exercises=public_exercises,
        terminal_summary=terminal_summary,
    )
    return (response, is_new)


async def get_attempt(
    session: AsyncSession,
    user: User,
    attempt_id: int,
) -> LessonAttemptResponse:
    """Get an attempt by ID for the retrieve endpoint."""
    response, _ = await retrieve_attempt(session, user, attempt_id, resumed=True)
    return response


async def _load_owned_attempt(
    session: AsyncSession,
    user: User,
    attempt_id: int,
) -> LessonAttempt:
    """Load an attempt owned by the current user, or raise 404."""
    result = await session.execute(
        select(LessonAttempt).where(LessonAttempt.id == attempt_id)
    )
    attempt = result.scalar_one_or_none()
    if attempt is None or attempt.user_id != user.id:
        raise NotFoundError("Attempt", attempt_id)
    return attempt


async def submit_answer(
    session: AsyncSession,
    user: User,
    attempt_id: int,
    exercise_id: int,
    position: int,
    answer: dict[str, Any],
) -> AnswerResponse:
    """Grade and persist one answer; enforce timed expiry and mode-specific hearts."""
    clock = get_clock()
    now = clock.now()

    attempt = await _load_owned_attempt(session, user, attempt_id)

    if attempt.status != "in_progress":
        raise ConflictError(
            "Attempt is already completed or failed",
            code="ATTEMPT_TERMINAL",
        )

    if _is_timed_expired(attempt, now):
        await _fail_time_expired(session, attempt, now)
        raise ConflictError(
            "Timed practice has expired",
            code="TIME_EXPIRED",
            details={
                "failure_reason": "time_expired",
                "completed_at": attempt.completed_at.isoformat()
                if attempt.completed_at
                else None,
            },
        )

    if position != attempt.current_index:
        raise ConflictError(
            f"Expected position {attempt.current_index}, got {position}",
            code="ANSWER_OUT_OF_ORDER",
        )

    exercise_order = attempt.exercise_order
    if position < 0 or position >= len(exercise_order):
        raise ConflictError(
            f"Position {position} is out of range",
            code="ANSWER_OUT_OF_ORDER",
        )

    expected_exercise_id = exercise_order[position]
    if exercise_id != expected_exercise_id:
        raise ConflictError(
            f"Expected exercise_id {expected_exercise_id}, got {exercise_id}",
            code="ANSWER_OUT_OF_ORDER",
        )

    existing_result = await session.execute(
        select(ExerciseAnswer).where(
            ExerciseAnswer.lesson_attempt_id == attempt.id,
            or_(
                ExerciseAnswer.position == position,
                ExerciseAnswer.exercise_id == exercise_id,
            ),
        )
    )
    if existing_result.scalar_one_or_none() is not None:
        raise ConflictError(
            "Answer already submitted for this position or exercise",
            code="ANSWER_ALREADY_SUBMITTED",
        )

    exercise_result = await session.execute(
        select(Exercise).where(Exercise.id == exercise_id)
    )
    exercise = exercise_result.scalar_one_or_none()
    if exercise is None:
        raise NotFoundError("Exercise", exercise_id)

    grade_result = grade_answer(
        exercise.type,
        exercise.options,
        exercise.correct_answer,
        answer,
    )

    mode = getattr(attempt, "mode", None) or "standard"
    hearts.apply_lazy_regeneration(user, now)

    answer_row = ExerciseAnswer(
        lesson_attempt_id=attempt.id,
        exercise_id=exercise.id,
        position=position,
        exercise_type=exercise.type,
        submitted_answer=answer,
        correct_answer_snapshot=grade_result.revealed_correct_answer,
        is_correct=grade_result.is_correct,
        answered_at=now,
    )
    session.add(answer_row)

    attempt.current_index = attempt.current_index + 1

    if not grade_result.is_correct:
        attempt.mistakes_count = attempt.mistakes_count + 1
        if mode == "standard":
            hearts.lose_heart(user, now)
            attempt.hearts_lost = attempt.hearts_lost + 1
            if user.hearts == 0:
                attempt.status = "failed"
                attempt.completed_at = now
                attempt.failure_reason = "out_of_hearts"

    try:
        await session.flush()
    except IntegrityError as exc:
        raise ConflictError(
            "Answer already submitted for this position or exercise",
            code="ANSWER_ALREADY_SUBMITTED",
        ) from exc

    total_exercises = len(exercise_order)
    if mode == "timed":
        can_complete = (
            attempt.current_index == total_exercises
            and attempt.status == "in_progress"
        )
    else:
        can_complete = (
            attempt.current_index == total_exercises
            and attempt.status == "in_progress"
            and user.hearts > 0
        )

    return AnswerResponse(
        attempt_id=attempt.id,
        exercise_id=exercise.id,
        position=position,
        is_correct=grade_result.is_correct,
        correct_answer=grade_result.revealed_correct_answer,
        current_index=attempt.current_index,
        total_exercises=total_exercises,
        mistakes_count=attempt.mistakes_count,
        hearts_remaining=user.hearts,
        max_hearts=user.max_hearts,
        next_heart_at=hearts.calculate_next_heart_at(user),
        lesson_status=attempt.status,  # type: ignore[arg-type]
        can_complete=can_complete,
    )


async def complete_attempt(
    session: AsyncSession,
    user: User,
    attempt_id: int,
) -> CompletionResponse:
    """Atomically complete an attempt and apply mode-specific gamification."""
    clock = get_clock()
    now = clock.now()
    today = clock.logical_date()

    result = await session.execute(
        select(LessonAttempt)
        .where(LessonAttempt.id == attempt_id)
        .options(
            joinedload(LessonAttempt.lesson).joinedload(Lesson.skill)
        )
    )
    attempt = result.scalar_one_or_none()
    if attempt is None or attempt.user_id != user.id:
        raise NotFoundError("Attempt", attempt_id)

    if attempt.status == "completed":
        raise ConflictError(
            "Attempt is already completed",
            code="ATTEMPT_ALREADY_COMPLETED",
        )
    if attempt.status == "failed":
        raise ConflictError(
            "Failed attempts cannot be completed",
            code="ATTEMPT_FAILED",
        )
    if attempt.status != "in_progress":
        raise ConflictError(
            "Attempt is not in progress",
            code="ATTEMPT_TERMINAL",
        )

    if _is_timed_expired(attempt, now):
        await _fail_time_expired(session, attempt, now)
        raise ConflictError(
            "Timed practice has expired",
            code="TIME_EXPIRED",
            details={"failure_reason": "time_expired"},
        )

    mode = getattr(attempt, "mode", None) or "standard"
    hearts.apply_lazy_regeneration(user, now)

    if mode == "standard" and user.hearts <= 0:
        raise ConflictError(
            "Cannot complete a lesson with zero hearts",
            code="OUT_OF_HEARTS",
        )

    exercise_order = attempt.exercise_order
    total_exercises = len(exercise_order)
    if attempt.current_index != total_exercises:
        raise ConflictError(
            "Not all exercises have been answered",
            code="LESSON_NOT_READY",
        )

    answer_count = (
        await session.execute(
            select(func.count())
            .select_from(ExerciseAnswer)
            .where(ExerciseAnswer.lesson_attempt_id == attempt.id)
        )
    ).scalar_one()
    if answer_count != total_exercises:
        raise ConflictError(
            "Not all exercises have been answered",
            code="LESSON_NOT_READY",
        )

    lesson = attempt.lesson
    skill = lesson.skill

    if mode == "timed":
        xp_award = xp_service.calculate_timed_xp(attempt.mistakes_count)
    else:
        xp_award = xp_service.calculate_standard_xp(
            lesson.xp_reward, attempt.mistakes_count
        )

    claim = await session.execute(
        update(LessonAttempt)
        .where(
            LessonAttempt.id == attempt.id,
            LessonAttempt.status == "in_progress",
        )
        .values(
            status="completed",
            completed_at=now,
            activity_date=today,
            xp_earned=xp_award.earned,
        )
    )
    if claim.rowcount != 1:
        await session.refresh(attempt)
        if attempt.status == "completed":
            raise ConflictError(
                "Attempt is already completed",
                code="ATTEMPT_ALREADY_COMPLETED",
            )
        if attempt.status == "failed":
            raise ConflictError(
                "Failed attempts cannot be completed",
                code="ATTEMPT_FAILED",
            )
        raise ConflictError(
            "Could not claim attempt for completion",
            code="CONFLICT",
        )

    attempt.status = "completed"
    attempt.completed_at = now
    attempt.activity_date = today
    attempt.xp_earned = xp_award.earned

    user.total_xp += xp_award.earned
    extended_today = streak_service.apply_streak(user, today)

    unlocked_skill_ids: list[int] = []
    if mode == "timed":
        progress = await skill_progress_service.apply_timed_practice_update(
            session, user, skill, now
        )
    else:
        progress, unlocked_skill_ids = (
            await skill_progress_service.apply_standard_crown_and_unlocks(
                session, user, skill, now
            )
        )

    new_achievements = await achievements_service.evaluate_and_award_achievements(
        session, user, now
    )

    if _completion_failure_hook is not None:
        _completion_failure_hook()

    await session.flush()

    today_xp = await xp_service.calculate_today_xp(session, user.id, today)
    daily_goal = xp_service.build_daily_goal_progress(today_xp, user.daily_goal_xp)

    prereq_crowns: int | None = None
    if skill.unlock_requires_skill_id is not None:
        prereq_progress = await get_skill_progress(
            session, user.id, skill.unlock_requires_skill_id
        )
        prereq_crowns = prereq_progress.crowns if prereq_progress else 0
    skill_status = derive_skill_state(
        skill, progress.crowns, True, prereq_crowns
    )

    return CompletionResponse(
        attempt_id=attempt.id,
        skill=CompletionSkillSummary(
            id=skill.id,
            title=skill.title,
            new_crowns=progress.crowns,
            max_level=skill.max_level,
            status=skill_status,
        ),
        xp=CompletionXpSummary(
            base=xp_award.base,
            perfect_bonus=xp_award.perfect_bonus,
            earned=xp_award.earned,
            perfect=xp_award.perfect,
        ),
        streak=CompletionStreakSummary(
            current=user.current_streak,
            longest=user.longest_streak,
            extended_today=extended_today,
            activity_date=today.isoformat(),
        ),
        daily_goal=CompletionDailyGoalSummary(
            today_xp=daily_goal.today_xp,
            goal_xp=daily_goal.goal_xp,
            progress=daily_goal.progress,
            reached=daily_goal.reached,
        ),
        unlocked_skill_ids=unlocked_skill_ids,
        achievements_unlocked=[
            CompletionAchievementSummary(
                key=a.key,
                title=a.title,
                description=a.description,
                icon=a.icon,
            )
            for a in new_achievements
        ],
        user_totals=CompletionUserTotals(
            total_xp=user.total_xp,
            hearts=user.hearts,
            max_hearts=user.max_hearts,
            gems=user.gems,
        ),
        completed_at=now,
    )
