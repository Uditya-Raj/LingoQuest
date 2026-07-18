"""Development-only logical clock routes."""
from datetime import datetime, timezone

from fastapi import APIRouter, status

from app.core.clock import DebugClock, get_clock, set_clock
from app.schemas.debug import (
    DebugClockAdvanceRequest,
    DebugClockAdvanceResponse,
    DebugClockResetResponse,
    DebugClockStatusResponse,
)

router = APIRouter(prefix="/debug", tags=["debug"])


def _ensure_debug_clock() -> DebugClock:
    clock = get_clock()
    if isinstance(clock, DebugClock):
        return clock
    debug = DebugClock()
    set_clock(debug)
    return debug


def _iso(dt: datetime) -> str:
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


@router.get(
    "/clock",
    response_model=DebugClockStatusResponse,
    status_code=status.HTTP_200_OK,
)
async def get_debug_clock():
    """Read real vs logical clock state."""
    debug = _ensure_debug_clock()
    real_now = datetime.now(timezone.utc)
    return DebugClockStatusResponse(
        real_now=_iso(real_now),
        logical_now=_iso(debug.now()),
        offset_days=debug.offset_days,
    )


@router.post(
    "/clock/advance",
    response_model=DebugClockAdvanceResponse,
    status_code=status.HTTP_200_OK,
)
async def advance_debug_clock(body: DebugClockAdvanceRequest):
    """Advance the logical clock by whole days (does not change OS time)."""
    debug = _ensure_debug_clock()
    debug.advance_days(body.days)
    logical = debug.now()
    return DebugClockAdvanceResponse(
        logical_now=_iso(logical),
        logical_date=logical.date().isoformat(),
        offset_days=debug.offset_days,
    )


@router.post(
    "/clock/reset",
    response_model=DebugClockResetResponse,
    status_code=status.HTTP_200_OK,
)
async def reset_debug_clock():
    """Clear the logical clock override."""
    debug = _ensure_debug_clock()
    debug.reset()
    logical = debug.now()
    return DebugClockResetResponse(
        logical_now=_iso(logical),
        logical_date=logical.date().isoformat(),
        offset_days=debug.offset_days,
    )
