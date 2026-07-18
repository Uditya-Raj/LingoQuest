"""Phase 6B timed-practice integration tests."""
from __future__ import annotations

import asyncio
from datetime import datetime, timedelta, timezone
from typing import Any

import pytest
from httpx import AsyncClient
from sqlalchemy import event, func, select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.clock import DebugClock, RealClock, set_clock
from app.core.database import Base
from app.core.errors import ConflictError, DomainError
from app.models.course import Exercise, Lesson
from app.models.progress import ExerciseAnswer, LessonAttempt, UserSkillProgress
from app.models.user import User
from app.seed.seed_data import seed_achievements, seed_course_content, seed_users_and_history
from app.services import lesson_engine
from app.services.lesson_engine import TIMED_PRACTICE_DURATION_SECONDS


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
    if exercise.type == "translate_word_bank":
        ids = list(ca["ordered_ids"])
        if len(ids) >= 2:
            ids[0], ids[1] = ids[1], ids[0]
            return {"ordered_ids": ids}
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
    client: AsyncClient,
    session: AsyncSession,
    data: dict[str, Any],
    *,
    mistake_at: int | None = None,
) -> None:
    attempt_id = data["attempt_id"]
    for i, pub in enumerate(data["exercises"]):
        ex = await _load_exercise(session, pub["id"])
        payload = (
            _incorrect_payload(ex)
            if mistake_at is not None and i == mistake_at
            else _correct_payload(ex)
        )
        resp = await client.post(
            f"/api/lessons/{attempt_id}/answer",
            json={"exercise_id": pub["id"], "position": i, "answer": payload},
        )
        assert resp.status_code == 200, resp.text


@pytest.mark.asyncio
class TestTimedStart:
    async def test_timed_start_120s_and_ten_types(
        self, async_client: AsyncClient, seeded_session: AsyncSession
    ):
        clock = DebugClock()
        start_at = datetime(2026, 7, 18, 12, 0, 0, tzinfo=timezone.utc)
        clock.set_time(start_at)
        set_clock(clock)
        try:
            response = await async_client.post("/api/skills/3/start-timed")
            assert response.status_code == 201, response.text
            body = response.json()
            assert body["mode"] == "timed"
            assert body["remaining_seconds"] == TIMED_PRACTICE_DURATION_SECONDS
            assert body["expires_at"] is not None
            assert body["total_exercises"] == 10
            assert len(body["exercises"]) == 10
            ids = [e["id"] for e in body["exercises"]]
            assert len(set(ids)) == 10
            types = {e["type"] for e in body["exercises"]}
            assert types == {
                "multiple_choice",
                "translate_word_bank",
                "match_pairs",
                "fill_blank",
                "type_answer",
            }
            for e in body["exercises"]:
                assert "correct_answer" not in e

            attempt = (
                await seeded_session.execute(
                    select(LessonAttempt).where(LessonAttempt.id == body["attempt_id"])
                )
            ).scalar_one()
            assert attempt.mode == "timed"
            assert attempt.expires_at is not None
        finally:
            set_clock(RealClock())

    async def test_timed_start_zero_hearts_and_locked(
        self, async_client: AsyncClient, seeded_session: AsyncSession
    ):
        maya = await _maya(seeded_session)
        maya.hearts = 0
        await seeded_session.flush()

        ok = await async_client.post("/api/skills/3/start-timed")
        assert ok.status_code == 201, ok.text

        locked = await async_client.post("/api/skills/5/start-timed")
        assert locked.status_code == 409
        assert locked.json()["error"]["code"] == "SKILL_LOCKED"

    async def test_refresh_preserves_expiry_and_order(
        self, async_client: AsyncClient
    ):
        clock = DebugClock()
        start_at = datetime(2026, 7, 18, 12, 0, 0, tzinfo=timezone.utc)
        clock.set_time(start_at)
        set_clock(clock)
        try:
            start = await async_client.post("/api/skills/3/start-timed")
            body = start.json()
            expires = body["expires_at"]
            order = [e["id"] for e in body["exercises"]]

            clock.set_time(start_at + timedelta(seconds=30))
            retrieve = await async_client.get(f"/api/lessons/{body['attempt_id']}")
            assert retrieve.status_code == 200
            again = retrieve.json()
            assert again["expires_at"] == expires
            assert [e["id"] for e in again["exercises"]] == order
            assert again["remaining_seconds"] == 90
            assert again["mode"] == "timed"
        finally:
            set_clock(RealClock())


