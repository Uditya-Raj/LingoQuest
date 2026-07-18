"""Seed data integration tests."""
import pytest
from datetime import date, datetime, timezone
from sqlalchemy import select, func, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import (
    User, Course, Unit, Skill, Lesson, Exercise,
    LessonAttempt, ExerciseAnswer, UserSkillProgress,
    Achievement, UserAchievement,
)
from app.seed.seed_data import seed_course_content, seed_achievements, seed_users_and_history


@pytest.mark.asyncio
class TestSeedDataIntegration:
    """Test complete seed generation and verification."""
    
    async def test_exact_row_counts(self, test_session: AsyncSession):
        """Test that seed produces exact expected row counts."""
        # Seed everything
        reference_date = date(2026, 7, 18)
        reference_now = datetime.combine(reference_date, datetime.min.time()).replace(
            tzinfo=timezone.utc
        )
        
        entities = await seed_course_content(test_session)
        achievements = await seed_achievements(test_session)
        await seed_users_and_history(
            test_session,
            entities["course"],
            entities["skills"],
            entities["lessons"],
            achievements,
            reference_date,
            reference_now,
        )
        await test_session.commit()
        
        # Verify exact counts from /docs/05_SEED_DATA.md
        expected = {
            Course: 1,
            Unit: 3,
            Skill: 5,
            Lesson: 5,
            Exercise: 60,
            User: 5,
            UserSkillProgress: 25,  # 5 users × 5 skills
            Achievement: 6,
            LessonAttempt: 142,
            ExerciseAnswer: 1420,
        }
        
        for model, count in expected.items():
            result = await test_session.execute(select(func.count(model.id)))
            actual = result.scalar()
            assert actual == count, f"{model.__name__}: expected {count}, got {actual}"
    
    async def test_five_progress_rows_per_user(self, test_session: AsyncSession):
        """Test that every user has exactly 5 progress rows (one per skill)."""
        reference_date = date(2026, 7, 18)
        reference_now = datetime.combine(reference_date, datetime.min.time()).replace(
            tzinfo=timezone.utc
        )
        
        entities = await seed_course_content(test_session)
        achievements = await seed_achievements(test_session)
        await seed_users_and_history(
            test_session,
            entities["course"],
            entities["skills"],
            entities["lessons"],
            achievements,
            reference_date,
            reference_now,
        )
        await test_session.commit()
        
        # Check each user
        result = await test_session.execute(select(User))
        users = result.scalars().all()
        
        assert len(users) == 5, "Should have 5 users"
        
        for user in users:
            result = await test_session.execute(
                select(func.count(UserSkillProgress.id))
                .where(UserSkillProgress.user_id == user.id)
            )
            count = result.scalar()
            assert count == 5, f"{user.display_name} should have 5 progress rows, got {count}"
    
    async def test_xp_consistency(self, test_session: AsyncSession):
        """Test that stored total_xp equals sum of completed attempt XP."""
        reference_date = date(2026, 7, 18)
        reference_now = datetime.combine(reference_date, datetime.min.time()).replace(
            tzinfo=timezone.utc
        )
        
        entities = await seed_course_content(test_session)
        achievements = await seed_achievements(test_session)
        await seed_users_and_history(
            test_session,
            entities["course"],
            entities["skills"],
            entities["lessons"],
            achievements,
            reference_date,
            reference_now,
        )
        await test_session.commit()
        
        result = await test_session.execute(select(User))
        users = result.scalars().all()
        
        for user in users:
            result = await test_session.execute(
                select(func.coalesce(func.sum(LessonAttempt.xp_earned), 0))
                .where(
                    LessonAttempt.user_id == user.id,
                    LessonAttempt.status == "completed",
                )
            )
            computed_xp = result.scalar()
            
            assert user.total_xp == computed_xp, (
                f"{user.display_name}: stored XP {user.total_xp} != computed {computed_xp}"
            )
    
    async def test_maya_state(self, test_session: AsyncSession):
        """Test Maya's specific required state."""
        reference_date = date(2026, 7, 18)
        reference_now = datetime.combine(reference_date, datetime.min.time()).replace(
            tzinfo=timezone.utc
        )
        
        entities = await seed_course_content(test_session)
        achievements = await seed_achievements(test_session)
        await seed_users_and_history(
            test_session,
            entities["course"],
            entities["skills"],
            entities["lessons"],
            achievements,
            reference_date,
            reference_now,
        )
        await test_session.commit()
        
        # Get Maya
        result = await test_session.execute(
            select(User).where(User.username == "maya_demo")
        )
        maya = result.scalar_one()
        
        # Verify Maya's profile
        assert maya.total_xp == 340, f"Maya total_xp should be 340, got {maya.total_xp}"
        assert maya.current_streak == 6, f"Maya current_streak should be 6, got {maya.current_streak}"
        assert maya.longest_streak == 11, f"Maya longest_streak should be 11, got {maya.longest_streak}"
        assert maya.hearts == 4, f"Maya hearts should be 4, got {maya.hearts}"
        assert maya.gems == 100, f"Maya gems should be 100, got {maya.gems}"
        assert maya.is_content_admin is True, "Maya should be content admin"
        assert maya.last_activity_date == reference_date, "Maya last_activity_date should match reference"
        
        # Verify today's XP
        result = await test_session.execute(
            select(func.coalesce(func.sum(LessonAttempt.xp_earned), 0))
            .where(
                LessonAttempt.user_id == maya.id,
                LessonAttempt.activity_date == reference_date,
                LessonAttempt.status == "completed",
            )
        )
        today_xp = result.scalar()
        assert today_xp == 10, f"Maya today_xp should be 10, got {today_xp}"
        
        # Get skills in order
        result = await test_session.execute(
            select(Skill)
            .join(Unit)
            .order_by(Unit.order_index, Skill.order_index)
        )
        skills = list(result.scalars().all())
        assert len(skills) == 5
        
        # Verify Maya's skill progress
        expected_progress = [
            ("Greetings", 5, 15),  # 5 crowns, 15 completions
            ("Basics", 5, 12),     # 5 crowns, 12 completions
            ("Food", 2, 2),        # 2 crowns, 2 completions
            ("Family", 0, 0),      # not started
            ("Questions", 0, 0),   # not started
        ]
        
        for skill, (expected_title, expected_crowns, expected_practiced) in zip(skills, expected_progress):
            assert skill.title == expected_title, f"Skill order mismatch: expected {expected_title}, got {skill.title}"
            
            result = await test_session.execute(
                select(UserSkillProgress).where(
                    UserSkillProgress.user_id == maya.id,
                    UserSkillProgress.skill_id == skill.id,
                )
            )
            progress = result.scalar_one()
            
            assert progress.crowns == expected_crowns, (
                f"Maya {skill.title} crowns: expected {expected_crowns}, got {progress.crowns}"
            )
            assert progress.times_practiced == expected_practiced, (
                f"Maya {skill.title} practice count: expected {expected_practiced}, got {progress.times_practiced}"
            )
    
    async def test_zero_active_attempts(self, test_session: AsyncSession):
        """Test that no active or failed attempts are seeded."""
        reference_date = date(2026, 7, 18)
        reference_now = datetime.combine(reference_date, datetime.min.time()).replace(
            tzinfo=timezone.utc
        )
        
        entities = await seed_course_content(test_session)
        achievements = await seed_achievements(test_session)
        await seed_users_and_history(
            test_session,
            entities["course"],
            entities["skills"],
            entities["lessons"],
            achievements,
            reference_date,
            reference_now,
        )
        await test_session.commit()
        
        # Check for in_progress attempts
        result = await test_session.execute(
            select(func.count(LessonAttempt.id))
            .where(LessonAttempt.status == "in_progress")
        )
        in_progress = result.scalar()
        assert in_progress == 0, f"Should have 0 in_progress attempts, got {in_progress}"
        
        # Check for failed attempts
        result = await test_session.execute(
            select(func.count(LessonAttempt.id))
            .where(LessonAttempt.status == "failed")
        )
        failed = result.scalar()
        assert failed == 0, f"Should have 0 failed attempts, got {failed}"
        
        # All attempts should be completed
        result = await test_session.execute(
            select(func.count(LessonAttempt.id))
        )
        total = result.scalar()
        
        result = await test_session.execute(
            select(func.count(LessonAttempt.id))
            .where(LessonAttempt.status == "completed")
        )
        completed = result.scalar()
        
        assert total == completed == 142, f"All {total} attempts should be completed"
    
    async def test_foreign_key_integrity(self, test_session: AsyncSession):
        """Test that no foreign key violations exist."""
        reference_date = date(2026, 7, 18)
        reference_now = datetime.combine(reference_date, datetime.min.time()).replace(
            tzinfo=timezone.utc
        )
        
        entities = await seed_course_content(test_session)
        achievements = await seed_achievements(test_session)
        await seed_users_and_history(
            test_session,
            entities["course"],
            entities["skills"],
            entities["lessons"],
            achievements,
            reference_date,
            reference_now,
        )
        await test_session.commit()
        
        # Run SQLite foreign key check
        result = await test_session.execute(text("PRAGMA foreign_key_check"))
        violations = result.fetchall()
        
        assert len(violations) == 0, f"Found {len(violations)} foreign key violations: {violations}"
    
    async def test_idempotent_seeding(self, test_session: AsyncSession):
        """Test that running seed twice does not create duplicates."""
        reference_date = date(2026, 7, 18)
        reference_now = datetime.combine(reference_date, datetime.min.time()).replace(
            tzinfo=timezone.utc
        )
        
        # First seed
        entities = await seed_course_content(test_session)
        achievements = await seed_achievements(test_session)
        await seed_users_and_history(
            test_session,
            entities["course"],
            entities["skills"],
            entities["lessons"],
            achievements,
            reference_date,
            reference_now,
        )
        await test_session.commit()
        
        # Get counts after first seed
        first_counts = {}
        for model in [Course, Unit, Skill, Lesson, Exercise, User, UserSkillProgress,
                      Achievement, LessonAttempt, ExerciseAnswer, UserAchievement]:
            result = await test_session.execute(select(func.count(model.id)))
            first_counts[model.__name__] = result.scalar()
        
        # Second seed (should be idempotent)
        entities2 = await seed_course_content(test_session)
        achievements2 = await seed_achievements(test_session)
        await seed_users_and_history(
            test_session,
            entities2["course"],
            entities2["skills"],
            entities2["lessons"],
            achievements2,
            reference_date,
            reference_now,
        )
        await test_session.commit()
        
        # Get counts after second seed
        for model in [Course, Unit, Skill, Lesson, Exercise, User, UserSkillProgress,
                      Achievement, LessonAttempt, ExerciseAnswer, UserAchievement]:
            result = await test_session.execute(select(func.count(model.id)))
            second_count = result.scalar()
            first_count = first_counts[model.__name__]
            
            assert second_count == first_count, (
                f"{model.__name__}: count changed from {first_count} to {second_count} on second seed"
            )
