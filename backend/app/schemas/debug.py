"""Development-only debug clock schemas."""
from pydantic import BaseModel, Field


class DebugClockStatusResponse(BaseModel):
    """GET /api/debug/clock response."""

    real_now: str
    logical_now: str
    offset_days: int


class DebugClockAdvanceRequest(BaseModel):
    """POST /api/debug/clock/advance request."""

    days: int = Field(..., ge=1, le=365)

    model_config = {"extra": "forbid"}


class DebugClockAdvanceResponse(BaseModel):
    """POST /api/debug/clock/advance response."""

    logical_now: str
    logical_date: str
    offset_days: int


class DebugClockResetResponse(BaseModel):
    """POST /api/debug/clock/reset response."""

    logical_now: str
    logical_date: str
    offset_days: int
