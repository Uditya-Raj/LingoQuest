"""Integration tests for Phase 5A: grading and answer transaction."""
from __future__ import annotations

import asyncio
from datetime import date, datetime, timezone
from typing import Any

import pytest
from httpx import AsyncClient
from sqlalchemy import event, func, select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.database import Base
from app.core.errors import ConflictError, DomainError
from app.models.course import Exercise, Lesson
from app.models.progress import ExerciseAnswer, LessonAttempt
from app.models.user import User
from app.seed.seed_data import seed_achievements, seed_course_content, seed_users_and_history
from app.services import lesson_engine


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _correct_payload(exercise: Exercise) -> dict[str, Any]:
    """Build a valid correct submitted answer from stored contract."""
    ca = exercise.correct_answer
    if exercise.type == "multiple_choice":
        return {"option_id": ca["option_id"]}
    if exercise.type == "translate_word_bank":
        return {"ordered_ids": list(ca["ordered_ids"])}
    if exercise.type == "match_pairs":
        return {"pairs": [dict(p) for p in ca["pairs"]]}
    if exercise.type in ("fill_blank", "type_answer"):
        if exercise.type == "fill_blank":
            return {"text": ca["text"]}
        return {"text": ca["accepted"][0]}
    raise ValueError(exercise.type)


def _incorrect_payload(exercise: Exercise) -> dict[str, Any]:
    """Build a valid but incorrect submitted answer."""
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
        # fall back: use a distractor-only wrong order if present
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
    if exercise.type == "fill_blank":
        return {"text": "zz_wrong_zz"}
    if exercise.type == "type_answer":
        return {"text": "zz_wrong_zz"}
    raise ValueError(exercise.type)


async def _maya(session: AsyncSession) -> User:
    result = await session.execute(select(User).where(User.username == "maya_demo"))
    return result.scalar_one()


async def _load_exercise(session: AsyncSession, exercise_id: int) -> Exercise:
    result = await session.execute(select(Exercise).where(Exercise.id == exercise_id))
    return result.scalar_one()


async def _start_attempt(client: AsyncClient, skill_id: int = 1) -> dict[str, Any]:
    response = await client.post(f"/api/skills/{skill_id}/start")
    assert response.status_code in (200, 201), response.text
    return response.json()


async def _snapshot_state(session: AsyncSession, attempt_id: int, user_id: int) -> dict[str, Any]:
    attempt = (
        await session.execute(select(LessonAttempt).where(LessonAttempt.id == attempt_id))
    ).scalar_one()
    user = (await session.execute(select(User).where(User.id == user_id))).scalar_one()
    answer_count = (
        await session.execute(
            select(func.count())
            .select_from(ExerciseAnswer)
            .where(ExerciseAnswer.lesson_attempt_id == attempt_id)
        )
    ).scalar_one()
    return {
        "hearts": user.hearts,
        "anchor": user.heart_regen_anchor_at,
        "total_xp": user.total_xp,
        "current_streak": user.current_streak,
        "current_index": attempt.current_index,
        "mistakes_count": attempt.mistakes_count,
        "hearts_lost": attempt.hearts_lost,
        "status": attempt.status,
        "xp_earned": attempt.xp_earned,
        "answer_count": answer_count,
    }


# ---------------------------------------------------------------------------
# API integration cases
# ---------------------------------------------------------------------------

