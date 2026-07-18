"""Lesson engine service for starting and retrieving attempts."""
import random
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import joinedload, selectinload

from app.models.user import User
from app.models.course import Skill, Lesson, Exercise
from app.models.progress import LessonAttempt
from app.core.errors import NotFoundError, ConflictError
from app.core.clock import Clock, get_clock
from app.services import hearts
from app.services.course_path import (
    get_skill_progress, has_active_attempt, derive_skill_state,
    calculate_today_xp, build_learner_summary
)
from app.schemas.lesson import LessonAttemptResponse, PublicExercise, TerminalSummary
from app.schemas.course import ExerciseOption, MatchPairsOptions


ATTEMPT_EXERCISE_COUNT = 10
REQUIRED_EXERCISE_TYPES = [
    "multiple_choice",
    "translate_word_bank",
    "match_pairs",
    "fill_blank",
    "type_answer"
]


def build_public_exercise(exercise: Exercise, position: int) -> PublicExercise:
    """
    Build public exercise without correct_answer.
    
    Converts options to typed schema based on exercise type.
    """
    options_data = None
    
    if exercise.type == "match_pairs" and exercise.options:
        # Convert match pairs options
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
        # Convert list options (multiple_choice, translate_word_bank)
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
        tts_text=None,  # Phase 10D will populate this
        tts_lang=None,
        metadata=exercise.exercise_metadata,
        options=options_data
    )


async def select_stratified_exercises(
    session: AsyncSession,
    lesson_id: int
) -> list[int]:
    """
    Select 10 unique active exercises with all five required types represented.
    
    Strategy:
    1. Get one random exercise from each required type
    2. Fill remaining 5 slots with random other active exercises
    3. Shuffle the final order
    
    Returns list of exercise IDs in randomized order.
    Raises ConflictError if insufficient exercises.
    """
    # Load all active exercises for the lesson
    result = await session.execute(
        select(Exercise)
        .where(
            Exercise.lesson_id == lesson_id,
            Exercise.is_active == True
        )
    )
    all_exercises = result.scalars().all()
    
    if len(all_exercises) < ATTEMPT_EXERCISE_COUNT:
        raise ConflictError(
            f"Insufficient exercises: need {ATTEMPT_EXERCISE_COUNT}, found {len(all_exercises)}"
        )
    
    # Group by type
    by_type = {}
    for ex in all_exercises:
        by_type.setdefault(ex.type, []).append(ex)
    
    # Check all required types are present
    for req_type in REQUIRED_EXERCISE_TYPES:
        if req_type not in by_type or len(by_type[req_type]) == 0:
            raise ConflictError(
                f"Missing required exercise type: {req_type}"
            )
    
    # Select one from each required type
    selected = []
    remaining = list(all_exercises)
    
    for req_type in REQUIRED_EXERCISE_TYPES:
        candidates = by_type[req_type]
        chosen = random.choice(candidates)
        selected.append(chosen.id)
        remaining.remove(chosen)
    
    # Fill remaining slots
    slots_remaining = ATTEMPT_EXERCISE_COUNT - len(selected)
    if slots_remaining > 0:
        additional = random.sample(remaining, min(slots_remaining, len(remaining)))
        selected.extend(ex.id for ex in additional)
    
    # Shuffle final order
    random.shuffle(selected)
    
    return selected


