"""Deterministic seed data CLI and verification."""
import argparse
import sys
from datetime import datetime, date, timedelta, timezone
from typing import Any
from collections import Counter

from sqlalchemy import select, func, text
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker

from app.core.config import settings
from app.core.database import Base
from app.models import (
    User, Course, Unit, Skill, Lesson, Exercise,
    LessonAttempt, ExerciseAnswer, UserSkillProgress,
    Achievement, UserAchievement,
)
from app.seed.validators import validate_exercise_contract
from app.seed.content import (
    get_course_definition,
    get_units_definition,
    get_skills_definition,
    get_exercises_for_skill,
    get_achievements_definition,
)
from app.seed.history import (
    get_users_definition,
    get_maya_history,
    get_leo_history,
    get_asha_history,
    get_noah_history,
    get_sofia_history,
)


async def seed_course_content(session: AsyncSession) -> dict[str, list[Any]]:
    """Seed course structure and exercises.
    
    Returns dict with created entities for history generation.
    """
    print("Seeding course content...")
    
    # Course
    course_def = get_course_definition()
    result = await session.execute(
        select(Course).where(
            Course.language_code == course_def["language_code"],
            Course.from_language_code == course_def["from_language_code"],
        )
    )
    course = result.scalar_one_or_none()
    
    if not course:
        course = Course(**course_def)
        session.add(course)
        await session.flush()
        print(f"  Created course: {course.title}")
    else:
        print(f"  Course exists: {course.title}")
    
    # Units
    units_def = get_units_definition()
    units = []
    
    for unit_def in units_def:
        result = await session.execute(
            select(Unit).where(
                Unit.course_id == course.id,
                Unit.order_index == unit_def["order_index"],
            )
        )
        unit = result.scalar_one_or_none()
        
        if not unit:
            unit = Unit(course_id=course.id, **unit_def)
            session.add(unit)
            await session.flush()
        units.append(unit)
    
    print(f"  Units: {len(units)}")
    
    # Skills
    skills_def = get_skills_definition()
    skills = []
    
    for skill_def in skills_def:
        unit = units[skill_def["unit_index"]]
        prerequisite_id = None
        
        if skill_def["prerequisite_skill_index"] is not None:
            prerequisite_id = skills[skill_def["prerequisite_skill_index"]].id
        
        result = await session.execute(
            select(Skill).where(
                Skill.unit_id == unit.id,
                Skill.order_index == skill_def["order_index"],
            )
        )
        skill = result.scalar_one_or_none()
        
        if not skill:
            skill = Skill(
                unit_id=unit.id,
                order_index=skill_def["order_index"],
                title=skill_def["title"],
                description=skill_def["description"],
                icon=skill_def["icon"],
                unlock_requires_skill_id=prerequisite_id,
                max_level=skill_def["max_level"],
            )
            session.add(skill)
            await session.flush()
        skills.append(skill)
    
    print(f"  Skills: {len(skills)}")
    
    # Lessons (one per skill)
    lessons = []
    
    for skill in skills:
        result = await session.execute(
            select(Lesson).where(
                Lesson.skill_id == skill.id,
                Lesson.order_index == 0,
            )
        )
        lesson = result.scalar_one_or_none()
        
        if not lesson:
            lesson = Lesson(
                skill_id=skill.id,
                order_index=0,
                xp_reward=10,
            )
            session.add(lesson)
            await session.flush()
        lessons.append(lesson)
    
    print(f"  Lessons: {len(lessons)}")
    
    # Exercises
    total_exercises = 0
    invalid_contracts = 0
    type_counts = Counter()
    
    for skill_index, lesson in enumerate(lessons):
        exercises_def = get_exercises_for_skill(skill_index)
        
        for ex_def in exercises_def:
            # Validate contract (including optional TTS fields)
            try:
                validate_exercise_contract(
                    exercise_type=ex_def["type"],
                    prompt=ex_def["prompt"],
                    options=ex_def["options"],
                    correct_answer=ex_def["correct_answer"],
                    tts_text=ex_def.get("tts_text"),
                    tts_lang=ex_def.get("tts_lang"),
                )
            except ValueError as e:
                print(f"    INVALID CONTRACT: {e}")
                invalid_contracts += 1
                continue
            
            # Check if exists
            result = await session.execute(
                select(Exercise).where(
                    Exercise.lesson_id == lesson.id,
                    Exercise.order_index == ex_def["order_index"],
                )
            )
            exercise = result.scalar_one_or_none()
            
            if not exercise:
                exercise = Exercise(
                    lesson_id=lesson.id,
                    order_index=ex_def["order_index"],
                    type=ex_def["type"],
                    prompt=ex_def["prompt"],
                    audio_url=ex_def.get("audio_url"),
                    tts_text=ex_def.get("tts_text"),
                    tts_lang=ex_def.get("tts_lang"),
                    options=ex_def["options"],
                    correct_answer=ex_def["correct_answer"],
                    exercise_metadata=ex_def["metadata"],
                    is_active=True,
                )
                session.add(exercise)
                total_exercises += 1
                type_counts[ex_def["type"]] += 1
            else:
                # Safe content-definition update (does not touch learner progress).
                exercise.type = ex_def["type"]
                exercise.prompt = ex_def["prompt"]
                exercise.audio_url = ex_def.get("audio_url")
                exercise.tts_text = ex_def.get("tts_text")
                exercise.tts_lang = ex_def.get("tts_lang")
                exercise.options = ex_def["options"]
                exercise.correct_answer = ex_def["correct_answer"]
                exercise.exercise_metadata = ex_def["metadata"]
    
    await session.flush()
    print(f"  Exercises created: {total_exercises}")
    print(f"  Invalid contracts: {invalid_contracts}")
    print(f"  Type distribution: {dict(type_counts)}")
    
    return {
        "course": course,
        "units": units,
        "skills": skills,
        "lessons": lessons,
    }


