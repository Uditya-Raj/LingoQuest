"""Integration tests for Phase 5B: atomic completion and gamification."""
from __future__ import annotations

import asyncio
from datetime import date, datetime, timezone
from typing import Any

import pytest
from httpx import AsyncClient
from sqlalchemy import event, select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.clock import DebugClock, RealClock, set_clock
from app.core.database import Base
from app.core.errors import ConflictError, DomainError
from app.models.achievement import UserAchievement
from app.models.course import Exercise, Skill
from app.models.progress import LessonAttempt, UserSkillProgress
from app.models.user import User
from app.seed.seed_data import seed_achievements, seed_course_content, seed_users_and_history
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


async def _assert_xp_cache(session: AsyncSession, user_id: int) -> None:
    user = (await session.execute(select(User).where(User.id == user_id))).scalar_one()
    summed = await xp_service.sum_completed_xp(session, user_id)
    assert user.total_xp == summed


async def _answer_all(
    session: AsyncSession,
    user: User,
    attempt_id: int,
    exercises: list[dict[str, Any]],
    *,
    mistakes_at: set[int] | None = None,
) -> None:
    """Answer every exercise via the service. mistakes_at positions are wrong."""
    mistakes_at = mistakes_at or set()
    for i, pub in enumerate(exercises):
        ex = await _load_exercise(session, pub["id"])
        payload = (
            _incorrect_payload(ex) if i in mistakes_at else _correct_payload(ex)
        )
        await lesson_engine.submit_answer(
            session, user, attempt_id, pub["id"], i, payload
        )


async def _prepare_ready_attempt(
    client: AsyncClient,
    session: AsyncSession,
    *,
    skill_id: int = 3,
    mistakes_at: set[int] | None = None,
) -> tuple[User, dict[str, Any]]:
    """Start skill, answer all exercises, leave attempt ready to complete."""
    maya = await _maya(session)
    maya.hearts = 5
    maya.heart_regen_anchor_at = None
    await session.flush()

    start = await client.post(f"/api/skills/{skill_id}/start")
    assert start.status_code in (200, 201), start.text
    data = start.json()
    await _answer_all(
        session, maya, data["attempt_id"], data["exercises"], mistakes_at=mistakes_at
    )
    await session.flush()
    await session.refresh(maya)
    return maya, data


# ---------------------------------------------------------------------------
# Integration scenarios
# ---------------------------------------------------------------------------

class TestCompletionConflicts:
    @pytest.mark.asyncio
    async def test_early_completion_no_effects(
        self, async_client: AsyncClient, seeded_session: AsyncSession
    ):
        maya = await _maya(seeded_session)
        xp_before = maya.total_xp
        streak_before = maya.current_streak

        start = await async_client.post("/api/skills/3/start")
        assert start.status_code in (200, 201)
        attempt_id = start.json()["attempt_id"]

        response = await async_client.post(f"/api/lessons/{attempt_id}/complete")
        assert response.status_code == 409
        assert response.json()["error"]["code"] == "LESSON_NOT_READY"

        await seeded_session.refresh(maya)
        assert maya.total_xp == xp_before
        assert maya.current_streak == streak_before
        await _assert_xp_cache(seeded_session, maya.id)

    @pytest.mark.asyncio
    async def test_failed_completion_no_effects(
        self, async_client: AsyncClient, seeded_session: AsyncSession
    ):
        maya = await _maya(seeded_session)
        maya.hearts = 1
        maya.heart_regen_anchor_at = datetime.now(timezone.utc)
        xp_before = maya.total_xp
        streak_before = maya.current_streak
        await seeded_session.flush()

        start = await async_client.post("/api/skills/3/start")
        data = start.json()
        attempt_id = data["attempt_id"]
        ex = await _load_exercise(seeded_session, data["exercises"][0]["id"])

        fail = await async_client.post(
            f"/api/lessons/{attempt_id}/answer",
            json={
                "exercise_id": data["exercises"][0]["id"],
                "position": 0,
                "answer": _incorrect_payload(ex),
            },
        )
        assert fail.json()["lesson_status"] == "failed"

        response = await async_client.post(f"/api/lessons/{attempt_id}/complete")
        assert response.status_code == 409
        assert response.json()["error"]["code"] == "ATTEMPT_FAILED"

        await seeded_session.refresh(maya)
        assert maya.total_xp == xp_before
        assert maya.current_streak == streak_before
        await _assert_xp_cache(seeded_session, maya.id)


