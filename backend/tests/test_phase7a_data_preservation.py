"""Phase 7A data-preservation regression for populated ca24 → head upgrades.

Guarantees that repairing b7e3c91f2a04 (additive ALTER TABLE ADD COLUMN) preserves
all seeded exercise_answers when foreign-key enforcement is ON.
"""
from __future__ import annotations

import os
import sqlite3
import subprocess
import sys
from pathlib import Path

import pytest
from sqlalchemy import create_engine, text

BACKEND_ROOT = Path(__file__).resolve().parents[1]


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
            "2026-07-18",
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


def _sync_engine(db_path: Path):
    return create_engine(f"sqlite:///{db_path.as_posix()}")


def _copy_ca24_compatible(src_path: Path, dst_path: Path) -> None:
    """Copy seeded HEAD data into a ca24 schema DB (omit Phase 6B columns)."""
    dst = sqlite3.connect(dst_path.as_posix())
    dst.execute("PRAGMA foreign_keys=ON")
    attached = src_path.as_posix().replace("'", "''")
    dst.execute(f"ATTACH DATABASE '{attached}' AS src")

    tables_cols: dict[str, list[str] | None] = {
        "courses": None,
        "units": None,
        "skills": None,
        "lessons": None,
        "exercises": [
            "id",
            "lesson_id",
            "order_index",
            "type",
            "prompt",
            "audio_url",
            "options",
            "correct_answer",
            "metadata",
            "is_active",
            "created_at",
            "updated_at",
        ],
        "achievements": None,
        "users": None,
        "lesson_attempts": [
            "id",
            "user_id",
            "lesson_id",
            "started_at",
            "completed_at",
            "activity_date",
            "status",
            "exercise_order",
            "current_index",
            "mistakes_count",
            "hearts_lost",
            "xp_earned",
        ],
        "exercise_answers": None,
        "user_skill_progress": None,
        "user_achievements": None,
    }

    for table, cols in tables_cols.items():
        if cols is None:
            cols = [row[1] for row in dst.execute(f"PRAGMA table_info({table})").fetchall()]
        col_list = ", ".join(cols)
        dst.execute(
            f"INSERT INTO main.{table} ({col_list}) SELECT {col_list} FROM src.{table}"
        )

    dst.commit()
    dst.close()


def _snapshot(conn) -> dict:
    """Record representative rows and aggregates for post-upgrade equality checks."""
    attempts = conn.execute(
        text(
            """
            SELECT id, user_id, lesson_id, status, exercise_order, current_index,
                   mistakes_count, hearts_lost, xp_earned, activity_date
            FROM lesson_attempts
            ORDER BY id
            """
        )
    ).fetchall()
    answers = conn.execute(
        text(
            """
            SELECT id, lesson_attempt_id, exercise_id, position, exercise_type,
                   submitted_answer, correct_answer_snapshot, is_correct
            FROM exercise_answers
            ORDER BY id
            """
        )
    ).fetchall()
    progress = conn.execute(
        text(
            """
            SELECT id, user_id, skill_id, crowns, times_practiced
            FROM user_skill_progress
            ORDER BY id
            """
        )
    ).fetchall()
    achievements = conn.execute(
        text(
            """
            SELECT id, user_id, achievement_id, earned_at
            FROM user_achievements
            ORDER BY id
            """
        )
    ).fetchall()
    users = conn.execute(
        text(
            """
            SELECT id, username, total_xp, current_streak, longest_streak, hearts, gems
            FROM users
            ORDER BY id
            """
        )
    ).fetchall()
    # Representative slices for readable failure messages
    sample_attempt_ids = [row[0] for row in attempts[:5]]
    sample_answers = [
        row
        for row in answers
        if row[1] in sample_attempt_ids
    ]
    return {
        "attempt_count": len(attempts),
        "answer_count": len(answers),
        "progress_count": len(progress),
        "achievement_count": len(achievements),
        "attempts": attempts,
        "answers": answers,
        "progress": progress,
        "achievements": achievements,
        "users": users,
        "sample_answers": sample_answers,
        "xp_sum": sum(u[2] for u in users),
    }


