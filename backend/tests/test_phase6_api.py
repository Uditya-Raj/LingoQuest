"""Integration tests for Phase 6: remaining standard backend endpoints."""
from __future__ import annotations

from datetime import date, datetime, timedelta, timezone
from typing import Any

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.clock import DebugClock, RealClock, set_clock
from app.core.config import settings
from app.core.database import get_session
from app.main import create_app
from app.models.course import Exercise
from app.models.progress import LessonAttempt, UserSkillProgress
from app.models.user import User
from app.services import lesson_engine
from app.services import xp as xp_service


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _correct_payload(exercise: Exercise) -> dict[str, Any]:
    ca = exercise.correct_answer
    if exercise.type == "multiple_choice":
        return {"option_id": ca["option_id"]}
    if exercise.type == "translate_word_bank":
        return {"ordered_ids": list(ca["ordered_ids"])}
    if exercise.type == "match_pairs":
        return {"pairs": [dict(p) for p in ca["pairs"]]}
    if exercise.type == "fill_blank":
        return {"text": ca["text"]}
    if exercise.type == "type_answer":
        return {"text": ca["accepted"][0]}
    raise ValueError(exercise.type)


def _incorrect_payload(exercise: Exercise) -> dict[str, Any]:
    ca = exercise.correct_answer
    if exercise.type == "multiple_choice":
        for opt in exercise.options:
            if opt["id"] != ca["option_id"]:
                return {"option_id": opt["id"]}
        raise AssertionError("no distractor")
    if exercise.type == "translate_word_bank":
        ids = list(ca["ordered_ids"])
        if len(ids) >= 2:
            ids[0], ids[1] = ids[1], ids[0]
            return {"ordered_ids": ids}
        all_ids = [o["id"] for o in exercise.options]
        return {"ordered_ids": list(reversed(all_ids[: len(ids)]))}
    if exercise.type == "match_pairs":
        pairs = [dict(p) for p in ca["pairs"]]
        if len(pairs) >= 2:
            pairs[0]["right_id"], pairs[1]["right_id"] = (
                pairs[1]["right_id"],
                pairs[0]["right_id"],
            )
        return {"pairs": pairs}
    if exercise.type in ("fill_blank", "type_answer"):
        return {"text": "zz_wrong_zz"}
    raise ValueError(exercise.type)


async def _maya(session: AsyncSession) -> User:
    return (
        await session.execute(select(User).where(User.username == "maya_demo"))
    ).scalar_one()


async def _load_exercise(session: AsyncSession, exercise_id: int) -> Exercise:
    return (
        await session.execute(select(Exercise).where(Exercise.id == exercise_id))
    ).scalar_one()


async def _answer_all(
    session: AsyncSession,
    user: User,
    attempt_id: int,
    exercises: list[dict[str, Any]],
    *,
    mistakes_at: set[int] | None = None,
) -> None:
    mistakes_at = mistakes_at or set()
    for i, pub in enumerate(exercises):
        ex = await _load_exercise(session, pub["id"])
        payload = (
            _incorrect_payload(ex) if i in mistakes_at else _correct_payload(ex)
        )
        await lesson_engine.submit_answer(
            session, user, attempt_id, pub["id"], i, payload
        )


VALID_EXERCISES: dict[str, dict[str, Any]] = {
    "multiple_choice": {
        "type": "multiple_choice",
        "prompt": "Phase6 MC",
        "options": [
            {"id": "a", "text": "Yes"},
            {"id": "b", "text": "No"},
        ],
        "correct_answer": {"option_id": "a"},
        "metadata": {"hint": "mc"},
    },
    "translate_word_bank": {
        "type": "translate_word_bank",
        "prompt": "Phase6 WB",
        "options": [
            {"id": "w1", "text": "I"},
            {"id": "w2", "text": "eat"},
            {"id": "w3", "text": "bread"},
        ],
        "correct_answer": {"ordered_ids": ["w1", "w2", "w3"]},
        "metadata": None,
    },
    "match_pairs": {
        "type": "match_pairs",
        "prompt": "Phase6 MP",
        "options": {
            "left": [{"id": "l1", "text": "agua"}, {"id": "l2", "text": "pan"}],
            "right": [
                {"id": "r1", "text": "water"},
                {"id": "r2", "text": "bread"},
            ],
        },
        "correct_answer": {
            "pairs": [
                {"left_id": "l1", "right_id": "r1"},
                {"left_id": "l2", "right_id": "r2"},
            ]
        },
        "metadata": None,
    },
    "fill_blank": {
        "type": "fill_blank",
        "prompt": "Ella ___ estudiante.",
        "options": None,
        "correct_answer": {"text": "es"},
        "metadata": {"hint": "ser"},
    },
    "type_answer": {
        "type": "type_answer",
        "prompt": "Hello in Spanish",
        "options": None,
        "correct_answer": {"accepted": ["hola", "hello"]},
        "metadata": None,
    },
}