async def start_or_resume_standard(
    session: AsyncSession,
    user: User,
    skill_id: int
) -> tuple[LessonAttemptResponse, bool]:
    """
    Start a new standard-mode attempt or resume an existing one.
    
    Returns: (attempt_response, is_new)
    where is_new is True for 201 Created, False for 200 OK resume.
    """
    clock = get_clock()
    now = clock.now()
    
    # Apply lazy heart regeneration
    hearts.apply_lazy_regeneration(user, now)
    await session.flush()
    
    # Load skill with lesson
    result = await session.execute(
        select(Skill)
        .where(Skill.id == skill_id)
        .options(
            joinedload(Skill.unit),
            selectinload(Skill.lessons)
        )
    )
    skill = result.scalar_one_or_none()
    
    if skill is None:
        raise NotFoundError("Skill", skill_id)
    
    # Verify skill is in user's active course
    if user.active_course_id != skill.unit.course_id:
        raise NotFoundError("Skill not in active course", skill_id)
    
    # Get progress and derive state
    progress = await get_skill_progress(session, user.id, skill_id)
    crowns = progress.crowns if progress else 0
    
    # Check for existing active attempt first
    existing_attempt_id = await has_active_attempt(session, user.id, skill_id)
    
    if existing_attempt_id:
        # Resume existing attempt
        return await retrieve_attempt(session, user, existing_attempt_id, resumed=True)
    
    # Check if skill is locked
    prereq_crowns = None
    if skill.unlock_requires_skill_id is not None:
        prereq_progress = await get_skill_progress(session, user.id, skill.unlock_requires_skill_id)
        prereq_crowns = prereq_progress.crowns if prereq_progress else 0
    
    status = derive_skill_state(skill, crowns, False, prereq_crowns)
    
    if status == "locked":
        raise ConflictError("Skill is locked. Complete the prerequisite skill first.")
    
    # Check hearts
    if user.hearts == 0:
        next_heart_at = hearts.calculate_next_heart_at(user)
        raise ConflictError(f"Out of hearts. Next heart at {next_heart_at}")
    
    # Select lesson (first lesson for now)
    lesson = skill.lessons[0] if skill.lessons else None
    if lesson is None:
        raise NotFoundError("Lesson", f"skill_{skill_id}")
    
    # Select stratified exercises
    exercise_ids = await select_stratified_exercises(session, lesson.id)
    
    # Create new attempt
    new_attempt = LessonAttempt(
        user_id=user.id,
        lesson_id=lesson.id,
        started_at=now,
        status="in_progress",
        exercise_order=exercise_ids,
        current_index=0,
        mistakes_count=0,
        hearts_lost=0,
        xp_earned=None
    )
    
    session.add(new_attempt)
    await session.flush()
    await session.refresh(new_attempt)
    
    # Build response
    return await retrieve_attempt(session, user, new_attempt.id, resumed=False)


async def retrieve_attempt(
    session: AsyncSession,
    user: User,
    attempt_id: int,
    resumed: bool = True
) -> tuple[LessonAttemptResponse, bool]:
    """
    Retrieve an attempt for refresh/resume.
    
    Returns: (attempt_response, is_new)
    where is_new is True for 201 (new attempt), False for 200 (resume/retrieve).
    """
    clock = get_clock()
    now = clock.now()
    
    # Load attempt with relationships
    result = await session.execute(
        select(LessonAttempt)
        .where(LessonAttempt.id == attempt_id)
        .options(
            joinedload(LessonAttempt.lesson)
            .joinedload(Lesson.skill)
        )
    )
    attempt = result.scalar_one_or_none()
    
    if attempt is None:
        raise NotFoundError("Attempt", attempt_id)
    
    # Verify ownership
    if attempt.user_id != user.id:
        raise NotFoundError("Attempt", attempt_id)
    
    # Load exercises in order
    exercise_ids = attempt.exercise_order
    exercises_result = await session.execute(
        select(Exercise)
        .where(Exercise.id.in_(exercise_ids))
    )
    exercises_map = {ex.id: ex for ex in exercises_result.scalars().all()}
    
    # Build ordered public exercises
    public_exercises = []
    for position, exercise_id in enumerate(exercise_ids):
        exercise = exercises_map.get(exercise_id)
        if exercise:
            public_exercises.append(build_public_exercise(exercise, position))
    
    # Build terminal summary if applicable
    terminal_summary = None
    if attempt.status in ("completed", "failed"):
        terminal_summary = TerminalSummary(
            outcome=attempt.status,
            xp_earned=attempt.xp_earned or 0,
            perfect=attempt.mistakes_count == 0,
            failure_reason=None,  # Phase 5A will set this
            completed_at=attempt.completed_at
        )
        # For completed/failed attempts, resumed should be False
        resumed = False
    
    # Apply lazy regeneration for current heart state
    hearts.apply_lazy_regeneration(user, now)
    next_heart_at = hearts.calculate_next_heart_at(user)
    
    # Calculate today's XP
    today_xp = await calculate_today_xp(session, user.id, clock)
    
    # Determine if this is a new attempt (for 201 vs 200 status code)
    is_new = not resumed and attempt.status == "in_progress"
    
    response = LessonAttemptResponse(
        attempt_id=attempt.id,
        skill_id=attempt.lesson.skill_id,
        lesson_id=attempt.lesson_id,
        skill_title=attempt.lesson.skill.title,
        status=attempt.status,
        mode="standard",  # Phase 6B will handle timed mode
        expires_at=None,
        remaining_seconds=None,
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
        terminal_summary=terminal_summary
    )
    
    return (response, is_new)


async def get_attempt(
    session: AsyncSession,
    user: User,
    attempt_id: int
) -> LessonAttemptResponse:
    """
    Get an attempt by ID for the retrieve endpoint.
    
    This is a wrapper around retrieve_attempt for the GET endpoint.
    """
    response, _ = await retrieve_attempt(session, user, attempt_id, resumed=True)
    return response