class TestAnswerHappyPath:
    @pytest.mark.asyncio
    async def test_correct_advances_without_heart_loss(
        self, async_client: AsyncClient, seeded_session: AsyncSession
    ):
        maya = await _maya(seeded_session)
        data = await _start_attempt(async_client)
        # Capture hearts after start (which applies lazy regeneration).
        await seeded_session.refresh(maya)
        hearts_before = maya.hearts
        attempt_id = data["attempt_id"]
        exercise = data["exercises"][0]
        ex = await _load_exercise(seeded_session, exercise["id"])

        response = await async_client.post(
            f"/api/lessons/{attempt_id}/answer",
            json={
                "exercise_id": exercise["id"],
                "position": 0,
                "answer": _correct_payload(ex),
            },
        )
        assert response.status_code == 200, response.text
        body = response.json()
        assert body["is_correct"] is True
        assert body["current_index"] == 1
        assert body["mistakes_count"] == 0
        assert body["hearts_remaining"] == hearts_before
        assert body["lesson_status"] == "in_progress"
        assert body["can_complete"] is False
        assert "correct_answer" in body

        await seeded_session.refresh(maya)
        assert maya.hearts == hearts_before

    @pytest.mark.asyncio
    async def test_wrong_advances_and_loses_one_heart(
        self, async_client: AsyncClient, seeded_session: AsyncSession
    ):
        maya = await _maya(seeded_session)
        maya.hearts = 4
        maya.heart_regen_anchor_at = None
        await seeded_session.flush()

        data = await _start_attempt(async_client)
        attempt_id = data["attempt_id"]
        exercise = data["exercises"][0]
        ex = await _load_exercise(seeded_session, exercise["id"])

        response = await async_client.post(
            f"/api/lessons/{attempt_id}/answer",
            json={
                "exercise_id": exercise["id"],
                "position": 0,
                "answer": _incorrect_payload(ex),
            },
        )
        assert response.status_code == 200, response.text
        body = response.json()
        assert body["is_correct"] is False
        assert body["current_index"] == 1
        assert body["mistakes_count"] == 1
        assert body["hearts_remaining"] == 3
        assert body["lesson_status"] == "in_progress"

        await seeded_session.refresh(maya)
        assert maya.hearts == 3
        attempt = (
            await seeded_session.execute(
                select(LessonAttempt).where(LessonAttempt.id == attempt_id)
            )
        ).scalar_one()
        assert attempt.hearts_lost == 1

    @pytest.mark.asyncio
    async def test_final_answer_sets_can_complete(
        self, async_client: AsyncClient, seeded_session: AsyncSession
    ):
        maya = await _maya(seeded_session)
        maya.hearts = 5
        await seeded_session.flush()

        data = await _start_attempt(async_client)
        attempt_id = data["attempt_id"]
        exercises = data["exercises"]

        # Advance through first 9 correctly via service for speed
        for i in range(9):
            ex = await _load_exercise(seeded_session, exercises[i]["id"])
            await lesson_engine.submit_answer(
                seeded_session,
                maya,
                attempt_id,
                exercises[i]["id"],
                i,
                _correct_payload(ex),
            )
        await seeded_session.flush()

        last = exercises[9]
        ex = await _load_exercise(seeded_session, last["id"])
        response = await async_client.post(
            f"/api/lessons/{attempt_id}/answer",
            json={
                "exercise_id": last["id"],
                "position": 9,
                "answer": _correct_payload(ex),
            },
        )
        assert response.status_code == 200, response.text
        body = response.json()
        assert body["current_index"] == 10
        assert body["lesson_status"] == "in_progress"
        assert body["can_complete"] is True
        assert body["hearts_remaining"] > 0

    @pytest.mark.asyncio
    async def test_zero_heart_fails_in_same_response(
        self, async_client: AsyncClient, seeded_session: AsyncSession
    ):
        maya = await _maya(seeded_session)
        maya.hearts = 1
        maya.heart_regen_anchor_at = datetime.now(timezone.utc)
        xp_before = maya.total_xp
        streak_before = maya.current_streak
        await seeded_session.flush()

        data = await _start_attempt(async_client)
        attempt_id = data["attempt_id"]
        exercise = data["exercises"][0]
        ex = await _load_exercise(seeded_session, exercise["id"])

        response = await async_client.post(
            f"/api/lessons/{attempt_id}/answer",
            json={
                "exercise_id": exercise["id"],
                "position": 0,
                "answer": _incorrect_payload(ex),
            },
        )
        assert response.status_code == 200, response.text
        body = response.json()
        assert body["is_correct"] is False
        assert body["hearts_remaining"] == 0
        assert body["lesson_status"] == "failed"
        assert body["can_complete"] is False

        await seeded_session.refresh(maya)
        assert maya.hearts == 0
        assert maya.total_xp == xp_before
        assert maya.current_streak == streak_before

        attempt = (
            await seeded_session.execute(
                select(LessonAttempt).where(LessonAttempt.id == attempt_id)
            )
        ).scalar_one()
        assert attempt.status == "failed"
        assert attempt.completed_at is not None
        assert attempt.activity_date is None
        assert attempt.xp_earned is None


