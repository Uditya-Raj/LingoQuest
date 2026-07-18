"""Common shared response schemas."""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class LearnerSummary(BaseModel):
    """Shared learner summary for persistent top bar."""
    
    id: int
    display_name: str
    hearts: int
    max_hearts: int
    next_heart_at: Optional[datetime] = None
    total_xp: int
    today_xp: int
    daily_goal_xp: int
    daily_goal_progress: float = Field(ge=0.0, le=1.0)
    current_streak: int
    gems: int
    
    model_config = {"from_attributes": True}


class ErrorDetail(BaseModel):
    """Standard error response shape."""
    
    code: str
    message: str
    details: Optional[dict] = None
    
    model_config = {"from_attributes": True}


class ErrorResponse(BaseModel):
    """Standard error envelope."""
    
    error: ErrorDetail
    
    model_config = {"from_attributes": True}
