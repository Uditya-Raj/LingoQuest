"""Achievements list response schemas."""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class AchievementListItem(BaseModel):
    """Active achievement with earned state and live progress."""

    id: int
    key: str
    title: str
    description: str
    icon: str
    criteria_type: str
    criteria_value: int
    current_value: int
    earned: bool
    earned_at: Optional[datetime] = None


class AchievementsListResponse(BaseModel):
    """GET /api/achievements response."""

    achievements: list[AchievementListItem]
