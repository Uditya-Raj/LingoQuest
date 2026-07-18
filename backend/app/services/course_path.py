"""Course path service for skill state derivation and course response."""
from typing import Literal
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import joinedload, selectinload

from app.models.user import User
from app.models.course import Course, Unit, Skill, Lesson
from app.models.progress import UserSkillProgress, LessonAttempt
from app.core.errors import NotFoundError
from app.core.clock import Clock, get_clock
from app.services import hearts
from app.services.xp import calculate_today_xp_for_clock
from app.schemas.common import LearnerSummary
from app.schemas.course import (
    CourseResponse, CourseInfo, UnitSummary, SkillSummary,
    SkillDetailResponse, SkillDetail, LessonInfo, 
    PrerequisiteInfo, ActiveAttemptInfo
)


SkillStatus = Literal["locked", "available", "in_progress", "completed"]


async def get_skill_progress(
    session: AsyncSession,
    user_id: int,
    skill_id: int
) -> UserSkillProgress | None:
    """Get user's progress for a specific skill."""
    result = await session.execute(
        select(UserSkillProgress)
        .where(
            UserSkillProgress.user_id == user_id,
            UserSkillProgress.skill_id == skill_id
        )
    )
    return result.scalar_one_or_none()


async def has_active_attempt(
    session: AsyncSession,
    user_id: int,
    skill_id: int
) -> int | None:
    """Check if user has an active attempt for the skill. Returns attempt_id or None."""
    result = await session.execute(
        select(LessonAttempt.id)
        .join(Lesson, LessonAttempt.lesson_id == Lesson.id)
        .where(
            LessonAttempt.user_id == user_id,
            Lesson.skill_id == skill_id,
            LessonAttempt.status == "in_progress"
        )
    )
    return result.scalar_one_or_none()


def derive_skill_state(
    skill: Skill,
    crowns: int,
    has_attempt: bool,
    prerequisite_crowns: int | None
) -> SkillStatus:
    """
    Derive public skill state from progress facts.
    
    Rules:
    1. completed when crowns >= max_level
    2. in_progress when crowns > 0 or any attempt exists
    3. available when no prerequisite or prerequisite crowns >= 1
    4. locked otherwise
    """
    if crowns >= skill.max_level:
        return "completed"
    
    if crowns > 0 or has_attempt:
        return "in_progress"
    
    if skill.unlock_requires_skill_id is None:
        return "available"
    
    if prerequisite_crowns is not None and prerequisite_crowns >= 1:
        return "available"
    
    return "locked"


def build_learner_summary(user: User, today_xp: int, clock: Clock) -> LearnerSummary:
    """Build learner summary with lazy regeneration applied."""
    now = clock.now()
    
    # Calculate next heart time
    next_heart_at = hearts.calculate_next_heart_at(user)
    
    # Calculate daily goal progress
    daily_goal_progress = min(today_xp / user.daily_goal_xp, 1.0)
    
    return LearnerSummary(
        id=user.id,
        display_name=user.display_name,
        hearts=user.hearts,
        max_hearts=user.max_hearts,
        next_heart_at=next_heart_at,
        total_xp=user.total_xp,
        today_xp=today_xp,
        daily_goal_xp=user.daily_goal_xp,
        daily_goal_progress=daily_goal_progress,
        current_streak=user.current_streak,
        gems=user.gems
    )


async def calculate_today_xp(
    session: AsyncSession,
    user_id: int,
    clock: Clock
) -> int:
    """Calculate today's XP from completed attempts with matching activity_date."""
    return await calculate_today_xp_for_clock(session, user_id, clock)


async def get_course_path(
    session: AsyncSession,
    user: User
) -> CourseResponse:
    """
    Get the complete course path with derived skill states.
    
    Applies lazy heart regeneration before building the response.
    """
    clock = get_clock()
    now = clock.now()
    
    # Apply lazy heart regeneration
    hearts.apply_lazy_regeneration(user, now)
    await session.flush()
    
    # Get active course
    if user.active_course_id is None:
        raise NotFoundError("Active course", "none")
    
    # Load course with full path
    result = await session.execute(
        select(Course)
        .where(Course.id == user.active_course_id)
        .options(
            selectinload(Course.units)
            .selectinload(Unit.skills)
        )
    )
    course = result.scalar_one_or_none()
    
    if course is None:
        raise NotFoundError("Course", user.active_course_id)
    
    # Load all progress for user
    progress_result = await session.execute(
        select(UserSkillProgress)
        .where(UserSkillProgress.user_id == user.id)
    )
    progress_map = {p.skill_id: p for p in progress_result.scalars().all()}
    
    # Load active attempts
    attempts_result = await session.execute(
        select(LessonAttempt.id, Lesson.skill_id)
        .join(Lesson, LessonAttempt.lesson_id == Lesson.id)
        .where(
            LessonAttempt.user_id == user.id,
            LessonAttempt.status == "in_progress"
        )
    )
    active_attempts_map = {skill_id: attempt_id for attempt_id, skill_id in attempts_result.all()}
    
    # Build prerequisite crowns map
    prereq_crowns_map = {}
    for skill_id, progress in progress_map.items():
        prereq_crowns_map[skill_id] = progress.crowns
    
    # Calculate today's XP
    today_xp = await calculate_today_xp(session, user.id, clock)
    
    # Build learner summary
    learner_summary = build_learner_summary(user, today_xp, clock)
    
    # Build units with skills
    units_data = []
    for unit in sorted(course.units, key=lambda u: u.order_index):
        skills_data = []
        for skill in sorted(unit.skills, key=lambda s: s.order_index):
            progress = progress_map.get(skill.id)
            crowns = progress.crowns if progress else 0
            has_attempt = skill.id in active_attempts_map
            
            prereq_crowns = None
            if skill.unlock_requires_skill_id is not None:
                prereq_crowns = prereq_crowns_map.get(skill.unlock_requires_skill_id, 0)
            
            status = derive_skill_state(skill, crowns, has_attempt, prereq_crowns)
            
            active_attempt_id = active_attempts_map.get(skill.id)
            
            skills_data.append(SkillSummary(
                id=skill.id,
                title=skill.title,
                description=skill.description,
                icon=skill.icon,
                order_index=skill.order_index,
                status=status,
                crowns=crowns,
                max_level=skill.max_level,
                active_attempt_id=active_attempt_id
            ))
        
        units_data.append(UnitSummary(
            id=unit.id,
            title=unit.title,
            description=unit.description,
            order_index=unit.order_index,
            color_theme=unit.color_theme,
            skills=skills_data
        ))
    
    return CourseResponse(
        learner=learner_summary,
        course=CourseInfo(
            id=course.id,
            title=course.title,
            language_code=course.language_code,
            from_language_code=course.from_language_code,
            icon=course.icon
        ),
        units=units_data
    )


