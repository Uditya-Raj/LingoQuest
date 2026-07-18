"""User profile and settings schemas."""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field, model_validator


class ProfileActiveCourse(BaseModel):
    """Active course slice on the profile."""

    id: int
    title: str
    icon: str


class ProfileUserInfo(BaseModel):
    """Identity slice of GET /api/user/me."""

    id: int
    username: str
    display_name: str
    email: Optional[str] = None
    joined_at: datetime
    active_course: Optional[ProfileActiveCourse] = None


class ProfileStats(BaseModel):
    """Aggregated learner statistics."""

    total_xp: int
    today_xp: int
    daily_goal_xp: int
    daily_goal_progress: float
    current_streak: int
    longest_streak: int
    hearts: int
    max_hearts: int
    gems: int
    skills_completed: int
    lessons_completed: int
    perfect_lessons: int


class ProfileAchievement(BaseModel):
    """Achievement row on the profile (no criteria progress)."""

    id: int
    key: str
    title: str
    description: str
    icon: str
    earned: bool
    earned_at: Optional[datetime] = None


class ProfileResponse(BaseModel):
    """GET /api/user/me response."""

    user: ProfileUserInfo
    stats: ProfileStats
    achievements: list[ProfileAchievement]


class UserPatchRequest(BaseModel):
    """PATCH /api/user/me request. At least one field required."""

    display_name: Optional[str] = None
    daily_goal_xp: Optional[int] = Field(default=None, ge=5, le=100)

    model_config = {"extra": "forbid"}

    @model_validator(mode="after")
    def at_least_one_field(self) -> "UserPatchRequest":
        if self.display_name is None and self.daily_goal_xp is None:
            raise ValueError("At least one of display_name or daily_goal_xp is required")
        return self


class UserPatchResponse(BaseModel):
    """PATCH /api/user/me response."""

    display_name: str
    daily_goal_xp: int
    today_xp: int
    daily_goal_progress: float
