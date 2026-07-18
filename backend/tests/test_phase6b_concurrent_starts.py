"""Phase 6B concurrent timed-start race test using separate sessions."""
from __future__ import annotations

import asyncio
from datetime import datetime, timezone

import pytest
from sqlalchemy import event, select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.clock import DebugClock, RealClock, set_clock
from app.core.database import Base
from app.models.progress import LessonAttempt
from app.models.user import User
from app.seed.seed_data import seed_achievements, seed_course_content, seed_users_and_history
from app.services import lesson_engine


async def _maya(session: AsyncSession) -> User:
    return (
        await session.execute(select(User).where(User.username == "maya_demo"))
    ).scalar_one()


@pytest.mark.asyncio
class TestConcurrentTimedStarts:
    async def test_concurrent_timed_starts_keep_one_attempt(self, tmp_path):
        """
        Prove that truly concurrent timed starts using separate sessions
        result in exactly one surviving attempt per user-skill pair.
        
        This verifies the service-level race cleanup in start_timed_practice
        works correctly even without a database unique constraint.
        """
        db_path = tmp_path / "concurrent_starts.db"
        engine = create_async_engine(
            f"sqlite+aiosqlite:///{db_path.as_posix()}",
            echo=False,
        )

        @event.listens_for(engine.sync_engine, "connect")
        def set_sqlite_pragma(dbapi_conn, connection_record):
            cursor = dbapi_conn.cursor()
            cursor.execute("PRAGMA foreign_keys=ON")
            cursor.close()

        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

        SessionLocal = async_sessionmaker(
            engine, class_=AsyncSession, expire_on_commit=False
        )

        clock = DebugClock()
        clock.set_time(datetime(2026, 7, 18, 12, 0, tzinfo=timezone.utc))
        set_clock(clock)

        try:
            # Seed the database
            async with SessionLocal() as session:
                from datetime import date

                reference_date = date(2026, 7, 18)
                reference_now = datetime.combine(
                    reference_date, datetime.min.time()
                ).replace(tzinfo=timezone.utc)
                entities = await seed_course_content(session)
                achievements = await seed_achievements(session)
                await seed_users_and_history(
                    session,
                    entities["course"],
                    entities["skills"],
                    entities["lessons"],
                    achievements,
                    reference_date,
                    reference_now,
                )
                await session.commit()

            # Concurrent start function using separate sessions
            async def do_timed_start(skill_id: int) -> tuple[int, bool]:
                """Returns (attempt_id, resumed) from start."""
                async with SessionLocal() as session:
                    maya = await _maya(session)
                    response, resumed = await lesson_engine.start_timed_practice(
                        session, maya, skill_id
                    )
                    await session.commit()
                    return response.attempt_id, resumed

            # Launch two concurrent timed starts for the same user and skill
            results = await asyncio.gather(
                do_timed_start(3),
                do_timed_start(3),
            )

            attempt_ids = [r[0] for r in results]
            resumed_flags = [r[1] for r in results]

            # At least one should succeed as new (resumed=False)
            # and at least one should see it as existing (resumed=True)
            # OR both could see the same attempt if race resolution works perfectly
            assert False in resumed_flags, "At least one start should be new"
            
            # Verify only one in-progress attempt exists for this user-skill
            async with SessionLocal() as session:
                maya = await _maya(session)
                attempts = (
                    await session.execute(
                        select(LessonAttempt)
                        .join(
                            lesson_engine.Lesson,
                            LessonAttempt.lesson_id == lesson_engine.Lesson.id,
                        )
                        .where(
                            LessonAttempt.user_id == maya.id,
                            lesson_engine.Lesson.skill_id == 3,
                            LessonAttempt.status == "in_progress",
                        )
                    )
                ).scalars().all()

                # Exactly one in-progress attempt should exist
                assert len(attempts) == 1, (
                    f"Expected exactly 1 in-progress attempt, found {len(attempts)}"
                )

                # Both returned attempt IDs should match the surviving one
                survivor_id = attempts[0].id
                assert all(
                    aid == survivor_id for aid in attempt_ids
                ), f"All returned IDs should match survivor {survivor_id}, got {attempt_ids}"

                # Verify it's a valid timed attempt
                assert attempts[0].mode == "timed"
                assert attempts[0].expires_at is not None

        finally:
            set_clock(RealClock())
            await engine.dispose()
