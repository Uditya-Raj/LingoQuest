"""Logical-date streak transitions."""
from __future__ import annotations

from datetime import date, timedelta

from app.core.errors import ConflictError
from app.models.user import User


def apply_streak(user: User, today: date) -> bool:
    """
    Update streak for a successful completion on ``today``.

    Returns whether this completion created a new active streak day
    (``extended_today``).

    Raises ConflictError(CLOCK_BEFORE_ACTIVITY) when stored last_activity_date
    is after the logical today (debug clock moved backwards).
    """
    previous = user.last_activity_date

    if previous is not None and previous > today:
        raise ConflictError(
            "Logical clock is before the learner's last activity date",
            code="CLOCK_BEFORE_ACTIVITY",
            details={
                "last_activity_date": previous.isoformat(),
                "logical_today": today.isoformat(),
            },
        )

    if previous is None:
        user.current_streak = 1
        extended_today = True
    elif previous == today:
        extended_today = False
    elif previous == today - timedelta(days=1):
        user.current_streak += 1
        extended_today = True
    else:
        user.current_streak = 1
        extended_today = True

    user.last_activity_date = today
    user.longest_streak = max(user.longest_streak, user.current_streak)
    return extended_today