class TestPhase7APopulatedCa24UpgradePreservesAnswers:
    def test_populated_ca24_upgrades_to_head_preserving_all_answers(self, tmp_path):
        """Mandatory regression: 142 attempts / 1,420 answers survive ca24 → head."""
        head_seed = tmp_path / "head_seed.db"
        ca24 = tmp_path / "ca24_populated.db"

        # Build complete seeded history at head, then project onto ca24 schema.
        _run_alembic(head_seed, "upgrade", "head")
        _run_seed(head_seed)

        with _sync_engine(head_seed).connect() as conn:
            assert conn.execute(text("SELECT COUNT(*) FROM lesson_attempts")).scalar() == 142
            assert conn.execute(text("SELECT COUNT(*) FROM exercise_answers")).scalar() == 1420

        _run_alembic(ca24, "upgrade", "ca24b65a41a3")
        _copy_ca24_compatible(head_seed, ca24)

        engine = _sync_engine(ca24)
        with engine.connect() as conn:
            conn.execute(text("PRAGMA foreign_keys=ON"))
            before = _snapshot(conn)
            assert before["attempt_count"] == 142
            assert before["answer_count"] == 1420
            assert before["progress_count"] == 25
            assert before["achievement_count"] == 22
            # ca24 has no mode/tts columns yet
            attempt_cols = {
                row[1] for row in conn.execute(text("PRAGMA table_info(lesson_attempts)"))
            }
            assert "mode" not in attempt_cols
            exercise_cols = {
                row[1] for row in conn.execute(text("PRAGMA table_info(exercises)"))
            }
            assert "tts_text" not in exercise_cols

        # Real migration chain with FK enforcement (application default).
        _run_alembic(ca24, "upgrade", "head")

        with engine.connect() as conn:
            conn.execute(text("PRAGMA foreign_keys=ON"))
            rev = conn.execute(text("SELECT version_num FROM alembic_version")).scalar()
            assert rev == "c8a1f4e2b9d0"

            after = _snapshot(conn)
            assert after["answer_count"] == 1420
            assert after["attempt_count"] == 142
            assert after["progress_count"] == before["progress_count"]
            assert after["achievement_count"] == before["achievement_count"]
            assert after["xp_sum"] == before["xp_sum"]

            # Relationship/value equality for core history (pre-6B columns).
            assert after["attempts"] == before["attempts"]
            assert after["answers"] == before["answers"]
            assert after["progress"] == before["progress"]
            assert after["users"] == before["users"]
            # earned_at may be timezone-normalized; compare without relying on string form
            assert [
                (r[0], r[1], r[2]) for r in after["achievements"]
            ] == [
                (r[0], r[1], r[2]) for r in before["achievements"]
            ]

            modes = conn.execute(
                text("SELECT DISTINCT mode FROM lesson_attempts")
            ).fetchall()
            assert modes == [("standard",)]
            null_modes = conn.execute(
                text("SELECT COUNT(*) FROM lesson_attempts WHERE mode IS NULL")
            ).scalar()
            assert null_modes == 0

            attempt_cols = {
                row[1] for row in conn.execute(text("PRAGMA table_info(lesson_attempts)"))
            }
            assert {"mode", "expires_at", "failure_reason"} <= attempt_cols
            exercise_cols = {
                row[1] for row in conn.execute(text("PRAGMA table_info(exercises)"))
            }
            assert {"tts_text", "tts_lang"} <= exercise_cols

            assert conn.execute(text("PRAGMA foreign_key_check")).fetchall() == []
            fk_on = conn.execute(text("PRAGMA foreign_keys")).scalar()
            assert fk_on == 1

        # New CHECK constraints reject invalid values (separate connections).
        with pytest.raises(Exception):
            with engine.begin() as bad:
                bad.execute(text("PRAGMA foreign_keys=ON"))
                bad.execute(
                    text(
                        """
                        INSERT INTO lesson_attempts (
                            user_id, lesson_id, status, mode, exercise_order,
                            current_index, mistakes_count, hearts_lost
                        ) VALUES (1, 1, 'in_progress', 'legendary', '[1]', 0, 0, 0)
                        """
                    )
                )

        with pytest.raises(Exception):
            with engine.begin() as bad:
                bad.execute(text("PRAGMA foreign_keys=ON"))
                bad.execute(
                    text(
                        """
                        INSERT INTO lesson_attempts (
                            user_id, lesson_id, status, mode, failure_reason,
                            exercise_order, current_index, mistakes_count, hearts_lost
                        ) VALUES (
                            1, 1, 'failed', 'standard', 'other', '[1]', 0, 0, 0
                        )
                        """
                    )
                )

        # TTS columns are writable after upgrade.
        with engine.begin() as write_conn:
            write_conn.execute(text("PRAGMA foreign_keys=ON"))
            write_conn.execute(
                text(
                    """
                    UPDATE exercises
                    SET tts_text = 'hola', tts_lang = 'es-ES'
                    WHERE id = (SELECT MIN(id) FROM exercises)
                    """
                )
            )
            row = write_conn.execute(
                text(
                    """
                    SELECT tts_text, tts_lang FROM exercises
                    WHERE id = (SELECT MIN(id) FROM exercises)
                    """
                )
            ).fetchone()
            assert row == ("hola", "es-ES")