async def seed_achievements(session: AsyncSession) -> list[Achievement]:
    """Seed achievement definitions."""
    print("Seeding achievements...")
    
    achievements_def = get_achievements_definition()
    achievements = []
    
    for ach_def in achievements_def:
        result = await session.execute(
            select(Achievement).where(Achievement.key == ach_def["key"])
        )
        achievement = result.scalar_one_or_none()
        
        if not achievement:
            achievement = Achievement(**ach_def)
            session.add(achievement)
            await session.flush()
        achievements.append(achievement)
    
    print(f"  Achievements: {len(achievements)}")
    return achievements


async def seed_users_and_history(
    session: AsyncSession,
    course: Course,
    skills: list[Skill],
    lessons: list[Lesson],
    achievements: list[Achievement],
    reference_date: date,
    reference_now: datetime,
) -> None:
    """Seed users and their historical attempts."""
    print("Seeding users and history...")
    
    users_def = get_users_definition()
    
    # Check if Maya already has history
    result = await session.execute(
        select(User).where(User.username == "maya_demo")
    )
    maya_existing = result.scalar_one_or_none()
    
    if maya_existing:
        # Check if Maya has any attempts
        result = await session.execute(
            select(func.count(LessonAttempt.id))
            .where(LessonAttempt.user_id == maya_existing.id)
        )
        attempt_count = result.scalar()
        
        if attempt_count > 0:
            print("  Seeded users already have history, skipping...")
            return
    
    # Get history generators
    history_funcs = [
        get_leo_history,
        get_asha_history,
        get_maya_history,
        get_noah_history,
        get_sofia_history,
    ]
    
    total_attempts = 0
    total_answers = 0
    total_progress_rows = 0
    
    for user_index, user_def in enumerate(users_def):
        # Create or get user
        result = await session.execute(
            select(User).where(User.username == user_def["username"])
        )
        user = result.scalar_one_or_none()
        
        if not user:
            user = User(
                username=user_def["username"],
                display_name=user_def["display_name"],
                email=user_def["email"],
                total_xp=user_def["total_xp"],
                current_streak=user_def["current_streak"],
                longest_streak=user_def["longest_streak"],
                gems=user_def["gems"],
                daily_goal_xp=user_def["daily_goal_xp"],
                is_content_admin=user_def["is_content_admin"],
                active_course_id=course.id,
            )
            session.add(user)
            await session.flush()
        
        # Generate history
        history = history_funcs[user_index](reference_date)
        
        # Set user-specific fields
        if "hearts" in user_def:
            user.hearts = user_def["hearts"]
        
        if "heart_regen_anchor_minutes_ago" in history:
            user.heart_regen_anchor_at = reference_now - timedelta(
                minutes=history["heart_regen_anchor_minutes_ago"]
            )
        
        user.current_streak = history["current_streak"]
        user.longest_streak = history["longest_streak"]
        user.last_activity_date = history.get("last_activity_date")
        
        # Create attempts
        skill_progress_tracker = {}
        
        for attempt_recipe in history["attempts"]:
            skill = skills[attempt_recipe["skill_index"]]
            lesson = lessons[attempt_recipe["skill_index"]]
            
            # Get 10 exercises for this lesson
            result = await session.execute(
                select(Exercise)
                .where(Exercise.lesson_id == lesson.id, Exercise.is_active == True)
                .order_by(Exercise.order_index)
                .limit(10)
            )
            exercises = list(result.scalars().all())
            
            if len(exercises) < 10:
                print(f"    WARNING: Skill {skill.title} has only {len(exercises)} exercises")
                continue
            
            exercise_order = [ex.id for ex in exercises]
            
            # Create attempt
            attempt_time = datetime.combine(
                attempt_recipe["activity_date"],
                datetime.min.time()
            ).replace(tzinfo=reference_now.tzinfo)
            
            attempt = LessonAttempt(
                user_id=user.id,
                lesson_id=lesson.id,
                started_at=attempt_time,
                completed_at=attempt_time + timedelta(minutes=5),
                activity_date=attempt_recipe["activity_date"],
                status="completed",
                exercise_order=exercise_order,
                current_index=10,
                mistakes_count=attempt_recipe["mistakes_count"],
                hearts_lost=attempt_recipe["mistakes_count"],
                xp_earned=attempt_recipe["xp_earned"],
            )
            session.add(attempt)
            await session.flush()
            total_attempts += 1
            
            # Create answer records
            mistakes_to_make = attempt_recipe["mistakes_count"]
            for position, exercise in enumerate(exercises):
                is_correct = mistakes_to_make == 0
                
                if not is_correct and mistakes_to_make > 0:
                    mistakes_to_make -= 1
                
                # Generate a valid submitted answer
                submitted_answer = exercise.correct_answer
                if not is_correct:
                    # Make it wrong based on type
                    if exercise.type == "multiple_choice":
                        # Pick a different option
                        options = exercise.options
                        wrong_id = next(
                            (opt["id"] for opt in options if opt["id"] != exercise.correct_answer["option_id"]),
                            options[0]["id"]
                        )
                        submitted_answer = {"option_id": wrong_id}
                    elif exercise.type == "fill_blank":
                        submitted_answer = {"text": "incorrect"}
                    elif exercise.type == "type_answer":
                        submitted_answer = {"text": "wrong"}
                    # For word_bank and match_pairs, just use correct (simplified)
                
                answer = ExerciseAnswer(
                    lesson_attempt_id=attempt.id,
                    exercise_id=exercise.id,
                    position=position,
                    exercise_type=exercise.type,
                    submitted_answer=submitted_answer,
                    correct_answer_snapshot=exercise.correct_answer,
                    is_correct=is_correct,
                    answered_at=attempt_time + timedelta(seconds=30 * position),
                )
                session.add(answer)
                total_answers += 1
            
            # Track skill progress
            if skill.id not in skill_progress_tracker:
                skill_progress_tracker[skill.id] = {
                    "crowns": 0,
                    "times_practiced": 0,
                    "last_practiced_at": None,
                }
            
            skill_progress_tracker[skill.id]["times_practiced"] += 1
            skill_progress_tracker[skill.id]["crowns"] = min(
                skill_progress_tracker[skill.id]["crowns"] + 1,
                skill.max_level,
            )
            skill_progress_tracker[skill.id]["last_practiced_at"] = attempt.completed_at
        
        # Create user_skill_progress rows for ALL skills (not just practiced ones)
        for skill in skills:
            result = await session.execute(
                select(UserSkillProgress).where(
                    UserSkillProgress.user_id == user.id,
                    UserSkillProgress.skill_id == skill.id,
                )
            )
            progress = result.scalar_one_or_none()
            
            if not progress:
                # Get practiced data if it exists, otherwise zero
                progress_data = skill_progress_tracker.get(skill.id, {
                    "crowns": 0,
                    "times_practiced": 0,
                    "last_practiced_at": None,
                })
                
                progress = UserSkillProgress(
                    user_id=user.id,
                    skill_id=skill.id,
                    crowns=progress_data["crowns"],
                    times_practiced=progress_data["times_practiced"],
                    last_practiced_at=progress_data["last_practiced_at"],
                )
                session.add(progress)
                total_progress_rows += 1
        
        # Award achievements based on history
        # Calculate current values
        perfect_lesson_count = sum(1 for a in history["attempts"] if a["mistakes_count"] == 0)
        skills_completed = sum(1 for p in skill_progress_tracker.values() if p["crowns"] >= 5)
        
        for achievement in achievements:
            earned = False
            
            if achievement.criteria_type == "total_xp":
                earned = user.total_xp >= achievement.criteria_value
            elif achievement.criteria_type == "streak_days":
                earned = user.longest_streak >= achievement.criteria_value
            elif achievement.criteria_type == "perfect_lessons":
                earned = perfect_lesson_count >= achievement.criteria_value
            elif achievement.criteria_type == "skills_completed":
                earned = skills_completed >= achievement.criteria_value
            
            if earned:
                result = await session.execute(
                    select(UserAchievement).where(
                        UserAchievement.user_id == user.id,
                        UserAchievement.achievement_id == achievement.id,
                    )
                )
                user_achievement = result.scalar_one_or_none()
                
                if not user_achievement:
                    user_achievement = UserAchievement(
                        user_id=user.id,
                        achievement_id=achievement.id,
                        earned_at=reference_now,
                    )
                    session.add(user_achievement)
        
        print(f"  {user.display_name}: {len(history['attempts'])} attempts")
    
    await session.flush()
    print(f"  Total attempts: {total_attempts}")
    print(f"  Total answers: {total_answers}")
    print(f"  Total progress rows: {total_progress_rows}")