class TestSuccessfulCompletion:
    @pytest.mark.asyncio
    async def test_non_perfect_completion(
        self, async_client: AsyncClient, seeded_session: AsyncSession
    ):
        clock = DebugClock()
        clock.set_time(datetime(2026, 7, 18, 12, 0, tzinfo=timezone.utc))
        set_clock(clock)
        try:
            maya, data = await _prepare_ready_attempt(
                async_client, seeded_session, mistakes_at={0}
            )
            xp_before = maya.total_xp
            crowns_before = (
                await seeded_session.execute(
                    select(UserSkillProgress).where(
                        UserSkillProgress.user_id == maya.id,
                        UserSkillProgress.skill_id == 3,
                    )
                )
            ).scalar_one().crowns

            response = await async_client.post(
                f"/api/lessons/{data['attempt_id']}/complete"
            )
            assert response.status_code == 200, response.text
            body = response.json()

            assert body["xp"]["base"] == 10
            assert body["xp"]["perfect_bonus"] == 0
            assert body["xp"]["earned"] == 10
            assert body["xp"]["perfect"] is False
            assert body["skill"]["new_crowns"] == crowns_before + 1
            assert body["user_totals"]["total_xp"] == xp_before + 10
            assert "completed_at" in body

            await seeded_session.refresh(maya)
            assert maya.total_xp == xp_before + 10
            await _assert_xp_cache(seeded_session, maya.id)
        finally:
            set_clock(RealClock())

    @pytest.mark.asyncio
    async def test_perfect_completion(
        self, async_client: AsyncClient, seeded_session: AsyncSession
    ):
        clock = DebugClock()
        clock.set_time(datetime(2026, 7, 18, 12, 0, tzinfo=timezone.utc))
        set_clock(clock)
        try:
            maya, data = await _prepare_ready_attempt(
                async_client, seeded_session, mistakes_at=set()
            )
            xp_before = maya.total_xp

            response = await async_client.post(
                f"/api/lessons/{data['attempt_id']}/complete"
            )
            assert response.status_code == 200, response.text
            body = response.json()
            assert body["xp"]["earned"] == 15
            assert body["xp"]["perfect_bonus"] == 5
            assert body["xp"]["perfect"] is True
            assert body["user_totals"]["total_xp"] == xp_before + 15
            await _assert_xp_cache(seeded_session, maya.id)
        finally:
            set_clock(RealClock())

    @pytest.mark.asyncio
    async def test_duplicate_completion_no_second_effects(
        self, async_client: AsyncClient, seeded_session: AsyncSession
    ):
        clock = DebugClock()
        clock.set_time(datetime(2026, 7, 18, 12, 0, tzinfo=timezone.utc))
        set_clock(clock)
        try:
            maya, data = await _prepare_ready_attempt(async_client, seeded_session)
            first = await async_client.post(
                f"/api/lessons/{data['attempt_id']}/complete"
            )
            assert first.status_code == 200
            await seeded_session.refresh(maya)
            xp_after = maya.total_xp
            streak_after = maya.current_streak

            second = await async_client.post(
                f"/api/lessons/{data['attempt_id']}/complete"
            )
            assert second.status_code == 409
            assert second.json()["error"]["code"] == "ATTEMPT_ALREADY_COMPLETED"

            await seeded_session.refresh(maya)
            assert maya.total_xp == xp_after
            assert maya.current_streak == streak_after
            await _assert_xp_cache(seeded_session, maya.id)
        finally:
            set_clock(RealClock())

    @pytest.mark.asyncio
    async def test_exact_completion_response_and_error_envelope(
        self, async_client: AsyncClient, seeded_session: AsyncSession
    ):
        clock = DebugClock()
        clock.set_time(datetime(2026, 7, 18, 12, 0, tzinfo=timezone.utc))
        set_clock(clock)
        try:
            _, data = await _prepare_ready_attempt(async_client, seeded_session)
            response = await async_client.post(
                f"/api/lessons/{data['attempt_id']}/complete"
            )
            assert response.status_code == 200
            body = response.json()
            required = {
                "attempt_id",
                "skill",
                "xp",
                "streak",
                "daily_goal",
                "unlocked_skill_ids",
                "achievements_unlocked",
                "user_totals",
                "completed_at",
            }
            assert required.issubset(body.keys())
            assert {"base", "perfect_bonus", "earned", "perfect"} <= body["xp"].keys()
            assert {"current", "longest", "extended_today", "activity_date"} <= body[
                "streak"
            ].keys()
            assert {"today_xp", "goal_xp", "progress", "reached"} <= body[
                "daily_goal"
            ].keys()
            assert body["daily_goal"]["progress"] <= 1.0

            openapi = await async_client.get("/api/openapi.json")
            components = openapi.json()["components"]["schemas"]
            assert "CompletionResponse" in components
            assert "/api/lessons/{attempt_id}/complete" in openapi.json()["paths"]

            # Standard error envelope on conflict
            again = await async_client.post(
                f"/api/lessons/{data['attempt_id']}/complete"
            )
            err = again.json()
            assert "error" in err
            assert {"code", "message"} <= err["error"].keys()
        finally:
            set_clock(RealClock())


