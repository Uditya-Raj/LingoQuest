"""SQLAlchemy models package.

All models must be imported here for Alembic autogenerate to discover them.
"""

from app.models.user import User
from app.models.course import Course, Unit, Skill, Lesson, Exercise
from app.models.progress import LessonAttempt, ExerciseAnswer, UserSkillProgress
from app.models.achievement import Achievement, UserAchievement

__all__ = [
    "User",
    "Course",
    "Unit",
    "Skill",
    "Lesson",
    "Exercise",
    "LessonAttempt",
    "ExerciseAnswer",
    "UserSkillProgress",
    "Achievement",
    "UserAchievement",
]