# ---------------------------------------------------------------------------
# Hearts
# ---------------------------------------------------------------------------

class TestHeartsAPI:
    @pytest.mark.asyncio
    async def test_status_full_partial_and_regen(
        self, async_client: AsyncClient, seeded_session: AsyncSession
    ):
        clock = DebugClock()
        now = datetime(2026, 7, 18, 12, 0, tzinfo=timezone.utc)
        clock.set_time(now)
        set_clock(clock)
        try:
            maya = await _maya(seeded_session)

            # Full
            maya.hearts = 5
            maya.heart_regen_anchor_at = None
            await seeded_session.flush()
            full = await async_client.get("/api/hearts/status")
            assert full.status_code == 200
            body = full.json()
            assert body["hearts"] == 5
            assert body["next_heart_at"] is None
            assert body["seconds_until_next"] is None
            assert body["regen_interval_minutes"] == 15

            # Partial, no full interval yet
            maya.hearts = 3
            maya.heart_regen_anchor_at = now
            await seeded_session.flush()
            clock.set_time(now + timedelta(minutes=10))
            partial = await async_client.get("/api/hearts/status")
            assert partial.status_code == 200
            pbody = partial.json()
            assert pbody["hearts"] == 3
            assert pbody["next_heart_at"] is not None
            assert pbody["seconds_until_next"] == 5 * 60

            # Regenerated after 30 minutes (2 intervals)
            clock.set_time(now + timedelta(minutes=30))
            regen = await async_client.get("/api/hearts/status")
            assert regen.status_code == 200
            rbody = regen.json()
            assert rbody["hearts"] == 5
            assert rbody["next_heart_at"] is None
        finally:
            set_clock(RealClock())

    @pytest.mark.asyncio
    async def test_successful_refill(
        self, async_client: AsyncClient, seeded_session: AsyncSession
    ):
        clock = DebugClock()
        now = datetime(2026, 7, 18, 12, 0, tzinfo=timezone.utc)
        clock.set_time(now)
        set_clock(clock)
        try:
            maya = await _maya(seeded_session)
            maya.hearts = 2
            maya.gems = 100
            # Anchor recent enough that lazy regen does not fill before refill.
            maya.heart_regen_anchor_at = now - timedelta(minutes=5)
            await seeded_session.flush()

            response = await async_client.post(
                "/api/hearts/refill", json={"confirm_spend": True}
            )
            assert response.status_code == 200, response.text
            body = response.json()
            assert body["hearts"] == 5
            assert body["gems_spent"] == 20
            assert body["gems"] == 80
            assert body["next_heart_at"] is None

            await seeded_session.refresh(maya)
            assert maya.hearts == 5
            assert maya.gems == 80
            assert maya.heart_regen_anchor_at is None
        finally:
            set_clock(RealClock())

    @pytest.mark.asyncio
    async def test_refill_failures_spend_nothing(
        self, async_client: AsyncClient, seeded_session: AsyncSession
    ):
        maya = await _maya(seeded_session)

        maya.hearts = 5
        maya.gems = 100
        maya.heart_regen_anchor_at = None
        await seeded_session.flush()
        full = await async_client.post(
            "/api/hearts/refill", json={"confirm_spend": True}
        )
        assert full.status_code == 409
        assert full.json()["error"]["code"] == "HEARTS_ALREADY_FULL"
        await seeded_session.refresh(maya)
        assert maya.gems == 100

        maya.hearts = 2
        await seeded_session.flush()
        unconfirmed = await async_client.post(
            "/api/hearts/refill", json={"confirm_spend": False}
        )
        assert unconfirmed.status_code == 400
        assert unconfirmed.json()["error"]["code"] == "REFILL_NOT_CONFIRMED"
        await seeded_session.refresh(maya)
        assert maya.gems == 100
        assert maya.hearts == 2

        maya.gems = 10
        await seeded_session.flush()
        poor = await async_client.post(
            "/api/hearts/refill", json={"confirm_spend": True}
        )
        assert poor.status_code == 409
        assert poor.json()["error"]["code"] == "INSUFFICIENT_GEMS"
        await seeded_session.refresh(maya)
        assert maya.gems == 10
        assert maya.hearts == 2


