"""Progress and attempt tracking domain models."""
from datetime import date, datetime
from typing import Optional
from sqlalchemy import (
    CheckConstraint, String, Integer, Boolean, DateTime, Date, JSON,
    ForeignKey, UniqueConstraint, Index
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.core.database import Base


class LessonAttempt(Base):
    """Persisted state machine for a learner playing a lesson."""
    
    __tablename__ = "lesson_attempts"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    lesson_id: Mapped[int] = mapped_column(Integer, ForeignKey("lessons.id", ondelete="RESTRICT"), nullable=False)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    activity_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    status: Mapped[str] = mapped_column(String, nullable=False, default="in_progress")
    mode: Mapped[str] = mapped_column(String, nullable=False, default="standard")
    expires_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    failure_reason: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    exercise_order: Mapped[list] = mapped_column(JSON, nullable=False)
    current_index: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    mistakes_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    hearts_lost: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    xp_earned: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    
    __table_args__ = (
        CheckConstraint(
            "status IN ('in_progress', 'completed', 'failed')",
            name="ck_lesson_attempts_status_valid"
        ),
        CheckConstraint(
            "mode IN ('standard', 'timed')",
            name="ck_lesson_attempts_mode_valid"
        ),
        CheckConstraint(
            "failure_reason IS NULL OR failure_reason IN ('out_of_hearts', 'time_expired')",
            name="ck_lesson_attempts_failure_reason_valid"
        ),
        CheckConstraint("current_index >= 0", name="ck_lesson_attempts_index_positive"),
        CheckConstraint("mistakes_count >= 0", name="ck_lesson_attempts_mistakes_positive"),
        CheckConstraint("hearts_lost >= 0", name="ck_lesson_attempts_hearts_lost_positive"),
        CheckConstraint("xp_earned IS NULL OR xp_earned >= 0", name="ck_lesson_attempts_xp_positive"),
        Index("ix_attempts_user_status", "user_id", "status"),
        Index("ix_attempts_lesson_status", "lesson_id", "status"),
        Index("ix_attempts_user_activity", "user_id", "activity_date", "status"),
        Index("ix_attempts_user_completed", "user_id", "completed_at"),
    )
    
    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="lesson_attempts")
    lesson: Mapped["Lesson"] = relationship("Lesson", back_populates="lesson_attempts")
    exercise_answers: Mapped[list["ExerciseAnswer"]] = relationship(
        "ExerciseAnswer", back_populates="lesson_attempt", cascade="all, delete-orphan"
    )


class ExerciseAnswer(Base):
    """Immutable per-answer audit records."""
    
    __tablename__ = "exercise_answers"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    lesson_attempt_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("lesson_attempts.id", ondelete="CASCADE"), nullable=False
    )
    exercise_id: Mapped[int] = mapped_column(Integer, ForeignKey("exercises.id", ondelete="RESTRICT"), nullable=False)
    position: Mapped[int] = mapped_column(Integer, nullable=False)
    exercise_type: Mapped[str] = mapped_column(String, nullable=False)
    submitted_answer: Mapped[dict] = mapped_column(JSON, nullable=False)
    correct_answer_snapshot: Mapped[dict] = mapped_column(JSON, nullable=False)
    is_correct: Mapped[bool] = mapped_column(Boolean, nullable=False)
    answered_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    
    __table_args__ = (
        UniqueConstraint("lesson_attempt_id", "position", name="uq_exercise_answers_attempt_position"),
        UniqueConstraint("lesson_attempt_id", "exercise_id", name="uq_exercise_answers_attempt_exercise"),
        CheckConstraint("position >= 0", name="ck_exercise_answers_position_positive"),
        CheckConstraint(
            "exercise_type IN ('multiple_choice', 'translate_word_bank', 'match_pairs', 'fill_blank', 'type_answer')",
            name="ck_exercise_answers_type_valid"
        ),
        Index("ix_answers_exercise", "exercise_id"),
    )
    
    # Relationships
    lesson_attempt: Mapped["LessonAttempt"] = relationship("LessonAttempt", back_populates="exercise_answers")
    exercise: Mapped["Exercise"] = relationship("Exercise", back_populates="exercise_answers")


class UserSkillProgress(Base):
    """Progress facts that cannot be cheaply inferred from attempts."""
    
    __tablename__ = "user_skill_progress"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    skill_id: Mapped[int] = mapped_column(Integer, ForeignKey("skills.id", ondelete="RESTRICT"), nullable=False)
    crowns: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    times_practiced: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    last_practiced_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    
    __table_args__ = (
        UniqueConstraint("user_id", "skill_id", name="uq_user_skill_progress_user_skill"),
        CheckConstraint("crowns >= 0", name="ck_user_skill_progress_crowns_positive"),
        CheckConstraint("times_practiced >= 0", name="ck_user_skill_progress_practiced_positive"),
    )
    
    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="skill_progress")
    skill: Mapped["Skill"] = relationship("Skill", back_populates="user_progress")


# Import related models for relationship resolution
from app.models.user import User
from app.models.course import Lesson, Exercise, Skill
