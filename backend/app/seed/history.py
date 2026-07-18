"""User definitions and historical attempt generation."""
from datetime import datetime, date, timedelta
from typing import Any
import random


def get_users_definition() -> list[dict[str, Any]]:
    """Return five seeded users in leaderboard order."""
    return [
        {
            "username": "leo_demo",
            "display_name": "Leo",
            "email": "leo@example.test",
            "total_xp": 520,
            "current_streak": 8,
            "longest_streak": 10,
            "gems": 150,
            "daily_goal_xp": 20,
            "is_content_admin": False,
        },
        {
            "username": "asha_demo",
            "display_name": "Asha",
            "email": "asha@example.test",
            "total_xp": 410,
            "current_streak": 4,
            "longest_streak": 7,
            "gems": 120,
            "daily_goal_xp": 20,
            "is_content_admin": False,
        },
        {
            "username": "maya_demo",
            "display_name": "Maya",
            "email": "maya@example.test",
            "total_xp": 340,
            "current_streak": 6,
            "longest_streak": 11,
            "hearts": 4,
            "gems": 100,
            "daily_goal_xp": 20,
            "is_content_admin": True,
        },
        {
            "username": "noah_demo",
            "display_name": "Noah",
            "email": "noah@example.test",
            "total_xp": 290,
            "current_streak": 2,
            "longest_streak": 4,
            "gems": 80,
            "daily_goal_xp": 20,
            "is_content_admin": False,
        },
        {
            "username": "sofia_demo",
            "display_name": "Sofia",
            "email": "sofia@example.test",
            "total_xp": 150,
            "current_streak": 1,
            "longest_streak": 2,
            "gems": 50,
            "daily_goal_xp": 20,
            "is_content_admin": False,
        },
    ]


def generate_attempt_history(
    user_index: int,
    num_attempts: int,
    num_perfect: int,
    skill_distribution: list[tuple[int, int]],  # [(skill_index, count), ...]
    reference_date: date,
    streak_pattern: list[int],  # Day offsets for streak building
) -> list[dict[str, Any]]:
    """Generate completed attempts for a user.
    
    Args:
        user_index: User index (0-4)
        num_attempts: Total completed attempts
        num_perfect: Number of perfect (0 mistakes) attempts
        skill_distribution: How attempts are spread across skills
        reference_date: Reference date for today's activity
        streak_pattern: List of day offsets from reference_date for historical dates
    
    Returns:
        List of attempt recipes with dates and XP
    """
    attempts = []
    attempt_count = 0
    
    # Build attempt dates based on streak pattern
    attempt_dates = []
    for day_offset in streak_pattern:
        activity_date = reference_date - timedelta(days=abs(day_offset))
        attempt_dates.append(activity_date)
    
    # Ensure we have enough dates
    while len(attempt_dates) < num_attempts:
        # Fill remaining with evenly distributed dates
        last_date = attempt_dates[-1] if attempt_dates else reference_date
        attempt_dates.append(last_date)
    
    # Shuffle to mix perfect/non-perfect, but keep last date at end
    last_date = attempt_dates[-1]
    remaining_dates = attempt_dates[:-1]
    random.seed(user_index * 1000)  # Deterministic shuffle
    random.shuffle(remaining_dates)
    attempt_dates = remaining_dates + [last_date]
    
    # Distribute attempts across skills
    for skill_index, count in skill_distribution:
        for i in range(count):
            if attempt_count >= num_attempts:
                break
            
            is_perfect = attempt_count < num_perfect
            activity_date = attempt_dates[attempt_count]
            
            attempts.append({
                "skill_index": skill_index,
                "activity_date": activity_date,
                "xp_earned": 15 if is_perfect else 10,
                "mistakes_count": 0 if is_perfect else random.randint(1, 3),
            })
            
            attempt_count += 1
    
    return attempts


