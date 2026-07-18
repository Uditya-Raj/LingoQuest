"""Phase 7C — Backend end-to-end HTTP acceptance gate.

Proves the complete learning journey through real ASGI HTTP calls against a
fresh Alembic-migrated and seeded temporary SQLite database. Direct DB access
is limited to setup, solution lookup, and final persistence checks.
"""
from __future__ import annotations

import asyncio
import json
import os
import subprocess
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, AsyncIterator

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy import event, select, text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import NullPool

from app.core.clock import DebugClock, RealClock, get_clock, set_clock
from app.core.config import settings
from app.core.database import get_session
from app.main import create_app
from app.models.course import Exercise, Lesson
from app.models.progress import LessonAttempt, UserSkillProgress
from app.models.user import User
from app.services.lesson_engine import TIMED_PRACTICE_DURATION_SECONDS


BACKEND_ROOT = Path(__file__).resolve().parents[1]
DEV_DB_PATH = BACKEND_ROOT / "lingopath.db"
REFERENCE_DATE = "2026-07-18"
# Seed uses midnight UTC; keep logical now within the 15-minute regen window
# so Maya's seeded 4 hearts are not lazily restored before assertions.
SEED_NOW = datetime(2026, 7, 18, 0, 5, 0, tzinfo=timezone.utc)
ALEMBIC_HEAD = "c8a1f4e2b9d0"

_DEV_DB_BEFORE: tuple[int, float] | None = None
if DEV_DB_PATH.exists():
    st = DEV_DB_PATH.stat()
    _DEV_DB_BEFORE = (st.st_size, st.st_mtime)


def _run_alembic(db_path: Path, *args: str) -> None:
    env = os.environ.copy()
    env["DATABASE_URL"] = f"sqlite+aiosqlite:///{db_path.as_posix()}"
    result = subprocess.run(
        [sys.executable, "-m", "alembic", *args],
        cwd=str(BACKEND_ROOT),
        env=env,
        capture_output=True,
        text=True,
        check=False,
    )
    if result.returncode != 0:
        raise AssertionError(
            f"alembic {' '.join(args)} failed:\n"
            f"stdout:\n{result.stdout}\nstderr:\n{result.stderr}"
        )


def _run_seed(db_path: Path) -> None:
    env = os.environ.copy()
    env["DATABASE_URL"] = f"sqlite+aiosqlite:///{db_path.as_posix()}"
    result = subprocess.run(
        [
            sys.executable,
            "-m",
            "app.seed.seed_data",
            "--reference-date",
            REFERENCE_DATE,
        ],
        cwd=str(BACKEND_ROOT),
        env=env,
        capture_output=True,
        text=True,
        check=False,
    )
    if result.returncode != 0:
        raise AssertionError(
            f"seed failed:\nstdout:\n{result.stdout}\nstderr:\n{result.stderr}"
        )


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


def _assert_error_envelope(body: dict[str, Any]) -> None:
    assert "error" in body
    assert {"code", "message"} <= set(body["error"].keys())


