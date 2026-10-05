"""
Test configuration and fixtures for HireMind AI.
"""

import asyncio
from typing import AsyncGenerator, Generator

import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy import create_engine
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.database.base import Base
from app.database.models import User, Candidate, Recruiter, Job, Skill, Resume, Application
from app.core.security import hash_password, create_access_token


# Test database URL (in-memory SQLite for speed)
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"


@pytest.fixture(scope="session")
def event_loop() -> Generator:
    """Create event loop for async tests."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture(scope="function")
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    """Create a test database session."""
    # Create async engine with in-memory SQLite
    engine = create_async_engine(
        TEST_DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )

    # Create tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Create session
    async_session = async_sessionmaker(
        bind=engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )

    async with async_session() as session:
        yield session

    # Cleanup
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

    await engine.dispose()


@pytest_asyncio.fixture(scope="function")
async def client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """Create test client with database session."""
    from app.core.dependencies import get_db

    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test"
    ) as ac:
        yield ac

    app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def test_user(db_session: AsyncSession) -> User:
    """Create a test user."""
    user = User(
        email="test@example.com",
        password_hash=hash_password("testpassword123"),
        role="candidate",
        is_active=True,
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest_asyncio.fixture
async def test_recruiter_user(db_session: AsyncSession) -> User:
    """Create a test recruiter user."""
    user = User(
        email="recruiter@example.com",
        password_hash=hash_password("testpassword123"),
        role="recruiter",
        is_active=True,
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest_asyncio.fixture
async def test_candidate(db_session: AsyncSession, test_user: User) -> Candidate:
    """Create a test candidate profile."""
    candidate = Candidate(
        user_id=test_user.id,
        full_name="Test Candidate",
        phone="+1234567890",
        location="New York",
        bio="Test bio",
    )
    db_session.add(candidate)
    await db_session.commit()
    await db_session.refresh(candidate)
    return candidate


@pytest_asyncio.fixture
async def test_recruiter(db_session: AsyncSession, test_recruiter_user: User) -> Recruiter:
    """Create a test recruiter profile."""
    recruiter = Recruiter(
        user_id=test_recruiter_user.id,
        full_name="Test Recruiter",
        company_name="Test Company",
        phone="+0987654321",
        designation="HR Manager",
    )
    db_session.add(recruiter)
    await db_session.commit()
    await db_session.refresh(recruiter)
    return recruiter


@pytest_asyncio.fixture
async def test_job(db_session: AsyncSession, test_recruiter: Recruiter) -> Job:
    """Create a test job posting."""
    job = Job(
        recruiter_id=test_recruiter.id,
        title="Senior Python Developer",
        description="We are looking for a senior Python developer...",
        requirements="5+ years of Python experience",
        location="Remote",
        job_type="full-time",
        experience_level="senior",
        is_active=True,
    )
    db_session.add(job)
    await db_session.commit()
    await db_session.refresh(job)
    return job


@pytest_asyncio.fixture
async def test_skill(db_session: AsyncSession) -> Skill:
    """Create a test skill."""
    skill = Skill(
        name="Python",
        normalized_name="python",
        category="Programming Languages",
    )
    db_session.add(skill)
    await db_session.commit()
    await db_session.refresh(skill)
    return skill


@pytest_asyncio.fixture
def auth_headers(test_user: User) -> dict:
    """Create authorization headers for test user."""
    token = create_access_token(data={"sub": str(test_user.id), "role": test_user.role})
    return {"Authorization": f"Bearer {token}"}


@pytest_asyncio.fixture
def recruiter_auth_headers(test_recruiter_user: User) -> dict:
    """Create authorization headers for test recruiter."""
    token = create_access_token(data={"sub": str(test_recruiter_user.id), "role": test_recruiter_user.role})
    return {"Authorization": f"Bearer {token}"}
