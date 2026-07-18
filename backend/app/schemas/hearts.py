"""Hearts status and refill response schemas."""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class HeartsStatusResponse(BaseModel):
    """GET /api/hearts/status response."""

    hearts: int
    max_hearts: int
    next_heart_at: Optional[datetime] = None
    seconds_until_next: Optional[int] = None
    regen_interval_minutes: int = Field(default=15)


class HeartsRefillRequest(BaseModel):
    """POST /api/hearts/refill request."""

    confirm_spend: bool

    model_config = {"extra": "forbid"}


class HeartsRefillResponse(BaseModel):
    """POST /api/hearts/refill response."""

    hearts: int
    max_hearts: int
    gems: int
    gems_spent: int
    next_heart_at: Optional[datetime] = None
