"""
Basic API tests for HireMind AI.
Run with: pytest tests/test_api.py -v
"""

import pytest
from httpx import AsyncClient
from main import app


@pytest.mark.asyncio
async def test_root_endpoint():
    """Test root endpoint."""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "message" in data
    assert "HireMind" in data["message"]


@pytest.mark.asyncio
async def test_health_check():
    """Test health check endpoint."""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"


@pytest.mark.asyncio
async def test_register_recruiter():
    """Test recruiter registration."""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.post(
            "/api/auth/register/recruiter",
            json={
                "email": "test.recruiter@example.com",
                "password": "testpass123",
                "full_name": "Test Recruiter",
                "company_name": "Test Company",
                "designation": "HR Manager"
            }
        )
    assert response.status_code == 201
    data = response.json()
    assert "access_token" in data
    assert data["user"]["role"] == "recruiter"


@pytest.mark.asyncio
async def test_register_candidate():
    """Test candidate registration."""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.post(
            "/api/auth/register/candidate",
            json={
                "email": "test.candidate@example.com",
                "password": "testpass123",
                "full_name": "Test Candidate",
                "location": "New York"
            }
        )
    assert response.status_code == 201
    data = response.json()
    assert "access_token" in data
    assert data["user"]["role"] == "candidate"


@pytest.mark.asyncio
async def test_login():
    """Test login endpoint."""
    # First register a user
    async with AsyncClient(app=app, base_url="http://test") as client:
        await client.post(
            "/api/auth/register/candidate",
            json={
                "email": "login.test@example.com",
                "password": "testpass123",
                "full_name": "Login Test"
            }
        )

        # Then login
        response = await client.post(
            "/api/auth/login",
            json={
                "email": "login.test@example.com",
                "password": "testpass123"
            }
        )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "token_type" in data


@pytest.mark.asyncio
async def test_invalid_login():
    """Test login with invalid credentials."""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.post(
            "/api/auth/login",
            json={
                "email": "nonexistent@example.com",
                "password": "wrongpass"
            }
        )
    assert response.status_code == 401