VALID_EXERCISES: dict[str, dict[str, Any]] = {
    "multiple_choice": {
        "type": "multiple_choice",
        "prompt": "7C MC",
        "options": [
            {"id": "a", "text": "Yes"},
            {"id": "b", "text": "No"},
        ],
        "correct_answer": {"option_id": "a"},
        "metadata": {"hint": "mc"},
    },
    "translate_word_bank": {
        "type": "translate_word_bank",
        "prompt": "7C WB",
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
        "prompt": "7C MP",
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


class AcceptanceEnv:
    """Migrated+seeded temp DB with session-per-request HTTP client."""

    def __init__(
        self,
        db_path: Path,
        session_factory: async_sessionmaker[AsyncSession],
        client: AsyncClient,
        clock: DebugClock,
        app: Any,
    ):
        self.db_path = db_path
        self.session_factory = session_factory
        self.client = client
        self.clock = clock
        self.app = app

    async def load_exercise(self, exercise_id: int) -> Exercise:
        async with self.session_factory() as session:
            return (
                await session.execute(
                    select(Exercise).where(Exercise.id == exercise_id)
                )
            ).scalar_one()

    async def maya(self) -> User:
        async with self.session_factory() as session:
            return (
                await session.execute(
                    select(User).where(User.username == "maya_demo")
                )
            ).scalar_one()

    async def update_maya(self, **fields: Any) -> None:
        async with self.session_factory() as session:
            maya = (
                await session.execute(
                    select(User).where(User.username == "maya_demo")
                )
            ).scalar_one()
            for key, value in fields.items():
                setattr(maya, key, value)
            await session.commit()

    async def answer_all(
        self,
        attempt_id: int,
        exercises: list[dict[str, Any]],
        *,
        mistakes_at: set[int] | None = None,
    ) -> list[dict[str, Any]]:
        mistakes_at = mistakes_at or set()
        responses: list[dict[str, Any]] = []
        for i, pub in enumerate(exercises):
            ex = await self.load_exercise(pub["id"])
            payload = (
                _incorrect_payload(ex)
                if i in mistakes_at
                else _correct_payload(ex)
            )
            resp = await self.client.post(
                f"/api/lessons/{attempt_id}/answer",
                json={
                    "exercise_id": pub["id"],
                    "position": i,
                    "answer": payload,
                },
            )
            assert resp.status_code == 200, resp.text
            responses.append(resp.json())
        return responses


@pytest.fixture
async def acceptance_env(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> AsyncIterator[AcceptanceEnv]:
    """Fresh temp DB: Alembic to head, real seed, ASGI HTTP, separate sessions."""
    db_path = tmp_path / "phase7c_acceptance.db"
    _run_alembic(db_path, "upgrade", "head")
    _run_seed(db_path)

    engine = create_async_engine(
        f"sqlite+aiosqlite:///{db_path.as_posix()}",
        poolclass=NullPool,
        echo=False,
    )

    @event.listens_for(engine.sync_engine, "connect")
    def set_sqlite_pragma(dbapi_conn, connection_record):
        cursor = dbapi_conn.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

    session_factory = async_sessionmaker(
        engine,
        class_=AsyncSession,
        expire_on_commit=False,
        autocommit=False,
        autoflush=False,
    )

    monkeypatch.setattr(settings, "debug_clock_enabled", True)
    # create_app() installs its own DebugClock when debug is enabled — freeze that instance.
    app = create_app()
    clock = get_clock()
    assert isinstance(clock, DebugClock)
    clock.set_time(SEED_NOW)

    async def override_get_session() -> AsyncIterator[AsyncSession]:
        async with session_factory() as session:
            try:
                yield session
                await session.commit()
            except Exception:
                await session.rollback()
                raise

    app.dependency_overrides[get_session] = override_get_session

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield AcceptanceEnv(db_path, session_factory, client, clock, app)

    app.dependency_overrides.clear()
    monkeypatch.setattr(settings, "debug_clock_enabled", False)
    set_clock(RealClock())
    await engine.dispose()


# ---------------------------------------------------------------------------
# 1. Fresh-database boot gate
# ---------------------------------------------------------------------------


class TestFreshDatabaseBoot:
    def test_migrate_seed_counts_fk_and_idempotent(self, tmp_path: Path):
        db_path = tmp_path / "boot_gate.db"
        _run_alembic(db_path, "upgrade", "head")
        _run_seed(db_path)

        from sqlalchemy import create_engine

        sync = create_engine(f"sqlite:///{db_path.as_posix()}")
        with sync.connect() as conn:
            conn.execute(text("PRAGMA foreign_keys=ON"))
            rev = conn.execute(text("SELECT version_num FROM alembic_version")).scalar()
            assert rev == ALEMBIC_HEAD

            assert conn.execute(text("SELECT COUNT(*) FROM lesson_attempts")).scalar() == 142
            assert conn.execute(text("SELECT COUNT(*) FROM exercise_answers")).scalar() == 1420
            assert (
                conn.execute(text("SELECT COUNT(*) FROM user_skill_progress")).scalar()
                == 25
            )
            assert conn.execute(text("PRAGMA foreign_keys")).scalar() == 1
            assert conn.execute(text("PRAGMA foreign_key_check")).fetchall() == []

        _run_seed(db_path)
        with sync.connect() as conn:
            assert conn.execute(text("SELECT COUNT(*) FROM lesson_attempts")).scalar() == 142
            assert conn.execute(text("SELECT COUNT(*) FROM exercise_answers")).scalar() == 1420
            assert (
                conn.execute(text("SELECT COUNT(*) FROM user_skill_progress")).scalar()
                == 25
            )
            assert conn.execute(text("PRAGMA foreign_key_check")).fetchall() == []
        sync.dispose()

    @pytest.mark.asyncio
    async def test_start_retrieve_never_leak_answers(
        self, acceptance_env: AcceptanceEnv
    ):
        client = acceptance_env.client
        start = await client.post("/api/skills/3/start")
        assert start.status_code in (200, 201), start.text
        body = start.json()
        for ex in body["exercises"]:
            assert "correct_answer" not in ex
        retrieve = await client.get(f"/api/lessons/{body['attempt_id']}")
        assert retrieve.status_code == 200
        for ex in retrieve.json()["exercises"]:
            assert "correct_answer" not in ex


# ---------------------------------------------------------------------------
# 2. Standard lesson journey
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
class TestStandardLessonJourney:
    async def test_full_path_to_completion_and_refresh(
        self, acceptance_env: AcceptanceEnv
    ):
        client = acceptance_env.client
        env = acceptance_env

        course = await client.get("/api/course")
        assert course.status_code == 200, course.text
        skills = [s for u in course.json()["units"] for s in u["skills"]]
        skill = next(s for s in skills if s["status"] in ("available", "in_progress"))
        skill_id = skill["id"]
        crowns_before = skill["crowns"]

        detail = await client.get(f"/api/skills/{skill_id}")
        assert detail.status_code == 200
        skill_detail = detail.json()["skill"]
        assert skill_detail["id"] == skill_id
        assert skill_detail["status"] == skill["status"]
        assert skill_detail["crowns"] == crowns_before

        me_before = (await client.get("/api/user/me")).json()
        xp_before = me_before["stats"]["total_xp"]
        streak_before = me_before["stats"]["current_streak"]
        hearts_before = me_before["stats"]["hearts"]
        ach_before = (await client.get("/api/achievements")).json()

        start = await client.post(f"/api/skills/{skill_id}/start")
        assert start.status_code in (200, 201), start.text
        data = start.json()
        attempt_id = data["attempt_id"]
        exercises = data["exercises"]
        assert data["mode"] == "standard"
        assert len(exercises) == 10
        assert {e["type"] for e in exercises} == {
            "multiple_choice",
            "translate_word_bank",
            "match_pairs",
            "fill_blank",
            "type_answer",
        }
        for e in exercises:
            assert "correct_answer" not in e

        retrieve = await client.get(f"/api/lessons/{attempt_id}")
        assert retrieve.status_code == 200
        retrieved = retrieve.json()
        assert [e["id"] for e in retrieved["exercises"]] == [e["id"] for e in exercises]
        assert retrieved["current_index"] == 0
        for e in retrieved["exercises"]:
            assert "correct_answer" not in e

        second = exercises[1]
        ex1 = await env.load_exercise(second["id"])
        ooo = await client.post(
            f"/api/lessons/{attempt_id}/answer",
            json={
                "exercise_id": second["id"],
                "position": 1,
                "answer": _correct_payload(ex1),
            },
        )
        assert ooo.status_code == 409
        _assert_error_envelope(ooo.json())

        answer_bodies = await env.answer_all(attempt_id, exercises)
        assert all(b["is_correct"] for b in answer_bodies)
        assert answer_bodies[-1]["hearts_remaining"] == hearts_before

        first = exercises[0]
        ex0 = await env.load_exercise(first["id"])
        dup = await client.post(
            f"/api/lessons/{attempt_id}/answer",
            json={
                "exercise_id": first["id"],
                "position": 0,
                "answer": _correct_payload(ex0),
            },
        )
        assert dup.status_code == 409
        _assert_error_envelope(dup.json())

        complete = await client.post(f"/api/lessons/{attempt_id}/complete")
        assert complete.status_code == 200, complete.text
        result = complete.json()
        assert result["xp"]["earned"] == 15
        assert result["xp"]["perfect"] is True
        assert result["streak"]["current"] == streak_before
        assert result["user_totals"]["total_xp"] == xp_before + 15

        again = await client.post(f"/api/lessons/{attempt_id}/complete")
        assert again.status_code == 409
        assert again.json()["error"]["code"] == "ATTEMPT_ALREADY_COMPLETED"

        course_after = (await client.get("/api/course")).json()
        me_after = (await client.get("/api/user/me")).json()
        lb_after = (await client.get("/api/leaderboard")).json()
        ach_after = (await client.get("/api/achievements")).json()

        assert me_after["stats"]["total_xp"] == xp_before + 15
        assert me_after["stats"]["current_streak"] == streak_before
        skill_after = next(
            s
            for u in course_after["units"]
            for s in u["skills"]
            if s["id"] == skill_id
        )
        assert skill_after["crowns"] == crowns_before + 1
        assert lb_after["current_user"]["total_xp"] == me_after["stats"]["total_xp"]
        assert lb_after["current_user"]["is_current_user"] is True

        earned_before = {a["key"] for a in ach_before["achievements"] if a["earned"]}
        earned_after = {a["key"] for a in ach_after["achievements"] if a["earned"]}
        assert earned_before <= earned_after

        maya = await env.maya()
        async with env.session_factory() as session:
            progress = (
                await session.execute(
                    select(UserSkillProgress).where(
                        UserSkillProgress.user_id == maya.id,
                        UserSkillProgress.skill_id == skill_id,
                    )
                )
            ).scalar_one()
            assert progress.crowns == crowns_before + 1
            refreshed = (
                await session.execute(
                    select(User).where(User.username == "maya_demo")
                )
            ).scalar_one()
            assert refreshed.total_xp == xp_before + 15


# ---------------------------------------------------------------------------
# 3. Wrong-answer and heart flow
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
class TestWrongAnswerHeartFlow:
    async def test_heart_loss_failure_refill_retry_and_regen(
        self, acceptance_env: AcceptanceEnv
    ):
        client = acceptance_env.client
        env = acceptance_env
        skill_id = 4

        me0 = (await client.get("/api/user/me")).json()
        hearts0 = me0["stats"]["hearts"]
        xp0 = me0["stats"]["total_xp"]
        gems0 = me0["stats"]["gems"]
        assert hearts0 == 4

        start = await client.post(f"/api/skills/{skill_id}/start")
        assert start.status_code in (200, 201), start.text
        data = start.json()
        attempt_id = data["attempt_id"]
        exercises = data["exercises"]

        ex0 = await env.load_exercise(exercises[0]["id"])
        wrong = await client.post(
            f"/api/lessons/{attempt_id}/answer",
            json={
                "exercise_id": exercises[0]["id"],
                "position": 0,
                "answer": _incorrect_payload(ex0),
            },
        )
        assert wrong.status_code == 200, wrong.text
        body = wrong.json()
        assert body["is_correct"] is False
        assert body["hearts_remaining"] == hearts0 - 1
        assert body["lesson_status"] == "in_progress"

        pos = 1
        last = body
        while last["hearts_remaining"] > 0:
            pub = exercises[pos]
            ex = await env.load_exercise(pub["id"])
            resp = await client.post(
                f"/api/lessons/{attempt_id}/answer",
                json={
                    "exercise_id": pub["id"],
                    "position": pos,
                    "answer": _incorrect_payload(ex),
                },
            )
            assert resp.status_code == 200, resp.text
            last = resp.json()
            pos += 1

        assert last["hearts_remaining"] == 0
        assert last["lesson_status"] == "failed"

        retrieve = await client.get(f"/api/lessons/{attempt_id}")
        assert retrieve.json()["status"] == "failed"
        assert retrieve.json()["terminal_summary"]["failure_reason"] == "out_of_hearts"

        me_fail = (await client.get("/api/user/me")).json()
        assert me_fail["stats"]["total_xp"] == xp0
        assert me_fail["stats"]["hearts"] == 0

        async with env.session_factory() as session:
            attempt = (
                await session.execute(
                    select(LessonAttempt).where(LessonAttempt.id == attempt_id)
                )
            ).scalar_one()
            assert attempt.status == "failed"
            assert attempt.xp_earned is None
            progress = (
                await session.execute(
                    select(UserSkillProgress).where(
                        UserSkillProgress.user_id == attempt.user_id,
                        UserSkillProgress.skill_id == skill_id,
                    )
                )
            ).scalar_one()
            assert progress.crowns == 0

        blocked = await client.post(f"/api/skills/{skill_id}/start")
        assert blocked.status_code == 409
        assert blocked.json()["error"]["code"] == "OUT_OF_HEARTS"

        status = await client.get("/api/hearts/status")
        assert status.status_code == 200
        assert status.json()["hearts"] == 0

        refill = await client.post(
            "/api/hearts/refill", json={"confirm_spend": True}
        )
        assert refill.status_code == 200, refill.text
        assert refill.json()["hearts"] == 5
        assert refill.json()["gems"] == gems0 - 20

        restart = await client.post(f"/api/skills/{skill_id}/start")
        assert restart.status_code == 201, restart.text
        assert restart.json()["attempt_id"] != attempt_id

        await env.update_maya(
            hearts=3,
            heart_regen_anchor_at=SEED_NOW,
            gems=100,
        )
        env.clock.set_time(SEED_NOW + timedelta(minutes=15))
        regen = await client.get("/api/hearts/status")
        assert regen.status_code == 200
        assert regen.json()["hearts"] == 4


# ---------------------------------------------------------------------------
# 4. Timed-practice journey
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
class TestTimedPracticeJourney:
    async def test_successful_timed_attempt(self, acceptance_env: AcceptanceEnv):
        client = acceptance_env.client
        env = acceptance_env
        skill_id = 3

        me_before = (await client.get("/api/user/me")).json()
        xp_before = me_before["stats"]["total_xp"]
        hearts_before = me_before["stats"]["hearts"]
        course_before = (await client.get("/api/course")).json()
        crowns = {
            s["id"]: s["crowns"]
            for u in course_before["units"]
            for s in u["skills"]
        }
        statuses = {
            s["id"]: s["status"]
            for u in course_before["units"]
            for s in u["skills"]
        }

        start = await client.post(f"/api/skills/{skill_id}/start-timed")
        assert start.status_code == 201, start.text
        data = start.json()
        assert data["mode"] == "timed"
        assert data["expires_at"] is not None
        assert data["remaining_seconds"] == TIMED_PRACTICE_DURATION_SECONDS
        started = datetime.fromisoformat(
            data["started_at"].replace("Z", "+00:00")
        )
        expires = datetime.fromisoformat(
            data["expires_at"].replace("Z", "+00:00")
        )
        assert int((expires - started).total_seconds()) == TIMED_PRACTICE_DURATION_SECONDS
        attempt_id = data["attempt_id"]
        exercises = data["exercises"]
        assert len(exercises) == 10
        assert {e["type"] for e in exercises} == {
            "multiple_choice",
            "translate_word_bank",
            "match_pairs",
            "fill_blank",
            "type_answer",
        }

        retrieve = await client.get(f"/api/lessons/{attempt_id}")
        assert retrieve.status_code == 200
        assert retrieve.json()["expires_at"] == data["expires_at"]
        assert [e["id"] for e in retrieve.json()["exercises"]] == [
            e["id"] for e in exercises
        ]

        ex0 = await env.load_exercise(exercises[0]["id"])
        wrong = await client.post(
            f"/api/lessons/{attempt_id}/answer",
            json={
                "exercise_id": exercises[0]["id"],
                "position": 0,
                "answer": _incorrect_payload(ex0),
            },
        )
        assert wrong.status_code == 200, wrong.text
        assert wrong.json()["is_correct"] is False
        assert wrong.json()["mistakes_count"] == 1
        assert wrong.json()["hearts_remaining"] == hearts_before

        for i, pub in enumerate(exercises[1:], start=1):
            ex = await env.load_exercise(pub["id"])
            resp = await client.post(
                f"/api/lessons/{attempt_id}/answer",
                json={
                    "exercise_id": pub["id"],
                    "position": i,
                    "answer": _correct_payload(ex),
                },
            )
            assert resp.status_code == 200, resp.text

        complete = await client.post(f"/api/lessons/{attempt_id}/complete")
        assert complete.status_code == 200, complete.text
        result = complete.json()
        assert result["xp"]["earned"] == 20
        assert result["user_totals"]["total_xp"] == xp_before + 20

        course_after = (await client.get("/api/course")).json()
        for u in course_after["units"]:
            for s in u["skills"]:
                assert s["crowns"] == crowns[s["id"]]
                if statuses[s["id"]] == "locked":
                    assert s["status"] == "locked"

        again = await client.post(f"/api/lessons/{attempt_id}/complete")
        assert again.status_code == 409
        me_after = (await client.get("/api/user/me")).json()
        assert me_after["stats"]["total_xp"] == xp_before + 20

    async def test_expired_timed_attempt_and_boundary(
        self, acceptance_env: AcceptanceEnv
    ):
        client = acceptance_env.client
        env = acceptance_env
        skill_id = 3

        start_at = SEED_NOW
        env.clock.set_time(start_at)
        start = await client.post(f"/api/skills/{skill_id}/start-timed")
        assert start.status_code == 201, start.text
        data = start.json()
        attempt_id = data["attempt_id"]
        expires_at = datetime.fromisoformat(
            data["expires_at"].replace("Z", "+00:00")
        )
        exercises = data["exercises"]

        env.clock.set_time(expires_at)
        ex0 = await env.load_exercise(exercises[0]["id"])
        at_boundary = await client.post(
            f"/api/lessons/{attempt_id}/answer",
            json={
                "exercise_id": exercises[0]["id"],
                "position": 0,
                "answer": _correct_payload(ex0),
            },
        )
        assert at_boundary.status_code == 200, at_boundary.text

        me_before = (await client.get("/api/user/me")).json()
        xp_before = me_before["stats"]["total_xp"]
        hearts_before = me_before["stats"]["hearts"]

        env.clock.set_time(expires_at + timedelta(seconds=1))
        ex1 = await env.load_exercise(exercises[1]["id"])
        expired = await client.post(
            f"/api/lessons/{attempt_id}/answer",
            json={
                "exercise_id": exercises[1]["id"],
                "position": 1,
                "answer": _correct_payload(ex1),
            },
        )
        assert expired.status_code == 409, expired.text
        err = expired.json()
        _assert_error_envelope(err)
        assert err["error"]["code"] == "TIME_EXPIRED"

        retrieve = await client.get(f"/api/lessons/{attempt_id}")
        assert retrieve.status_code == 200
        body = retrieve.json()
        assert body["status"] == "failed"
        assert body["terminal_summary"]["failure_reason"] == "time_expired"

        complete = await client.post(f"/api/lessons/{attempt_id}/complete")
        assert complete.status_code == 409

        me_after = (await client.get("/api/user/me")).json()
        assert me_after["stats"]["total_xp"] == xp_before
        assert me_after["stats"]["hearts"] == hearts_before

        async with env.session_factory() as session:
            attempt = (
                await session.execute(
                    select(LessonAttempt).where(LessonAttempt.id == attempt_id)
                )
            ).scalar_one()
            assert attempt.status == "failed"
            assert attempt.failure_reason == "time_expired"
            assert attempt.xp_earned is None


# ---------------------------------------------------------------------------
# 5. Profile, daily goal, leaderboard, achievements
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
class TestProfileLeaderboardAchievements:
    async def test_maya_seed_profile_patch_and_leaderboard(
        self, acceptance_env: AcceptanceEnv
    ):
        client = acceptance_env.client
        env = acceptance_env

        me = (await client.get("/api/user/me")).json()
        assert me["user"]["display_name"] == "Maya"
        stats = me["stats"]
        assert stats["total_xp"] == 340
        assert stats["current_streak"] == 6
        assert stats["longest_streak"] == 11
        assert stats["hearts"] == 4
        assert stats["gems"] == 100
        assert stats["daily_goal_xp"] == 20
        assert stats["today_xp"] == 10

        lb = (await client.get("/api/leaderboard")).json()
        assert lb["current_user"]["display_name"] == "Maya"
        assert lb["current_user"]["rank"] == 3
        assert lb["current_user"]["is_current_user"] is True

        ach = (await client.get("/api/achievements")).json()
        earned = {a["key"] for a in ach["achievements"] if a["earned"]}
        locked = {a["key"] for a in ach["achievements"] if not a["earned"]}
        assert {
            "first_steps",
            "streak_3",
            "streak_7",
            "xp_100",
            "perfectionist",
        } <= earned
        assert "xp_500" in locked

        bad = await client.patch("/api/user/me", json={"daily_goal_xp": 0})
        assert bad.status_code == 422

        blank = await client.patch("/api/user/me", json={"display_name": "   "})
        assert blank.status_code == 422

        patched = await client.patch(
            "/api/user/me",
            json={"display_name": "Maya Quest", "daily_goal_xp": 30},
        )
        assert patched.status_code == 200, patched.text
        assert patched.json()["display_name"] == "Maya Quest"
        assert patched.json()["daily_goal_xp"] == 30

        restored = await client.patch(
            "/api/user/me",
            json={"display_name": "Maya", "daily_goal_xp": 20},
        )
        assert restored.status_code == 200

        start = await client.post("/api/skills/3/start")
        data = start.json()
        await env.answer_all(data["attempt_id"], data["exercises"])
        complete = await client.post(f"/api/lessons/{data['attempt_id']}/complete")
        assert complete.status_code == 200
        earned_xp = complete.json()["xp"]["earned"]

        me2 = (await client.get("/api/user/me")).json()
        assert me2["stats"]["today_xp"] == 10 + earned_xp
        assert me2["stats"]["total_xp"] == 340 + earned_xp

        lb2 = (await client.get("/api/leaderboard")).json()
        assert lb2["current_user"]["total_xp"] == me2["stats"]["total_xp"]
        assert lb2["current_user"]["is_current_user"] is True


# ---------------------------------------------------------------------------
# 6. Content administration
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
class TestContentAdminAcceptance:
    async def test_admin_tree_create_edit_tts_and_protection(
        self, acceptance_env: AcceptanceEnv
    ):
        client = acceptance_env.client
        env = acceptance_env

        tree = await client.get("/api/admin/content/tree")
        assert tree.status_code == 200, tree.text
        courses = tree.json()["courses"]
        assert len(courses) == 1
        admin_ex = courses[0]["units"][0]["skills"][0]["lessons"][0]["exercises"][0]
        assert "correct_answer" in admin_ex

        start = await client.post("/api/skills/3/start")
        for e in start.json()["exercises"]:
            assert "correct_answer" not in e

        created_ids: list[int] = []
        for i, (etype, payload) in enumerate(VALID_EXERCISES.items()):
            body: dict[str, Any] = {
                "lesson_id": 3,
                "order_index": 300 + i,
                "audio_url": None,
                "is_active": True,
                **payload,
            }
            if etype == "type_answer":
                body["tts_text"] = "hola"
                body["tts_lang"] = "es-ES"
            resp = await client.post("/api/admin/exercises", json=body)
            assert resp.status_code == 201, f"{etype}: {resp.text}"
            data = resp.json()
            assert data["type"] == etype
            assert data["correct_answer"] == payload["correct_answer"]
            created_ids.append(data["id"])
            if etype == "type_answer":
                assert data["tts_text"] == "hola"
                assert data["tts_lang"] == "es-ES"

        bad = await client.post(
            "/api/admin/exercises",
            json={
                "lesson_id": 3,
                "order_index": 400,
                "type": "multiple_choice",
                "prompt": "Bad",
                "options": [{"id": "a", "text": "Only one"}],
                "correct_answer": {"option_id": "z"},
                "is_active": True,
            },
        )
        assert bad.status_code == 400
        assert bad.json()["error"]["code"] == "INVALID_EXERCISE_CONTRACT"

        blank_tts = await client.post(
            "/api/admin/exercises",
            json={
                "lesson_id": 3,
                "order_index": 410,
                "type": "type_answer",
                "prompt": "TTS blank",
                "options": None,
                "correct_answer": {"accepted": ["hola"]},
                "tts_text": "   ",
                "tts_lang": "es-ES",
                "is_active": True,
            },
        )
        assert blank_tts.status_code == 400
        assert blank_tts.json()["error"]["code"] == "INVALID_EXERCISE_CONTRACT"

        bad_lang = await client.post(
            "/api/admin/exercises",
            json={
                "lesson_id": 3,
                "order_index": 411,
                "type": "type_answer",
                "prompt": "TTS lang",
                "options": None,
                "correct_answer": {"accepted": ["hola"]},
                "tts_text": "hola",
                "tts_lang": "!!",
                "is_active": True,
            },
        )
        assert bad_lang.status_code == 400
        assert bad_lang.json()["error"]["code"] == "INVALID_EXERCISE_CONTRACT"

        partial_tts = await client.post(
            "/api/admin/exercises",
            json={
                "lesson_id": 3,
                "order_index": 412,
                "type": "type_answer",
                "prompt": "TTS partial",
                "options": None,
                "correct_answer": {"accepted": ["hola"]},
                "tts_text": "hola",
                "is_active": True,
            },
        )
        assert partial_tts.status_code == 400
        assert partial_tts.json()["error"]["code"] == "INVALID_EXERCISE_CONTRACT"

        ex_id = created_ids[3]
        bad_patch = await client.patch(
            f"/api/admin/exercises/{ex_id}",
            json={"type": "multiple_choice"},
        )
        assert bad_patch.status_code == 400

        good_patch = await client.patch(
            f"/api/admin/exercises/{ex_id}",
            json={"prompt": "Ella ___ mi hermana."},
        )
        assert good_patch.status_code == 200
        assert good_patch.json()["prompt"] == "Ella ___ mi hermana."
        assert good_patch.json()["type"] == "fill_blank"

        await env.update_maya(hearts=5, heart_regen_anchor_at=None)
        # Resume/create active attempt on Food and protect its first exercise
        active = await client.post("/api/skills/3/start")
        assert active.status_code in (200, 201)
        active_ex = active.json()["exercises"][0]["id"]
        protected = await client.patch(
            f"/api/admin/exercises/{active_ex}",
            json={"prompt": "Should not apply"},
        )
        assert protected.status_code == 409
        assert protected.json()["error"]["code"] == "CONTENT_IN_ACTIVE_ATTEMPT"


# ---------------------------------------------------------------------------
# 7. Error and ownership contracts
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
class TestErrorAndOwnership:
    async def test_error_envelope_and_ownership(self, acceptance_env: AcceptanceEnv):
        client = acceptance_env.client
        env = acceptance_env

        start = await client.post("/api/skills/3/start")
        data = start.json()
        attempt_id = data["attempt_id"]
        first = data["exercises"][0]
        malformed = await client.post(
            f"/api/lessons/{attempt_id}/answer",
            json={
                "exercise_id": first["id"],
                "position": 0,
                "answer": {"not_a_valid_field": True},
            },
        )
        assert malformed.status_code == 400
        _assert_error_envelope(malformed.json())

        missing = await client.get("/api/skills/99999")
        assert missing.status_code == 404
        _assert_error_envelope(missing.json())

        locked = await client.post("/api/skills/5/start")
        assert locked.status_code == 409
        _assert_error_envelope(locked.json())
        assert locked.json()["error"]["code"] == "SKILL_LOCKED"

        await env.update_maya(is_content_admin=False)
        forbidden = await client.get("/api/admin/content/tree")
        assert forbidden.status_code == 403
        _assert_error_envelope(forbidden.json())
        assert forbidden.json()["error"]["code"] == "CONTENT_ADMIN_REQUIRED"
        await env.update_maya(is_content_admin=True)

        async with env.session_factory() as session:
            other = (
                await session.execute(
                    select(User).where(User.username != "maya_demo")
                )
            ).scalars().first()
            lesson = (await session.execute(select(Lesson).limit(1))).scalar_one()
            foreign = LessonAttempt(
                user_id=other.id,
                lesson_id=lesson.id,
                started_at=SEED_NOW,
                status="in_progress",
                mode="standard",
                exercise_order=[1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
                current_index=0,
                mistakes_count=0,
                hearts_lost=0,
            )
            session.add(foreign)
            await session.commit()
            foreign_id = foreign.id

        get_foreign = await client.get(f"/api/lessons/{foreign_id}")
        assert get_foreign.status_code == 404
        _assert_error_envelope(get_foreign.json())

        ans_foreign = await client.post(
            f"/api/lessons/{foreign_id}/answer",
            json={
                "exercise_id": 1,
                "position": 0,
                "answer": {"option_id": "a"},
            },
        )
        assert ans_foreign.status_code == 404

        complete_foreign = await client.post(f"/api/lessons/{foreign_id}/complete")
        assert complete_foreign.status_code == 404


# ---------------------------------------------------------------------------
# 8. Concurrency acceptance
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
class TestConcurrencyAcceptance:
    async def test_concurrent_completion_one_success(
        self, acceptance_env: AcceptanceEnv
    ):
        client = acceptance_env.client
        env = acceptance_env

        me = (await client.get("/api/user/me")).json()
        xp_before = me["stats"]["total_xp"]

        start = await client.post("/api/skills/3/start")
        data = start.json()
        attempt_id = data["attempt_id"]
        await env.answer_all(attempt_id, data["exercises"])

        async def do_complete() -> tuple[int, str]:
            resp = await client.post(f"/api/lessons/{attempt_id}/complete")
            if resp.status_code == 200:
                return 200, "ok"
            return resp.status_code, resp.json().get("error", {}).get("code", "")

        results = await asyncio.gather(do_complete(), do_complete())
        statuses = [r[0] for r in results]
        codes = [r[1] for r in results]
        assert statuses.count(200) == 1
        assert "ATTEMPT_ALREADY_COMPLETED" in codes

        me_after = (await client.get("/api/user/me")).json()
        delta = me_after["stats"]["total_xp"] - xp_before
        assert delta in (10, 15)

    async def test_concurrent_timed_starts_one_active(
        self, acceptance_env: AcceptanceEnv
    ):
        client = acceptance_env.client
        env = acceptance_env
        skill_id = 3

        async def do_start() -> int:
            resp = await client.post(f"/api/skills/{skill_id}/start-timed")
            assert resp.status_code in (200, 201), resp.text
            return resp.json()["attempt_id"]

        ids = await asyncio.gather(do_start(), do_start())
        async with env.session_factory() as session:
            maya = (
                await session.execute(
                    select(User).where(User.username == "maya_demo")
                )
            ).scalar_one()
            active = (
                await session.execute(
                    select(LessonAttempt)
                    .join(Lesson, LessonAttempt.lesson_id == Lesson.id)
                    .where(
                        LessonAttempt.user_id == maya.id,
                        Lesson.skill_id == skill_id,
                        LessonAttempt.status == "in_progress",
                        LessonAttempt.mode == "timed",
                    )
                )
            ).scalars().all()
            assert len(active) == 1
            assert all(i == active[0].id for i in ids)


# ---------------------------------------------------------------------------
# 9. Naming and OpenAPI
# ---------------------------------------------------------------------------


class TestNamingAndOpenAPI:
    @pytest.mark.asyncio
    async def test_openapi_title_paths_and_no_lingopath_leak(
        self, acceptance_env: AcceptanceEnv
    ):
        client = acceptance_env.client
        openapi = await client.get("/api/openapi.json")
        assert openapi.status_code == 200
        doc = openapi.json()
        assert doc["info"]["title"] == "LingoQuest API"
        assert "LingoPath" not in json.dumps(doc)

        paths = doc["paths"]
        for path in (
            "/api/course",
            "/api/skills/{skill_id}",
            "/api/skills/{skill_id}/start",
            "/api/skills/{skill_id}/start-timed",
            "/api/lessons/{attempt_id}",
            "/api/lessons/{attempt_id}/answer",
            "/api/lessons/{attempt_id}/complete",
            "/api/hearts/status",
            "/api/hearts/refill",
            "/api/user/me",
            "/api/leaderboard",
            "/api/achievements",
            "/api/admin/content/tree",
            "/api/admin/exercises",
            "/api/admin/exercises/{exercise_id}",
            "/api/debug/clock",
        ):
            assert path in paths, path

        schemas = doc.get("components", {}).get("schemas", {})
        for name in (
            "LessonAttemptResponse",
            "PublicExercise",
            "CourseResponse",
            "SkillDetailResponse",
            "ProfileResponse",
        ):
            if name not in schemas:
                continue
            props = schemas[name].get("properties", {})
            assert "correct_answer" not in props

        course = await client.get("/api/course")
        assert "LingoPath" not in course.text
        start = await client.post("/api/skills/3/start")
        assert "LingoPath" not in start.text
        for e in start.json()["exercises"]:
            assert "correct_answer" not in e

    def test_developer_database_untouched(self):
        if _DEV_DB_BEFORE is None:
            pytest.skip("Developer lingopath.db not present")
        assert DEV_DB_PATH.exists()
        st = DEV_DB_PATH.stat()
        assert (st.st_size, st.st_mtime) == _DEV_DB_BEFORE