# ---------------------------------------------------------------------------
# Profile
# ---------------------------------------------------------------------------

class TestProfileAPI:
    @pytest.mark.asyncio
    async def test_seeded_maya_profile(
        self, async_client: AsyncClient, seeded_session: AsyncSession
    ):
        clock = DebugClock()
        clock.set_time(datetime(2026, 7, 18, 12, 0, tzinfo=timezone.utc))
        set_clock(clock)
        try:
            response = await async_client.get("/api/user/me")
            assert response.status_code == 200, response.text
            body = response.json()

            assert body["user"]["username"] == "maya_demo"
            assert body["user"]["display_name"] == "Maya"
            assert body["user"]["active_course"]["title"] == "Spanish"
            stats = body["stats"]
            assert stats["total_xp"] == 340
            assert stats["today_xp"] == 10
            assert stats["daily_goal_xp"] == 20
            assert stats["daily_goal_progress"] == 0.5
            assert stats["current_streak"] == 6
            assert stats["longest_streak"] == 11
            assert stats["gems"] == 100
            assert stats["skills_completed"] == 2
            assert stats["lessons_completed"] == 29
            assert stats["perfect_lessons"] == 10

            keys = {a["key"]: a for a in body["achievements"]}
            assert keys["streak_7"]["earned"] is True
            assert keys["xp_500"]["earned"] is False
        finally:
            set_clock(RealClock())

    @pytest.mark.asyncio
    async def test_valid_patch_persists(
        self, async_client: AsyncClient, seeded_session: AsyncSession
    ):
        clock = DebugClock()
        clock.set_time(datetime(2026, 7, 18, 12, 0, tzinfo=timezone.utc))
        set_clock(clock)
        try:
            maya = await _maya(seeded_session)
            xp_before = maya.total_xp

            response = await async_client.patch(
                "/api/user/me",
                json={"display_name": "  Maya R.  ", "daily_goal_xp": 30},
            )
            assert response.status_code == 200, response.text
            body = response.json()
            assert body["display_name"] == "Maya R."
            assert body["daily_goal_xp"] == 30
            assert body["today_xp"] == 10
            assert abs(body["daily_goal_progress"] - 10 / 30) < 1e-6

            await seeded_session.refresh(maya)
            assert maya.display_name == "Maya R."
            assert maya.daily_goal_xp == 30
            assert maya.total_xp == xp_before
        finally:
            set_clock(RealClock())

    @pytest.mark.asyncio
    async def test_invalid_empty_unknown_patches(
        self, async_client: AsyncClient, seeded_session: AsyncSession
    ):
        empty = await async_client.patch("/api/user/me", json={})
        assert empty.status_code == 422

        unknown = await async_client.patch(
            "/api/user/me", json={"display_name": "X", "hearts": 5}
        )
        assert unknown.status_code == 422

        bad_goal = await async_client.patch(
            "/api/user/me", json={"daily_goal_xp": 3}
        )
        assert bad_goal.status_code == 422

        blank = await async_client.patch(
            "/api/user/me", json={"display_name": "   "}
        )
        assert blank.status_code == 422


# ---------------------------------------------------------------------------
# Leaderboard
# ---------------------------------------------------------------------------

