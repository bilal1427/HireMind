"""
Tests for job endpoints.
"""

import pytest
from httpx import AsyncClient

from app.database.models import Job


class TestJobCreation:
    """Tests for job creation."""

    @pytest.mark.asyncio
    async def test_create_job_success(self, client: AsyncClient, recruiter_auth_headers):
        """Test successful job creation."""
        response = await client.post(
            "/api/jobs",
            json={
                "title": "Senior Backend Developer",
                "description": "We are looking for an experienced backend developer.",
                "requirements": "5+ years experience with Python",
                "location": "Remote",
                "job_type": "full-time",
                "experience_level": "senior",
            },
            headers=recruiter_auth_headers
        )
        assert response.status_code == 201
        data = response.json()
        assert data["title"] == "Senior Backend Developer"
        assert data["is_active"] == True

    @pytest.mark.asyncio
    async def test_create_job_with_skills(self, client: AsyncClient, recruiter_auth_headers):
        """Test job creation with skills."""
        response = await client.post(
            "/api/jobs",
            json={
                "title": "Full Stack Developer",
                "description": "Full stack position",
                "skills": [
                    {"skill_name": "Python", "is_required": True},
                    {"skill_name": "React", "is_required": True},
                ]
            },
            headers=recruiter_auth_headers
        )
        assert response.status_code == 201
        data = response.json()
        assert len(data["skills"]) == 2

    @pytest.mark.asyncio
    async def test_create_job_unauthorized(self, client: AsyncClient):
        """Test job creation without authentication."""
        response = await client.post(
            "/api/jobs",
            json={"title": "Test Job", "description": "Test"}
        )
        assert response.status_code == 403

    @pytest.mark.asyncio
    async def test_create_job_as_candidate(self, client: AsyncClient, auth_headers):
        """Test that candidates cannot create jobs."""
        response = await client.post(
            "/api/jobs",
            json={"title": "Test Job", "description": "Test"},
            headers=auth_headers
        )
        assert response.status_code == 403


class TestJobListing:
    """Tests for job listing."""

    @pytest.mark.asyncio
    async def test_list_jobs_public(self, client: AsyncClient, test_job):
        """Test public job listing."""
        response = await client.get("/api/jobs")
        assert response.status_code == 200
        data = response.json()
        assert len(data["jobs"]) >= 1
        assert data["total"] >= 1

    @pytest.mark.asyncio
    async def test_list_jobs_with_search(self, client: AsyncClient, test_job):
        """Test job listing with search."""
        response = await client.get("/api/jobs?search=Python")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data["jobs"], list)

    @pytest.mark.asyncio
    async def test_list_jobs_with_location_filter(self, client: AsyncClient, test_job):
        """Test job listing with location filter."""
        response = await client.get("/api/jobs?location=Remote")
        assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_list_jobs_pagination(self, client: AsyncClient, test_job):
        """Test job listing pagination."""
        response = await client.get("/api/jobs?page=1&page_size=10")
        assert response.status_code == 200
        data = response.json()
        assert data["page"] == 1
        assert data["page_size"] == 10


class TestJobRetrieval:
    """Tests for single job retrieval."""

    @pytest.mark.asyncio
    async def test_get_job_success(self, client: AsyncClient, test_job):
        """Test getting a specific job."""
        response = await client.get(f"/api/jobs/{test_job.id}")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == test_job.id
        assert data["title"] == test_job.title

    @pytest.mark.asyncio
    async def test_get_job_not_found(self, client: AsyncClient):
        """Test getting nonexistent job."""
        response = await client.get("/api/jobs/99999")
        assert response.status_code == 404


class TestJobUpdate:
    """Tests for job update."""

    @pytest.mark.asyncio
    async def test_update_job_success(self, client: AsyncClient, test_job, recruiter_auth_headers):
        """Test successful job update."""
        response = await client.put(
            f"/api/jobs/{test_job.id}",
            json={"title": "Updated Job Title"},
            headers=recruiter_auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "Updated Job Title"

    @pytest.mark.asyncio
    async def test_update_job_wrong_recruiter(self, client: AsyncClient, test_job, auth_headers):
        """Test that wrong recruiter cannot update job."""
        response = await client.put(
            f"/api/jobs/{test_job.id}",
            json={"title": "Hacked Title"},
            headers=auth_headers
        )
        assert response.status_code == 403


class TestJobDeletion:
    """Tests for job deletion."""

    @pytest.mark.asyncio
    async def test_delete_job_success(self, client: AsyncClient, db_session, recruiter_auth_headers):
        """Test successful job deletion."""
        # Create a new job for this test
        job = Job(
            recruiter_id=1,  # Will be set by the test fixture
            title="Job to Delete",
            description="Test",
        )
        db_session.add(job)
        await db_session.commit()
        await db_session.refresh(job)

        response = await client.delete(
            f"/api/jobs/{job.id}",
            headers=recruiter_auth_headers
        )
        assert response.status_code == 204

    @pytest.mark.asyncio
    async def test_delete_job_unauthorized(self, client: AsyncClient, test_job, auth_headers):
        """Test that unauthorized user cannot delete job."""
        response = await client.delete(
            f"/api/jobs/{test_job.id}",
            headers=auth_headers
        )
        assert response.status_code == 403


class TestJobToggleStatus:
    """Tests for job status toggle."""

    @pytest.mark.asyncio
    async def test_toggle_job_status(self, client: AsyncClient, test_job, recruiter_auth_headers):
        """Test toggling job active status."""
        original_status = test_job.is_active

        response = await client.post(
            f"/api/jobs/{test_job.id}/toggle-status",
            headers=recruiter_auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["is_active"] != original_status