class TestAnswerIdempotencyAndErrors:
    @pytest.mark.asyncio
    async def test_out_of_order_leaves_state_unchanged(
        self, async_client: AsyncClient, seeded_session: AsyncSession
    ):
        maya = await _maya(seeded_session)
        data = await _start_attempt(async_client)
        attempt_id = data["attempt_id"]
        before = await _snapshot_state(seeded_session, attempt_id, maya.id)

        exercise = data["exercises"][1]
        ex = await _load_exercise(seeded_session, exercise["id"])
        response = await async_client.post(
            f"/api/lessons/{attempt_id}/answer",
            json={
                "exercise_id": exercise["id"],
                "position": 1,
                "answer": _correct_payload(ex),
            },
        )
        assert response.status_code == 409
        assert response.json()["error"]["code"] == "ANSWER_OUT_OF_ORDER"
        after = await _snapshot_state(seeded_session, attempt_id, maya.id)
        assert after == before

    @pytest.mark.asyncio
    async def test_wrong_exercise_id_leaves_state_unchanged(
        self, async_client: AsyncClient, seeded_session: AsyncSession
    ):
        maya = await _maya(seeded_session)
        data = await _start_attempt(async_client)
        attempt_id = data["attempt_id"]
        before = await _snapshot_state(seeded_session, attempt_id, maya.id)

        wrong_id = data["exercises"][1]["id"]
        ex = await _load_exercise(seeded_session, wrong_id)
        response = await async_client.post(
            f"/api/lessons/{attempt_id}/answer",
            json={
                "exercise_id": wrong_id,
                "position": 0,
                "answer": _correct_payload(ex),
            },
        )
        assert response.status_code == 409
        assert response.json()["error"]["code"] == "ANSWER_OUT_OF_ORDER"
        after = await _snapshot_state(seeded_session, attempt_id, maya.id)
        assert after == before

    @pytest.mark.asyncio
    async def test_duplicate_sequential_leaves_state_unchanged(
        self, async_client: AsyncClient, seeded_session: AsyncSession
    ):
        maya = await _maya(seeded_session)
        data = await _start_attempt(async_client)
        attempt_id = data["attempt_id"]
        exercise = data["exercises"][0]
        ex = await _load_exercise(seeded_session, exercise["id"])
        payload = {
            "exercise_id": exercise["id"],
            "position": 0,
            "answer": _correct_payload(ex),
        }

        first = await async_client.post(f"/api/lessons/{attempt_id}/answer", json=payload)
        assert first.status_code == 200
        before = await _snapshot_state(seeded_session, attempt_id, maya.id)

        # Replaying the same answered position is rejected without mutation.
        # After advancement, the documented position check yields ANSWER_OUT_OF_ORDER;
        # concurrent uniqueness maps to ANSWER_ALREADY_SUBMITTED (covered separately).
        second = await async_client.post(f"/api/lessons/{attempt_id}/answer", json=payload)
        assert second.status_code == 409
        assert second.json()["error"]["code"] in (
            "ANSWER_ALREADY_SUBMITTED",
            "ANSWER_OUT_OF_ORDER",
        )
        after = await _snapshot_state(seeded_session, attempt_id, maya.id)
        assert after == before

    @pytest.mark.asyncio
    async def test_malformed_answer_deducts_no_heart(
        self, async_client: AsyncClient, seeded_session: AsyncSession
    ):
        maya = await _maya(seeded_session)
        data = await _start_attempt(async_client)
        attempt_id = data["attempt_id"]
        before = await _snapshot_state(seeded_session, attempt_id, maya.id)

        response = await async_client.post(
            f"/api/lessons/{attempt_id}/answer",
            json={
                "exercise_id": data["exercises"][0]["id"],
                "position": 0,
                "answer": {"not_a_valid": "shape"},
            },
        )
        assert response.status_code == 400
        assert response.json()["error"]["code"] == "INVALID_ANSWER_SHAPE"
        after = await _snapshot_state(seeded_session, attempt_id, maya.id)
        assert after == before

    @pytest.mark.asyncio
    async def test_invalid_option_reference_deducts_no_heart(
        self, async_client: AsyncClient, seeded_session: AsyncSession
    ):
        maya = await _maya(seeded_session)
        data = await _start_attempt(async_client)
        attempt_id = data["attempt_id"]

        # Find a multiple_choice exercise at current index by advancing until one
        # appears, or craft from first exercise if MC.
        target_pos = None
        for i, pub in enumerate(data["exercises"]):
            if pub["type"] == "multiple_choice":
                target_pos = i
                break
        assert target_pos is not None

        for i in range(target_pos):
            ex = await _load_exercise(seeded_session, data["exercises"][i]["id"])
            await lesson_engine.submit_answer(
                seeded_session,
                maya,
                attempt_id,
                data["exercises"][i]["id"],
                i,
                _correct_payload(ex),
            )
        await seeded_session.flush()

        before = await _snapshot_state(seeded_session, attempt_id, maya.id)
        pub = data["exercises"][target_pos]
        response = await async_client.post(
            f"/api/lessons/{attempt_id}/answer",
            json={
                "exercise_id": pub["id"],
                "position": target_pos,
                "answer": {"option_id": "does_not_exist"},
            },
        )
        assert response.status_code == 400
        assert response.json()["error"]["code"] == "INVALID_OPTION_REFERENCE"
        after = await _snapshot_state(seeded_session, attempt_id, maya.id)
        assert after == before

    @pytest.mark.asyncio
    async def test_completed_attempt_rejects_answer(
        self, async_client: AsyncClient, seeded_session: AsyncSession
    ):
        maya = await _maya(seeded_session)
        result = await seeded_session.execute(
            select(LessonAttempt).where(
                LessonAttempt.user_id == maya.id,
                LessonAttempt.status == "completed",
            ).limit(1)
        )
        attempt = result.scalar_one()
        exercise_id = attempt.exercise_order[0]
        ex = await _load_exercise(seeded_session, exercise_id)
        before = await _snapshot_state(seeded_session, attempt.id, maya.id)

        response = await async_client.post(
            f"/api/lessons/{attempt.id}/answer",
            json={
                "exercise_id": exercise_id,
                "position": 0,
                "answer": _correct_payload(ex),
            },
        )
        assert response.status_code == 409
        assert response.json()["error"]["code"] == "ATTEMPT_TERMINAL"
        after = await _snapshot_state(seeded_session, attempt.id, maya.id)
        assert after == before

    @pytest.mark.asyncio
    async def test_failed_attempt_rejects_answer(
        self, async_client: AsyncClient, seeded_session: AsyncSession
    ):
        maya = await _maya(seeded_session)
        data = await _start_attempt(async_client, skill_id=2)
        # Pin hearts after start so lazy regen cannot refill before the wrong answer.
        maya.hearts = 1
        maya.heart_regen_anchor_at = datetime.now(timezone.utc)
        await seeded_session.flush()

        attempt_id = data["attempt_id"]
        exercise = data["exercises"][0]
        ex = await _load_exercise(seeded_session, exercise["id"])

        fail = await async_client.post(
            f"/api/lessons/{attempt_id}/answer",
            json={
                "exercise_id": exercise["id"],
                "position": 0,
                "answer": _incorrect_payload(ex),
            },
        )
        assert fail.status_code == 200, fail.text
        assert fail.json()["lesson_status"] == "failed"
        before = await _snapshot_state(seeded_session, attempt_id, maya.id)

        # Restore a heart so failure isn't from zero-heart start; answer should still reject
        maya.hearts = 3
        await seeded_session.flush()

        response = await async_client.post(
            f"/api/lessons/{attempt_id}/answer",
            json={
                "exercise_id": data["exercises"][1]["id"],
                "position": 1,
                "answer": {"option_id": "x"},
            },
        )
        assert response.status_code == 409
        assert response.json()["error"]["code"] == "ATTEMPT_TERMINAL"
        # hearts may have been bumped to 3 in session; compare attempt fields
        after_attempt = (
            await seeded_session.execute(
                select(LessonAttempt).where(LessonAttempt.id == attempt_id)
            )
        ).scalar_one()
        assert after_attempt.current_index == before["current_index"]
        assert after_attempt.status == "failed"
        assert after_attempt.mistakes_count == before["mistakes_count"]

    @pytest.mark.asyncio
    async def test_foreign_attempt_returns_404(
        self, async_client: AsyncClient, seeded_session: AsyncSession
    ):
        other = (
            await seeded_session.execute(select(User).where(User.username != "maya_demo"))
        ).scalars().first()
        assert other is not None

        lesson = (await seeded_session.execute(select(Lesson).limit(1))).scalar_one()
        foreign = LessonAttempt(
            user_id=other.id,
            lesson_id=lesson.id,
            started_at=datetime.now(timezone.utc),
            status="in_progress",
            exercise_order=[1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
            current_index=0,
            mistakes_count=0,
            hearts_lost=0,
        )
        seeded_session.add(foreign)
        await seeded_session.flush()

        response = await async_client.post(
            f"/api/lessons/{foreign.id}/answer",
            json={
                "exercise_id": 1,
                "position": 0,
                "answer": {"option_id": "a"},
            },
        )
        assert response.status_code == 404
        assert response.json()["error"]["code"] == "ATTEMPT_NOT_FOUND"

    @pytest.mark.asyncio
    async def test_correct_answers_absent_from_start_and_retrieve(
        self, async_client: AsyncClient
    ):
        start = await async_client.post("/api/skills/1/start")
        assert start.status_code in (200, 201)
        start_data = start.json()
        for exercise in start_data["exercises"]:
            assert "correct_answer" not in exercise

        retrieve = await async_client.get(f"/api/lessons/{start_data['attempt_id']}")
        assert retrieve.status_code == 200
        for exercise in retrieve.json()["exercises"]:
            assert "correct_answer" not in exercise

    @pytest.mark.asyncio
    async def test_answer_response_and_openapi_models(self, async_client: AsyncClient, seeded_session: AsyncSession):
        data = await _start_attempt(async_client)
        attempt_id = data["attempt_id"]
        exercise = data["exercises"][0]
        ex = await _load_exercise(seeded_session, exercise["id"])

        response = await async_client.post(
            f"/api/lessons/{attempt_id}/answer",
            json={
                "exercise_id": exercise["id"],
                "position": 0,
                "answer": _correct_payload(ex),
            },
        )
        assert response.status_code == 200
        body = response.json()
        required = {
            "attempt_id",
            "exercise_id",
            "position",
            "is_correct",
            "correct_answer",
            "current_index",
            "total_exercises",
            "mistakes_count",
            "hearts_remaining",
            "max_hearts",
            "next_heart_at",
            "lesson_status",
            "can_complete",
        }
        assert required.issubset(body.keys())

        openapi = await async_client.get("/api/openapi.json")
        assert openapi.status_code == 200
        schema = openapi.json()
        paths = schema["paths"]
        assert "/api/lessons/{attempt_id}/answer" in paths
        post = paths["/api/lessons/{attempt_id}/answer"]["post"]
        assert "AnswerResponse" in str(post.get("responses", {})) or "200" in post["responses"]
        # Request/response models registered
        components = schema.get("components", {}).get("schemas", {})
        assert "AnswerSubmitRequest" in components
        assert "AnswerResponse" in components


class TestConcurrentDuplicate:
    @pytest.mark.asyncio
    async def test_concurrent_duplicate_mutates_once(self, tmp_path):
        """Two concurrent submissions: one success, one conflict, one mutation."""
        db_path = tmp_path / "phase5a_concurrent.db"
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

        async with SessionLocal() as session:
            reference_date = date(2026, 7, 18)
            reference_now = datetime.combine(reference_date, datetime.min.time()).replace(
                tzinfo=timezone.utc
            )
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
            response, _ = await lesson_engine.start_or_resume_standard(session, maya, 1)
            await session.commit()
            await session.refresh(maya)
            hearts_before = maya.hearts
            attempt_id = response.attempt_id
            exercise_id = response.exercises[0].id
            position = 0
            ex = await _load_exercise(session, exercise_id)
            payload = _correct_payload(ex)

        async def attempt_submit() -> str:
            async with SessionLocal() as session:
                maya = await _maya(session)
                try:
                    await lesson_engine.submit_answer(
                        session,
                        maya,
                        attempt_id,
                        exercise_id,
                        position,
                        payload,
                    )
                    await session.commit()
                    return "ok"
                except ConflictError as exc:
                    await session.rollback()
                    return exc.code
                except DomainError as exc:
                    await session.rollback()
                    return exc.code

        outcomes = await asyncio.gather(attempt_submit(), attempt_submit())
        assert "ok" in outcomes
        assert "ANSWER_ALREADY_SUBMITTED" in outcomes
        assert outcomes.count("ok") == 1

        async with SessionLocal() as session:
            attempt = (
                await session.execute(
                    select(LessonAttempt).where(LessonAttempt.id == attempt_id)
                )
            ).scalar_one()
            answer_count = (
                await session.execute(
                    select(func.count())
                    .select_from(ExerciseAnswer)
                    .where(ExerciseAnswer.lesson_attempt_id == attempt_id)
                )
            ).scalar_one()
            maya = await _maya(session)
            assert attempt.current_index == 1
            assert answer_count == 1
            assert maya.hearts == hearts_before
            assert attempt.mistakes_count == 0

        await engine.dispose()
