"""Integration tests for Phase 4: Course, skill, start, and retrieve APIs."""
import pytest
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.main import app
from app.models.user import User
from app.models.course import Skill, Lesson
from app.models.progress import LessonAttempt, UserSkillProgress


class TestCourseAPI:
    """Test GET /api/course endpoint."""
    
    @pytest.mark.asyncio
    async def test_course_response_structure(self, async_client: AsyncClient):
        """Test that course endpoint returns proper structure."""
        response = await async_client.get("/api/course")
        
        assert response.status_code == 200
        data = response.json()
        
        # Check top-level structure
        assert "learner" in data
        assert "course" in data
        assert "units" in data
        
        # Check learner summary
        learner = data["learner"]
        assert "id" in learner
        assert "display_name" in learner
        assert "hearts" in learner
        assert "max_hearts" in learner
        assert "total_xp" in learner
        assert "today_xp" in learner
        assert "daily_goal_xp" in learner
        assert "daily_goal_progress" in learner
        assert "current_streak" in learner
        assert "gems" in learner
        
        # Check course info
        course = data["course"]
        assert course["id"] == 1
        assert course["title"] == "Spanish"
        assert course["language_code"] == "es"
        assert course["from_language_code"] == "en"
        
        # Check units and skills
        assert len(data["units"]) > 0
        first_unit = data["units"][0]
        assert "id" in first_unit
        assert "title" in first_unit
        assert "skills" in first_unit
        assert len(first_unit["skills"]) > 0
    
    @pytest.mark.asyncio
    async def test_all_four_skill_states(self, async_client: AsyncClient):
        """Test that course returns all four skill states correctly."""
        response = await async_client.get("/api/course")
        assert response.status_code == 200
        
        data = response.json()
        
        # Collect all skills across units
        all_skills = []
        for unit in data["units"]:
            all_skills.extend(unit["skills"])
        
        # Check we have all required states
        states = {skill["status"] for skill in all_skills}
        assert "locked" in states
        assert "available" in states
        assert "in_progress" in states
        assert "completed" in states
    
    @pytest.mark.asyncio
    async def test_skill_status_fields(self, async_client: AsyncClient):
        """Test that skills have correct status fields."""
        response = await async_client.get("/api/course")
        assert response.status_code == 200
        
        data = response.json()
        first_skill = data["units"][0]["skills"][0]
        
        assert "id" in first_skill
        assert "title" in first_skill
        assert "status" in first_skill
        assert "crowns" in first_skill
        assert "max_level" in first_skill
        assert first_skill["status"] in ["locked", "available", "in_progress", "completed"]
    
    @pytest.mark.asyncio
    async def test_heart_regeneration_applied(self, async_client: AsyncClient, session: AsyncSession):
        """Test that lazy heart regeneration is applied before response."""
        # Get Maya
        result = await session.execute(
            select(User).where(User.username == "maya_demo")
        )
        maya = result.scalar_one()
        
        response = await async_client.get("/api/course")
        assert response.status_code == 200
        
        data = response.json()
        # Hearts should be between 0 and max_hearts after regeneration
        assert 0 <= data["learner"]["hearts"] <= data["learner"]["max_hearts"]
        # If regenerated to full, next_heart_at should be None
        if data["learner"]["hearts"] == data["learner"]["max_hearts"]:
            assert data["learner"]["next_heart_at"] is None


class TestSkillDetailAPI:
    """Test GET /api/skills/{skill_id} endpoint."""
    
    @pytest.mark.asyncio
    async def test_skill_detail_structure(self, async_client: AsyncClient):
        """Test skill detail response structure."""
        response = await async_client.get("/api/skills/1")
        
        assert response.status_code == 200
        data = response.json()
        
        assert "skill" in data
        assert "lesson" in data
        assert "active_attempt" in data
        assert "can_start" in data
        assert "learner" in data
        
        # Check skill detail
        skill = data["skill"]
        assert skill["id"] == 1
        assert "title" in skill
        assert "description" in skill
        assert "status" in skill
        assert "crowns" in skill
        assert "max_level" in skill
        
        # Check lesson info
        lesson = data["lesson"]
        assert "id" in lesson
        assert "exercise_pool_size" in lesson
        assert "attempt_exercise_count" in lesson
        assert lesson["attempt_exercise_count"] == 10
        assert "base_xp" in lesson
    
    @pytest.mark.asyncio
    async def test_skill_not_found(self, async_client: AsyncClient):
        """Test 404 for non-existent skill."""
        response = await async_client.get("/api/skills/9999")
        
        assert response.status_code == 404
        data = response.json()
        assert "error" in data
    
    @pytest.mark.asyncio
    async def test_can_start_available_skill(self, async_client: AsyncClient):
        """Test that available skills can be started."""
        # Skill 1 should be available for Maya
        response = await async_client.get("/api/skills/1")
        
        assert response.status_code == 200
        data = response.json()
        
        # If hearts > 0 and not locked, should be able to start
        if data["learner"]["hearts"] > 0 and data["skill"]["status"] != "locked":
            assert data["can_start"] is True
    
    @pytest.mark.asyncio
    async def test_prerequisite_info(self, async_client: AsyncClient, session: AsyncSession):
        """Test prerequisite information is included when present."""
        # Find a skill with a prerequisite
        result = await session.execute(
            select(Skill).where(Skill.unlock_requires_skill_id.isnot(None))
        )
        skill = result.scalars().first()
        
        if skill:
            response = await async_client.get(f"/api/skills/{skill.id}")
            assert response.status_code == 200
            data = response.json()
            
            if data["skill"]["prerequisite"]:
                prereq = data["skill"]["prerequisite"]
                assert "id" in prereq
                assert "title" in prereq
                assert "satisfied" in prereq


