"""
Tests for interview endpoints.
"""

import pytest
from httpx import AsyncClient
from datetime import datetime, timedelta

from app.database.models import Interview, Application


class TestInterviewScheduling:
    """Tests for interview scheduling."""

    @pytest.mark.asyncio
    async def test_schedule_interview_success(self, client: AsyncClient, recruiter_auth_headers, test_job, test_candidate, test_recruiter, db_session):
        """Test successful interview scheduling."""
        # Create application first
        app = Application(
            candidate_id=test_candidate.id,
            job_id=test_job.id,
            status="shortlisted",
            applied_at=datetime.utcnow(),
        )
        db_session.add(app)
        await db_session.commit()
        await db_session.refresh(app)

        scheduled_time = datetime.utcnow() + timedelta(days=7)

        response = await client.post(
            "/api/interviews",
            json={
                "application_id": app.id,
                "interview_type": "video",
                "scheduled_at": scheduled_time.isoformat(),
                "duration_minutes": 60,
                "meeting_link": "https://meet.example.com/abc123",
            },
            headers=recruiter_auth_headers
        )
        assert response.status_code == 201
        data = response.json()
        assert data["interview_type"] == "video"
        assert data["status"] == "scheduled"

    @pytest.mark.asyncio
    async def test_schedule_interview_for_other_recruiter_job(self, client: AsyncClient, recruiter_auth_headers, test_job, test_candidate, db_session):
        """Test that recruiter cannot schedule interview for another recruiter's job."""
        # Create a job owned by different recruiter
        from app.database.models import Job, Recruiter, User
        from app.core.security import hash_password

        other_user = User(
            email="other_recruiter@example.com",
            password_hash=hash_password("password"),
            role="recruiter",
        )
        db_session.add(other_user)
        await db_session.commit()

        other_recruiter = Recruiter(
            user_id=other_user.id,
            full_name="Other Recruiter",
            company_name="Other Company",
        )
        db_session.add(other_recruiter)
        await db_session.commit()

        other_job = Job(
            recruiter_id=other_recruiter.id,
            title="Other Job",
            description="Test",
        )
        db_session.add(other_job)
        await db_session.commit()

        app = Application(
            candidate_id=test_candidate.id,
            job_id=other_job.id,
            status="shortlisted",
            applied_at=datetime.utcnow(),
        )
        db_session.add(app)
        await db_session.commit()
        await db_session.refresh(app)

        response = await client.post(
            "/api/interviews",
            json={
                "application_id": app.id,
                "interview_type": "phone",
                "scheduled_at": (datetime.utcnow() + timedelta(days=7)).isoformat(),
            },
            headers=recruiter_auth_headers
        )
        assert response.status_code == 403


class TestInterviewListing:
    """Tests for interview listing."""

    @pytest.mark.asyncio
    async def test_list_interviews_as_recruiter(self, client: AsyncClient, recruiter_auth_headers, test_job, test_candidate, test_recruiter, db_session):
        """Test listing interviews as recruiter."""
        app = Application(
            candidate_id=test_candidate.id,
            job_id=test_job.id,
            status="interview",
            applied_at=datetime.utcnow(),
        )
        db_session.add(app)
        await db_session.commit()
        await db_session.refresh(app)

        interview = Interview(
            application_id=app.id,
            recruiter_id=test_recruiter.id,
            candidate_id=test_candidate.id,
            job_id=test_job.id,
            interview_type="video",
            status="scheduled",
            scheduled_at=datetime.utcnow() + timedelta(days=1),
            duration_minutes=60,
        )
        db_session.add(interview)
        await db_session.commit()

        response = await client.get("/api/interviews", headers=recruiter_auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["total"] >= 1

    @pytest.mark.asyncio
    async def test_list_interviews_as_candidate(self, client: AsyncClient, auth_headers, test_job, test_candidate, test_recruiter, db_session):
        """Test listing interviews as candidate."""
        app = Application(
            candidate_id=test_candidate.id,
            job_id=test_job.id,
            status="interview",
            applied_at=datetime.utcnow(),
        )
        db_session.add(app)
        await db_session.commit()
        await db_session.refresh(app)

        interview = Interview(
            application_id=app.id,
            recruiter_id=test_recruiter.id,
            candidate_id=test_candidate.id,
            job_id=test_job.id,
            interview_type="video",
            status="scheduled",
            scheduled_at=datetime.utcnow() + timedelta(days=1),
            duration_minutes=60,
        )
        db_session.add(interview)
        await db_session.commit()

        response = await client.get("/api/interviews", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["total"] >= 1


class TestInterviewFeedback:
    """Tests for interview feedback."""

    @pytest.mark.asyncio
    async def test_add_feedback_success(self, client: AsyncClient, recruiter_auth_headers, test_job, test_candidate, test_recruiter, db_session):
        """Test adding interview feedback."""
        app = Application(
            candidate_id=test_candidate.id,
            job_id=test_job.id,
            status="interview",
            applied_at=datetime.utcnow(),
        )
        db_session.add(app)
        await db_session.commit()
        await db_session.refresh(app)

        interview = Interview(
            application_id=app.id,
            recruiter_id=test_recruiter.id,
            candidate_id=test_candidate.id,
            job_id=test_job.id,
            interview_type="technical",
            status="scheduled",
            scheduled_at=datetime.utcnow() - timedelta(hours=1),
            duration_minutes=60,
        )
        db_session.add(interview)
        await db_session.commit()
        await db_session.refresh(interview)

        response = await client.post(
            f"/api/interviews/{interview.id}/feedback",
            json={
                "rating": 4,
                "technical_skills": 5,
                "communication": 4,
                "cultural_fit": 4,
                "problem_solving": 3,
                "strengths": "Strong technical background",
                "weaknesses": "Could improve problem-solving speed",
                "recommendation": "yes",
                "summary": "Good candidate overall",
            },
            headers=recruiter_auth_headers
        )
        assert response.status_code == 201
        data = response.json()
        assert data["rating"] == 4

    @pytest.mark.asyncio
    async def test_add_feedback_twice_forbidden(self, client: AsyncClient, recruiter_auth_headers, test_job, test_candidate, test_recruiter, db_session):
        """Test that adding feedback twice is forbidden."""
        from app.database.models import InterviewFeedback

        app = Application(
            candidate_id=test_candidate.id,
            job_id=test_job.id,
            status="interview",
            applied_at=datetime.utcnow(),
        )
        db_session.add(app)
        await db_session.commit()
        await db_session.refresh(app)

        interview = Interview(
            application_id=app.id,
            recruiter_id=test_recruiter.id,
            candidate_id=test_candidate.id,
            job_id=test_job.id,
            interview_type="technical",
            status="completed",
            scheduled_at=datetime.utcnow() - timedelta(hours=1),
            duration_minutes=60,
        )
        db_session.add(interview)
        await db_session.commit()
        await db_session.refresh(interview)

        # Add feedback first time
        feedback = InterviewFeedback(
            interview_id=interview.id,
            recruiter_id=test_recruiter.id,
            rating=4,
        )
        db_session.add(feedback)
        await db_session.commit()

        # Try to add again
        response = await client.post(
            f"/api/interviews/{interview.id}/feedback",
            json={"rating": 5},
            headers=recruiter_auth_headers
        )
        assert response.status_code == 409
