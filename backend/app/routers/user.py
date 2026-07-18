"""User profile and settings routes."""
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.schemas.user import ProfileResponse, UserPatchRequest, UserPatchResponse
from app.services import profile as profile_service

router = APIRouter(tags=["user"])


@router.get(
    "/user/me",
    response_model=ProfileResponse,
    status_code=status.HTTP_200_OK,
)
async def get_me(
    session: AsyncSession = Depends(get_session),
    user: User = Depends(get_current_user),
):
    """Return persisted profile, stats, and achievement states."""
    return await profile_service.get_profile(session, user)


@router.patch(
    "/user/me",
    response_model=UserPatchResponse,
    status_code=status.HTTP_200_OK,
)
async def patch_me(
    body: UserPatchRequest,
    session: AsyncSession = Depends(get_session),
    user: User = Depends(get_current_user),
):
    """Update display_name and/or daily_goal_xp; recompute goal progress."""
    return await profile_service.patch_profile(session, user, body)
