"""Content-administration routes."""
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.dependencies.auth import require_content_admin
from app.models.user import User
from app.schemas.admin import (
    AdminContentTreeResponse,
    AdminExerciseCreateRequest,
    AdminExercisePatchRequest,
    AdminExerciseRepresentation,
)
from app.services import content_admin as content_admin_service

router = APIRouter(tags=["admin"])


@router.get(
    "/admin/content/tree",
    response_model=AdminContentTreeResponse,
    status_code=status.HTTP_200_OK,
)
async def get_content_tree(
    session: AsyncSession = Depends(get_session),
    _admin: User = Depends(require_content_admin),
):
    """Return the complete ordered content tree for the content manager."""
    return await content_admin_service.get_content_tree(session)


@router.post(
    "/admin/exercises",
    response_model=AdminExerciseRepresentation,
    status_code=status.HTTP_201_CREATED,
)
async def create_exercise(
    body: AdminExerciseCreateRequest,
    session: AsyncSession = Depends(get_session),
    _admin: User = Depends(require_content_admin),
):
    """Create an exercise after shared contract validation."""
    return await content_admin_service.create_exercise(session, body)


@router.patch(
    "/admin/exercises/{exercise_id}",
    response_model=AdminExerciseRepresentation,
    status_code=status.HTTP_200_OK,
)
async def patch_exercise(
    exercise_id: int,
    body: AdminExercisePatchRequest,
    session: AsyncSession = Depends(get_session),
    _admin: User = Depends(require_content_admin),
):
    """Merge-patch an exercise with complete contract validation."""
    return await content_admin_service.patch_exercise(session, exercise_id, body)