async def get_skill_detail(
    session: AsyncSession,
    user: User,
    skill_id: int
) -> SkillDetailResponse:
    """
    Get detailed skill information for the start/resume screen.
    
    Applies lazy heart regeneration before building the response.
    """
    clock = get_clock()
    now = clock.now()
    
    # Apply lazy heart regeneration
    hearts.apply_lazy_regeneration(user, now)
    await session.flush()
    
    # Load skill with relationships
    result = await session.execute(
        select(Skill)
        .where(Skill.id == skill_id)
        .options(
            joinedload(Skill.unit).joinedload(Unit.course),
            selectinload(Skill.lessons).selectinload(Lesson.exercises)
        )
    )
    skill = result.scalar_one_or_none()
    
    if skill is None:
        raise NotFoundError("Skill", skill_id)
    
    # Verify skill is in user's active course
    if user.active_course_id != skill.unit.course.id:
        raise NotFoundError("Skill not in active course", skill_id)
    
    # Get progress
    progress = await get_skill_progress(session, user.id, skill_id)
    crowns = progress.crowns if progress else 0
    
    # Get active attempt
    active_attempt_id = await has_active_attempt(session, user.id, skill_id)
    active_attempt_info = None
    
    if active_attempt_id:
        attempt_result = await session.execute(
            select(LessonAttempt)
            .where(LessonAttempt.id == active_attempt_id)
        )
        attempt = attempt_result.scalar_one()
        
        active_attempt_info = ActiveAttemptInfo(
            id=attempt.id,
            current_index=attempt.current_index,
            total_exercises=len(attempt.exercise_order),
            started_at=attempt.started_at
        )
    
    # Check prerequisite
    prerequisite_info = None
    prereq_satisfied = True
    
    if skill.unlock_requires_skill_id is not None:
        prereq_result = await session.execute(
            select(Skill).where(Skill.id == skill.unlock_requires_skill_id)
        )
        prereq_skill = prereq_result.scalar_one()
        
        prereq_progress = await get_skill_progress(session, user.id, skill.unlock_requires_skill_id)
        prereq_crowns = prereq_progress.crowns if prereq_progress else 0
        prereq_satisfied = prereq_crowns >= 1
        
        prerequisite_info = PrerequisiteInfo(
            id=prereq_skill.id,
            title=prereq_skill.title,
            satisfied=prereq_satisfied
        )
    
    # Derive status
    has_attempt = active_attempt_id is not None
    prereq_crowns = None if prerequisite_info is None else (1 if prereq_satisfied else 0)
    status = derive_skill_state(skill, crowns, has_attempt, prereq_crowns)
    
    # Check if can start
    can_start = True
    blocked_reason = None
    
    if status == "locked":
        can_start = False
        blocked_reason = "Skill is locked. Complete the prerequisite skill first."
    elif user.hearts == 0:
        can_start = False
        blocked_reason = "Out of hearts. Wait for regeneration or refill with gems."
    
    # Get lesson info
    # Use first lesson for simplicity; production might have lesson selection logic
    lesson = skill.lessons[0] if skill.lessons else None
    
    if lesson is None:
        raise NotFoundError("Lesson", f"skill_{skill_id}")
    
    active_exercises = [ex for ex in lesson.exercises if ex.is_active]
    
    lesson_info = LessonInfo(
        id=lesson.id,
        exercise_pool_size=len(active_exercises),
        attempt_exercise_count=10,  # Standard attempt size
        base_xp=lesson.xp_reward
    )
    
    # Calculate today's XP
    today_xp = await calculate_today_xp(session, user.id, clock)
    
    # Build learner summary
    learner_summary = build_learner_summary(user, today_xp, clock)
    
    return SkillDetailResponse(
        skill=SkillDetail(
            id=skill.id,
            title=skill.title,
            description=skill.description,
            icon=skill.icon,
            status=status,
            crowns=crowns,
            max_level=skill.max_level,
            prerequisite=prerequisite_info
        ),
        lesson=lesson_info,
        active_attempt=active_attempt_info,
        can_start=can_start,
        blocked_reason=blocked_reason,
        learner=learner_summary
    )