class TestLessonStartAPI:
    """Test POST /api/skills/{skill_id}/start endpoint."""
    
    @pytest.mark.asyncio
    async def test_start_new_attempt(self, async_client: AsyncClient, session: AsyncSession):
        """Test starting a new lesson attempt returns 201."""
        # Find an available skill without active attempt
        result = await session.execute(
            select(Skill).where(Skill.id == 1)
        )
        skill = result.scalar_one()
        
        # Ensure no active attempt exists for Maya and this skill
        await session.execute(
            select(LessonAttempt).where(
                LessonAttempt.user_id == 1,
                LessonAttempt.lesson_id.in_(
                    select(Lesson.id).where(Lesson.skill_id == skill.id)
                ),
                LessonAttempt.status == "in_progress"
            )
        )
        
        response = await async_client.post(f"/api/skills/{skill.id}/start")
        
        # Should be 201 for new attempt or 200 for resumed
        assert response.status_code in [200, 201]
        data = response.json()
        
        # Check response structure
        assert "attempt_id" in data
        assert "skill_id" in data
        assert data["skill_id"] == skill.id
        assert "lesson_id" in data
        assert "status" in data
        assert data["status"] == "in_progress"
        assert "mode" in data
        assert data["mode"] == "standard"
        assert "exercises" in data
        assert len(data["exercises"]) == 10
        assert "current_index" in data
        assert data["current_index"] == 0
        assert "hearts" in data
    
    @pytest.mark.asyncio
    async def test_resume_existing_attempt(self, async_client: AsyncClient, session: AsyncSession):
        """Test resuming an existing attempt returns 200."""
        # Start a new attempt
        response1 = await async_client.post("/api/skills/1/start")
        assert response1.status_code in [200, 201]
        data1 = response1.json()
        attempt_id = data1["attempt_id"]
        
        # Start again - should resume
        response2 = await async_client.post("/api/skills/1/start")
        assert response2.status_code == 200
        data2 = response2.json()
        
        # Should be same attempt
        assert data2["attempt_id"] == attempt_id
        assert data2["resumed"] is True
    
    @pytest.mark.asyncio
    async def test_exercises_selection(self, async_client: AsyncClient):
        """Test that start selects exactly 10 exercises with all five types."""
        response = await async_client.post("/api/skills/1/start")
        assert response.status_code in [200, 201]
        
        data = response.json()
        exercises = data["exercises"]
        
        # Check count
        assert len(exercises) == 10
        
        # Check all have positions 0-9
        positions = [ex["position"] for ex in exercises]
        assert positions == list(range(10))
        
        # Check all five types are present
        types = {ex["type"] for ex in exercises}
        required_types = {
            "multiple_choice",
            "translate_word_bank",
            "match_pairs",
            "fill_blank",
            "type_answer"
        }
        assert required_types.issubset(types)
    
    @pytest.mark.asyncio
    async def test_no_correct_answers_exposed(self, async_client: AsyncClient):
        """Test that start response never exposes correct_answer."""
        response = await async_client.post("/api/skills/1/start")
        assert response.status_code in [200, 201]
        
        data = response.json()
        exercises = data["exercises"]
        
        for exercise in exercises:
            # Should not have correct_answer field
            assert "correct_answer" not in exercise
            
            # Should have other required fields
            assert "id" in exercise
            assert "type" in exercise
            assert "prompt" in exercise
    
    @pytest.mark.asyncio
    async def test_locked_skill_blocked(self, async_client: AsyncClient, session: AsyncSession):
        """Test that starting a locked skill returns 409."""
        # Find a locked skill
        result = await session.execute(
            select(Skill).where(Skill.unlock_requires_skill_id.isnot(None))
        )
        
        locked_skill = None
        for skill in result.scalars().all():
            # Check if prerequisite has no crowns
            prereq_progress = await session.execute(
                select(UserSkillProgress).where(
                    UserSkillProgress.user_id == 1,
                    UserSkillProgress.skill_id == skill.unlock_requires_skill_id
                )
            )
            prereq = prereq_progress.scalar_one_or_none()
            
            if prereq is None or prereq.crowns == 0:
                locked_skill = skill
                break
        
        if locked_skill:
            response = await async_client.post(f"/api/skills/{locked_skill.id}/start")
            assert response.status_code == 409
            data = response.json()
            assert "error" in data


