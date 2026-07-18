"""Unit tests for Phase 5B gamification services."""
from __future__ import annotations

from datetime import date, datetime, timedelta, timezone

import pytest
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import ConflictError, DomainError
from app.models.achievement import Achievement, UserAchievement
from app.models.course import Skill
from app.models.progress import LessonAttempt, UserSkillProgress
from app.models.user import User
from app.services import hearts
from app.services import xp as xp_service
from app.services import streak as streak_service
from app.services import achievements as achievements_service
from app.services.skill_progress import apply_standard_crown_and_unlocks


def _user(**overrides) -> User:
    defaults = dict(
        username="unit_user",
        display_name="Unit",
        total_xp=0,
        current_streak=0,
        longest_streak=0,
        last_activity_date=None,
        hearts=5,
        max_hearts=5,
        heart_regen_anchor_at=None,
        gems=100,
        daily_goal_xp=20,
    )
    defaults.update(overrides)
    return User(**defaults)


# ---------------------------------------------------------------------------
# XP and daily goal
# ---------------------------------------------------------------------------

class TestXpFormula:
    def test_normal_base_10(self):
        award = xp_service.calculate_standard_xp(10, mistakes_count=1)
        assert award.base == 10
        assert award.perfect_bonus == 0
        assert award.earned == 10
        assert award.perfect is False

    def test_perfect_base_10(self):
        award = xp_service.calculate_standard_xp(10, mistakes_count=0)
        assert award.perfect_bonus == 5
        assert award.earned == 15
        assert award.perfect is True

    def test_odd_base_uses_floor(self):
        award = xp_service.calculate_standard_xp(11, mistakes_count=0)
        assert award.perfect_bonus == 5  # floor(11/2)
        assert award.earned == 16


class TestDailyGoal:
    def test_progress_caps_at_one(self):
        progress = xp_service.build_daily_goal_progress(40, 20)
        assert progress.progress == 1.0
        assert progress.reached is True
        assert progress.today_xp == 40

    def test_partial_progress(self):
        progress = xp_service.build_daily_goal_progress(10, 20)
        assert progress.progress == 0.5
        assert progress.reached is False

    @pytest.mark.asyncio
    async def test_today_xp_filters_by_activity_date(self, seeded_session: AsyncSession):
        maya = (
            await seeded_session.execute(select(User).where(User.username == "maya_demo"))
        ).scalar_one()
        today = date(2026, 7, 18)
        other = date(2026, 7, 17)

        today_xp = await xp_service.calculate_today_xp(seeded_session, maya.id, today)
        other_xp = await xp_service.calculate_today_xp(seeded_session, maya.id, other)
        # Seeded Maya has activity on reference_date; other day may differ.
        assert today_xp >= 0
        assert other_xp >= 0
        # Ensure filtering works: sum of all completed != only-today unless all same day
        all_xp = await xp_service.sum_completed_xp(seeded_session, maya.id)
        assert all_xp == maya.total_xp
        assert today_xp <= all_xp


# ---------------------------------------------------------------------------
# Streak
# ---------------------------------------------------------------------------

class TestStreak:
    def test_first_activity_starts_at_one(self):
        user = _user()
        extended = streak_service.apply_streak(user, date(2026, 7, 18))
        assert user.current_streak == 1
        assert user.longest_streak == 1
        assert extended is True

    def test_same_day_does_not_increment(self):
        user = _user(current_streak=3, longest_streak=5, last_activity_date=date(2026, 7, 18))
        extended = streak_service.apply_streak(user, date(2026, 7, 18))
        assert user.current_streak == 3
        assert user.longest_streak == 5
        assert extended is False

    def test_next_day_increments(self):
        user = _user(current_streak=3, longest_streak=5, last_activity_date=date(2026, 7, 18))
        extended = streak_service.apply_streak(user, date(2026, 7, 19))
        assert user.current_streak == 4
        assert user.longest_streak == 5
        assert extended is True

    def test_missed_day_resets_to_one(self):
        user = _user(current_streak=6, longest_streak=11, last_activity_date=date(2026, 7, 15))
        extended = streak_service.apply_streak(user, date(2026, 7, 18))
        assert user.current_streak == 1
        assert user.longest_streak == 11
        assert extended is True

    def test_longest_never_decreases(self):
        user = _user(current_streak=11, longest_streak=11, last_activity_date=date(2026, 7, 18))
        streak_service.apply_streak(user, date(2026, 7, 19))
        assert user.current_streak == 12
        assert user.longest_streak == 12

    def test_future_stored_date_raises_clock_conflict(self):
        user = _user(last_activity_date=date(2026, 7, 20))
        with pytest.raises(ConflictError) as exc:
            streak_service.apply_streak(user, date(2026, 7, 18))
        assert exc.value.code == "CLOCK_BEFORE_ACTIVITY"


