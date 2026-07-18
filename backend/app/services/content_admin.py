"""Content-administration tree and exercise create/edit."""
from __future__ import annotations

from copy import deepcopy
from typing import Any

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.errors import ConflictError, DomainError, NotFoundError
from app.models.course import Course, Exercise, Lesson, Skill, Unit
from app.models.progress import LessonAttempt
from app.seed.validators import validate_exercise_contract
from app.schemas.admin import (
    AdminContentTreeResponse,
    AdminCourseNode,
    AdminExerciseCreateRequest,
    AdminExercisePatchRequest,
    AdminExerciseRepresentation,
    AdminLessonNode,
    AdminSkillNode,
    AdminUnitNode,
)


def _serialize_exercise(exercise: Exercise) -> AdminExerciseRepresentation:
    return AdminExerciseRepresentation(
        id=exercise.id,
        lesson_id=exercise.lesson_id,
        order_index=exercise.order_index,
        type=exercise.type,  # type: ignore[arg-type]
        prompt=exercise.prompt,
        audio_url=exercise.audio_url,
        tts_text=exercise.tts_text,
        tts_lang=exercise.tts_lang,
        options=exercise.options,
        correct_answer=exercise.correct_answer,
        metadata=exercise.exercise_metadata,
        is_active=exercise.is_active,
        created_at=exercise.created_at,
        updated_at=exercise.updated_at,
    )


def _validate_or_raise(
    exercise_type: str,
    prompt: str,
    options: Any,
    correct_answer: dict[str, Any],
    tts_text: str | None = None,
    tts_lang: str | None = None,
) -> None:
    try:
        validate_exercise_contract(
            exercise_type,
            prompt,
            options,
            correct_answer,
            tts_text=tts_text,
            tts_lang=tts_lang,
        )
    except ValueError as exc:
        raise DomainError(
            code="INVALID_EXERCISE_CONTRACT",
            message=str(exc),
            status_code=400,
        ) from exc


async def _exercise_in_active_attempt(
    session: AsyncSession,
    exercise_id: int,
) -> bool:
    """True when any in-progress attempt includes this exercise in its order."""
    result = await session.execute(
        select(LessonAttempt).where(LessonAttempt.status == "in_progress")
    )
    for attempt in result.scalars().all():
        order = attempt.exercise_order or []
        if exercise_id in order:
            return True
    return False


async def get_content_tree(session: AsyncSession) -> AdminContentTreeResponse:
    """Return complete ordered course/unit/skill/lesson/exercise tree."""
    result = await session.execute(
        select(Course)
        .options(
            selectinload(Course.units)
            .selectinload(Unit.skills)
            .selectinload(Skill.lessons)
            .selectinload(Lesson.exercises)
        )
        .order_by(Course.id)
    )
    courses = list(result.scalars().unique().all())

    course_nodes: list[AdminCourseNode] = []
    for course in courses:
        units_sorted = sorted(course.units, key=lambda u: u.order_index)
        unit_nodes: list[AdminUnitNode] = []
        for unit in units_sorted:
            skills_sorted = sorted(unit.skills, key=lambda s: s.order_index)
            skill_nodes: list[AdminSkillNode] = []
            for skill in skills_sorted:
                lessons_sorted = sorted(skill.lessons, key=lambda l: l.order_index)
                lesson_nodes: list[AdminLessonNode] = []
                for lesson in lessons_sorted:
                    exercises_sorted = sorted(
                        lesson.exercises, key=lambda e: e.order_index
                    )
                    lesson_nodes.append(
                        AdminLessonNode(
                            id=lesson.id,
                            order_index=lesson.order_index,
                            xp_reward=lesson.xp_reward,
                            exercises=[
                                _serialize_exercise(ex) for ex in exercises_sorted
                            ],
                        )
                    )
                skill_nodes.append(
                    AdminSkillNode(
                        id=skill.id,
                        title=skill.title,
                        lessons=lesson_nodes,
                    )
                )
            unit_nodes.append(
                AdminUnitNode(
                    id=unit.id,
                    title=unit.title,
                    skills=skill_nodes,
                )
            )
        course_nodes.append(
            AdminCourseNode(
                id=course.id,
                title=course.title,
                units=unit_nodes,
            )
        )

    return AdminContentTreeResponse(courses=course_nodes)


