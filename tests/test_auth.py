"""
Tests for authentication endpoints.
"""

import pytest
from httpx import AsyncClient

from app.core.security import verify_password, decode_access_token


class TestAuthRegistration:
    """Tests for user registration."""

    @pytest.mark.asyncio
    async def test_register_candidate_success(self, client: AsyncClient):
        """Test successful candidate registration."""
        response = await client.post(
            "/api/auth/register",
            json={
                "email": "newcandidate@example.com",
                "password": "securepassword123",
                "role": "candidate",
                "full_name": "New Candidate",
            }
        )
        assert response.status_code == 201
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert data["user"]["email"] == "newcandidate@example.com"
        assert data["user"]["role"] == "candidate"

    @pytest.mark.asyncio
    async def test_register_recruiter_success(self, client: AsyncClient):
        """Test successful recruiter registration."""
        response = await client.post(
            "/api/auth/register",
            json={
                "email": "newrecruiter@example.com",
                "password": "securepassword123",
                "role": "recruiter",
                "full_name": "New Recruiter",
                "company_name": "Tech Corp",
            }
        )
        assert response.status_code == 201
        data = response.json()
        assert data["user"]["role"] == "recruiter"

    @pytest.mark.asyncio
    async def test_register_duplicate_email(self, client: AsyncClient, test_user):
        """Test registration with duplicate email."""
        response = await client.post(
            "/api/auth/register",
            json={
                "email": test_user.email,
                "password": "anotherpassword",
                "role": "candidate",
                "full_name": "Another User",
            }
        )
        assert response.status_code == 409

    @pytest.mark.asyncio
    async def test_register_invalid_role(self, client: AsyncClient):
        """Test registration with invalid role."""
        response = await client.post(
            "/api/auth/register",
            json={
                "email": "user@example.com",
                "password": "password123",
                "role": "admin",
                "full_name": "Admin User",
            }
        )
        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_register_short_password(self, client: AsyncClient):
        """Test registration with short password."""
        response = await client.post(
            "/api/auth/register",
            json={
                "email": "user@example.com",
                "password": "short",
                "role": "candidate",
                "full_name": "Test User",
            }
        )
        assert response.status_code == 422


class TestAuthLogin:
    """Tests for user login."""

    @pytest.mark.asyncio
    async def test_login_success(self, client: AsyncClient, test_user):
        """Test successful login."""
        response = await client.post(
            "/api/auth/login",
            json={
                "email": test_user.email,
                "password": "testpassword123",
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["user"]["email"] == test_user.email

    @pytest.mark.asyncio
    async def test_login_wrong_password(self, client: AsyncClient, test_user):
        """Test login with wrong password."""
        response = await client.post(
            "/api/auth/login",
            json={
                "email": test_user.email,
                "password": "wrongpassword",
            }
        )
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_login_nonexistent_user(self, client: AsyncClient):
        """Test login with nonexistent user."""
        response = await client.post(
            "/api/auth/login",
            json={
                "email": "nonexistent@example.com",
                "password": "password123",
            }
        )
        assert response.status_code == 401


class TestAuthMe:
    """Tests for current user endpoint."""

    @pytest.mark.asyncio
    async def test_get_current_user_success(self, client: AsyncClient, auth_headers):
        """Test getting current user profile."""
        response = await client.get("/api/auth/me", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "user" in data
        assert data["user"]["email"] == "test@example.com"

    @pytest.mark.asyncio
    async def test_get_current_user_unauthorized(self, client: AsyncClient):
        """Test getting current user without token."""
        response = await client.get("/api/auth/me")
        assert response.status_code == 403

    @pytest.mark.asyncio
    async def test_get_current_user_invalid_token(self, client: AsyncClient):
        """Test getting current user with invalid token."""
        response = await client.get(
            "/api/auth/me",
            headers={"Authorization": "Bearer invalid_token"}
        )
        assert response.status_code == 401


class TestPasswordSecurity:
    """Tests for password security."""

    def test_password_hashing(self):
        """Test password hashing works correctly."""
        password = "testpassword123"
        from app.core.security import hash_password, verify_password

        hashed = hash_password(password)
        assert hashed != password
        assert verify_password(password, hashed)
        assert not verify_password("wrongpassword", hashed)

    def test_jwt_token_creation(self):
        """Test JWT token creation and validation."""
        from app.core.security import create_access_token, decode_access_token

        token = create_access_token(data={"sub": "1", "role": "candidate"})
        assert token is not None

        payload = decode_access_token(token)
        assert payload is not None
        assert payload["sub"] == "1"
        assert payload["role"] == "candidate"