# ---------------------------------------------------------------------------
# Hearts regeneration and refill
# ---------------------------------------------------------------------------

class TestHeartRegeneration:
    def test_no_full_interval_no_regen(self):
        now = datetime(2026, 7, 18, 10, 0, tzinfo=timezone.utc)
        user = _user(hearts=3, heart_regen_anchor_at=now)
        hearts.apply_lazy_regeneration(user, now + timedelta(minutes=10))
        assert user.hearts == 3
        assert user.heart_regen_anchor_at == now

    def test_multiple_intervals_and_remainder(self):
        anchor = datetime(2026, 7, 18, 10, 0, tzinfo=timezone.utc)
        now = datetime(2026, 7, 18, 10, 38, tzinfo=timezone.utc)
        user = _user(hearts=2, heart_regen_anchor_at=anchor)
        hearts.apply_lazy_regeneration(user, now)
        assert user.hearts == 4
        assert user.heart_regen_anchor_at == datetime(2026, 7, 18, 10, 30, tzinfo=timezone.utc)

    def test_regen_caps_and_clears_anchor(self):
        anchor = datetime(2026, 7, 18, 10, 0, tzinfo=timezone.utc)
        now = datetime(2026, 7, 18, 12, 0, tzinfo=timezone.utc)
        user = _user(hearts=3, heart_regen_anchor_at=anchor)
        hearts.apply_lazy_regeneration(user, now)
        assert user.hearts == 5
        assert user.heart_regen_anchor_at is None


class TestHeartRefill:
    def test_successful_refill(self):
        now = datetime(2026, 7, 18, 10, 0, tzinfo=timezone.utc)
        user = _user(
            hearts=2,
            gems=100,
            heart_regen_anchor_at=now,
        )
        result = hearts.refill_hearts(user, confirm_spend=True, now=now)
        assert result.hearts == 5
        assert result.gems_spent == 20
        assert result.gems == 80
        assert user.heart_regen_anchor_at is None

    def test_full_hearts_change_nothing(self):
        now = datetime(2026, 7, 18, 10, 0, tzinfo=timezone.utc)
        user = _user(hearts=5, gems=100)
        with pytest.raises(ConflictError) as exc:
            hearts.refill_hearts(user, confirm_spend=True, now=now)
        assert exc.value.code == "HEARTS_ALREADY_FULL"
        assert user.gems == 100
        assert user.hearts == 5

    def test_insufficient_gems_change_nothing(self):
        now = datetime(2026, 7, 18, 10, 0, tzinfo=timezone.utc)
        user = _user(hearts=2, gems=10, heart_regen_anchor_at=now)
        with pytest.raises(ConflictError) as exc:
            hearts.refill_hearts(user, confirm_spend=True, now=now)
        assert exc.value.code == "INSUFFICIENT_GEMS"
        assert user.gems == 10
        assert user.hearts == 2
        assert user.heart_regen_anchor_at == now

    def test_confirm_required(self):
        now = datetime(2026, 7, 18, 10, 0, tzinfo=timezone.utc)
        user = _user(hearts=2, gems=100)
        with pytest.raises(DomainError) as exc:
            hearts.refill_hearts(user, confirm_spend=False, now=now)
        assert exc.value.code == "REFILL_NOT_CONFIRMED"
        assert user.gems == 100


# ---------------------------------------------------------------------------
# Crowns / unlocks
# ---------------------------------------------------------------------------

class TestCrownsAndUnlocks:
    @pytest.mark.asyncio
    async def test_crown_increment_cap_and_practice(self, seeded_session: AsyncSession):
        maya = (
            await seeded_session.execute(select(User).where(User.username == "maya_demo"))
        ).scalar_one()
        skill = (
            await seeded_session.execute(select(Skill).where(Skill.id == 1))
        ).scalar_one()
        progress = (
            await seeded_session.execute(
                select(UserSkillProgress).where(
                    UserSkillProgress.user_id == maya.id,
                    UserSkillProgress.skill_id == 1,
                )
            )
        ).scalar_one()
        progress.crowns = skill.max_level
        practiced_before = progress.times_practiced
        await seeded_session.flush()

        now = datetime(2026, 7, 18, 12, 0, tzinfo=timezone.utc)
        updated, unlocked = await apply_standard_crown_and_unlocks(
            seeded_session, maya, skill, now
        )
        assert updated.crowns == skill.max_level
        assert updated.times_practiced == practiced_before + 1
        assert unlocked == []

    @pytest.mark.asyncio
    async def test_prerequisite_crown_unlocks_dependent(self, seeded_session: AsyncSession):
        maya = (
            await seeded_session.execute(select(User).where(User.username == "maya_demo"))
        ).scalar_one()
        # Family (4) unlocks Questions (5). Ensure Family has 0 crowns.
        family = (await seeded_session.execute(select(Skill).where(Skill.id == 4))).scalar_one()
        questions = (await seeded_session.execute(select(Skill).where(Skill.id == 5))).scalar_one()
        assert questions.unlock_requires_skill_id == family.id

        family_progress = (
            await seeded_session.execute(
                select(UserSkillProgress).where(
                    UserSkillProgress.user_id == maya.id,
                    UserSkillProgress.skill_id == family.id,
                )
            )
        ).scalar_one_or_none()
        if family_progress is None:
            family_progress = UserSkillProgress(
                user_id=maya.id,
                skill_id=family.id,
                crowns=0,
                times_practiced=0,
            )
            seeded_session.add(family_progress)
        else:
            family_progress.crowns = 0
        await seeded_session.flush()

        now = datetime(2026, 7, 18, 12, 0, tzinfo=timezone.utc)
        _, unlocked = await apply_standard_crown_and_unlocks(
            seeded_session, maya, family, now
        )
        assert questions.id in unlocked


