"""Phase 6B forward-migration checks."""
from __future__ import annotations

import os
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


def _sync_engine(db_path: Path):
    return create_engine(f"sqlite:///{db_path.as_posix()}")


class TestPhase6BMigration:
    def test_empty_database_upgrades_to_head(self, tmp_path):
        db_path = tmp_path / "empty.db"
        _run_alembic(db_path, "upgrade", "head")

        engine = _sync_engine(db_path)
        with engine.connect() as conn:
            conn.execute(text("PRAGMA foreign_keys=ON"))
            rev = conn.execute(text("SELECT version_num FROM alembic_version")).scalar()
            assert rev == "b7e3c91f2a04"

            cols = {
                row[1]
                for row in conn.execute(text("PRAGMA table_info(lesson_attempts)")).fetchall()
            }
            assert {"mode", "expires_at", "failure_reason"} <= cols

            ex_cols = {
                row[1]
                for row in conn.execute(text("PRAGMA table_info(exercises)")).fetchall()
            }
            assert {"tts_text", "tts_lang"} <= ex_cols

            fk = conn.execute(text("PRAGMA foreign_key_check")).fetchall()
            assert fk == []

    def test_existing_attempts_backfill_standard_and_out_of_hearts(self, tmp_path):
        db_path = tmp_path / "backfill.db"
        _run_alembic(db_path, "upgrade", "ca24b65a41a3")

        engine = _sync_engine(db_path)
        with engine.begin() as conn:
            conn.execute(text("PRAGMA foreign_keys=ON"))
            conn.execute(
                text(
                    """
                    INSERT INTO courses (language_code, from_language_code, title, icon)
                    VALUES ('es', 'en', 'Spanish', 'spanish-course')
                    """
                )
            )
            conn.execute(
                text(
                    """
                    INSERT INTO users (
                        username, display_name, total_xp, current_streak, longest_streak,
                        hearts, max_hearts, gems, daily_goal_xp, is_content_admin
                    ) VALUES (
                        'mig_user', 'Mig', 0, 0, 0, 5, 5, 0, 20, 0
                    )
                    """
                )
            )
            conn.execute(
                text(
                    """
                    INSERT INTO units (course_id, order_index, title, description, color_theme)
                    VALUES (1, 0, 'U', 'd', 'meadow')
                    """
                )
            )
            conn.execute(
                text(
                    """
                    INSERT INTO skills (
                        unit_id, order_index, title, description, icon, max_level
                    ) VALUES (1, 0, 'G', 'd', 'wave', 5)
                    """
                )
            )
            conn.execute(
                text(
                    "INSERT INTO lessons (skill_id, order_index, xp_reward) VALUES (1, 0, 10)"
                )
            )
            conn.execute(
                text(
                    """
                    INSERT INTO lesson_attempts (
                        user_id, lesson_id, status, exercise_order,
                        current_index, mistakes_count, hearts_lost
                    ) VALUES
                    (1, 1, 'in_progress', '[1]', 0, 0, 0),
                    (1, 1, 'failed', '[1]', 1, 1, 1),
                    (1, 1, 'completed', '[1]', 1, 0, 0)
                    """
                )
            )

        _run_alembic(db_path, "upgrade", "head")

        with engine.connect() as conn:
            rows = conn.execute(
                text(
                    "SELECT status, mode, failure_reason FROM lesson_attempts ORDER BY id"
                )
            ).fetchall()
            assert len(rows) == 3
            assert all(r[1] == "standard" for r in rows)
            by_status = {r[0]: r[2] for r in rows}
            assert by_status["failed"] == "out_of_hearts"
            assert by_status["in_progress"] is None
            assert by_status["completed"] is None

            fk = conn.execute(text("PRAGMA foreign_key_check")).fetchall()
            assert fk == []

    def test_constraints_reject_invalid_mode_and_failure_reason(self, tmp_path):
        db_path = tmp_path / "constraints.db"
        _run_alembic(db_path, "upgrade", "head")

        engine = _sync_engine(db_path)
        with engine.begin() as conn:
            conn.execute(text("PRAGMA foreign_keys=ON"))
            conn.execute(
                text(
                    """
                    INSERT INTO courses (language_code, from_language_code, title, icon)
                    VALUES ('es', 'en', 'Spanish', 'spanish-course')
                    """
                )
            )
            conn.execute(
                text(
                    """
                    INSERT INTO users (
                        username, display_name, total_xp, current_streak, longest_streak,
                        hearts, max_hearts, gems, daily_goal_xp, is_content_admin
                    ) VALUES (
                        'mig_user2', 'Mig2', 0, 0, 0, 5, 5, 0, 20, 0
                    )
                    """
                )
            )
            conn.execute(
                text(
                    """
                    INSERT INTO units (course_id, order_index, title, description, color_theme)
                    VALUES (1, 0, 'U', 'd', 'meadow')
                    """
                )
            )
            conn.execute(
                text(
                    """
                    INSERT INTO skills (
                        unit_id, order_index, title, description, icon, max_level
                    ) VALUES (1, 0, 'G', 'd', 'wave', 5)
                    """
                )
            )
            conn.execute(
                text(
                    "INSERT INTO lessons (skill_id, order_index, xp_reward) VALUES (1, 0, 10)"
                )
            )

        with engine.begin() as conn:
            conn.execute(text("PRAGMA foreign_keys=ON"))
            with pytest.raises(Exception):
                conn.execute(
                    text(
                        """
                        INSERT INTO lesson_attempts (
                            user_id, lesson_id, status, mode, exercise_order,
                            current_index, mistakes_count, hearts_lost
                        ) VALUES (1, 1, 'in_progress', 'legendary', '[1]', 0, 0, 0)
                        """
                    )
                )

        with engine.begin() as conn:
            conn.execute(text("PRAGMA foreign_keys=ON"))
            with pytest.raises(Exception):
                conn.execute(
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

    def test_seeded_database_forward_upgrade_preserves_counts(self, tmp_path):
        db_path = tmp_path / "seeded_upgrade.db"
        _run_alembic(db_path, "upgrade", "ca24b65a41a3")

        engine = _sync_engine(db_path)
        with engine.begin() as conn:
            conn.execute(text("PRAGMA foreign_keys=ON"))
            conn.execute(
                text(
                    """
                    INSERT INTO courses (language_code, from_language_code, title, icon)
                    VALUES ('es', 'en', 'Spanish', 'spanish-course')
                    """
                )
            )
            conn.execute(
                text(
                    """
                    INSERT INTO users (
                        username, display_name, total_xp, current_streak, longest_streak,
                        hearts, max_hearts, gems, daily_goal_xp, is_content_admin
                    ) VALUES (
                        'seed_mig', 'Seed', 100, 1, 1, 4, 5, 50, 20, 1
                    )
                    """
                )
            )
            conn.execute(
                text(
                    """
                    INSERT INTO units (course_id, order_index, title, description, color_theme)
                    VALUES (1, 0, 'U', 'd', 'meadow')
                    """
                )
            )
            conn.execute(
                text(
                    """
                    INSERT INTO skills (
                        unit_id, order_index, title, description, icon, max_level
                    ) VALUES (1, 0, 'G', 'd', 'wave', 5)
                    """
                )
            )
            conn.execute(
                text(
                    "INSERT INTO lessons (skill_id, order_index, xp_reward) VALUES (1, 0, 10)"
                )
            )
            conn.execute(
                text(
                    """
                    INSERT INTO exercises (
                        lesson_id, order_index, type, prompt, options, correct_answer,
                        is_active
                    ) VALUES (
                        1, 0, 'multiple_choice', 'Hola',
                        '[{"id":"a","text":"Hi"}]', '{"option_id":"a"}', 1
                    )
                    """
                )
            )
            for _ in range(5):
                conn.execute(
                    text(
                        """
                        INSERT INTO lesson_attempts (
                            user_id, lesson_id, status, exercise_order,
                            current_index, mistakes_count, hearts_lost, xp_earned
                        ) VALUES (1, 1, 'completed', '[1]', 1, 0, 0, 10)
                        """
                    )
                )

        with engine.connect() as conn:
            before = conn.execute(text("SELECT COUNT(*) FROM lesson_attempts")).scalar()
            assert before == 5

        _run_alembic(db_path, "upgrade", "head")

        with engine.connect() as conn:
            after = conn.execute(text("SELECT COUNT(*) FROM lesson_attempts")).scalar()
            assert after == before
            modes = conn.execute(
                text("SELECT DISTINCT mode FROM lesson_attempts")
            ).fetchall()
            assert modes == [("standard",)]
            tts_null = conn.execute(
                text("SELECT tts_text, tts_lang FROM exercises WHERE id = 1")
            ).fetchone()
            assert tts_null == (None, None)
            fk = conn.execute(text("PRAGMA foreign_key_check")).fetchall()
            assert fk == []
