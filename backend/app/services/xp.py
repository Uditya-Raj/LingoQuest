"""XP calculation, daily XP aggregation, and daily-goal progress."""
from __future__ import annotations

from dataclasses import dataclass
from datetime import date
from math import floor

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.clock import Clock
from app.models.progress import LessonAttempt

PERFECT_BONUS_NUMERATOR = 1
PERFECT_BONUS_DENOMINATOR = 2


@dataclass(frozen=True)
class XpAward:
    """Standard-mode XP breakdown for one successful completion."""

    base: int
    perfect_bonus: int
    earned: int
    perfect: bool


@dataclass(frozen=True)
class DailyGoalProgress:
    """Today XP and capped daily-goal progress."""

    today_xp: int
    goal_xp: int
    progress: float
    reached: bool


def calculate_standard_xp(base_xp: int, mistakes_count: int) -> XpAward:
    """
    Award lesson XP plus floor(base/2) perfect bonus when mistakes_count == 0.

    Timed-mode fixed 20 XP is staged for Phase 6B; callers must not use this
    helper for timed completions.
    """
    perfect = mistakes_count == 0
    perfect_bonus = (
        floor(base_xp * PERFECT_BONUS_NUMERATOR / PERFECT_BONUS_DENOMINATOR)
        if perfect
        else 0
    )
    return XpAward(
        base=base_xp,
        perfect_bonus=perfect_bonus,
        earned=base_xp + perfect_bonus,
        perfect=perfect,
    )


def build_daily_goal_progress(today_xp: int, goal_xp: int) -> DailyGoalProgress:
    """Build capped daily-goal progress from today XP and the learner's goal."""
    if goal_xp <= 0:
        progress = 0.0
        reached = False
    else:
        progress = min(today_xp / goal_xp, 1.0)
        reached = today_xp >= goal_xp
    return DailyGoalProgress(
        today_xp=today_xp,
        goal_xp=goal_xp,
        progress=progress,
        reached=reached,
    )


async def sum_completed_xp(session: AsyncSession, user_id: int) -> int:
    """Sum xp_earned for all completed attempts (total_xp cache invariant)."""
    result = await session.execute(
        select(LessonAttempt.xp_earned).where(
            LessonAttempt.user_id == user_id,
            LessonAttempt.status == "completed",
        )
    )
    return sum(xp or 0 for xp in result.scalars().all())


async def calculate_today_xp(
    session: AsyncSession,
    user_id: int,
    logical_today: date,
) -> int:
    """Sum completed-attempt XP whose activity_date equals the logical date."""
    result = await session.execute(
        select(LessonAttempt.xp_earned).where(
            LessonAttempt.user_id == user_id,
            LessonAttempt.status == "completed",
            LessonAttempt.activity_date == logical_today,
        )
    )
    return sum(xp or 0 for xp in result.scalars().all())


async def calculate_today_xp_for_clock(
    session: AsyncSession,
    user_id: int,
    clock: Clock,
) -> int:
    """Convenience wrapper using the clock's logical date."""
    return await calculate_today_xp(session, user_id, clock.logical_date())
