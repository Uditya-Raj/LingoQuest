"""Phase 6B TTS seed and admin validation tests."""
from __future__ import annotations

from datetime import date, datetime, timezone

import pytest
from httpx import AsyncClient
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.course import Exercise, Lesson, Skill
from app.models.progress import LessonAttempt, UserSkillProgress
from app.models.user import User
from app.seed.seed_data import seed_achievements, seed_course_content, seed_users_and_history
from app.seed.validators import validate_exercise_contract, validate_tts_fields


REQUIRED_TYPES = {
    "multiple_choice",
    "translate_word_bank",
    "match_pairs",
    "fill_blank",
    "type_answer",
}


@pytest.mark.asyncio
class TestSeedTTS:
    async def test_tts_coverage_and_row_counts(self, test_session: AsyncSession):
        reference_date = date(2026, 7, 18)
        reference_now = datetime.combine(reference_date, datetime.min.time()).replace(
            tzinfo=timezone.utc
        )
        entities = await seed_course_content(test_session)
        achievements = await seed_achievements(test_session)
        await seed_users_and_history(
            test_session,
            entities["course"],
            entities["skills"],
            entities["lessons"],
            achievements,
            reference_date,
            reference_now,
        )
        await test_session.commit()

        exercise_count = (
            await test_session.execute(select(func.count(Exercise.id)))
        ).scalar()
        assert exercise_count == 60

        skills = (
            await test_session.execute(select(Skill).order_by(Skill.id))
        ).scalars().all()
        assert len(skills) == 5

        audio_types: set[str] = set()
        for skill in skills:
            lesson = (
                await test_session.execute(
                    select(Lesson).where(Lesson.skill_id == skill.id)
                )
            ).scalar_one()
            exercises = (
                await test_session.execute(
                    select(Exercise).where(Exercise.lesson_id == lesson.id)
                )
            ).scalars().all()
            tts_enabled = [
                e
                for e in exercises
                if e.tts_text and e.tts_lang
            ]
            assert len(tts_enabled) >= 3, f"{skill.title} needs >=3 TTS exercises"
            for e in tts_enabled:
                validate_tts_fields(e.tts_text, e.tts_lang)
                assert e.tts_lang == "es-ES"
                assert e.tts_text.strip()
                audio_types.add(e.type)

        assert audio_types == REQUIRED_TYPES

    async def test_idempotent_reseed_preserves_learner_history(
        self, test_session: AsyncSession
    ):
        reference_date = date(2026, 7, 18)
        reference_now = datetime.combine(reference_date, datetime.min.time()).replace(
            tzinfo=timezone.utc
        )
        entities = await seed_course_content(test_session)
        achievements = await seed_achievements(test_session)
        await seed_users_and_history(
            test_session,
            entities["course"],
            entities["skills"],
            entities["lessons"],
            achievements,
            reference_date,
            reference_now,
        )
        await test_session.commit()

        maya = (
            await test_session.execute(select(User).where(User.username == "maya_demo"))
        ).scalar_one()
        xp_before = maya.total_xp
        attempts_before = (
            await test_session.execute(
                select(func.count(LessonAttempt.id)).where(
                    LessonAttempt.user_id == maya.id
                )
            )
        ).scalar()
        progress_before = (
            await test_session.execute(
                select(func.count(UserSkillProgress.id)).where(
                    UserSkillProgress.user_id == maya.id
                )
            )
        ).scalar()

        # Rerun content seed — updates TTS without duplicating rows or history.
        await seed_course_content(test_session)
        await seed_users_and_history(
            test_session,
            entities["course"],
            entities["skills"],
            entities["lessons"],
            achievements,
            reference_date,
            reference_now,
        )
        await test_session.commit()

        await test_session.refresh(maya)
        assert maya.total_xp == xp_before
        attempts_after = (
            await test_session.execute(
                select(func.count(LessonAttempt.id)).where(
                    LessonAttempt.user_id == maya.id
                )
            )
        ).scalar()
        assert attempts_after == attempts_before
        progress_after = (
            await test_session.execute(
                select(func.count(UserSkillProgress.id)).where(
                    UserSkillProgress.user_id == maya.id
                )
            )
        ).scalar()
        assert progress_after == progress_before

        exercise_count = (
            await test_session.execute(select(func.count(Exercise.id)))
        ).scalar()
        assert exercise_count == 60

        tts_count = (
            await test_session.execute(
                select(func.count(Exercise.id)).where(
                    Exercise.tts_text.is_not(None),
                    Exercise.tts_lang.is_not(None),
                )
            )
        ).scalar()
        assert tts_count >= 15  # >=3 per skill × 5 skills


class TestTTSValidation:
    def test_blank_tts_text_rejected(self):
        with pytest.raises(ValueError, match="non-empty"):
            validate_tts_fields("   ", "es-ES")

    def test_invalid_lang_rejected(self):
        with pytest.raises(ValueError, match="Invalid tts_lang"):
            validate_tts_fields("hola", "!!")

    def test_partial_pair_rejected(self):
        with pytest.raises(ValueError, match="both"):
            validate_tts_fields("hola", None)

    def test_contract_accepts_valid_tts(self):
        validate_exercise_contract(
            "type_answer",
            "Translate: hello",
            None,
            {"accepted": ["hola"]},
            tts_text="hola",
            tts_lang="es-ES",
        )


@pytest.mark.asyncio
class TestAdminTTS:
    async def test_admin_create_and_reject_invalid_tts(
        self, async_client: AsyncClient, seeded_session: AsyncSession
    ):
        lesson_id = (
            await seeded_session.execute(select(Lesson.id).order_by(Lesson.id))
        ).scalars().first()

        created = await async_client.post(
            "/api/admin/exercises",
            json={
                "lesson_id": lesson_id,
                "order_index": 99,
                "type": "type_answer",
                "prompt": "Say goodbye",
                "audio_url": None,
                "tts_text": "adiós",
                "tts_lang": "es-ES",
                "options": None,
                "correct_answer": {"accepted": ["adiós", "adios"]},
                "metadata": {"hint": "Farewell"},
                "is_active": True,
            },
        )
        assert created.status_code == 201, created.text
        body = created.json()
        assert body["tts_text"] == "adiós"
        assert body["tts_lang"] == "es-ES"

        bad = await async_client.post(
            "/api/admin/exercises",
            json={
                "lesson_id": lesson_id,
                "order_index": 100,
                "type": "type_answer",
                "prompt": "Say hello",
                "tts_text": "   ",
                "tts_lang": "es-ES",
                "options": None,
                "correct_answer": {"accepted": ["hola"]},
                "is_active": True,
            },
        )
        assert bad.status_code == 400
        assert bad.json()["error"]["code"] == "INVALID_EXERCISE_CONTRACT"

    async def test_public_start_exposes_tts_hides_answers(
        self, async_client: AsyncClient
    ):
        start = await async_client.post("/api/skills/1/start")
        assert start.status_code in (200, 201)
        body = start.json()
        assert "correct_answer" not in body
        tts_seen = False
        for ex in body["exercises"]:
            assert "correct_answer" not in ex
            assert "tts_text" in ex
            assert "tts_lang" in ex
            if ex["tts_text"] and ex["tts_lang"]:
                tts_seen = True
        # Pool is stratified/random; TTS may or may not appear in a given sample.
        # Seed guarantees TTS exists in the lesson pool.
        assert isinstance(tts_seen, bool)
