"""Schema integration tests covering constraints and validation."""
import pytest
from sqlalchemy import select, text
from sqlalchemy.exc import IntegrityError

from app.models import (
    User, Course, Unit, Skill, Lesson, Exercise,
    LessonAttempt, ExerciseAnswer, UserSkillProgress,
    Achievement, UserAchievement
)


class TestForeignKeyEnforcement:
    """Test that foreign keys are enforced."""
    
    @pytest.mark.asyncio
    async def test_foreign_keys_enabled(self, test_session):
        """Verify PRAGMA foreign_keys is ON."""
        result = await test_session.execute(text("PRAGMA foreign_keys"))
        row = result.fetchone()
        assert row[0] == 1, "Foreign keys must be enabled"

    @pytest.mark.asyncio
    async def test_active_course_id_fk_rejects_orphan(self, test_session):
        """users.active_course_id must reference an existing course."""
        user = User(
            username="orphan_course",
            display_name="Orphan",
            active_course_id=99999,
        )
        test_session.add(user)
        with pytest.raises(IntegrityError):
            await test_session.flush()

    @pytest.mark.asyncio
    async def test_active_course_id_set_null_on_course_delete(self, test_session):
        """Deleting a course with no units SET NULLs users.active_course_id."""
        course = Course(
            language_code="fr",
            from_language_code="en",
            title="French",
            icon="french-course",
        )
        test_session.add(course)
        await test_session.flush()

        user = User(
            username="linked_course",
            display_name="Linked",
            active_course_id=course.id,
        )
        test_session.add(user)
        await test_session.flush()

        await test_session.delete(course)
        await test_session.flush()
        await test_session.refresh(user)
        assert user.active_course_id is None

    @pytest.mark.asyncio
    async def test_leaderboard_index_exists(self, test_session):
        """Deterministic leaderboard index is present on users."""
        result = await test_session.execute(text("PRAGMA index_list(users)"))
        names = {row[1] for row in result.fetchall()}
        assert "ix_users_leaderboard" in names

    @pytest.mark.asyncio
    async def test_user_skill_progress_has_no_status_column(self, test_session):
        """Public skill status must not be stored on user_skill_progress."""
        result = await test_session.execute(text("PRAGMA table_info(user_skill_progress)"))
        cols = {row[1] for row in result.fetchall()}
        assert "status" not in cols


class TestUserConstraints:
    """Test user table constraints."""
    
    @pytest.mark.asyncio
    async def test_username_unique(self, test_session):
        """Username must be unique."""
        user1 = User(username="alice", display_name="Alice")
        user2 = User(username="alice", display_name="Alice2")
        
        test_session.add(user1)
        await test_session.flush()
        
        test_session.add(user2)
        with pytest.raises(IntegrityError):
            await test_session.flush()
    
    @pytest.mark.asyncio
    async def test_negative_total_xp_rejected(self, test_session):
        """Total XP cannot be negative."""
        user = User(username="test", display_name="Test", total_xp=-1)
        test_session.add(user)
        
        with pytest.raises(IntegrityError):
            await test_session.flush()
    
    @pytest.mark.asyncio
    async def test_longest_streak_less_than_current_rejected(self, test_session):
        """Longest streak must be >= current streak."""
        user = User(
            username="test", 
            display_name="Test",
            current_streak=10,
            longest_streak=5
        )
        test_session.add(user)
        
        with pytest.raises(IntegrityError):
            await test_session.flush()
    
    @pytest.mark.asyncio
    async def test_hearts_exceeds_max_rejected(self, test_session):
        """Hearts cannot exceed max_hearts."""
        user = User(
            username="test",
            display_name="Test",
            hearts=10,
            max_hearts=5
        )
        test_session.add(user)
        
        with pytest.raises(IntegrityError):
            await test_session.flush()
    
    @pytest.mark.asyncio
    async def test_zero_daily_goal_rejected(self, test_session):
        """Daily goal must be positive."""
        user = User(
            username="test",
            display_name="Test",
            daily_goal_xp=0
        )
        test_session.add(user)
        
        with pytest.raises(IntegrityError):
            await test_session.flush()


