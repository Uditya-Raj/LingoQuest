"""Leaderboard routes."""
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.schemas.leaderboard import LeaderboardResponse
from app.services import leaderboard as leaderboard_service

router = APIRouter(tags=["leaderboard"])


@router.get(
    "/leaderboard",
    response_model=LeaderboardResponse,
    status_code=status.HTTP_200_OK,
)
async def get_leaderboard(
    limit: int = Query(default=10, ge=1, le=50),
    session: AsyncSession = Depends(get_session),
    user: User = Depends(get_current_user),
):
    """Return total-XP ranking with current user always present."""
    return await leaderboard_service.get_leaderboard(session, user, limit=limit)
