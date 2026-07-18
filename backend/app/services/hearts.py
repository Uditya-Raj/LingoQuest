"""Hearts service for regeneration and refill logic."""
from datetime import datetime, timedelta, timezone
from typing import Optional

from app.models.user import User
from app.core.clock import Clock


# Constants
HEART_REGEN_MINUTES = 15


def ensure_utc_aware(dt: datetime) -> datetime:
    """Ensure datetime is timezone-aware in UTC."""
    if dt.tzinfo is None:
        # Assume naive datetime is UTC
        return dt.replace(tzinfo=timezone.utc)
    return dt


def apply_lazy_regeneration(user: User, now: datetime) -> None:
    """
    Apply lazy heart regeneration based on elapsed time.
    
    Rules:
    - If hearts are full, ensure anchor is None.
    - If anchor is None but hearts are not full, set anchor to now.
    - Calculate full regeneration intervals elapsed.
    - Regenerate hearts up to max, capping at max_hearts.
    - Advance anchor by consumed intervals to preserve remainder.
    - Clear anchor when reaching max_hearts.
    
    Args:
        user: User model with hearts state
        now: Current UTC datetime from the injected clock
    """
    # Ensure now is timezone-aware
    now = ensure_utc_aware(now)
    
    # If already at max, ensure anchor is cleared
    if user.hearts >= user.max_hearts:
        user.hearts = user.max_hearts
        user.heart_regen_anchor_at = None
        return
    
    # If missing hearts but no anchor, establish it
    if user.heart_regen_anchor_at is None:
        user.heart_regen_anchor_at = now
        return
    
    # Ensure anchor is timezone-aware
    anchor = ensure_utc_aware(user.heart_regen_anchor_at)
    
    # Calculate elapsed time
    elapsed = now - anchor
    interval = timedelta(minutes=HEART_REGEN_MINUTES)
    
    # Calculate full intervals completed
    if elapsed < interval:
        # No full interval yet
        return
    
    intervals_completed = int(elapsed.total_seconds() // interval.total_seconds())
    
    if intervals_completed <= 0:
        return
    
    # Regenerate hearts
    missing_hearts = user.max_hearts - user.hearts
    regenerated = min(intervals_completed, missing_hearts)
    user.hearts += regenerated
    
    # Update or clear anchor
    if user.hearts >= user.max_hearts:
        user.hearts = user.max_hearts
        user.heart_regen_anchor_at = None
    else:
        # Advance anchor by consumed intervals to preserve remainder
        new_anchor = anchor + regenerated * interval
        user.heart_regen_anchor_at = new_anchor


def calculate_next_heart_at(user: User) -> Optional[datetime]:
    """
    Calculate when the next heart will regenerate.
    
    Returns None if hearts are full or anchor is not set.
    """
    if user.hearts >= user.max_hearts:
        return None
    
    if user.heart_regen_anchor_at is None:
        return None
    
    anchor = ensure_utc_aware(user.heart_regen_anchor_at)
    interval = timedelta(minutes=HEART_REGEN_MINUTES)
    return anchor + interval


def calculate_seconds_until_next(user: User, now: datetime) -> Optional[int]:
    """
    Calculate seconds until next heart regeneration.
    
    Returns None if hearts are full.
    """
    next_heart_at = calculate_next_heart_at(user)
    
    if next_heart_at is None:
        return None
    
    now = ensure_utc_aware(now)
    seconds = max(0, int((next_heart_at - now).total_seconds()))
    return seconds


def lose_heart(user: User, now: datetime) -> None:
    """
    Deduct exactly one heart after lazy regeneration has already been applied.

    Floors at zero. Sets the regen anchor when losing from a full set or when
    no anchor exists. Does not reset an existing anchor on further losses.
    """
    now = ensure_utc_aware(now)

    if user.hearts <= 0:
        # Defensive: an in-progress standard answer should not reach this state.
        user.hearts = 0
        return

    was_full = user.hearts == user.max_hearts
    user.hearts -= 1

    if was_full or user.heart_regen_anchor_at is None:
        user.heart_regen_anchor_at = now

