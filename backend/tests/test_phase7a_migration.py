"""Phase 7A forward-migration conformance checks."""
from __future__ import annotations

import os
import subprocess
import sys
from pathlib import Path

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


class TestPhase7AMigration:
    def test_upgrade_from_phase6b_preserves_rows_and_adds_fk(self, tmp_path):
        db_path = tmp_path / "from_6b.db"
        _run_alembic(db_path, "upgrade", "b7e3c91f2a04")

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
                        hearts, max_hearts, gems, daily_goal_xp, is_content_admin,
                        active_course_id
                    ) VALUES (
                        'pre7a', 'Pre7A', 10, 1, 1, 5, 5, 0, 20, 0, 1
                    )
                    """
                )
            )
            # Orphan that must be cleared before FK enforcement
            conn.execute(
                text(
                    """
                    INSERT INTO users (
                        username, display_name, total_xp, current_streak, longest_streak,
                        hearts, max_hearts, gems, daily_goal_xp, is_content_admin,
                        active_course_id
                    ) VALUES (
                        'orphan', 'Orphan', 0, 0, 0, 5, 5, 0, 20, 0, 999
                    )
                    """
                )
            )

        _run_alembic(db_path, "upgrade", "head")

        with engine.connect() as conn:
            conn.execute(text("PRAGMA foreign_keys=ON"))
            rev = conn.execute(text("SELECT version_num FROM alembic_version")).scalar()
            assert rev == "c8a1f4e2b9d0"

            linked = conn.execute(
                text("SELECT active_course_id FROM users WHERE username = 'pre7a'")
            ).scalar()
            assert linked == 1

            orphan = conn.execute(
                text("SELECT active_course_id FROM users WHERE username = 'orphan'")
            ).scalar()
            assert orphan is None

            user_fks = conn.execute(text("PRAGMA foreign_key_list(users)")).fetchall()
            assert any(
                row[2] == "courses" and row[3] == "active_course_id" for row in user_fks
            )

            indexes = {
                row[1] for row in conn.execute(text("PRAGMA index_list(users)")).fetchall()
            }
            assert "ix_users_leaderboard" in indexes

            assert conn.execute(text("PRAGMA foreign_key_check")).fetchall() == []
            assert conn.execute(text("SELECT COUNT(*) FROM users")).scalar() == 2
