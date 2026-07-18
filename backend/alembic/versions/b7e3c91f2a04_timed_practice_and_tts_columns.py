"""timed practice and TTS columns

Revision ID: b7e3c91f2a04
Revises: ca24b65a41a3
Create Date: 2026-07-18 20:00:00.000000

Forward migration for Phase 6B:
- lesson_attempts.mode / expires_at / failure_reason
- exercises.tts_text / tts_lang

Existing attempts backfill to mode=standard. Existing failed standard attempts
receive failure_reason=out_of_hearts when null (historical zero-heart failures).

PRE-RELEASE MIGRATION REPAIR (Phase 7A correction):
This revision previously used op.batch_alter_table(), which on SQLite rebuilds the
table. With foreign keys enabled, dropping lesson_attempts CASCADE-deleted all
exercise_answers. The implementation below uses native ALTER TABLE ADD COLUMN so
a populated ca24 database can upgrade with zero data loss. Same revision ID and
down_revision retained; repository is pre-release with no external production DBs.
A later forward migration cannot restore answers already deleted by the old body.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "b7e3c91f2a04"
down_revision: Union[str, None] = "ca24b65a41a3"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    # Match application FK enforcement. Native ADD COLUMN does not rebuild tables,
    # so ON DELETE CASCADE children are not wiped.
    conn.execute(sa.text("PRAGMA foreign_keys=ON"))

    # Additive columns only — do not use batch_alter_table (table rebuild + CASCADE).
    conn.execute(sa.text("ALTER TABLE exercises ADD COLUMN tts_text TEXT"))
    conn.execute(sa.text("ALTER TABLE exercises ADD COLUMN tts_lang TEXT"))

    conn.execute(
        sa.text(
            """
            ALTER TABLE lesson_attempts
            ADD COLUMN mode VARCHAR NOT NULL DEFAULT 'standard'
            CONSTRAINT ck_lesson_attempts_mode_valid
            CHECK (mode IN ('standard', 'timed'))
            """
        )
    )
    conn.execute(
        sa.text("ALTER TABLE lesson_attempts ADD COLUMN expires_at DATETIME")
    )
    conn.execute(
        sa.text(
            """
            ALTER TABLE lesson_attempts
            ADD COLUMN failure_reason VARCHAR
            CONSTRAINT ck_lesson_attempts_failure_reason_valid
            CHECK (
                failure_reason IS NULL
                OR failure_reason IN ('out_of_hearts', 'time_expired')
            )
            """
        )
    )

    # Explicit backfill for safety on engines that do not apply DEFAULT to rows.
    conn.execute(
        sa.text("UPDATE lesson_attempts SET mode = 'standard' WHERE mode IS NULL")
    )
    conn.execute(
        sa.text(
            """
            UPDATE lesson_attempts
            SET failure_reason = 'out_of_hearts'
            WHERE status = 'failed'
              AND failure_reason IS NULL
              AND mode = 'standard'
            """
        )
    )


def downgrade() -> None:
    conn = op.get_bind()
    # SQLite DROP COLUMN rewrites the table; disable FKs so CASCADE cannot wipe
    # exercise_answers during the rewrite.
    conn.execute(sa.text("PRAGMA foreign_keys=OFF"))

    conn.execute(sa.text("ALTER TABLE lesson_attempts DROP COLUMN failure_reason"))
    conn.execute(sa.text("ALTER TABLE lesson_attempts DROP COLUMN expires_at"))
    conn.execute(sa.text("ALTER TABLE lesson_attempts DROP COLUMN mode"))
    conn.execute(sa.text("ALTER TABLE exercises DROP COLUMN tts_lang"))
    conn.execute(sa.text("ALTER TABLE exercises DROP COLUMN tts_text"))

    conn.execute(sa.text("PRAGMA foreign_keys=ON"))
