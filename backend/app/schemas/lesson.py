"""Lesson attempt and answer response schemas."""
from datetime import datetime
from typing import Optional, Literal
from pydantic import BaseModel

from app.schemas.course import PublicExercise


class TerminalSummary(BaseModel):
    """Terminal attempt summary for completed/failed attempts."""
    
    outcome: Literal["completed", "failed"]
    xp_earned: int
    perfect: bool
    failure_reason: Optional[Literal["out_of_hearts", "time_expired"]] = None
    completed_at: datetime
    
    model_config = {"from_attributes": True}


class LessonAttemptResponse(BaseModel):
    """Shared lesson attempt response for start and retrieve."""
    
    attempt_id: int
    skill_id: int
    lesson_id: int
    skill_title: str
    status: Literal["in_progress", "completed", "failed"]
    mode: Literal["standard", "timed"] = "standard"
    expires_at: Optional[datetime] = None
    remaining_seconds: Optional[int] = None
    resumed: bool
    started_at: datetime
    completed_at: Optional[datetime] = None
    current_index: int
    total_exercises: int
    hearts: int
    max_hearts: int
    next_heart_at: Optional[datetime] = None
    mistakes_count: int
    exercises: list[PublicExercise]
    terminal_summary: Optional[TerminalSummary] = None
    
    model_config = {"from_attributes": True}