@pytest.mark.asyncio
class TestTimedAnswersAndHearts:
    async def test_wrong_timed_loses_no_heart_standard_loses_one(
        self, async_client: AsyncClient, seeded_session: AsyncSession
    ):
        clock = DebugClock()
        clock.set_time(datetime(2026, 7, 18, 12, 0, tzinfo=timezone.utc))
        set_clock(clock)
        try:
            maya = await _maya(seeded_session)
            timed = await async_client.post("/api/skills/3/start-timed")
            timed_body = timed.json()
            # Apply regen via retrieve so hearts_before matches answer path.
            retrieve = await async_client.get(
                f"/api/lessons/{timed_body['attempt_id']}"
            )
            hearts_before = retrieve.json()["hearts"]
            ex0 = timed_body["exercises"][0]
            exercise = await _load_exercise(seeded_session, ex0["id"])

            wrong = await async_client.post(
                f"/api/lessons/{timed_body['attempt_id']}/answer",
                json={
                    "exercise_id": ex0["id"],
                    "position": 0,
                    "answer": _incorrect_payload(exercise),
                },
            )
            assert wrong.status_code == 200
            assert wrong.json()["mistakes_count"] == 1
            assert wrong.json()["hearts_remaining"] == hearts_before
            await seeded_session.refresh(maya)
            assert maya.hearts == hearts_before

            # Expire timed attempt so a standard start is allowed.
            clock.set_time(datetime(2026, 7, 18, 12, 5, tzinfo=timezone.utc))
            await async_client.get(f"/api/lessons/{timed_body['attempt_id']}")

            std = await async_client.post("/api/skills/1/start")
            std_body = std.json()
            std_hearts = std_body["hearts"]
            sex = std_body["exercises"][0]
            sex_row = await _load_exercise(seeded_session, sex["id"])
            std_wrong = await async_client.post(
                f"/api/lessons/{std_body['attempt_id']}/answer",
                json={
                    "exercise_id": sex["id"],
                    "position": 0,
                    "answer": _incorrect_payload(sex_row),
                },
            )
            assert std_wrong.status_code == 200
            assert std_wrong.json()["hearts_remaining"] == std_hearts - 1
        finally:
            set_clock(RealClock())

    async def test_out_of_hearts_persists_failure_reason(
        self, async_client: AsyncClient, seeded_session: AsyncSession
    ):
        clock = DebugClock()
        now = datetime(2026, 7, 18, 12, 0, tzinfo=timezone.utc)
        clock.set_time(now)
        set_clock(clock)
        try:
            maya = await _maya(seeded_session)
            maya.hearts = 1
            maya.heart_regen_anchor_at = now
            await seeded_session.flush()

            start = await async_client.post("/api/skills/1/start")
            body = start.json()
            assert body["hearts"] == 1
            ex = body["exercises"][0]
            row = await _load_exercise(seeded_session, ex["id"])
            resp = await async_client.post(
                f"/api/lessons/{body['attempt_id']}/answer",
                json={
                    "exercise_id": ex["id"],
                    "position": 0,
                    "answer": _incorrect_payload(row),
                },
            )
            assert resp.status_code == 200
            assert resp.json()["lesson_status"] == "failed"

            attempt = (
                await seeded_session.execute(
                    select(LessonAttempt).where(
                        LessonAttempt.id == body["attempt_id"]
                    )
                )
            ).scalar_one()
            assert attempt.failure_reason == "out_of_hearts"

            retrieve = await async_client.get(f"/api/lessons/{body['attempt_id']}")
            summary = retrieve.json()["terminal_summary"]
            assert summary["failure_reason"] == "out_of_hearts"
        finally:
            set_clock(RealClock())