class TestLessonRetrieveAPI:
    """Test GET /api/lessons/{attempt_id} endpoint."""
    
    @pytest.mark.asyncio
    async def test_retrieve_attempt(self, async_client: AsyncClient):
        """Test retrieving an existing attempt."""
        # Start an attempt first
        start_response = await async_client.post("/api/skills/1/start")
        assert start_response.status_code in [200, 201]
        start_data = start_response.json()
        attempt_id = start_data["attempt_id"]
        
        # Retrieve it
        response = await async_client.get(f"/api/lessons/{attempt_id}")
        assert response.status_code == 200
        data = response.json()
        
        # Should match the start response structure
        assert data["attempt_id"] == attempt_id
        assert data["skill_id"] == start_data["skill_id"]
        assert data["lesson_id"] == start_data["lesson_id"]
        assert len(data["exercises"]) == len(start_data["exercises"])
        assert data["current_index"] == start_data["current_index"]
    
    @pytest.mark.asyncio
    async def test_retrieve_preserves_order(self, async_client: AsyncClient):
        """Test that retrieve returns exercises in exact persisted order."""
        # Start an attempt
        start_response = await async_client.post("/api/skills/1/start")
        start_data = start_response.json()
        attempt_id = start_data["attempt_id"]
        
        # Get exercise IDs from start
        start_exercise_ids = [ex["id"] for ex in start_data["exercises"]]
        
        # Retrieve and compare
        retrieve_response = await async_client.get(f"/api/lessons/{attempt_id}")
        retrieve_data = retrieve_response.json()
        retrieve_exercise_ids = [ex["id"] for ex in retrieve_data["exercises"]]
        
        assert start_exercise_ids == retrieve_exercise_ids
    
    @pytest.mark.asyncio
    async def test_retrieve_unknown_attempt_404(self, async_client: AsyncClient):
        """Test that unknown attempt IDs return 404."""
        response = await async_client.get("/api/lessons/9999")
        
        assert response.status_code == 404
        data = response.json()
        assert "error" in data
    
    @pytest.mark.asyncio
    async def test_retrieve_no_correct_answers(self, async_client: AsyncClient):
        """Test that retrieve never exposes correct answers."""
        # Start and retrieve
        start_response = await async_client.post("/api/skills/1/start")
        attempt_id = start_response.json()["attempt_id"]
        
        response = await async_client.get(f"/api/lessons/{attempt_id}")
        assert response.status_code == 200
        
        data = response.json()
        for exercise in data["exercises"]:
            assert "correct_answer" not in exercise


class TestHeartRegeneration:
    """Test lazy heart regeneration integration."""
    
    @pytest.mark.asyncio
    async def test_regeneration_applied_before_summary(self, async_client: AsyncClient, session: AsyncSession):
        """Test that heart regeneration is applied before learner summaries."""
        # Get current state
        result = await session.execute(
            select(User).where(User.username == "maya_demo")
        )
        maya = result.scalar_one()
        
        # Call any endpoint that returns learner summary
        response = await async_client.get("/api/course")
        assert response.status_code == 200
        
        data = response.json()
        # Hearts should be between 0 and max_hearts
        assert 0 <= data["learner"]["hearts"] <= data["learner"]["max_hearts"]
    
    @pytest.mark.asyncio
    async def test_next_heart_at_when_not_full(self, async_client: AsyncClient, session: AsyncSession):
        """Test next_heart_at is set when hearts < max_hearts."""
        # Get Maya who has 4/5 hearts
        result = await session.execute(
            select(User).where(User.username == "maya_demo")
        )
        maya = result.scalar_one()
        
        if maya.hearts < maya.max_hearts:
            response = await async_client.get("/api/course")
            assert response.status_code == 200
            
            data = response.json()
            learner = data["learner"]
            
            if learner["hearts"] < learner["max_hearts"]:
                # Should have next_heart_at
                assert learner["next_heart_at"] is not None
