"""User domain models."""
from datetime import date, datetime
from typing import Optional
from sqlalchemy import CheckConstraint, String, Integer, Boolean, DateTime, Date
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.core.database import Base


class User(Base):
    """Learner account and persistent gamification state."""
    
    __tablename__ = "users"
    
    # Primary key
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    
    # Identity
    username: Mapped[str] = mapped_column(String, unique=True, nullable=False, index=True)
    display_name: Mapped[str] = mapped_column(String, nullable=False)
    email: Mapped[Optional[str]] = mapped_column(String, unique=True, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    
    # Progress
    total_xp: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    current_streak: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    longest_streak: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    last_activity_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    
    # Hearts
    hearts: Mapped[int] = mapped_column(Integer, nullable=False, default=5)
    max_hearts: Mapped[int] = mapped_column(Integer, nullable=False, default=5)
    heart_regen_anchor_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    
    # Currency
    gems: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    
    # Settings
    daily_goal_xp: Mapped[int] = mapped_column(Integer, nullable=False, default=20)
    active_course_id: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    
    # Authorization
    is_content_admin: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    
    # Constraints
    __table_args__ = (
        CheckConstraint("total_xp >= 0", name="ck_users_total_xp_positive"),
        CheckConstraint("current_streak >= 0", name="ck_users_current_streak_positive"),
        CheckConstraint("longest_streak >= current_streak", name="ck_users_longest_streak_valid"),
        CheckConstraint("max_hearts > 0", name="ck_users_max_hearts_positive"),
        CheckConstraint("hearts >= 0 AND hearts <= max_hearts", name="ck_users_hearts_valid"),
        CheckConstraint("gems >= 0", name="ck_users_gems_positive"),
        CheckConstraint("daily_goal_xp > 0", name="ck_users_daily_goal_positive"),
    )
    
    # Relationships
    lesson_attempts: Mapped[list["LessonAttempt"]] = relationship(
        "LessonAttempt", back_populates="user", cascade="all, delete-orphan"
    )
    skill_progress: Mapped[list["UserSkillProgress"]] = relationship(
        "UserSkillProgress", back_populates="user", cascade="all, delete-orphan"
    )
    user_achievements: Mapped[list["UserAchievement"]] = relationship(
        "UserAchievement", back_populates="user", cascade="all, delete-orphan"
    )
