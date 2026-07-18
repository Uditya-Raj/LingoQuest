"""Content-administration request and response schemas."""
from datetime import datetime
from typing import Any, Literal, Optional

from pydantic import BaseModel, Field


ExerciseType = Literal[
    "multiple_choice",
    "translate_word_bank",
    "match_pairs",
    "fill_blank",
    "type_answer",
]


class AdminExerciseRepresentation(BaseModel):
    """Admin exercise including correct_answer (never exposed to learners)."""

    id: int
    lesson_id: int
    order_index: int
    type: ExerciseType
    prompt: str
    audio_url: Optional[str] = None
    options: Any = None
    correct_answer: dict[str, Any]
    metadata: Optional[dict[str, Any]] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime


class AdminLessonNode(BaseModel):
    id: int
    order_index: int
    xp_reward: int
    exercises: list[AdminExerciseRepresentation]


class AdminSkillNode(BaseModel):
    id: int
    title: str
    lessons: list[AdminLessonNode]


class AdminUnitNode(BaseModel):
    id: int
    title: str
    skills: list[AdminSkillNode]


class AdminCourseNode(BaseModel):
    id: int
    title: str
    units: list[AdminUnitNode]


class AdminContentTreeResponse(BaseModel):
    """GET /api/admin/content/tree response."""

    courses: list[AdminCourseNode]


class AdminExerciseCreateRequest(BaseModel):
    """POST /api/admin/exercises request."""

    lesson_id: int
    order_index: int = Field(..., ge=0)
    type: ExerciseType
    prompt: str
    audio_url: Optional[str] = None
    options: Any = None
    correct_answer: dict[str, Any]
    metadata: Optional[dict[str, Any]] = None
    is_active: bool = True

    model_config = {"extra": "forbid"}


class AdminExercisePatchRequest(BaseModel):
    """PATCH /api/admin/exercises/{id} — omitted fields keep stored values."""

    lesson_id: Optional[int] = None
    order_index: Optional[int] = Field(default=None, ge=0)
    type: Optional[ExerciseType] = None
    prompt: Optional[str] = None
    audio_url: Optional[str] = None
    options: Any = None
    correct_answer: Optional[dict[str, Any]] = None
    metadata: Optional[dict[str, Any]] = None
    is_active: Optional[bool] = None

    model_config = {"extra": "forbid"}