class TestConcurrentAndRollback:
    @pytest.mark.asyncio
    async def test_concurrent_completion_mutates_once(self, tmp_path):
        db_path = tmp_path / "phase5b_concurrent.db"
        engine = create_async_engine(
            f"sqlite+aiosqlite:///{db_path.as_posix()}",
            echo=False,
        )

        @event.listens_for(engine.sync_engine, "connect")
        def set_sqlite_pragma(dbapi_conn, connection_record):
            cursor = dbapi_conn.cursor()
            cursor.execute("PRAGMA foreign_keys=ON")
            cursor.close()

        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

        SessionLocal = async_sessionmaker(
            engine, class_=AsyncSession, expire_on_commit=False
        )

        clock = DebugClock()
        clock.set_time(datetime(2026, 7, 18, 12, 0, tzinfo=timezone.utc))
        set_clock(clock)

        try:
            async with SessionLocal() as session:
                reference_date = date(2026, 7, 18)
                reference_now = datetime.combine(
                    reference_date, datetime.min.time()
                ).replace(tzinfo=timezone.utc)
                entities = await seed_course_content(session)
                achievements = await seed_achievements(session)
                await seed_users_and_history(
                    session,
                    entities["course"],
                    entities["skills"],
                    entities["lessons"],
                    achievements,
                    reference_date,
                    reference_now,
                )
                await session.commit()

                maya = await _maya(session)
                maya.hearts = 5
                response, _ = await lesson_engine.start_or_resume_standard(
                    session, maya, 3
                )
                await session.commit()

                pubs = [
                    {"id": ex.id, "type": ex.type} for ex in response.exercises
                ]
                await _answer_all(session, maya, response.attempt_id, pubs)
                await session.commit()
                attempt_id = response.attempt_id
                xp_before = maya.total_xp

            async def attempt_complete() -> str:
                async with SessionLocal() as session:
                    maya = await _maya(session)
                    try:
                        await lesson_engine.complete_attempt(
                            session, maya, attempt_id
                        )
                        await session.commit()
                        return "ok"
                    except ConflictError as exc:
                        await session.rollback()
                        return exc.code
                    except DomainError as exc:
                        await session.rollback()
                        return exc.code

            outcomes = await asyncio.gather(attempt_complete(), attempt_complete())
            assert outcomes.count("ok") == 1
            assert "ATTEMPT_ALREADY_COMPLETED" in outcomes

            async with SessionLocal() as session:
                maya = await _maya(session)
                attempt = (
                    await session.execute(
                        select(LessonAttempt).where(LessonAttempt.id == attempt_id)
                    )
                ).scalar_one()
                assert attempt.status == "completed"
                assert attempt.xp_earned in (10, 15)
                assert maya.total_xp == xp_before + attempt.xp_earned
                await _assert_xp_cache(session, maya.id)
        finally:
            set_clock(RealClock())
            await engine.dispose()

    @pytest.mark.asyncio
    async def test_rollback_after_injected_failure(
        self, async_client: AsyncClient, seeded_session: AsyncSession
    ):
        clock = DebugClock()
        clock.set_time(datetime(2026, 7, 18, 12, 0, tzinfo=timezone.utc))
        set_clock(clock)

        class InjectedFailure(Exception):
            pass

        def boom() -> None:
            raise InjectedFailure("late step failed")

        lesson_engine.set_completion_failure_hook(boom)
        try:
            maya, data = await _prepare_ready_attempt(async_client, seeded_session)
            await seeded_session.commit()
            xp_before = maya.total_xp
            streak_before = maya.current_streak
            crowns_before = (
                await seeded_session.execute(
                    select(UserSkillProgress).where(
                        UserSkillProgress.user_id == maya.id,
                        UserSkillProgress.skill_id == 3,
                    )
                )
            ).scalar_one().crowns
            attempt_id = data["attempt_id"]

            with pytest.raises(InjectedFailure):
                await lesson_engine.complete_attempt(
                    seeded_session, maya, attempt_id
                )
            await seeded_session.rollback()

            # Re-query after rollback (identity map may be stale)
            maya = await _maya(seeded_session)
            attempt = (
                await seeded_session.execute(
                    select(LessonAttempt).where(LessonAttempt.id == attempt_id)
                )
            ).scalar_one()
            progress = (
                await seeded_session.execute(
                    select(UserSkillProgress).where(
                        UserSkillProgress.user_id == maya.id,
                        UserSkillProgress.skill_id == 3,
                    )
                )
            ).scalar_one()

            assert attempt.status == "in_progress"
            assert attempt.xp_earned is None
            assert maya.total_xp == xp_before
            assert maya.current_streak == streak_before
            assert progress.crowns == crowns_before

            # Clear hook and retry succeeds once
            lesson_engine.set_completion_failure_hook(None)
            maya = await _maya(seeded_session)
            result = await lesson_engine.complete_attempt(
                seeded_session, maya, attempt_id
            )
            await seeded_session.commit()
            assert result.xp.earned in (10, 15)
            maya = await _maya(seeded_session)
            assert maya.total_xp == xp_before + result.xp.earned
            await _assert_xp_cache(seeded_session, maya.id)
        finally:
            lesson_engine.set_completion_failure_hook(None)
            set_clock(RealClock())


