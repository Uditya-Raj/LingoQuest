"""Total-XP leaderboard ranking."""
from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.schemas.leaderboard import LeaderboardEntry, LeaderboardResponse


async def get_leaderboard(
    session: AsyncSession,
    current_user: User,
    limit: int = 10,
) -> LeaderboardResponse:
    """
    Rank users by total_xp DESC, username ASC, id ASC.

    Always returns current_user separately even when outside the limited entries.
    """
    result = await session.execute(
        select(User).order_by(
            User.total_xp.desc(),
            User.username.asc(),
            User.id.asc(),
        )
    )
    ranked = list(result.scalars().all())

    entries: list[LeaderboardEntry] = []
    current_entry: LeaderboardEntry | None = None

    for index, user in enumerate(ranked, start=1):
        entry = LeaderboardEntry(
            rank=index,
            user_id=user.id,
            display_name=user.display_name,
            total_xp=user.total_xp,
            current_streak=user.current_streak,
            is_current_user=user.id == current_user.id,
        )
        if user.id == current_user.id:
            current_entry = entry
        if index <= limit:
            entries.append(entry)

    if current_entry is None:
        current_entry = LeaderboardEntry(
            rank=0,
            user_id=current_user.id,
            display_name=current_user.display_name,
            total_xp=current_user.total_xp,
            current_streak=current_user.current_streak,
            is_current_user=True,
        )

    return LeaderboardResponse(
        ranking_basis="total_xp",
        entries=entries,
        current_user=current_entry,
    )
