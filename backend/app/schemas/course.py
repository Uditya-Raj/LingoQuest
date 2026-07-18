"""Course and skill response schemas."""
from datetime import datetime
from typing import Optional, Literal
from pydantic import BaseModel, Field

from app.schemas.common import LearnerSummary


# Exercise public contracts

class ExerciseOption(BaseModel):
    """Multiple choice option."""
    id: str
    text: str


class MatchPairsOptions(BaseModel):
    """Match pairs left/right lists."""
    left: list[ExerciseOption]
    right: list[ExerciseOption]


class PublicExercise(BaseModel):
    """Public exercise without correct answer."""
    
    id: int
    position: int
    type: Literal["multiple_choice", "translate_word_bank", "match_pairs", "fill_blank", "type_answer"]
    prompt: str
    audio_url: Optional[str] = None
    tts_text: Optional[str] = None
    tts_lang: Optional[str] = None
    metadata: Optional[dict] = None
    options: Optional[list[ExerciseOption] | MatchPairsOptions] = None
    
    model_config = {"from_attributes": True}


# Course path schemas

class CourseInfo(BaseModel):
    """Course identification."""
    
    id: int
    title: str
    language_code: str
    from_language_code: str
    icon: str
    
    model_config = {"from_attributes": True}


class SkillSummary(BaseModel):
    """Skill node in the path."""
    
    id: int
    title: str
    description: str
    icon: str
    order_index: int
    status: Literal["locked", "available", "in_progress", "completed"]
    crowns: int
    max_level: int
    active_attempt_id: Optional[int] = None
    
    model_config = {"from_attributes": True}


class UnitSummary(BaseModel):
    """Unit grouping skills."""
    
    id: int
    title: str
    description: str
    order_index: int
    color_theme: str
    skills: list[SkillSummary]
    
    model_config = {"from_attributes": True}


class CourseResponse(BaseModel):
    """Complete course path response."""
    
    learner: LearnerSummary
    course: CourseInfo
    units: list[UnitSummary]
    
    model_config = {"from_attributes": True}


# Skill detail schemas

class PrerequisiteInfo(BaseModel):
    """Prerequisite satisfaction status."""
    
    id: int
    title: str
    satisfied: bool
    
    model_config = {"from_attributes": True}


class SkillDetail(BaseModel):
    """Detailed skill information for start screen."""
    
    id: int
    title: str
    description: str
    icon: str
    status: Literal["locked", "available", "in_progress", "completed"]
    crowns: int
    max_level: int
    prerequisite: Optional[PrerequisiteInfo] = None
    
    model_config = {"from_attributes": True}


class LessonInfo(BaseModel):
    """Lesson pool information."""
    
    id: int
    exercise_pool_size: int
    attempt_exercise_count: int
    base_xp: int
    
    model_config = {"from_attributes": True}


class ActiveAttemptInfo(BaseModel):
    """Existing active attempt summary."""
    
    id: int
    current_index: int
    total_exercises: int
    started_at: datetime
    
    model_config = {"from_attributes": True}


class SkillDetailResponse(BaseModel):
    """Skill detail with start/resume information."""
    
    skill: SkillDetail
    lesson: LessonInfo
    active_attempt: Optional[ActiveAttemptInfo] = None
    can_start: bool
    blocked_reason: Optional[str] = None
    learner: LearnerSummary
    
    model_config = {"from_attributes": True}