class TestStreakDatesUnlockAchievementsConsistency:
    @pytest.mark.asyncio
    async def test_same_next_skipped_logical_dates(
        self, async_client: AsyncClient, seeded_session: AsyncSession
    ):
        clock = DebugClock()
        set_clock(clock)
        try:
            # Same day as last_activity (reference_date): extended_today false
            clock.set_time(datetime(2026, 7, 18, 12, 0, tzinfo=timezone.utc))
            maya, data = await _prepare_ready_attempt(
                async_client, seeded_session, skill_id=3
            )
            streak_before = maya.current_streak
            r1 = await async_client.post(
                f"/api/lessons/{data['attempt_id']}/complete"
            )
            assert r1.status_code == 200
            assert r1.json()["streak"]["extended_today"] is False
            assert r1.json()["streak"]["current"] == streak_before
            await _assert_xp_cache(seeded_session, maya.id)

            # Next day: increments
            clock.set_time(datetime(2026, 7, 19, 12, 0, tzinfo=timezone.utc))
            maya, data = await _prepare_ready_attempt(
                async_client, seeded_session, skill_id=3
            )
            r2 = await async_client.post(
                f"/api/lessons/{data['attempt_id']}/complete"
            )
            assert r2.status_code == 200
            assert r2.json()["streak"]["extended_today"] is True
            assert r2.json()["streak"]["current"] == streak_before + 1
            await _assert_xp_cache(seeded_session, maya.id)

            # Skipped day: resets to 1
            clock.set_time(datetime(2026, 7, 22, 12, 0, tzinfo=timezone.utc))
            maya, data = await _prepare_ready_attempt(
                async_client, seeded_session, skill_id=3
            )
            r3 = await async_client.post(
                f"/api/lessons/{data['attempt_id']}/complete"
            )
            assert r3.status_code == 200
            assert r3.json()["streak"]["current"] == 1
            assert r3.json()["streak"]["extended_today"] is True
            assert r3.json()["streak"]["longest"] >= 11
            await _assert_xp_cache(seeded_session, maya.id)
        finally:
            set_clock(RealClock())

    @pytest.mark.asyncio
    async def test_crown_cap_and_dependent_unlock(
        self, async_client: AsyncClient, seeded_session: AsyncSession
    ):
        clock = DebugClock()
        clock.set_time(datetime(2026, 7, 19, 12, 0, tzinfo=timezone.utc))
        set_clock(clock)
        try:
            maya = await _maya(seeded_session)
            # Prepare Family at 0 crowns so completing unlocks Questions
            family_progress = (
                await seeded_session.execute(
                    select(UserSkillProgress).where(
                        UserSkillProgress.user_id == maya.id,
                        UserSkillProgress.skill_id == 4,
                    )
                )
            ).scalar_one_or_none()
            if family_progress is None:
                family_progress = UserSkillProgress(
                    user_id=maya.id,
                    skill_id=4,
                    crowns=0,
                    times_practiced=0,
                )
                seeded_session.add(family_progress)
            else:
                family_progress.crowns = 0
            await seeded_session.flush()

            maya, data = await _prepare_ready_attempt(
                async_client, seeded_session, skill_id=4
            )
            response = await async_client.post(
                f"/api/lessons/{data['attempt_id']}/complete"
            )
            assert response.status_code == 200, response.text
            body = response.json()
            assert body["skill"]["new_crowns"] == 1
            assert 5 in body["unlocked_skill_ids"]

            # Course path agrees Questions is available
            course = await async_client.get("/api/course")
            assert course.status_code == 200
            skills = [
                s
                for u in course.json()["units"]
                for s in u["skills"]
            ]
            questions = next(s for s in skills if s["id"] == 5)
            assert questions["status"] in ("available", "in_progress", "completed")
            await _assert_xp_cache(seeded_session, maya.id)
        finally:
            set_clock(RealClock())

    @pytest.mark.asyncio
    async def test_achievement_threshold_crossed_by_completion(
        self, async_client: AsyncClient, seeded_session: AsyncSession
    ):
        clock = DebugClock()
        # Next day from Maya's last activity so streak 6 -> 7
        clock.set_time(datetime(2026, 7, 19, 12, 0, tzinfo=timezone.utc))
        set_clock(clock)
        try:
            from app.models.achievement import Achievement
            from sqlalchemy import delete

            maya = await _maya(seeded_session)
            assert maya.current_streak == 6

            # Seed awards streak_7 from longest_streak history; remove it so this
            # completion can newly unlock via current_streak crossing 7.
            streak_7 = (
                await seeded_session.execute(
                    select(Achievement).where(Achievement.key == "streak_7")
                )
            ).scalar_one()
            await seeded_session.execute(
                delete(UserAchievement).where(
                    UserAchievement.user_id == maya.id,
                    UserAchievement.achievement_id == streak_7.id,
                )
            )
            await seeded_session.flush()

            maya, data = await _prepare_ready_attempt(
                async_client, seeded_session, skill_id=3
            )
            response = await async_client.post(
                f"/api/lessons/{data['attempt_id']}/complete"
            )
            assert response.status_code == 200, response.text
            body = response.json()
            assert body["streak"]["current"] == 7
            unlocked_keys = [a["key"] for a in body["achievements_unlocked"]]
            assert "streak_7" in unlocked_keys
            await _assert_xp_cache(seeded_session, maya.id)
        finally:
            set_clock(RealClock())

    @pytest.mark.asyncio
    async def test_profile_path_leaderboard_sources_consistent(
        self, async_client: AsyncClient, seeded_session: AsyncSession
    ):
        clock = DebugClock()
        clock.set_time(datetime(2026, 7, 18, 15, 0, tzinfo=timezone.utc))
        set_clock(clock)
        try:
            maya, data = await _prepare_ready_attempt(async_client, seeded_session)
            complete = await async_client.post(
                f"/api/lessons/{data['attempt_id']}/complete"
            )
            assert complete.status_code == 200
            body = complete.json()

            await seeded_session.refresh(maya)
            assert maya.total_xp == body["user_totals"]["total_xp"]
            assert maya.hearts == body["user_totals"]["hearts"]
            assert maya.gems == body["user_totals"]["gems"]
            assert maya.current_streak == body["streak"]["current"]

            course = await async_client.get("/api/course")
            assert course.status_code == 200
            learner = course.json()["learner"]
            assert learner["total_xp"] == maya.total_xp
            assert learner["current_streak"] == maya.current_streak
            assert learner["hearts"] == maya.hearts

            # Leaderboard ordering by total_xp (no endpoint yet; query DB)
            users = (
                await seeded_session.execute(
                    select(User).order_by(
                        User.total_xp.desc(), User.username.asc(), User.id.asc()
                    )
                )
            ).scalars().all()
            assert users[0].total_xp >= users[1].total_xp
            maya_rank = next(i for i, u in enumerate(users) if u.id == maya.id)
            assert maya.total_xp == users[maya_rank].total_xp

            await _assert_xp_cache(seeded_session, maya.id)
            for u in users:
                await _assert_xp_cache(seeded_session, u.id)
        finally:
            set_clock(RealClock())