async def create_exercise(
    session: AsyncSession,
    body: AdminExerciseCreateRequest,
) -> AdminExerciseRepresentation:
    """Create an exercise after shared contract validation."""
    lesson = (
        await session.execute(select(Lesson).where(Lesson.id == body.lesson_id))
    ).scalar_one_or_none()
    if lesson is None:
        raise NotFoundError("Lesson", body.lesson_id)

    _validate_or_raise(
        body.type,
        body.prompt,
        body.options,
        body.correct_answer,
        tts_text=body.tts_text,
        tts_lang=body.tts_lang,
    )

    exercise = Exercise(
        lesson_id=body.lesson_id,
        order_index=body.order_index,
        type=body.type,
        prompt=body.prompt,
        audio_url=body.audio_url,
        tts_text=body.tts_text,
        tts_lang=body.tts_lang,
        options=body.options,
        correct_answer=body.correct_answer,
        exercise_metadata=body.metadata,
        is_active=body.is_active,
    )
    session.add(exercise)
    try:
        await session.flush()
    except IntegrityError as exc:
        raise ConflictError(
            "Exercise order conflicts with an existing exercise in this lesson",
            code="EXERCISE_ORDER_CONFLICT",
        ) from exc

    await session.refresh(exercise)
    return _serialize_exercise(exercise)


async def patch_exercise(
    session: AsyncSession,
    exercise_id: int,
    body: AdminExercisePatchRequest,
) -> AdminExerciseRepresentation:
    """
    Merge patch onto stored exercise, validate complete contract, then persist.

    Rejects edits when the exercise is referenced by an in-progress attempt.
    """
    exercise = (
        await session.execute(select(Exercise).where(Exercise.id == exercise_id))
    ).scalar_one_or_none()
    if exercise is None:
        raise NotFoundError("Exercise", exercise_id)

    if await _exercise_in_active_attempt(session, exercise_id):
        raise ConflictError(
            "Cannot edit an exercise referenced by an active attempt",
            code="CONTENT_IN_ACTIVE_ATTEMPT",
            details={"exercise_id": exercise_id},
        )

    # Build merged values from submitted fields only.
    patch_data = body.model_dump(exclude_unset=True)
    if not patch_data:
        raise DomainError(
            code="VALIDATION_ERROR",
            message="At least one field is required",
            status_code=422,
        )

    merged_type = patch_data.get("type", exercise.type)
    merged_prompt = patch_data.get("prompt", exercise.prompt)
    merged_options = (
        patch_data["options"] if "options" in patch_data else deepcopy(exercise.options)
    )
    merged_answer = (
        patch_data["correct_answer"]
        if "correct_answer" in patch_data
        else deepcopy(exercise.correct_answer)
    )
    merged_tts_text = (
        patch_data["tts_text"] if "tts_text" in patch_data else exercise.tts_text
    )
    merged_tts_lang = (
        patch_data["tts_lang"] if "tts_lang" in patch_data else exercise.tts_lang
    )

    _validate_or_raise(
        merged_type,
        merged_prompt,
        merged_options,
        merged_answer,
        tts_text=merged_tts_text,
        tts_lang=merged_tts_lang,
    )

    if "lesson_id" in patch_data:
        new_lesson = (
            await session.execute(
                select(Lesson).where(Lesson.id == patch_data["lesson_id"])
            )
        ).scalar_one_or_none()
        if new_lesson is None:
            raise NotFoundError("Lesson", patch_data["lesson_id"])
        exercise.lesson_id = patch_data["lesson_id"]

    if "order_index" in patch_data:
        exercise.order_index = patch_data["order_index"]
    if "type" in patch_data:
        exercise.type = patch_data["type"]
    if "prompt" in patch_data:
        exercise.prompt = patch_data["prompt"]
    if "audio_url" in patch_data:
        exercise.audio_url = patch_data["audio_url"]
    if "tts_text" in patch_data:
        exercise.tts_text = patch_data["tts_text"]
    if "tts_lang" in patch_data:
        exercise.tts_lang = patch_data["tts_lang"]
    if "options" in patch_data:
        exercise.options = patch_data["options"]
    if "correct_answer" in patch_data:
        exercise.correct_answer = patch_data["correct_answer"]
    if "metadata" in patch_data:
        exercise.exercise_metadata = patch_data["metadata"]
    if "is_active" in patch_data:
        exercise.is_active = patch_data["is_active"]

    try:
        await session.flush()
    except IntegrityError as exc:
        raise ConflictError(
            "Exercise order conflicts with an existing exercise in this lesson",
            code="EXERCISE_ORDER_CONFLICT",
        ) from exc

    await session.refresh(exercise)
    return _serialize_exercise(exercise)
