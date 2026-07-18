"""Leaderboard response schemas."""
from pydantic import BaseModel, Field


class LeaderboardEntry(BaseModel):
    """Single ranked leaderboard row."""

    rank: int
    user_id: int
    display_name: str
    total_xp: int
    current_streak: int
    is_current_user: bool


class LeaderboardResponse(BaseModel):
    """GET /api/leaderboard response."""

    ranking_basis: str = "total_xp"
    entries: list[LeaderboardEntry]
    current_user: LeaderboardEntry