class TestLeaderboardAPI:
    @pytest.mark.asyncio
    async def test_deterministic_order_and_maya_rank_three(
        self, async_client: AsyncClient, seeded_session: AsyncSession
    ):
        response = await async_client.get("/api/leaderboard")
        assert response.status_code == 200
        body = response.json()
        assert body["ranking_basis"] == "total_xp"
        assert "weekly" not in body["ranking_basis"].lower()

        entries = body["entries"]
        assert len(entries) == 5
        assert entries[0]["display_name"] == "Leo"
        assert entries[0]["total_xp"] == 520
        assert entries[2]["display_name"] == "Maya"
        assert entries[2]["rank"] == 3
        assert entries[2]["is_current_user"] is True
        assert body["current_user"]["rank"] == 3

        # Tie-break ordering: xp desc, username asc
        xp_values = [e["total_xp"] for e in entries]
        assert xp_values == sorted(xp_values, reverse=True)

    @pytest.mark.asyncio
    async def test_current_user_outside_limit(
        self, async_client: AsyncClient, seeded_session: AsyncSession
    ):
        response = await async_client.get("/api/leaderboard?limit=2")
        assert response.status_code == 200
        body = response.json()
        assert len(body["entries"]) == 2
        assert body["current_user"]["display_name"] == "Maya"
        assert body["current_user"]["rank"] == 3
        assert all(e["rank"] <= 2 for e in body["entries"])

    @pytest.mark.asyncio
    async def test_leaderboard_updates_after_completion(
        self, async_client: AsyncClient, seeded_session: AsyncSession
    ):
        clock = DebugClock()
        clock.set_time(datetime(2026, 7, 18, 12, 0, tzinfo=timezone.utc))
        set_clock(clock)
        try:
            before = (await async_client.get("/api/leaderboard")).json()
            maya_rank_before = before["current_user"]["rank"]
            maya_xp_before = before["current_user"]["total_xp"]

            maya = await _maya(seeded_session)
            maya.hearts = 5
            maya.heart_regen_anchor_at = None
            await seeded_session.flush()

            start = await async_client.post("/api/skills/3/start")
            data = start.json()
            await _answer_all(
                seeded_session, maya, data["attempt_id"], data["exercises"]
            )
            complete = await async_client.post(
                f"/api/lessons/{data['attempt_id']}/complete"
            )
            assert complete.status_code == 200, complete.text

            after = (await async_client.get("/api/leaderboard")).json()
            assert after["current_user"]["total_xp"] == maya_xp_before + 15
            # Rank may stay 3 or improve; XP must increase.
            assert after["current_user"]["rank"] <= maya_rank_before
        finally:
            set_clock(RealClock())


# ---------------------------------------------------------------------------
# Achievements
# ---------------------------------------------------------------------------

class TestAchievementsAPI:
    @pytest.mark.asyncio
    async def test_earned_locked_and_current_values(
        self, async_client: AsyncClient, seeded_session: AsyncSession
    ):
        response = await async_client.get("/api/achievements")
        assert response.status_code == 200
        body = response.json()
        by_key = {a["key"]: a for a in body["achievements"]}

        assert by_key["streak_7"]["earned"] is True
        assert by_key["streak_7"]["current_value"] == 6  # current streak below 7
        assert by_key["streak_7"]["earned_at"] is not None

        assert by_key["xp_500"]["earned"] is False
        assert by_key["xp_500"]["current_value"] == 340

        assert by_key["perfectionist"]["earned"] is True
        assert by_key["perfectionist"]["current_value"] == 10

        # Read does not create duplicates
        again = await async_client.get("/api/achievements")
        assert again.status_code == 200
        assert len(again.json()["achievements"]) == len(body["achievements"])


# ---------------------------------------------------------------------------
# Content admin
# ---------------------------------------------------------------------------

