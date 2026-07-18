"""Logical clock abstraction for testable time-dependent behavior."""
from datetime import datetime, timezone, date
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
    """Debug clock with settable time for testing."""
    
    def __init__(self):
        self._frozen_time: datetime | None = None
    
    def now(self) -> datetime:
        """Return frozen time if set, otherwise system time."""
        if self._frozen_time is not None:
            return self._frozen_time
        return datetime.now(timezone.utc)
    
    def logical_date(self) -> date:
        """Return logical date from frozen time or system time."""
        return self.now().date()
    
    def set_time(self, dt: datetime) -> None:
        """Set frozen time for testing."""
        self._frozen_time = dt.replace(tzinfo=timezone.utc)
    
    def reset(self) -> None:
        """Reset to system time."""
        self._frozen_time = None


# Global clock instance
_clock: Clock = RealClock()


def get_clock() -> Clock:
    """Get the current clock instance."""
    return _clock


def set_clock(clock: Clock) -> None:
    """Set the clock instance (for testing/debug)."""
    global _clock
    _clock = clock