def get_maya_history(reference_date: date) -> dict[str, Any]:
    """Generate Maya's specific history with exact requirements."""
    # Maya: 29 attempts, 10 perfect
    # Greetings: 15 (5 crowns)
    # Basics: 12 (5 crowns)
    # Food: 2 (2 crowns)
    # Total: 340 XP = 29*10 + 10*5
    
    # Build streak pattern: 11-day streak (days -17 to -7), gap, then 6-day streak (days -5 to 0)
    streak_days = []
    
    # Earlier 11-day streak
    for i in range(11, 0, -1):
        streak_days.append(-17 - (11 - i))
    
    # Gap days (no activity on -6)
    
    # Current 6-day streak (ending on reference_date = day 0)
    for i in range(6, 0, -1):
        streak_days.append(-(i - 1))
    
    # Maya needs 29 attempts total
    while len(streak_days) < 29:
        # Pad with activity on the last few days of earlier streak
        streak_days.insert(11, streak_days[10] - 1)
    
    skill_distribution = [
        (0, 15),  # Greetings: 15 attempts
        (1, 12),  # Basics: 12 attempts
        (2, 2),   # Food: 2 attempts
    ]
    
    return {
        "attempts": generate_attempt_history(
            user_index=2,
            num_attempts=29,
            num_perfect=10,
            skill_distribution=skill_distribution,
            reference_date=reference_date,
            streak_pattern=streak_days,
        ),
        "current_streak": 6,
        "longest_streak": 11,
        "last_activity_date": reference_date,
        "hearts": 4,
        "heart_regen_anchor_minutes_ago": 7,
    }


def get_leo_history(reference_date: date) -> dict[str, Any]:
    """Generate Leo's history: 40 attempts, 24 perfect, 520 XP."""
    # Distribute across all 5 skills with more on earlier ones
    skill_distribution = [
        (0, 10),  # Greetings
        (1, 10),  # Basics
        (2, 8),   # Food
        (3, 7),   # Family
        (4, 5),   # Questions
    ]
    
    # 8-day current streak
    streak_days = list(range(-7, 1))
    
    # Fill remaining days in past
    while len(streak_days) < 40:
        last_offset = streak_days[0]
        streak_days.insert(0, last_offset - 1)
    
    return {
        "attempts": generate_attempt_history(
            user_index=0,
            num_attempts=40,
            num_perfect=24,
            skill_distribution=skill_distribution,
            reference_date=reference_date,
            streak_pattern=streak_days,
        ),
        "current_streak": 8,
        "longest_streak": 10,
    }


def get_asha_history(reference_date: date) -> dict[str, Any]:
    """Generate Asha's history: 35 attempts, 12 perfect, 410 XP."""
    skill_distribution = [
        (0, 10),  # Greetings
        (1, 10),  # Basics
        (2, 8),   # Food
        (3, 7),   # Family
        (4, 0),   # Questions (not started)
    ]
    
    # 4-day current streak
    streak_days = list(range(-3, 1))
    
    while len(streak_days) < 35:
        last_offset = streak_days[0]
        streak_days.insert(0, last_offset - 1)
    
    return {
        "attempts": generate_attempt_history(
            user_index=1,
            num_attempts=35,
            num_perfect=12,
            skill_distribution=skill_distribution,
            reference_date=reference_date,
            streak_pattern=streak_days,
        ),
        "current_streak": 4,
        "longest_streak": 7,
    }


def get_noah_history(reference_date: date) -> dict[str, Any]:
    """Generate Noah's history: 25 attempts, 8 perfect, 290 XP."""
    skill_distribution = [
        (0, 8),   # Greetings
        (1, 10),  # Basics
        (2, 7),   # Food
        (3, 0),   # Family (not started)
        (4, 0),   # Questions (not started)
    ]
    
    # 2-day current streak
    streak_days = list(range(-1, 1))
    
    while len(streak_days) < 25:
        last_offset = streak_days[0]
        streak_days.insert(0, last_offset - 1)
    
    return {
        "attempts": generate_attempt_history(
            user_index=3,
            num_attempts=25,
            num_perfect=8,
            skill_distribution=skill_distribution,
            reference_date=reference_date,
            streak_pattern=streak_days,
        ),
        "current_streak": 2,
        "longest_streak": 4,
    }


def get_sofia_history(reference_date: date) -> dict[str, Any]:
    """Generate Sofia's history: 13 attempts, 4 perfect, 150 XP."""
    skill_distribution = [
        (0, 8),   # Greetings
        (1, 5),   # Basics
        (2, 0),   # Food (not started)
        (3, 0),   # Family (not started)
        (4, 0),   # Questions (not started)
    ]
    
    # 1-day current streak (just today)
    streak_days = [0]
    
    while len(streak_days) < 13:
        last_offset = streak_days[0]
        streak_days.insert(0, last_offset - 1)
    
    return {
        "attempts": generate_attempt_history(
            user_index=4,
            num_attempts=13,
            num_perfect=4,
            skill_distribution=skill_distribution,
            reference_date=reference_date,
            streak_pattern=streak_days,
        ),
        "current_streak": 1,
        "longest_streak": 2,
    }
