"""add users active_course_id FK and leaderboard index

Revision ID: c8a1f4e2b9d0
Revises: b7e3c91f2a04
Create Date: 2026-07-18 21:00:00.000000

Phase 7A forward migration:
- Add FK users.active_course_id -> courses.id ON DELETE SET NULL
- Add ix_users_leaderboard for deterministic total-XP ordering

SQLite batch rebuild of users requires PRAGMA foreign_keys=OFF so
ON DELETE CASCADE children (attempts/progress/achievements) are not wiped.
Does not rewrite ca24b65a41a3 or b7e3c91f2a04.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "c8a1f4e2b9d0"
down_revision: Union[str, None] = "b7e3c91f2a04"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    # Disable before any DML/DDL in this revision so the pragma takes effect.
    conn.execute(sa.text("PRAGMA foreign_keys=OFF"))

    # Clear orphaned active_course_id values before enforcing the FK.
    conn.execute(
        sa.text(
            """
            UPDATE users
            SET active_course_id = NULL
            WHERE active_course_id IS NOT NULL
              AND NOT EXISTS (
                  SELECT 1 FROM courses WHERE courses.id = users.active_course_id
              )
            """
        )
    )

    with op.batch_alter_table("users", schema=None) as batch_op:
        batch_op.create_foreign_key(
            "fk_users_active_course_id_courses",
            "courses",
            ["active_course_id"],
            ["id"],
            ondelete="SET NULL",
        )
        batch_op.create_index(
            "ix_users_leaderboard",
            ["total_xp", "username", "id"],
            unique=False,
        )

    conn.execute(sa.text("PRAGMA foreign_keys=ON"))


def downgrade() -> None:
    conn = op.get_bind()
    conn.execute(sa.text("PRAGMA foreign_keys=OFF"))

    with op.batch_alter_table("users", schema=None) as batch_op:
        batch_op.drop_index("ix_users_leaderboard")
        batch_op.drop_constraint(
            "fk_users_active_course_id_courses", type_="foreignkey"
        )

    conn.execute(sa.text("PRAGMA foreign_keys=ON"))