@pytest.mark.asyncio
class TestTimedExpiry:
    async def test_exact_boundary_still_allows_answer(
        self, async_client: AsyncClient, seeded_session: AsyncSession
    ):
        clock = DebugClock()
        start_at = datetime(2026, 7, 18, 12, 0, 0, tzinfo=timezone.utc)
        clock.set_time(start_at)
        set_clock(clock)
        try:
            start = await async_client.post("/api/skills/3/start-timed")
            body = start.json()
            # Spec: expired when logical_now > expires_at (equality still valid).
            clock.set_time(start_at + timedelta(seconds=TIMED_PRACTICE_DURATION_SECONDS))
            ex = body["exercises"][0]
            row = await _load_exercise(seeded_session, ex["id"])
            resp = await async_client.post(
                f"/api/lessons/{body['attempt_id']}/answer",
                json={
                    "exercise_id": ex["id"],
                    "position": 0,
                    "answer": _correct_payload(row),
                },
            )
            assert resp.status_code == 200, resp.text
            assert resp.json()["lesson_status"] == "in_progress"
        finally:
            set_clock(RealClock())

    async def test_answer_retrieve_complete_after_expiry(
        self, async_client: AsyncClient, seeded_session: AsyncSession
    ):
        clock = DebugClock()
        start_at = datetime(2026, 7, 18, 12, 0, 0, tzinfo=timezone.utc)
        clock.set_time(start_at)
        set_clock(clock)
        try:
            maya = await _maya(seeded_session)
            xp_before = maya.total_xp
            start = await async_client.post("/api/skills/3/start-timed")
            body = start.json()
            attempt_id = body["attempt_id"]

            clock.set_time(
                start_at + timedelta(seconds=TIMED_PRACTICE_DURATION_SECONDS + 1)
            )

            ex = body["exercises"][0]
            row = await _load_exercise(seeded_session, ex["id"])
            answer = await async_client.post(
                f"/api/lessons/{attempt_id}/answer",
                json={
                    "exercise_id": ex["id"],
                    "position": 0,
                    "answer": _correct_payload(row),
                },
            )
            assert answer.status_code == 409
            assert answer.json()["error"]["code"] == "TIME_EXPIRED"

            retrieve = await async_client.get(f"/api/lessons/{attempt_id}")
            assert retrieve.status_code == 200
            rbody = retrieve.json()
            assert rbody["status"] == "failed"
            assert rbody["terminal_summary"]["failure_reason"] == "time_expired"

            complete = await async_client.post(f"/api/lessons/{attempt_id}/complete")
            assert complete.status_code == 409
            assert complete.json()["error"]["code"] in (
                "TIME_EXPIRED",
                "ATTEMPT_FAILED",
            )

            await seeded_session.refresh(maya)
            assert maya.total_xp == xp_before
        finally:
            set_clock(RealClock())


@pytest.mark.asyncio
class TestTimedCompletion:
    async def test_successful_timed_awards_20_no_crown_unlock(
        self, async_client: AsyncClient, seeded_session: AsyncSession
    ):
        clock = DebugClock()
        clock.set_time(datetime(2026, 7, 18, 12, 0, tzinfo=timezone.utc))
        set_clock(clock)
        try:
            maya = await _maya(seeded_session)
            progress_before = (
                await seeded_session.execute(
                    select(UserSkillProgress).where(
                        UserSkillProgress.user_id == maya.id,
                        UserSkillProgress.skill_id == 3,
                    )
                )
            ).scalar_one()
            crowns_before = progress_before.crowns
            practiced_before = progress_before.times_practiced
            xp_before = maya.total_xp
            streak_before = maya.current_streak

            start = await async_client.post("/api/skills/3/start-timed")
            data = start.json()
            await _answer_all(async_client, seeded_session, data, mistake_at=2)

            complete = await async_client.post(
                f"/api/lessons/{data['attempt_id']}/complete"
            )
            assert complete.status_code == 200, complete.text
            body = complete.json()
            assert body["xp"]["earned"] == 20
            assert body["xp"]["base"] == 20
            assert body["xp"]["perfect_bonus"] == 0
            assert body["xp"]["perfect"] is False
            assert body["unlocked_skill_ids"] == []

            await seeded_session.refresh(maya)
            assert maya.total_xp == xp_before + 20
            assert maya.current_streak >= streak_before

            await seeded_session.refresh(progress_before)
            assert progress_before.crowns == crowns_before
            assert progress_before.times_practiced == practiced_before + 1
        finally:
            set_clock(RealClock())

    async def test_perfect_timed_still_no_perfect_bonus(
        self, async_client: AsyncClient, seeded_session: AsyncSession
    ):
        clock = DebugClock()
        clock.set_time(datetime(2026, 7, 18, 12, 0, tzinfo=timezone.utc))
        set_clock(clock)
        try:
            start = await async_client.post("/api/skills/3/start-timed")
            data = start.json()
            await _answer_all(async_client, seeded_session, data)
            complete = await async_client.post(
                f"/api/lessons/{data['attempt_id']}/complete"
            )
            assert complete.status_code == 200
            body = complete.json()
            assert body["xp"]["earned"] == 20
            assert body["xp"]["perfect_bonus"] == 0
            assert body["xp"]["perfect"] is True
        finally:
            set_clock(RealClock())

    async def test_duplicate_timed_completion(
        self, async_client: AsyncClient, seeded_session: AsyncSession
    ):
        clock = DebugClock()
        clock.set_time(datetime(2026, 7, 18, 12, 0, tzinfo=timezone.utc))
        set_clock(clock)
        try:
            maya = await _maya(seeded_session)
            start = await async_client.post("/api/skills/3/start-timed")
            data = start.json()
            await _answer_all(async_client, seeded_session, data)
            first = await async_client.post(
                f"/api/lessons/{data['attempt_id']}/complete"
            )
            assert first.status_code == 200
            await seeded_session.refresh(maya)
            xp = maya.total_xp

            second = await async_client.post(
                f"/api/lessons/{data['attempt_id']}/complete"
            )
            assert second.status_code == 409
            assert second.json()["error"]["code"] == "ATTEMPT_ALREADY_COMPLETED"
            await seeded_session.refresh(maya)
            assert maya.total_xp == xp
        finally:
            set_clock(RealClock())

    async def test_complete_after_expiry_awards_nothing(
        self, async_client: AsyncClient, seeded_session: AsyncSession
    ):
        clock = DebugClock()
        start_at = datetime(2026, 7, 18, 12, 0, tzinfo=timezone.utc)
        clock.set_time(start_at)
        set_clock(clock)
        try:
            maya = await _maya(seeded_session)
            xp_before = maya.total_xp
            start = await async_client.post("/api/skills/3/start-timed")
            data = start.json()
            await _answer_all(async_client, seeded_session, data)
            clock.set_time(
                start_at + timedelta(seconds=TIMED_PRACTICE_DURATION_SECONDS + 1)
            )
            complete = await async_client.post(
                f"/api/lessons/{data['attempt_id']}/complete"
            )
            assert complete.status_code == 409
            assert complete.json()["error"]["code"] == "TIME_EXPIRED"
            await seeded_session.refresh(maya)
            assert maya.total_xp == xp_before
        finally:
            set_clock(RealClock())


