"""Logical clock abstraction for testable time-dependent behavior."""
from datetime import datetime, timezone, date, timedelta
from typing import Protocol


class Clock(Protocol):
    """Protocol for clock implementations."""

    def now(self) -> datetime:
        """Return current UTC datetime."""
        ...

    def logical_date(self) -> date:
        """Return current logical game date."""
        ...


class RealClock:
    """Production clock using system time."""

    def now(self) -> datetime:
        """Return current system time in UTC."""
        return datetime.now(timezone.utc)

    def logical_date(self) -> date:
        """Return current system date."""
        return datetime.now(timezone.utc).date()


class DebugClock:
    """Debug clock with day offset and optional frozen time for testing."""

    def __init__(self) -> None:
        self._frozen_time: datetime | None = None
        self._offset_days: int = 0

    @property
    def offset_days(self) -> int:
        return self._offset_days

    def now(self) -> datetime:
        """Return frozen time if set, otherwise system time plus day offset."""
        if self._frozen_time is not None:
            return self._frozen_time
        return datetime.now(timezone.utc) + timedelta(days=self._offset_days)

    def logical_date(self) -> date:
        """Return logical date from now()."""
        return self.now().date()

    def set_time(self, dt: datetime) -> None:
        """Set absolute frozen time for testing (clears day offset)."""
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        self._frozen_time = dt
        self._offset_days = 0

    def advance_days(self, days: int) -> None:
        """Advance the logical clock by whole days without changing OS time."""
        if self._frozen_time is not None:
            self._frozen_time = self._frozen_time + timedelta(days=days)
        self._offset_days += days

    def reset(self) -> None:
        """Clear freeze and offset; resume real system time."""
        self._frozen_time = None
        self._offset_days = 0


# Global clock instance
_clock: Clock = RealClock()


def get_clock() -> Clock:
    """Get the current clock instance."""
    return _clock


def set_clock(clock: Clock) -> None:
    """Set the clock instance (for testing/debug)."""
    global _clock
    _clock = clock