class TestCourseConstraints:
    """Test course content constraints."""
    
    @pytest.mark.asyncio
    async def test_course_language_pair_unique(self, test_session):
        """Language pair must be unique."""
        course1 = Course(
            language_code="es",
            from_language_code="en",
            title="Spanish",
            icon="🇪🇸"
        )
        course2 = Course(
            language_code="es",
            from_language_code="en",
            title="Spanish 2",
            icon="🇪🇸"
        )
        
        test_session.add(course1)
        await test_session.flush()
        
        test_session.add(course2)
        with pytest.raises(IntegrityError):
            await test_session.flush()
    
    @pytest.mark.asyncio
    async def test_unit_order_unique_per_course(self, test_session):
        """Unit order must be unique within a course."""
        course = Course(
            language_code="es",
            from_language_code="en",
            title="Spanish",
            icon="🇪🇸"
        )
        test_session.add(course)
        await test_session.flush()
        
        unit1 = Unit(
            course_id=course.id,
            order_index=0,
            title="Unit 1",
            color_theme="#FF0000"
        )
        unit2 = Unit(
            course_id=course.id,
            order_index=0,
            title="Unit 2",
            color_theme="#00FF00"
        )
        
        test_session.add(unit1)
        await test_session.flush()
        
        test_session.add(unit2)
        with pytest.raises(IntegrityError):
            await test_session.flush()
    
    @pytest.mark.asyncio
    async def test_negative_unit_order_rejected(self, test_session):
        """Unit order must be non-negative."""
        course = Course(
            language_code="es",
            from_language_code="en",
            title="Spanish",
            icon="🇪🇸"
        )
        test_session.add(course)
        await test_session.flush()
        
        unit = Unit(
            course_id=course.id,
            order_index=-1,
            title="Unit",
            color_theme="#FF0000"
        )
        test_session.add(unit)
        
        with pytest.raises(IntegrityError):
            await test_session.flush()


class TestSkillConstraints:
    """Test skill constraints."""
    
    @pytest.mark.asyncio
    async def test_skill_self_prerequisite_rejected(self, test_session):
        """Skill cannot require itself."""
        course = Course(
            language_code="es",
            from_language_code="en",
            title="Spanish",
            icon="🇪🇸"
        )
        unit = Unit(
            course=course,
            order_index=0,
            title="Unit 1",
            color_theme="#FF0000"
        )
        skill = Skill(
            unit=unit,
            order_index=0,
            title="Greetings",
            icon="👋",
            max_level=5
        )
        
        test_session.add(skill)
        await test_session.flush()
        
        # Try to set self as prerequisite
        skill.unlock_requires_skill_id = skill.id
        
        with pytest.raises(IntegrityError):
            await test_session.flush()
    
    @pytest.mark.asyncio
    async def test_zero_max_level_rejected(self, test_session):
        """Max level must be positive."""
        course = Course(
            language_code="es",
            from_language_code="en",
            title="Spanish",
            icon="🇪🇸"
        )
        unit = Unit(
            course=course,
            order_index=0,
            title="Unit 1",
            color_theme="#FF0000"
        )
        skill = Skill(
            unit=unit,
            order_index=0,
            title="Greetings",
            icon="👋",
            max_level=0
        )
        
        test_session.add(skill)
        
        with pytest.raises(IntegrityError):
            await test_session.flush()


class TestExerciseConstraints:
    """Test exercise constraints."""
    
    @pytest.mark.asyncio
    async def test_invalid_exercise_type_rejected(self, test_session):
        """Exercise type must be one of the five allowed values."""
        course = Course(
            language_code="es",
            from_language_code="en",
            title="Spanish",
            icon="🇪🇸"
        )
        unit = Unit(
            course=course,
            order_index=0,
            title="Unit 1",
            color_theme="#FF0000"
        )
        skill = Skill(
            unit=unit,
            order_index=0,
            title="Greetings",
            icon="👋",
            max_level=5
        )
        lesson = Lesson(
            skill=skill,
            order_index=0,
            xp_reward=10
        )
        exercise = Exercise(
            lesson=lesson,
            order_index=0,
            type="invalid_type",
            prompt="Test",
            correct_answer={"answer": "test"}
        )
        
        test_session.add(exercise)
        
        with pytest.raises(IntegrityError):
            await test_session.flush()
    
    @pytest.mark.asyncio
    async def test_valid_exercise_types_accepted(self, test_session):
        """All five valid exercise types are accepted."""
        course = Course(
            language_code="es",
            from_language_code="en",
            title="Spanish",
            icon="🇪🇸"
        )
        unit = Unit(
            course=course,
            order_index=0,
            title="Unit 1",
            color_theme="#FF0000"
        )
        skill = Skill(
            unit=unit,
            order_index=0,
            title="Greetings",
            icon="👋",
            max_level=5
        )
        lesson = Lesson(
            skill=skill,
            order_index=0,
            xp_reward=10
        )
        
        valid_types = [
            "multiple_choice",
            "translate_word_bank",
            "match_pairs",
            "fill_blank",
            "type_answer"
        ]
        
        for i, exercise_type in enumerate(valid_types):
            exercise = Exercise(
                lesson=lesson,
                order_index=i,
                type=exercise_type,
                prompt="Test",
                correct_answer={"answer": "test"}
            )
            test_session.add(exercise)
        
        await test_session.flush()
        # All should succeed