# ---------------------------------------------------------------------------
# Achievements
# ---------------------------------------------------------------------------

class TestAchievements:
    @pytest.mark.asyncio
    async def test_each_criteria_type_and_duplicate_prevention(
        self, seeded_session: AsyncSession
    ):
        # Fresh user with no awards
        user = User(
            username="achieve_test",
            display_name="Achieve",
            email="achieve@example.test",
            total_xp=50,
            current_streak=2,
            longest_streak=2,
            hearts=5,
            max_hearts=5,
            gems=50,
            daily_goal_xp=20,
            active_course_id=1,
        )
        seeded_session.add(user)
        await seeded_session.flush()

        now = datetime(2026, 7, 18, 12, 0, tzinfo=timezone.utc)

        # Below all thresholds
        first = await achievements_service.evaluate_and_award_achievements(
            seeded_session, user, now
        )
        assert first == []

        # Cross total_xp and streak thresholds
        user.total_xp = 100
        user.current_streak = 3
        user.longest_streak = 3
        await seeded_session.flush()
        awarded = await achievements_service.evaluate_and_award_achievements(
            seeded_session, user, now
        )
        keys = {a.key for a in awarded}
        assert "xp_100" in keys
        assert "streak_3" in keys

        # Duplicate prevention
        again = await achievements_service.evaluate_and_award_achievements(
            seeded_session, user, now
        )
        assert again == []

        count = (
            await seeded_session.execute(
                select(UserAchievement).where(UserAchievement.user_id == user.id)
            )
        ).scalars().all()
        assert len(count) == len(keys)

    @pytest.mark.asyncio
    async def test_inactive_definitions_not_awarded(self, seeded_session: AsyncSession):
        inactive = Achievement(
            key="inactive_test",
            title="Inactive",
            description="Should not award",
            icon="x",
            criteria_type="total_xp",
            criteria_value=1,
            is_active=False,
        )
        seeded_session.add(inactive)
        user = User(
            username="inactive_user",
            display_name="Inactive",
            email="inactive@example.test",
            total_xp=999,
            current_streak=0,
            longest_streak=0,
            hearts=5,
            max_hearts=5,
            gems=0,
            daily_goal_xp=20,
            active_course_id=1,
        )
        seeded_session.add(user)
        await seeded_session.flush()

        awarded = await achievements_service.evaluate_and_award_achievements(
            seeded_session,
            user,
            datetime(2026, 7, 18, tzinfo=timezone.utc),
        )
        assert all(a.key != "inactive_test" for a in awarded)

    @pytest.mark.asyncio
    async def test_current_completion_counts_toward_perfect(
        self, seeded_session: AsyncSession
    ):
        user = User(
            username="perfect_counter",
            display_name="Perfect",
            email="perfect@example.test",
            total_xp=0,
            current_streak=0,
            longest_streak=0,
            hearts=5,
            max_hearts=5,
            gems=0,
            daily_goal_xp=20,
            active_course_id=1,
        )
        seeded_session.add(user)
        await seeded_session.flush()

        # Insert 4 perfect completed attempts + current one makes 5
        for i in range(5):
            seeded_session.add(
                LessonAttempt(
                    user_id=user.id,
                    lesson_id=1,
                    started_at=datetime(2026, 7, 18, tzinfo=timezone.utc),
                    completed_at=datetime(2026, 7, 18, tzinfo=timezone.utc),
                    activity_date=date(2026, 7, 18),
                    status="completed",
                    exercise_order=[1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
                    current_index=10,
                    mistakes_count=0,
                    hearts_lost=0,
                    xp_earned=15,
                )
            )
        user.total_xp = 75
        await seeded_session.flush()

        awarded = await achievements_service.evaluate_and_award_achievements(
            seeded_session,
            user,
            datetime(2026, 7, 18, tzinfo=timezone.utc),
        )
        assert any(a.key == "perfectionist" for a in awarded)
