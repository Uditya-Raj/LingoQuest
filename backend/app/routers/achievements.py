"""Achievements list route."""
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.schemas.achievements import AchievementsListResponse
from app.services import achievements as achievements_service

router = APIRouter(tags=["achievements"])


@router.get(
    "/achievements",
    response_model=AchievementsListResponse,
    status_code=status.HTTP_200_OK,
)
async def list_achievements(
    session: AsyncSession = Depends(get_session),
    user: User = Depends(get_current_user),
):
    """Return active achievements with earned state and live progress."""
    return await achievements_service.list_achievements_for_user(session, user)