class TestLessonAttemptConstraints:
    """Test lesson attempt constraints."""
    
    @pytest.mark.asyncio
    async def test_invalid_status_rejected(self, test_session):
        """Status must be one of the three allowed values."""
        user = User(username="test", display_name="Test")
        course = Course(
            language_code="es",
            from_language_code="en",
            title="Spanish",
            icon="🇪🇸"
        )
        unit = Unit(
            course=course,
            order_index=0,
            title="Unit 1",
            color_theme="#FF0000"
        )
        skill = Skill(
            unit=unit,
            order_index=0,
            title="Greetings",
            icon="👋",
            max_level=5
        )
        lesson = Lesson(
            skill=skill,
            order_index=0,
            xp_reward=10
        )
        
        test_session.add_all([user, lesson])
        await test_session.flush()
        
        attempt = LessonAttempt(
            user_id=user.id,
            lesson_id=lesson.id,
            status="invalid_status",
            exercise_order=[1, 2, 3]
        )
        test_session.add(attempt)
        
        with pytest.raises(IntegrityError):
            await test_session.flush()
    
    @pytest.mark.asyncio
    async def test_negative_current_index_rejected(self, test_session):
        """Current index must be non-negative."""
        user = User(username="test", display_name="Test")
        course = Course(
            language_code="es",
            from_language_code="en",
            title="Spanish",
            icon="🇪🇸"
        )
        unit = Unit(
            course=course,
            order_index=0,
            title="Unit 1",
            color_theme="#FF0000"
        )
        skill = Skill(
            unit=unit,
            order_index=0,
            title="Greetings",
            icon="👋",
            max_level=5
        )
        lesson = Lesson(
            skill=skill,
            order_index=0,
            xp_reward=10
        )
        
        test_session.add_all([user, lesson])
        await test_session.flush()
        
        attempt = LessonAttempt(
            user_id=user.id,
            lesson_id=lesson.id,
            status="in_progress",
            exercise_order=[1, 2, 3],
            current_index=-1
        )
        test_session.add(attempt)
        
        with pytest.raises(IntegrityError):
            await test_session.flush()


class TestExerciseAnswerConstraints:
    """Test exercise answer constraints."""
    
    @pytest.mark.asyncio
    async def test_duplicate_position_rejected(self, test_session):
        """Position must be unique within an attempt."""
        user = User(username="test", display_name="Test")
        course = Course(
            language_code="es",
            from_language_code="en",
            title="Spanish",
            icon="🇪🇸"
        )
        unit = Unit(
            course=course,
            order_index=0,
            title="Unit 1",
            color_theme="#FF0000"
        )
        skill = Skill(
            unit=unit,
            order_index=0,
            title="Greetings",
            icon="👋",
            max_level=5
        )
        lesson = Lesson(
            skill=skill,
            order_index=0,
            xp_reward=10
        )
        exercise1 = Exercise(
            lesson=lesson,
            order_index=0,
            type="multiple_choice",
            prompt="Test 1",
            correct_answer={"answer": "test1"}
        )
        exercise2 = Exercise(
            lesson=lesson,
            order_index=1,
            type="multiple_choice",
            prompt="Test 2",
            correct_answer={"answer": "test2"}
        )
        attempt = LessonAttempt(
            user=user,
            lesson=lesson,
            status="in_progress",
            exercise_order=[exercise1.id, exercise2.id]
        )
        
        test_session.add_all([user, attempt, exercise1, exercise2])
        await test_session.flush()
        
        answer1 = ExerciseAnswer(
            lesson_attempt_id=attempt.id,
            exercise_id=exercise1.id,
            position=0,
            exercise_type="multiple_choice",
            submitted_answer={"answer": "test"},
            correct_answer_snapshot={"answer": "test1"},
            is_correct=False
        )
        answer2 = ExerciseAnswer(
            lesson_attempt_id=attempt.id,
            exercise_id=exercise2.id,
            position=0,  # Duplicate position
            exercise_type="multiple_choice",
            submitted_answer={"answer": "test"},
            correct_answer_snapshot={"answer": "test2"},
            is_correct=False
        )
        
        test_session.add(answer1)
        await test_session.flush()
        
        test_session.add(answer2)
        with pytest.raises(IntegrityError):
            await test_session.flush()
    
    @pytest.mark.asyncio
    async def test_duplicate_exercise_rejected(self, test_session):
        """Exercise ID must be unique within an attempt."""
        user = User(username="test", display_name="Test")
        course = Course(
            language_code="es",
            from_language_code="en",
            title="Spanish",
            icon="🇪🇸"
        )
        unit = Unit(
            course=course,
            order_index=0,
            title="Unit 1",
            color_theme="#FF0000"
        )
        skill = Skill(
            unit=unit,
            order_index=0,
            title="Greetings",
            icon="👋",
            max_level=5
        )
        lesson = Lesson(
            skill=skill,
            order_index=0,
            xp_reward=10
        )
        exercise = Exercise(
            lesson=lesson,
            order_index=0,
            type="multiple_choice",
            prompt="Test",
            correct_answer={"answer": "test"}
        )
        attempt = LessonAttempt(
            user=user,
            lesson=lesson,
            status="in_progress",
            exercise_order=[exercise.id]
        )
        
        test_session.add_all([user, attempt, exercise])
        await test_session.flush()
        
        answer1 = ExerciseAnswer(
            lesson_attempt_id=attempt.id,
            exercise_id=exercise.id,
            position=0,
            exercise_type="multiple_choice",
            submitted_answer={"answer": "test"},
            correct_answer_snapshot={"answer": "test"},
            is_correct=False
        )
        answer2 = ExerciseAnswer(
            lesson_attempt_id=attempt.id,
            exercise_id=exercise.id,  # Duplicate exercise
            position=1,
            exercise_type="multiple_choice",
            submitted_answer={"answer": "test2"},
            correct_answer_snapshot={"answer": "test"},
            is_correct=False
        )
        
        test_session.add(answer1)
        await test_session.flush()
        
        test_session.add(answer2)
        with pytest.raises(IntegrityError):
            await test_session.flush()


