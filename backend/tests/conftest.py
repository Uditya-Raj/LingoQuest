"""Test configuration and fixtures."""
import pytest
from httpx import AsyncClient, ASGITransport
from sqlalchemy import event
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.pool import StaticPool
from sqlalchemy.engine import Engine

from app.main import create_app
from app.core.database import Base, get_session
from app.seed.seed_data import seed_course_content, seed_achievements, seed_users_and_history
from datetime import date, datetime, timezone


@pytest.fixture
async def test_session():
    """Create an isolated test database session."""
    # Use in-memory SQLite for tests
    engine = create_async_engine(
        "sqlite+aiosqlite:///:memory:",
        poolclass=StaticPool,
        echo=False,
    )
    
    # Enable foreign key constraints for SQLite
    @event.listens_for(engine.sync_engine, "connect")
    def set_sqlite_pragma(dbapi_conn, connection_record):
        """Enable foreign key constraints for SQLite connections."""
        cursor = dbapi_conn.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()
    
    # Create tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    # Create test_session
    TestSessionLocal = async_sessionmaker(
        engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )
    
    async with TestSessionLocal() as test_session:
        yield test_session
    
    await engine.dispose()


@pytest.fixture
async def session(test_session):
    """Alias for test_session."""
    return test_session


@pytest.fixture
async def seeded_session(test_session):
    """Create a test session with seeded data."""
    # Seed everything
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
    
    return test_session


@pytest.fixture
async def test_client(test_session):
    """Create a test client with overridden database session."""
    app = create_app()
    
    async def override_get_session():
        yield test_session
    
    app.dependency_overrides[get_session] = override_get_session
    
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client
    
    app.dependency_overrides.clear()


@pytest.fixture
async def async_client(seeded_session):
    """Create a test client with seeded data."""
    app = create_app()
    
    async def override_get_session():
        yield seeded_session
    
    app.dependency_overrides[get_session] = override_get_session
    
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client
    
    app.dependency_overrides.clear()
