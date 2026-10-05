"""
Tests for candidate endpoints.
"""

import pytest
from httpx import AsyncClient


class TestCandidateProfile:
    """Tests for candidate profile management."""

    @pytest.mark.asyncio
    async def test_get_candidate_profile(self, client: AsyncClient, auth_headers, test_candidate):
        """Test getting candidate profile."""
        response = await client.get("/api/candidates/me", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["full_name"] == test_candidate.full_name
        assert data["email"] == "test@example.com"

    @pytest.mark.asyncio
    async def test_update_candidate_profile(self, client: AsyncClient, auth_headers, test_candidate):
        """Test updating candidate profile."""
        response = await client.put(
            "/api/candidates/me",
            json={
                "full_name": "Updated Name",
                "bio": "Updated bio",
                "location": "San Francisco",
            },
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["full_name"] == "Updated Name"
        assert data["bio"] == "Updated bio"

    @pytest.mark.asyncio
    async def test_update_candidate_profile_unauthorized(self, client: AsyncClient):
        """Test updating profile without authentication."""
        response = await client.put(
            "/api/candidates/me",
            json={"full_name": "Hacked Name"}
        )
        assert response.status_code == 403


class TestCandidateSkills:
    """Tests for candidate skill management."""

    @pytest.mark.asyncio
    async def test_add_skill_to_profile(self, client: AsyncClient, auth_headers, test_candidate):
        """Test adding a skill to profile."""
        response = await client.post(
            "/api/candidates/me/skills",
            json={
                "skill_name": "Python",
                "proficiency_level": 4,
                "years_of_experience": 3.5,
                "is_primary": True,
            },
            headers=auth_headers
        )
        assert response.status_code == 201
        data = response.json()
        assert data["skill_name"] == "Python"
        assert data["proficiency_level"] == 4

    @pytest.mark.asyncio
    async def test_add_duplicate_skill(self, client: AsyncClient, auth_headers, test_candidate, test_skill, db_session):
        """Test adding duplicate skill fails."""
        from app.database.models.skill import CandidateSkill

        # Add skill first
        cs = CandidateSkill(
            candidate_id=test_candidate.id,
            skill_id=test_skill.id,
        )
        db_session.add(cs)
        await db_session.commit()

        # Try to add same skill again
        response = await client.post(
            "/api/candidates/me/skills",
            json={"skill_name": "Python"},
            headers=auth_headers
        )
        assert response.status_code == 409

    @pytest.mark.asyncio
    async def test_remove_skill_from_profile(self, client: AsyncClient, auth_headers, test_candidate, test_skill, db_session):
        """Test removing a skill from profile."""
        from app.database.models.skill import CandidateSkill

        # Add skill first
        cs = CandidateSkill(
            candidate_id=test_candidate.id,
            skill_id=test_skill.id,
        )
        db_session.add(cs)
        await db_session.commit()
        await db_session.refresh(cs)

        response = await client.delete(
            f"/api/candidates/me/skills/{cs.id}",
            headers=auth_headers
        )
        assert response.status_code == 204


class TestCandidateListing:
    """Tests for candidate listing (recruiter only)."""

    @pytest.mark.asyncio
    async def test_list_candidates_as_recruiter(self, client: AsyncClient, recruiter_auth_headers, test_candidate):
        """Test listing candidates as recruiter."""
        response = await client.get("/api/candidates", headers=recruiter_auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data["candidates"], list)
        assert data["total"] >= 1

    @pytest.mark.asyncio
    async def test_list_candidates_with_search(self, client: AsyncClient, recruiter_auth_headers, test_candidate):
        """Test searching candidates."""
        response = await client.get(
            f"/api/candidates?search={test_candidate.full_name}",
            headers=recruiter_auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["total"] >= 1

    @pytest.mark.asyncio
    async def test_list_candidates_as_candidate_forbidden(self, client: AsyncClient, auth_headers):
        """Test that candidates cannot list other candidates."""
        response = await client.get("/api/candidates", headers=auth_headers)
        assert response.status_code == 403

    @pytest.mark.asyncio
    async def test_get_candidate_detail_as_recruiter(self, client: AsyncClient, recruiter_auth_headers, test_candidate):
        """Test getting candidate details as recruiter."""
        response = await client.get(
            f"/api/candidates/{test_candidate.id}",
            headers=recruiter_auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == test_candidate.id