@pytest.mark.asyncio
class TestTimedConcurrencyAndContracts:
    async def test_openapi_includes_start_timed(self, async_client: AsyncClient):
        openapi = await async_client.get("/api/openapi.json")
        paths = openapi.json()["paths"]
        assert "/api/skills/{skill_id}/start-timed" in paths
        schemas = openapi.json()["components"]["schemas"]
        assert "LessonAttemptResponse" in schemas

    async def test_concurrent_timed_complete_once(self, tmp_path):
        db_path = tmp_path / "phase6b_concurrent.db"
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
                from datetime import date

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
                response, _ = await lesson_engine.start_timed_practice(session, maya, 3)
                await session.commit()
                attempt_id = response.attempt_id
                for i, pub in enumerate(response.exercises):
                    ex = await _load_exercise(session, pub.id)
                    await lesson_engine.submit_answer(
                        session,
                        maya,
                        attempt_id,
                        pub.id,
                        i,
                        _correct_payload(ex),
                    )
                await session.commit()
                xp_before = maya.total_xp

            async def do_complete() -> str:
                async with SessionLocal() as session:
                    maya = await _maya(session)
                    try:
                        await lesson_engine.complete_attempt(session, maya, attempt_id)
                        await session.commit()
                        return "ok"
                    except ConflictError as exc:
                        await session.rollback()
                        return exc.code
                    except DomainError as exc:
                        await session.rollback()
                        return exc.code

            outcomes = await asyncio.gather(do_complete(), do_complete())
            assert "ok" in outcomes
            assert "ATTEMPT_ALREADY_COMPLETED" in outcomes

            async with SessionLocal() as session:
                maya = await _maya(session)
                assert maya.total_xp == xp_before + 20
                attempt = (
                    await session.execute(
                        select(LessonAttempt).where(LessonAttempt.id == attempt_id)
                    )
                ).scalar_one()
                assert attempt.xp_earned == 20
        finally:
            set_clock(RealClock())
            await engine.dispose()

    async def test_completion_rollback_hook(
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
            maya = await _maya(seeded_session)
            start = await async_client.post("/api/skills/3/start-timed")
            data = start.json()
            await _answer_all(async_client, seeded_session, data)
            await seeded_session.commit()

            maya = await _maya(seeded_session)
            xp_before = maya.total_xp
            practiced_before = (
                await seeded_session.execute(
                    select(UserSkillProgress).where(
                        UserSkillProgress.user_id == maya.id,
                        UserSkillProgress.skill_id == 3,
                    )
                )
            ).scalar_one().times_practiced
            attempt_id = data["attempt_id"]

            with pytest.raises(InjectedFailure):
                await lesson_engine.complete_attempt(
                    seeded_session, maya, attempt_id
                )
            await seeded_session.rollback()

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
            assert progress.times_practiced == practiced_before

            lesson_engine.set_completion_failure_hook(None)
            maya = await _maya(seeded_session)
            result = await lesson_engine.complete_attempt(
                seeded_session, maya, attempt_id
            )
            await seeded_session.commit()
            assert result.xp.earned == 20
            maya = await _maya(seeded_session)
            assert maya.total_xp == xp_before + 20
        finally:
            lesson_engine.set_completion_failure_hook(None)
            set_clock(RealClock())
