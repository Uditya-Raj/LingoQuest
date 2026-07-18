"""Achievement criteria evaluation and idempotent awards."""
from __future__ import annotations

from datetime import datetime

from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.achievement import Achievement, UserAchievement
from app.models.course import Skill
from app.models.progress import LessonAttempt, UserSkillProgress
from app.models.user import User


async def count_skills_completed(session: AsyncSession, user_id: int) -> int:
    """Count progress rows whose crowns reach the related skill max_level."""
    result = await session.execute(
        select(func.count())
        .select_from(UserSkillProgress)
        .join(Skill, Skill.id == UserSkillProgress.skill_id)
        .where(
            UserSkillProgress.user_id == user_id,
            UserSkillProgress.crowns >= Skill.max_level,
        )
    )
    return int(result.scalar_one())


async def count_perfect_lessons(session: AsyncSession, user_id: int) -> int:
    """Count completed attempts with zero mistakes."""
    result = await session.execute(
        select(func.count())
        .select_from(LessonAttempt)
        .where(
            LessonAttempt.user_id == user_id,
            LessonAttempt.status == "completed",
            LessonAttempt.mistakes_count == 0,
        )
    )
    return int(result.scalar_one())


async def criteria_current_value(
    session: AsyncSession,
    user: User,
    criteria_type: str,
) -> int:
    """Resolve the live criteria value after XP/streak/crown updates."""
    if criteria_type == "streak_days":
        return user.current_streak
    if criteria_type == "total_xp":
        return user.total_xp
    if criteria_type == "skills_completed":
        return await count_skills_completed(session, user.id)
    if criteria_type == "perfect_lessons":
        return await count_perfect_lessons(session, user.id)
    return 0


async def evaluate_and_award_achievements(
    session: AsyncSession,
    user: User,
    earned_at: datetime,
) -> list[Achievement]:
    """
    Award every newly met active achievement exactly once.

    Returns only achievements inserted by this call. Uses a savepoint plus the
    unique (user_id, achievement_id) constraint as the final idempotency guard.
    """
    active_result = await session.execute(
        select(Achievement).where(Achievement.is_active.is_(True))
    )
    active = list(active_result.scalars().all())
    if not active:
        return []

    earned_result = await session.execute(
        select(UserAchievement.achievement_id).where(
            UserAchievement.user_id == user.id
        )
    )
    already_earned = set(earned_result.scalars().all())

    newly_awarded: list[Achievement] = []
    for achievement in active:
        if achievement.id in already_earned:
            continue
        current = await criteria_current_value(
            session, user, achievement.criteria_type
        )
        if current < achievement.criteria_value:
            continue

        try:
            async with session.begin_nested():
                session.add(
                    UserAchievement(
                        user_id=user.id,
                        achievement_id=achievement.id,
                        earned_at=earned_at,
                    )
                )
                await session.flush()
        except IntegrityError:
            # Unique constraint: already awarded (concurrent or race).
            continue

        newly_awarded.append(achievement)
        already_earned.add(achievement.id)

    return newly_awarded
