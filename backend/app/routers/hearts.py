"""Hearts status and refill routes."""
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.clock import get_clock
from app.core.database import get_session
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.schemas.hearts import (
    HeartsRefillRequest,
    HeartsRefillResponse,
    HeartsStatusResponse,
)
from app.services import hearts

router = APIRouter(tags=["hearts"])


@router.get(
    "/hearts/status",
    response_model=HeartsStatusResponse,
    status_code=status.HTTP_200_OK,
)
async def get_hearts_status(
    session: AsyncSession = Depends(get_session),
    user: User = Depends(get_current_user),
):
    """Apply lazy regeneration and return current hearts status."""
    clock = get_clock()
    now = clock.now()
    hearts.apply_lazy_regeneration(user, now)
    await session.flush()
    status_data = hearts.build_hearts_status(user, now)
    return HeartsStatusResponse(
        hearts=status_data.hearts,
        max_hearts=status_data.max_hearts,
        next_heart_at=status_data.next_heart_at,
        seconds_until_next=status_data.seconds_until_next,
        regen_interval_minutes=status_data.regen_interval_minutes,
    )


@router.post(
    "/hearts/refill",
    response_model=HeartsRefillResponse,
    status_code=status.HTTP_200_OK,
)
async def refill_hearts(
    body: HeartsRefillRequest,
    session: AsyncSession = Depends(get_session),
    user: User = Depends(get_current_user),
):
    """Spend 20 gems to refill hearts after explicit confirmation."""
    clock = get_clock()
    result = hearts.refill_hearts(user, body.confirm_spend, clock.now())
    await session.flush()
    return HeartsRefillResponse(
        hearts=result.hearts,
        max_hearts=result.max_hearts,
        gems=result.gems,
        gems_spent=result.gems_spent,
        next_heart_at=result.next_heart_at,
    )