async def verify_seed(session: AsyncSession, reference_date: date) -> bool:
    """Run verification checks and print report.
    
    Returns True if all checks pass.
    """
    print("\n" + "=" * 60)
    print("SEED VERIFICATION REPORT")
    print("=" * 60 + "\n")
    
    all_passed = True
    
    # 1. Row counts
    print("1. ROW COUNTS")
    
    # Expected counts from /docs/05_SEED_DATA.md
    expected_counts = {
        "courses": 1,
        "units": 3,
        "skills": 5,
        "lessons": 5,
        "exercises": 60,
        "users": 5,
        "user_skill_progress": 25,  # 5 users × 5 skills
        "achievements": 6,
        "lesson_attempts": 142,
        "exercise_answers": 1420,
    }
    
    tables = [
        (Course, "courses"),
        (Unit, "units"),
        (Skill, "skills"),
        (Lesson, "lessons"),
        (Exercise, "exercises"),
        (User, "users"),
        (UserSkillProgress, "user_skill_progress"),
        (Achievement, "achievements"),
        (LessonAttempt, "lesson_attempts"),
        (ExerciseAnswer, "exercise_answers"),
        (UserAchievement, "user_achievements"),
    ]
    
    for model, name in tables:
        result = await session.execute(select(func.count(model.id)))
        count = result.scalar()
        
        expected = expected_counts.get(name)
        if expected is not None:
            status = "[OK]" if count == expected else "[FAIL]"
            print(f"  {name}: {count} (expected {expected}) {status}")
            if count != expected:
                all_passed = False
        else:
            print(f"  {name}: {count}")
    
    # 2. Progress rows per user
    print("\n2. PROGRESS ROWS PER USER")
    result = await session.execute(select(User).order_by(User.total_xp.desc()))
    users = result.scalars().all()
    
    for user in users:
        result = await session.execute(
            select(func.count(UserSkillProgress.id))
            .where(UserSkillProgress.user_id == user.id)
        )
        progress_count = result.scalar()
        status = "[OK]" if progress_count == 5 else "[FAIL]"
        print(f"  {user.display_name}: {progress_count} rows (expected 5) {status}")
        if progress_count != 5:
            all_passed = False
    
    # 3. Exercise distribution per skill
    print("\n3. EXERCISE DISTRIBUTION BY SKILL")
    result = await session.execute(select(Skill).order_by(Skill.id))
    skills = result.scalars().all()
    
    for skill in skills:
        result = await session.execute(
            select(Exercise)
            .join(Lesson)
            .where(Lesson.skill_id == skill.id, Exercise.is_active == True)
        )
        exercises = list(result.scalars().all())
        
        type_counts = Counter(ex.type for ex in exercises)
        print(f"  {skill.title}:")
        print(f"    Total: {len(exercises)}")
        print(f"    multiple_choice: {type_counts.get('multiple_choice', 0)}")
        print(f"    translate_word_bank: {type_counts.get('translate_word_bank', 0)}")
        print(f"    match_pairs: {type_counts.get('match_pairs', 0)}")
        print(f"    fill_blank: {type_counts.get('fill_blank', 0)}")
        print(f"    type_answer: {type_counts.get('type_answer', 0)}")
        
        if len(exercises) != 12:
            print(f"    FAIL: Expected 12 exercises")
            all_passed = False
    
    # 4. XP consistency
    print("\n4. XP CONSISTENCY CHECK")
    result = await session.execute(select(User))
    users = result.scalars().all()
    
    for user in users:
        result = await session.execute(
            select(func.coalesce(func.sum(LessonAttempt.xp_earned), 0))
            .where(
                LessonAttempt.user_id == user.id,
                LessonAttempt.status == "completed",
            )
        )
        computed_xp = result.scalar()
        
        difference = user.total_xp - computed_xp
        status = "OK" if difference == 0 else "FAIL"
        print(f"  {user.display_name}: stored={user.total_xp}, computed={computed_xp}, diff={difference} [{status}]")
        
        if difference != 0:
            all_passed = False
    
    # 5. Maya's state
    print("\n5. MAYA'S PROFILE STATE")
    result = await session.execute(select(User).where(User.username == "maya_demo"))
    maya = result.scalar_one_or_none()
    
    if maya:
        print(f"  Total XP: {maya.total_xp}")
        print(f"  Current streak: {maya.current_streak}")
        print(f"  Longest streak: {maya.longest_streak}")
        print(f"  Hearts: {maya.hearts}/{maya.max_hearts}")
        print(f"  Gems: {maya.gems}")
        print(f"  Daily goal: {maya.daily_goal_xp}")
        print(f"  Last activity: {maya.last_activity_date}")
        print(f"  Heart regen anchor: {maya.heart_regen_anchor_at}")
        print(f"  Is content admin: {maya.is_content_admin}")
        
        # Check today's XP
        result = await session.execute(
            select(func.coalesce(func.sum(LessonAttempt.xp_earned), 0))
            .where(
                LessonAttempt.user_id == maya.id,
                LessonAttempt.activity_date == reference_date,
                LessonAttempt.status == "completed",
            )
        )
        today_xp = result.scalar()
        print(f"  Today's XP: {today_xp}")
        
        if maya.total_xp != 340:
            print(f"    FAIL: Expected total_xp=340")
            all_passed = False
        if maya.current_streak != 6:
            print(f"    FAIL: Expected current_streak=6")
            all_passed = False
        if maya.longest_streak != 11:
            print(f"    FAIL: Expected longest_streak=11")
            all_passed = False
        if maya.hearts != 4:
            print(f"    FAIL: Expected hearts=4")
            all_passed = False
        if today_xp != 10:
            print(f"    FAIL: Expected today_xp=10")
            all_passed = False
    else:
        print("  FAIL: Maya not found")
        all_passed = False
    
    # 6. Leaderboard order
    print("\n6. LEADERBOARD ORDER")
    result = await session.execute(
        select(User).order_by(User.total_xp.desc(), User.username.asc())
    )
    users = result.scalars().all()
    
    for rank, user in enumerate(users, 1):
        current_marker = " (current user)" if user.username == "maya_demo" else ""
        print(f"  {rank}. {user.display_name} - {user.total_xp} XP{current_marker}")
    
    if len(users) >= 3 and users[2].username != "maya_demo":
        print("    FAIL: Maya should be rank 3")
        all_passed = False
    
    # 7. Active attempts
    print("\n7. ACTIVE ATTEMPTS CHECK")
    result = await session.execute(
        select(func.count(LessonAttempt.id))
        .where(LessonAttempt.status == "in_progress")
    )
    active_count = result.scalar()
    print(f"  In-progress attempts: {active_count}")
    
    if active_count != 0:
        print("    FAIL: Expected 0 active attempts")
        all_passed = False
    
    # 8. Foreign key check
    print("\n8. FOREIGN KEY INTEGRITY")
    result = await session.execute(text("PRAGMA foreign_key_check"))
    violations = result.fetchall()
    
    if violations:
        print(f"  FAIL: Found {len(violations)} foreign key violations")
        for v in violations:
            print(f"    {v}")
        all_passed = False
    else:
        print("  [OK] No foreign key violations")
    
    print("\n" + "=" * 60)
    if all_passed:
        print("ALL CHECKS PASSED [OK]")
    else:
        print("SOME CHECKS FAILED [FAIL]")
    print("=" * 60 + "\n")
    
    return all_passed