class TestContentAdminAPI:
    @pytest.mark.asyncio
    async def test_non_admin_forbidden(
        self, async_client: AsyncClient, seeded_session: AsyncSession
    ):
        maya = await _maya(seeded_session)
        maya.is_content_admin = False
        await seeded_session.flush()

        response = await async_client.get("/api/admin/content/tree")
        assert response.status_code == 403
        assert response.json()["error"]["code"] == "CONTENT_ADMIN_REQUIRED"

        maya.is_content_admin = True
        await seeded_session.flush()

    @pytest.mark.asyncio
    async def test_content_tree_ordering(
        self, async_client: AsyncClient, seeded_session: AsyncSession
    ):
        response = await async_client.get("/api/admin/content/tree")
        assert response.status_code == 200, response.text
        body = response.json()
        assert len(body["courses"]) == 1
        course = body["courses"][0]
        assert course["title"] == "Spanish"
        assert len(course["units"]) >= 2
        skill0 = course["units"][0]["skills"][0]
        assert skill0["title"] == "Greetings"
        exercises = skill0["lessons"][0]["exercises"]
        assert len(exercises) == 12
        assert "correct_answer" in exercises[0]
        assert exercises[0]["order_index"] == 0

    @pytest.mark.asyncio
    async def test_create_all_five_types(
        self, async_client: AsyncClient, seeded_session: AsyncSession
    ):
        # Use Food lesson (id 3) and high order indexes to avoid conflicts
        for i, (etype, payload) in enumerate(VALID_EXERCISES.items()):
            body = {
                "lesson_id": 3,
                "order_index": 100 + i,
                "audio_url": None,
                "is_active": True,
                **payload,
            }
            response = await async_client.post("/api/admin/exercises", json=body)
            assert response.status_code == 201, f"{etype}: {response.text}"
            data = response.json()
            assert data["type"] == etype
            assert data["correct_answer"] == payload["correct_answer"]

    @pytest.mark.asyncio
    async def test_invalid_contract_not_persisted(
        self, async_client: AsyncClient, seeded_session: AsyncSession
    ):
        before = len(
            (
                await seeded_session.execute(select(Exercise))
            ).scalars().all()
        )
        response = await async_client.post(
            "/api/admin/exercises",
            json={
                "lesson_id": 3,
                "order_index": 200,
                "type": "multiple_choice",
                "prompt": "Bad",
                "options": [{"id": "a", "text": "Only one"}],
                "correct_answer": {"option_id": "z"},
                "is_active": True,
            },
        )
        assert response.status_code == 400
        assert response.json()["error"]["code"] == "INVALID_EXERCISE_CONTRACT"
        after = len(
            (
                await seeded_session.execute(select(Exercise))
            ).scalars().all()
        )
        assert after == before

    @pytest.mark.asyncio
    async def test_merged_patch_validation(
        self, async_client: AsyncClient, seeded_session: AsyncSession
    ):
        # Create a valid fill_blank first
        create = await async_client.post(
            "/api/admin/exercises",
            json={
                "lesson_id": 3,
                "order_index": 210,
                **VALID_EXERCISES["fill_blank"],
                "is_active": True,
            },
        )
        assert create.status_code == 201
        ex_id = create.json()["id"]

        # Invalid merge: change type to MC without providing options
        bad = await async_client.patch(
            f"/api/admin/exercises/{ex_id}",
            json={"type": "multiple_choice"},
        )
        assert bad.status_code == 400
        assert bad.json()["error"]["code"] == "INVALID_EXERCISE_CONTRACT"

        # Valid prompt-only patch
        good = await async_client.patch(
            f"/api/admin/exercises/{ex_id}",
            json={"prompt": "Ella ___ mi hermana."},
        )
        assert good.status_code == 200, good.text
        assert good.json()["prompt"] == "Ella ___ mi hermana."
        assert good.json()["type"] == "fill_blank"

    @pytest.mark.asyncio
    async def test_active_attempt_edit_protection(
        self, async_client: AsyncClient, seeded_session: AsyncSession
    ):
        maya = await _maya(seeded_session)
        maya.hearts = 5
        maya.heart_regen_anchor_at = None
        await seeded_session.flush()

        start = await async_client.post("/api/skills/3/start")
        assert start.status_code in (200, 201)
        attempt = start.json()
        exercise_id = attempt["exercises"][0]["id"]

        response = await async_client.patch(
            f"/api/admin/exercises/{exercise_id}",
            json={"prompt": "Should not apply"},
        )
        assert response.status_code == 409
        assert response.json()["error"]["code"] == "CONTENT_IN_ACTIVE_ATTEMPT"

        # Cleanup: fail or leave attempt; deactivate should also be blocked
        deactivate = await async_client.patch(
            f"/api/admin/exercises/{exercise_id}",
            json={"is_active": False},
        )
        assert deactivate.status_code == 409


# ---------------------------------------------------------------------------
# Debug clock
# ---------------------------------------------------------------------------

