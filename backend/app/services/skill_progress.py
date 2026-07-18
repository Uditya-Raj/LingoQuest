"""Crown/practice updates and derived unlock transitions."""
from __future__ import annotations

from datetime import datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.course import Course, Skill, Unit
from app.models.progress import LessonAttempt, UserSkillProgress
from app.models.user import User
from app.services.course_path import derive_skill_state


async def get_or_create_progress(
    session: AsyncSession,
    user_id: int,
    skill_id: int,
) -> UserSkillProgress:
    """Load or create the user's progress row for a skill."""
    result = await session.execute(
        select(UserSkillProgress).where(
            UserSkillProgress.user_id == user_id,
            UserSkillProgress.skill_id == skill_id,
        )
    )
    progress = result.scalar_one_or_none()
    if progress is not None:
        return progress

    progress = UserSkillProgress(
        user_id=user_id,
        skill_id=skill_id,
        crowns=0,
        times_practiced=0,
    )
    session.add(progress)
    await session.flush()
    return progress


async def _load_course_skills(
    session: AsyncSession,
    course_id: int,
) -> list[Skill]:
    result = await session.execute(
        select(Course)
        .where(Course.id == course_id)
        .options(selectinload(Course.units).selectinload(Unit.skills))
    )
    course = result.scalar_one()
    skills: list[Skill] = []
    for unit in course.units:
        skills.extend(unit.skills)
    return skills


async def _crowns_map(
    session: AsyncSession,
    user_id: int,
) -> dict[int, int]:
    result = await session.execute(
        select(UserSkillProgress).where(UserSkillProgress.user_id == user_id)
    )
    return {row.skill_id: row.crowns for row in result.scalars().all()}


async def _skills_with_any_attempt(
    session: AsyncSession,
    user_id: int,
) -> set[int]:
    """Skill IDs with any attempt history (including failed)."""
    result = await session.execute(
        select(LessonAttempt.lesson_id)
        .where(LessonAttempt.user_id == user_id)
        .distinct()
    )
    lesson_ids = list(result.scalars().all())
    if not lesson_ids:
        return set()

    from app.models.course import Lesson

    skill_result = await session.execute(
        select(Lesson.skill_id).where(Lesson.id.in_(lesson_ids)).distinct()
    )
    return set(skill_result.scalars().all())


def _unlocked_skill_ids(
    skills: list[Skill],
    crowns: dict[int, int],
    attempted: set[int],
) -> set[int]:
    unlocked: set[int] = set()
    for skill in skills:
        prereq_crowns: int | None = None
        if skill.unlock_requires_skill_id is not None:
            prereq_crowns = crowns.get(skill.unlock_requires_skill_id, 0)
        status = derive_skill_state(
            skill,
            crowns.get(skill.id, 0),
            skill.id in attempted,
            prereq_crowns,
        )
        if status != "locked":
            unlocked.add(skill.id)
    return unlocked


async def apply_standard_crown_and_unlocks(
    session: AsyncSession,
    user: User,
    skill: Skill,
    completed_at: datetime,
) -> tuple[UserSkillProgress, list[int]]:
    """
    Increment crowns (capped) and practice count; return newly unlocked skill IDs.
    """
    if user.active_course_id is None:
        course_skills = [skill]
    else:
        course_skills = await _load_course_skills(session, user.active_course_id)

    crowns_before = await _crowns_map(session, user.id)
    attempted = await _skills_with_any_attempt(session, user.id)
    # Ensure the skill being completed counts as attempted for post-state.
    attempted.add(skill.id)

    before_unlocked = _unlocked_skill_ids(course_skills, crowns_before, attempted)

    progress = await get_or_create_progress(session, user.id, skill.id)
    progress.crowns = min(progress.crowns + 1, skill.max_level)
    progress.times_practiced += 1
    progress.last_practiced_at = completed_at
    await session.flush()

    crowns_after = dict(crowns_before)
    crowns_after[skill.id] = progress.crowns
    after_unlocked = _unlocked_skill_ids(course_skills, crowns_after, attempted)

    newly_unlocked = sorted(after_unlocked - before_unlocked)
    return progress, newly_unlocked


async def apply_timed_practice_update(
    session: AsyncSession,
    user: User,
    skill: Skill,
    completed_at: datetime,
) -> UserSkillProgress:
    """
    Timed completion: increment practice count only.

    Does not add crowns or unlock dependent skills.
    """
    progress = await get_or_create_progress(session, user.id, skill.id)
    progress.times_practiced += 1
    progress.last_practiced_at = completed_at
    await session.flush()
    return progress
