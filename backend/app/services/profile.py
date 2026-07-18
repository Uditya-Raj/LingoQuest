"""Profile aggregates and settings updates."""
from __future__ import annotations

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.clock import get_clock
from app.core.errors import DomainError
from app.models.achievement import Achievement, UserAchievement
from app.models.course import Course
from app.models.progress import LessonAttempt
from app.models.user import User
from app.services import hearts
from app.services import achievements as achievements_service
from app.services import xp as xp_service
from app.schemas.user import (
    ProfileResponse,
    ProfileUserInfo,
    ProfileActiveCourse,
    ProfileStats,
    ProfileAchievement,
    UserPatchRequest,
    UserPatchResponse,
)


async def count_lessons_completed(session: AsyncSession, user_id: int) -> int:
    """Count successfully completed lesson attempts."""
    result = await session.execute(
        select(func.count())
        .select_from(LessonAttempt)
        .where(
            LessonAttempt.user_id == user_id,
            LessonAttempt.status == "completed",
        )
    )
    return int(result.scalar_one())


async def get_profile(session: AsyncSession, user: User) -> ProfileResponse:
    """Build the full profile response with lazy heart regeneration."""
    clock = get_clock()
    now = clock.now()
    hearts.apply_lazy_regeneration(user, now)
    await session.flush()

    today_xp = await xp_service.calculate_today_xp(
        session, user.id, clock.logical_date()
    )
    goal = xp_service.build_daily_goal_progress(today_xp, user.daily_goal_xp)

    skills_completed = await achievements_service.count_skills_completed(
        session, user.id
    )
    lessons_completed = await count_lessons_completed(session, user.id)
    perfect_lessons = await achievements_service.count_perfect_lessons(
        session, user.id
    )

    active_course = None
    if user.active_course_id is not None:
        course = (
            await session.execute(
                select(Course).where(Course.id == user.active_course_id)
            )
        ).scalar_one_or_none()
        if course is not None:
            active_course = ProfileActiveCourse(
                id=course.id,
                title=course.title,
                icon=course.icon,
            )

    earned_result = await session.execute(
        select(UserAchievement).where(UserAchievement.user_id == user.id)
    )
    earned_by_id = {
        ua.achievement_id: ua for ua in earned_result.scalars().all()
    }

    active_defs = (
        await session.execute(
            select(Achievement)
            .where(Achievement.is_active.is_(True))
            .order_by(Achievement.id)
        )
    ).scalars().all()

    achievement_rows = [
        ProfileAchievement(
            id=a.id,
            key=a.key,
            title=a.title,
            description=a.description,
            icon=a.icon,
            earned=a.id in earned_by_id,
            earned_at=earned_by_id[a.id].earned_at if a.id in earned_by_id else None,
        )
        for a in active_defs
    ]

    return ProfileResponse(
        user=ProfileUserInfo(
            id=user.id,
            username=user.username,
            display_name=user.display_name,
            email=user.email,
            joined_at=user.created_at,
            active_course=active_course,
        ),
        stats=ProfileStats(
            total_xp=user.total_xp,
            today_xp=today_xp,
            daily_goal_xp=user.daily_goal_xp,
            daily_goal_progress=goal.progress,
            current_streak=user.current_streak,
            longest_streak=user.longest_streak,
            hearts=user.hearts,
            max_hearts=user.max_hearts,
            gems=user.gems,
            skills_completed=skills_completed,
            lessons_completed=lessons_completed,
            perfect_lessons=perfect_lessons,
        ),
        achievements=achievement_rows,
    )


async def patch_profile(
    session: AsyncSession,
    user: User,
    body: UserPatchRequest,
) -> UserPatchResponse:
    """Persist display_name and/or daily_goal_xp; recompute goal progress only."""
    if body.display_name is not None:
        trimmed = body.display_name.strip()
        if not trimmed or len(trimmed) > 50:
            raise DomainError(
                code="VALIDATION_ERROR",
                message="display_name must be 1–50 characters after trimming",
                status_code=422,
            )
        user.display_name = trimmed

    if body.daily_goal_xp is not None:
        user.daily_goal_xp = body.daily_goal_xp

    await session.flush()

    clock = get_clock()
    today_xp = await xp_service.calculate_today_xp(
        session, user.id, clock.logical_date()
    )
    goal = xp_service.build_daily_goal_progress(today_xp, user.daily_goal_xp)

    return UserPatchResponse(
        display_name=user.display_name,
        daily_goal_xp=user.daily_goal_xp,
        today_xp=today_xp,
        daily_goal_progress=goal.progress,
    )