class TestDebugClockAPI:
    @pytest.mark.asyncio
    async def test_debug_routes_absent_when_disabled(
        self, async_client: AsyncClient
    ):
        assert settings.debug_clock_enabled is False
        response = await async_client.get("/api/debug/clock")
        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_debug_read_advance_reset(
        self, seeded_session: AsyncSession, monkeypatch: pytest.MonkeyPatch
    ):
        monkeypatch.setattr(settings, "debug_clock_enabled", True)
        app = create_app()

        async def override_get_session():
            yield seeded_session

        app.dependency_overrides[get_session] = override_get_session
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            status = await client.get("/api/debug/clock")
            assert status.status_code == 200
            body = status.json()
            assert "real_now" in body
            assert "logical_now" in body
            assert body["offset_days"] == 0

            advance = await client.post(
                "/api/debug/clock/advance", json={"days": 2}
            )
            assert advance.status_code == 200
            adv = advance.json()
            assert adv["offset_days"] == 2
            assert "logical_date" in adv

            bad = await client.post(
                "/api/debug/clock/advance", json={"days": 0}
            )
            assert bad.status_code == 422

            reset = await client.post("/api/debug/clock/reset")
            assert reset.status_code == 200
            assert reset.json()["offset_days"] == 0

        app.dependency_overrides.clear()
        monkeypatch.setattr(settings, "debug_clock_enabled", False)
        set_clock(RealClock())

    @pytest.mark.asyncio
    async def test_clock_drives_heart_streak_daily_xp(
        self, async_client: AsyncClient, seeded_session: AsyncSession
    ):
        clock = DebugClock()
        base = datetime(2026, 7, 18, 10, 0, tzinfo=timezone.utc)
        clock.set_time(base)
        set_clock(clock)
        try:
            maya = await _maya(seeded_session)
            maya.hearts = 3
            maya.heart_regen_anchor_at = base
            maya.last_activity_date = date(2026, 7, 18)
            maya.current_streak = 6
            await seeded_session.flush()

            # Heart regen via clock advance (no real wait)
            clock.set_time(base + timedelta(minutes=15))
            status = await async_client.get("/api/hearts/status")
            assert status.json()["hearts"] == 4

            # Complete a lesson on next logical day for streak
            maya.hearts = 5
            maya.heart_regen_anchor_at = None
            await seeded_session.flush()
            clock.set_time(datetime(2026, 7, 19, 12, 0, tzinfo=timezone.utc))

            start = await async_client.post("/api/skills/3/start")
            data = start.json()
            await _answer_all(
                seeded_session,
                maya,
                data["attempt_id"],
                data["exercises"],
                mistakes_at={0},
            )
            complete = await async_client.post(
                f"/api/lessons/{data['attempt_id']}/complete"
            )
            assert complete.status_code == 200, complete.text
            body = complete.json()
            assert body["streak"]["current"] == 7
            assert body["streak"]["extended_today"] is True
            assert body["streak"]["activity_date"] == "2026-07-19"
            assert body["daily_goal"]["today_xp"] == 10
        finally:
            set_clock(RealClock())


# ---------------------------------------------------------------------------
# OpenAPI / regression smoke
# ---------------------------------------------------------------------------

class TestOpenAPIAndRegression:
    @pytest.mark.asyncio
    async def test_openapi_includes_phase6_paths(
        self, async_client: AsyncClient
    ):
        response = await async_client.get("/api/openapi.json")
        assert response.status_code == 200
        paths = response.json()["paths"]
        for path in (
            "/api/hearts/status",
            "/api/hearts/refill",
            "/api/user/me",
            "/api/leaderboard",
            "/api/achievements",
            "/api/admin/content/tree",
            "/api/admin/exercises",
            "/api/admin/exercises/{exercise_id}",
        ):
            assert path in paths, path
        assert "/api/debug/clock" not in paths

        schemas = response.json()["components"]["schemas"]
        for name in (
            "HeartsStatusResponse",
            "HeartsRefillResponse",
            "ProfileResponse",
            "LeaderboardResponse",
            "AchievementsListResponse",
            "AdminContentTreeResponse",
            "AdminExerciseRepresentation",
            "CompletionResponse",
        ):
            assert name in schemas, name

    @pytest.mark.asyncio
    async def test_phase4_5_regression_smoke(
        self, async_client: AsyncClient, seeded_session: AsyncSession
    ):
        course = await async_client.get("/api/course")
        assert course.status_code == 200
        assert course.json()["learner"]["display_name"] == "Maya"

        health = await async_client.get("/api/health")
        assert health.status_code == 200

        maya = await _maya(seeded_session)
        maya.hearts = 5
        await seeded_session.flush()
        start = await async_client.post("/api/skills/4/start")
        assert start.status_code in (200, 201)
        attempt_id = start.json()["attempt_id"]
        retrieve = await async_client.get(f"/api/lessons/{attempt_id}")
        assert retrieve.status_code == 200
        assert "correct_answer" not in retrieve.text.lower() or (
            '"correct_answer"' not in retrieve.text
        )