async def reset_seed_data(session: AsyncSession) -> None:
    """Delete all seeded data in child-first order."""
    print("Resetting seed data...")
    
    # Temporarily disable foreign key constraints for SQLite
    await session.execute(text("PRAGMA foreign_keys = OFF"))
    
    # Delete in reverse dependency order
    await session.execute(text("DELETE FROM user_achievements"))
    await session.execute(text("DELETE FROM exercise_answers"))
    await session.execute(text("DELETE FROM lesson_attempts"))
    await session.execute(text("DELETE FROM user_skill_progress"))
    await session.execute(text("DELETE FROM users"))
    await session.execute(text("DELETE FROM achievements"))
    await session.execute(text("DELETE FROM exercises"))
    await session.execute(text("DELETE FROM lessons"))
    await session.execute(text("DELETE FROM skills"))
    await session.execute(text("DELETE FROM units"))
    await session.execute(text("DELETE FROM courses"))
    
    # Re-enable foreign key constraints
    await session.execute(text("PRAGMA foreign_keys = ON"))
    
    await session.commit()
    print("  All seed data deleted")


async def main(args: argparse.Namespace) -> int:
    """Main seed orchestration."""
    # Environment protection
    if args.reset:
        app_env = settings.model_config.get("env_file", ".env")
        if "production" in str(app_env).lower():
            print("ERROR: --reset is not allowed in production")
            return 1
        
        if not args.yes:
            print("ERROR: --reset requires --yes confirmation")
            return 1
    
    # Reference date (UTC — matches schema logical-clock / timestamp conventions)
    if args.reference_date:
        try:
            reference_date = date.fromisoformat(args.reference_date)
            reference_now = datetime.combine(
                reference_date, datetime.min.time(), tzinfo=timezone.utc
            )
        except ValueError:
            print(f"ERROR: Invalid date format: {args.reference_date}")
            return 1
    else:
        reference_now = datetime.now(timezone.utc)
        reference_date = reference_now.date()
    
    print(f"Reference date: {reference_date}")
    print(f"Reference time: {reference_now}\n")
    
    # Create async engine
    engine = create_async_engine(settings.database_url, echo=False)
    async_session_maker = async_sessionmaker(engine, expire_on_commit=False)
    
    async with async_session_maker() as session:
        try:
            # Reset if requested
            if args.reset:
                await reset_seed_data(session)
            
            # Seed content
            entities = await seed_course_content(session)
            achievements = await seed_achievements(session)
            
            # Seed users and history
            await seed_users_and_history(
                session=session,
                course=entities["course"],
                skills=entities["skills"],
                lessons=entities["lessons"],
                achievements=achievements,
                reference_date=reference_date,
                reference_now=reference_now,
            )
            
            await session.commit()
            print("\nSeed data committed successfully.")
            
            # Verify
            passed = await verify_seed(session, reference_date)
            
            return 0 if passed else 1
        
        except Exception as e:
            await session.rollback()
            print(f"\nERROR: {e}")
            import traceback
            traceback.print_exc()
            return 1
    
    await engine.dispose()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Seed LingoQuest database with deterministic data")
    parser.add_argument(
        "--reference-date",
        type=str,
        help="Reference date for today's activity (YYYY-MM-DD). Defaults to current date.",
    )
    parser.add_argument(
        "--reset",
        action="store_true",
        help="Delete all seed data before seeding (development only)",
    )
    parser.add_argument(
        "--yes",
        action="store_true",
        help="Confirm destructive reset operation",
    )
    
    args = parser.parse_args()
    
    exit_code = 0
    try:
        import asyncio
        exit_code = asyncio.run(main(args))
    except KeyboardInterrupt:
        print("\nInterrupted by user")
        exit_code = 130
    
    sys.exit(exit_code)
