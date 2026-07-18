"""Course content domain models."""
from datetime import datetime
from typing import Optional
from sqlalchemy import (
    CheckConstraint, String, Integer, Text, Boolean, DateTime, JSON, 
    ForeignKey, UniqueConstraint, Index
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.core.database import Base


class Course(Base):
    """Language course definition."""
    
    __tablename__ = "courses"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    language_code: Mapped[str] = mapped_column(String, nullable=False)
    from_language_code: Mapped[str] = mapped_column(String, nullable=False)
    title: Mapped[str] = mapped_column(String, nullable=False)
    icon: Mapped[str] = mapped_column(String, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    
    __table_args__ = (
        UniqueConstraint("language_code", "from_language_code", name="uq_courses_language_pair"),
    )
    
    # Relationships
    units: Mapped[list["Unit"]] = relationship("Unit", back_populates="course")


class Unit(Base):
    """Unit grouping skills within a course."""
    
    __tablename__ = "units"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    course_id: Mapped[int] = mapped_column(Integer, ForeignKey("courses.id", ondelete="RESTRICT"), nullable=False)
    order_index: Mapped[int] = mapped_column(Integer, nullable=False)
    title: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False, default="")
    color_theme: Mapped[str] = mapped_column(String, nullable=False)
    
    __table_args__ = (
        UniqueConstraint("course_id", "order_index", name="uq_units_course_order"),
        CheckConstraint("order_index >= 0", name="ck_units_order_positive"),
        Index("ix_units_course_order", "course_id", "order_index"),
    )
    
    # Relationships
    course: Mapped["Course"] = relationship("Course", back_populates="units")
    skills: Mapped[list["Skill"]] = relationship("Skill", back_populates="unit")


class Skill(Base):
    """Skill node in the learning path."""
    
    __tablename__ = "skills"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    unit_id: Mapped[int] = mapped_column(Integer, ForeignKey("units.id", ondelete="RESTRICT"), nullable=False)
    order_index: Mapped[int] = mapped_column(Integer, nullable=False)
    title: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False, default="")
    icon: Mapped[str] = mapped_column(String, nullable=False)
    unlock_requires_skill_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("skills.id", ondelete="RESTRICT"), nullable=True
    )
    max_level: Mapped[int] = mapped_column(Integer, nullable=False, default=5)
    
    __table_args__ = (
        UniqueConstraint("unit_id", "order_index", name="uq_skills_unit_order"),
        CheckConstraint("order_index >= 0", name="ck_skills_order_positive"),
        CheckConstraint("max_level > 0", name="ck_skills_max_level_positive"),
        CheckConstraint(
            "unlock_requires_skill_id IS NULL OR unlock_requires_skill_id != id",
            name="ck_skills_no_self_prerequisite"
        ),
        Index("ix_skills_unit_order", "unit_id", "order_index"),
        Index("ix_skills_prerequisite", "unlock_requires_skill_id"),
    )
    
    # Relationships
    unit: Mapped["Unit"] = relationship("Unit", back_populates="skills")
    lessons: Mapped[list["Lesson"]] = relationship("Lesson", back_populates="skill")
    user_progress: Mapped[list["UserSkillProgress"]] = relationship(
        "UserSkillProgress", back_populates="skill"
    )


class Lesson(Base):
    """Exercise pool grouping under a skill."""
    
    __tablename__ = "lessons"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    skill_id: Mapped[int] = mapped_column(Integer, ForeignKey("skills.id", ondelete="RESTRICT"), nullable=False)
    order_index: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    xp_reward: Mapped[int] = mapped_column(Integer, nullable=False, default=10)
    
    __table_args__ = (
        UniqueConstraint("skill_id", "order_index", name="uq_lessons_skill_order"),
        CheckConstraint("order_index >= 0", name="ck_lessons_order_positive"),
        CheckConstraint("xp_reward > 0", name="ck_lessons_xp_positive"),
        Index("ix_lessons_skill_order", "skill_id", "order_index"),
    )
    
    # Relationships
    skill: Mapped["Skill"] = relationship("Skill", back_populates="lessons")
    exercises: Mapped[list["Exercise"]] = relationship("Exercise", back_populates="lesson")
    lesson_attempts: Mapped[list["LessonAttempt"]] = relationship(
        "LessonAttempt", back_populates="lesson"
    )


class Exercise(Base):
    """Canonical editable exercise content."""
    
    __tablename__ = "exercises"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    lesson_id: Mapped[int] = mapped_column(Integer, ForeignKey("lessons.id", ondelete="RESTRICT"), nullable=False)
    order_index: Mapped[int] = mapped_column(Integer, nullable=False)
    type: Mapped[str] = mapped_column(String, nullable=False)
    prompt: Mapped[str] = mapped_column(Text, nullable=False)
    audio_url: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    tts_text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    tts_lang: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    options: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    correct_answer: Mapped[dict] = mapped_column(JSON, nullable=False)
    exercise_metadata: Mapped[Optional[dict]] = mapped_column("metadata", JSON, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )
    
    __table_args__ = (
        UniqueConstraint("lesson_id", "order_index", name="uq_exercises_lesson_order"),
        CheckConstraint("order_index >= 0", name="ck_exercises_order_positive"),
        CheckConstraint(
            "type IN ('multiple_choice', 'translate_word_bank', 'match_pairs', 'fill_blank', 'type_answer')",
            name="ck_exercises_type_valid"
        ),
        Index("ix_exercises_lesson_active", "lesson_id", "is_active"),
        Index("ix_exercises_type", "type"),
    )
    
    # Relationships
    lesson: Mapped["Lesson"] = relationship("Lesson", back_populates="exercises")
    exercise_answers: Mapped[list["ExerciseAnswer"]] = relationship(
        "ExerciseAnswer", back_populates="exercise"
    )


# Import progress models for relationship resolution
from app.models.progress import LessonAttempt, ExerciseAnswer, UserSkillProgress
