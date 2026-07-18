"""Course path and skill detail routes."""
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.schemas.course import CourseResponse, SkillDetailResponse
from app.services import course_path


router = APIRouter(tags=["course"])


@router.get("/course", response_model=CourseResponse, status_code=status.HTTP_200_OK)
async def get_course(
    session: AsyncSession = Depends(get_session),
    user: User = Depends(get_current_user)
):
    """
    Get the active course path with derived skill states.
    
    Applies lazy heart regeneration before returning the learner summary.
    """
    return await course_path.get_course_path(session, user)


@router.get("/skills/{skill_id}", response_model=SkillDetailResponse, status_code=status.HTTP_200_OK)
async def get_skill_detail(
    skill_id: int,
    session: AsyncSession = Depends(get_session),
    user: User = Depends(get_current_user)
):
    """
    Get skill detail for the start/resume screen.
    
    Returns skill information, lesson pool size, active attempt if present,
    and whether the learner can start.
    """
    return await course_path.get_skill_detail(session, user, skill_id)