class TestAchievementConstraints:
    """Test achievement constraints."""
    
    @pytest.mark.asyncio
    async def test_invalid_criteria_type_rejected(self, test_session):
        """Criteria type must be one of the four allowed values."""
        achievement = Achievement(
            key="test",
            title="Test",
            description="Test",
            icon="🏆",
            criteria_type="invalid_type",
            criteria_value=10
        )
        test_session.add(achievement)
        
        with pytest.raises(IntegrityError):
            await test_session.flush()
    
    @pytest.mark.asyncio
    async def test_duplicate_user_achievement_rejected(self, test_session):
        """User cannot earn the same achievement twice."""
        user = User(username="test", display_name="Test")
        achievement = Achievement(
            key="test",
            title="Test",
            description="Test",
            icon="🏆",
            criteria_type="total_xp",
            criteria_value=100
        )
        
        test_session.add_all([user, achievement])
        await test_session.flush()
        
        user_ach1 = UserAchievement(
            user_id=user.id,
            achievement_id=achievement.id
        )
        user_ach2 = UserAchievement(
            user_id=user.id,
            achievement_id=achievement.id
        )
        
        test_session.add(user_ach1)
        await test_session.flush()
        
        test_session.add(user_ach2)
        with pytest.raises(IntegrityError):
            await test_session.flush()


class TestRelationships:
    """Test that relationships and cascades work correctly."""
    
    @pytest.mark.asyncio
    async def test_user_deletion_cascades_attempts(self, test_session):
        """Deleting a user cascades to their attempts."""
        user = User(username="test", display_name="Test")
        course = Course(
            language_code="es",
            from_language_code="en",
            title="Spanish",
            icon="🇪🇸"
        )
        unit = Unit(
            course=course,
            order_index=0,
            title="Unit 1",
            color_theme="#FF0000"
        )
        skill = Skill(
            unit=unit,
            order_index=0,
            title="Greetings",
            icon="👋",
            max_level=5
        )
        lesson = Lesson(
            skill=skill,
            order_index=0,
            xp_reward=10
        )
        attempt = LessonAttempt(
            user=user,
            lesson=lesson,
            status="in_progress",
            exercise_order=[1, 2, 3]
        )
        
        test_session.add_all([user, attempt])
        await test_session.flush()
        
        attempt_id = attempt.id
        
        # Delete user
        await test_session.delete(user)
        await test_session.flush()
        
        # Attempt should be deleted
        result = await test_session.execute(
            select(LessonAttempt).where(LessonAttempt.id == attempt_id)
        )
        assert result.scalar_one_or_none() is None
    
    @pytest.mark.asyncio
    async def test_course_deletion_restricted_with_units(self, test_session):
        """Deleting a course with units is restricted."""
        course = Course(
            language_code="es",
            from_language_code="en",
            title="Spanish",
            icon="🇪🇸"
        )
        unit = Unit(
            course=course,
            order_index=0,
            title="Unit 1",
            color_theme="#FF0000"
        )
        
        test_session.add_all([course, unit])
        await test_session.flush()
        
        # Try to delete course (should fail due to RESTRICT)
        await test_session.delete(course)
        
        with pytest.raises(IntegrityError):
            await test_session.flush()
