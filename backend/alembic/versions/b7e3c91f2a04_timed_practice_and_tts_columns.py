"""timed practice and TTS columns

Revision ID: b7e3c91f2a04
Revises: ca24b65a41a3
Create Date: 2026-07-18 20:00:00.000000

Forward migration for Phase 6B:
- lesson_attempts.mode / expires_at / failure_reason
- exercises.tts_text / tts_lang

Existing attempts backfill to mode=standard. Existing failed standard attempts
receive failure_reason=out_of_hearts when null (historical zero-heart failures).
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "b7e3c91f2a04"
down_revision: Union[str, None] = "ca24b65a41a3"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table("exercises", schema=None) as batch_op:
        batch_op.add_column(sa.Column("tts_text", sa.Text(), nullable=True))
        batch_op.add_column(sa.Column("tts_lang", sa.Text(), nullable=True))

    with op.batch_alter_table("lesson_attempts", schema=None) as batch_op:
        batch_op.add_column(
            sa.Column(
                "mode",
                sa.String(),
                nullable=False,
                server_default="standard",
            )
        )
        batch_op.add_column(
            sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True)
        )
        batch_op.add_column(sa.Column("failure_reason", sa.String(), nullable=True))
        batch_op.create_check_constraint(
            "ck_lesson_attempts_mode_valid",
            "mode IN ('standard', 'timed')",
        )
        batch_op.create_check_constraint(
            "ck_lesson_attempts_failure_reason_valid",
            "failure_reason IS NULL OR failure_reason IN ('out_of_hearts', 'time_expired')",
        )

    # Explicit backfill for safety on engines that do not apply server_default to rows.
    op.execute(
        sa.text("UPDATE lesson_attempts SET mode = 'standard' WHERE mode IS NULL")
    )
    op.execute(
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
    with op.batch_alter_table("lesson_attempts", schema=None) as batch_op:
        batch_op.drop_constraint("ck_lesson_attempts_failure_reason_valid", type_="check")
        batch_op.drop_constraint("ck_lesson_attempts_mode_valid", type_="check")
        batch_op.drop_column("failure_reason")
        batch_op.drop_column("expires_at")
        batch_op.drop_column("mode")

    with op.batch_alter_table("exercises", schema=None) as batch_op:
        batch_op.drop_column("tts_lang")
        batch_op.drop_column("tts_text")
