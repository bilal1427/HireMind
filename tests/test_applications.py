"""
Tests for application endpoints.
"""

import pytest
from httpx import AsyncClient
from datetime import datetime

from app.database.models import Application
from app.constants.application_status import VALID_STATUSES


class TestApplicationCreation:
    """Tests for job application."""

    @pytest.mark.asyncio
    async def test_apply_for_job_success(self, client: AsyncClient, auth_headers, test_job, test_candidate):
        """Test successful job application."""
        response = await client.post(
            "/api/applications",
            json={
                "job_id": test_job.id,
                "cover_letter": "I am interested in this position.",
            },
            headers=auth_headers
        )
        assert response.status_code == 201
        data = response.json()
        assert data["job_id"] == test_job.id
        assert data["status"] == "applied"

    @pytest.mark.asyncio
    async def test_apply_for_inactive_job(self, client: AsyncClient, auth_headers, test_job, db_session):
        """Test applying for inactive job fails."""
        test_job.is_active = False
        await db_session.commit()

        response = await client.post(
            "/api/applications",
            json={"job_id": test_job.id},
            headers=auth_headers
        )
        assert response.status_code == 400

    @pytest.mark.asyncio
    async def test_apply_twice_for_same_job(self, client: AsyncClient, auth_headers, test_job, test_candidate, db_session):
        """Test that applying twice for same job fails."""
        # First application
        app = Application(
            candidate_id=test_candidate.id,
            job_id=test_job.id,
            status="applied",
            applied_at=datetime.utcnow(),
        )
        db_session.add(app)
        await db_session.commit()

        # Try to apply again
        response = await client.post(
            "/api/applications",
            json={"job_id": test_job.id},
            headers=auth_headers
        )
        assert response.status_code == 409

    @pytest.mark.asyncio
    async def test_apply_as_recruiter_forbidden(self, client: AsyncClient, recruiter_auth_headers, test_job):
        """Test that recruiters cannot apply for jobs."""
        response = await client.post(
            "/api/applications",
            json={"job_id": test_job.id},
            headers=recruiter_auth_headers
        )
        assert response.status_code == 403


class TestApplicationListing:
    """Tests for application listing."""

    @pytest.mark.asyncio
    async def test_list_candidate_applications(self, client: AsyncClient, auth_headers, test_job, test_candidate, db_session):
        """Test listing applications for candidate."""
        app = Application(
            candidate_id=test_candidate.id,
            job_id=test_job.id,
            status="applied",
            applied_at=datetime.utcnow(),
        )
        db_session.add(app)
        await db_session.commit()

        response = await client.get("/api/applications", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["total"] >= 1

    @pytest.mark.asyncio
    async def test_list_recruiter_applications(self, client: AsyncClient, recruiter_auth_headers, test_job, test_candidate, db_session):
        """Test listing applications for recruiter."""
        app = Application(
            candidate_id=test_candidate.id,
            job_id=test_job.id,
            status="applied",
            applied_at=datetime.utcnow(),
        )
        db_session.add(app)
        await db_session.commit()

        response = await client.get("/api/applications", headers=recruiter_auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["total"] >= 1

    @pytest.mark.asyncio
    async def test_list_applications_with_status_filter(self, client: AsyncClient, auth_headers, test_job, test_candidate, db_session):
        """Test filtering applications by status."""
        app = Application(
            candidate_id=test_candidate.id,
            job_id=test_job.id,
            status="shortlisted",
            applied_at=datetime.utcnow(),
        )
        db_session.add(app)
        await db_session.commit()

        response = await client.get("/api/applications?status=shortlisted", headers=auth_headers)
        assert response.status_code == 200


class TestApplicationStatusUpdate:
    """Tests for application status updates."""

    @pytest.mark.asyncio
    async def test_update_status_valid_transition(self, client: AsyncClient, recruiter_auth_headers, test_job, test_candidate, db_session):
        """Test valid status transition."""
        app = Application(
            candidate_id=test_candidate.id,
            job_id=test_job.id,
            status="applied",
            applied_at=datetime.utcnow(),
        )
        db_session.add(app)
        await db_session.commit()
        await db_session.refresh(app)

        response = await client.put(
            f"/api/applications/{app.id}/status",
            json={"status": "screening"},
            headers=recruiter_auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "screening"

    @pytest.mark.asyncio
    async def test_update_status_invalid_transition(self, client: AsyncClient, recruiter_auth_headers, test_job, test_candidate, db_session):
        """Test invalid status transition."""
        app = Application(
            candidate_id=test_candidate.id,
            job_id=test_job.id,
            status="applied",
            applied_at=datetime.utcnow(),
        )
        db_session.add(app)
        await db_session.commit()
        await db_session.refresh(app)

        # Cannot go directly from applied to selected
        response = await client.put(
            f"/api/applications/{app.id}/status",
            json={"status": "selected"},
            headers=recruiter_auth_headers
        )
        assert response.status_code == 400

    @pytest.mark.asyncio
    async def test_update_status_by_wrong_recruiter(self, client: AsyncClient, auth_headers, test_job, test_candidate, db_session):
        """Test that candidates cannot update status."""
        app = Application(
            candidate_id=test_candidate.id,
            job_id=test_job.id,
            status="applied",
            applied_at=datetime.utcnow(),
        )
        db_session.add(app)
        await db_session.commit()
        await db_session.refresh(app)

        response = await client.put(
            f"/api/applications/{app.id}/status",
            json={"status": "screening"},
            headers=auth_headers
        )
        assert response.status_code == 403


class TestApplicationAuthorization:
    """Tests for application authorization."""

    @pytest.mark.asyncio
    async def test_view_own_application(self, client: AsyncClient, auth_headers, test_job, test_candidate, db_session):
        """Test viewing own application."""
        app = Application(
            candidate_id=test_candidate.id,
            job_id=test_job.id,
            status="applied",
            applied_at=datetime.utcnow(),
        )
        db_session.add(app)
        await db_session.commit()
        await db_session.refresh(app)

        response = await client.get(f"/api/applications/{app.id}", headers=auth_headers)
        assert response.status_code == 200
