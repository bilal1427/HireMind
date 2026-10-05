"""
Application service for HireMind AI platform.
Handles job applications and status management.
"""

from datetime import datetime
from typing import Optional, List

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database.models.application import Application
from app.database.models.job import Job
from app.database.models.candidate import Candidate
from app.database.models.candidate_score import CandidateScore
from app.schemas.application import (
    ApplicationCreateRequest,
    ApplicationUpdateRequest,
    ApplicationResponse,
    ApplicationListResponse,
    ApplicationDetailResponse,
)
from app.core.exceptions import raise_not_found, raise_forbidden, BusinessLogicError
from app.constants.application_status import ApplicationStatus


class ApplicationService:
    """Service for application operations."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def apply_for_job(
        self,
        candidate_id: int,
        application_data: ApplicationCreateRequest,
    ) -> ApplicationResponse:
        """
        Apply for a job.

        Args:
            candidate_id: Candidate ID
            application_data: Application data

        Returns:
            Created application
        """
        # Check if job exists and is active
        job = await self._get_job(application_data.job_id)
        if not job:
            raise_not_found("Job")
        if not job.is_active:
            raise BusinessLogicError("This job posting is no longer active")

        # Check if already applied
        existing = await self.db.execute(
            select(Application).where(
                Application.candidate_id == candidate_id,
                Application.job_id == application_data.job_id,
            )
        )
        if existing.scalar_one_or_none():
            raise BusinessLogicError("You have already applied for this job")

        # Create application
        application = Application(
            candidate_id=candidate_id,
            job_id=application_data.job_id,
            cover_letter=application_data.cover_letter,
            status=ApplicationStatus.PENDING,
        )
        self.db.add(application)
        await self.db.commit()
        await self.db.refresh(application)

        return self._application_to_response(application)

    async def get_application(
        self,
        application_id: int,
        user_role: str,
        user_id: int,
    ) -> ApplicationDetailResponse:
        """
        Get application details.

        Args:
            application_id: Application ID
            user_role: User role (recruiter/candidate)
            user_id: User ID

        Returns:
            Application details
        """
        application = await self._get_application_with_details(application_id)
        if not application:
            raise_not_found("Application")

        # Check authorization
        if user_role == "candidate":
            candidate = await self._get_candidate_by_user(user_id)
            if not candidate or application.candidate_id != candidate.id:
                raise_forbidden("You don't have access to this application")
        else:  # recruiter
            job = await self._get_job(application.job_id)
            recruiter = await self._get_recruiter_by_user(user_id)
            if not recruiter or job.recruiter_id != recruiter.id:
                raise_forbidden("You don't have access to this application")

        # Get match score if available
        match_score = await self._get_match_score(
            application.candidate_id,
            application.job_id
        )

        return self._application_to_detail_response(application, match_score)

    async def list_applications(
        self,
        user_role: str,
        user_id: int,
        status: Optional[str] = None,
        job_id: Optional[int] = None,
        limit: int = 20,
        offset: int = 0,
    ) -> ApplicationListResponse:
        """
        List applications.

        Args:
            user_role: User role
            user_id: User ID
            status: Filter by status
            job_id: Filter by job
            limit: Max results
            offset: Pagination offset

        Returns:
            List of applications
        """
        if user_role == "candidate":
            candidate = await self._get_candidate_by_user(user_id)
            if not candidate:
                raise_not_found("Candidate profile")

            query = select(Application).where(
                Application.candidate_id == candidate.id
            )
            count_query = select(func.count(Application.id)).where(
                Application.candidate_id == candidate.id
            )
        else:  # recruiter
            recruiter = await self._get_recruiter_by_user(user_id)
            if not recruiter:
                raise_not_found("Recruiter profile")

            # Get recruiter's jobs
            jobs_result = await self.db.execute(
                select(Job.id).where(Job.recruiter_id == recruiter.id)
            )
            job_ids = [j[0] for j in jobs_result.fetchall()]

            if not job_ids:
                return ApplicationListResponse(applications=[], total=0, limit=limit, offset=offset)

            query = select(Application).where(Application.job_id.in_(job_ids))
            count_query = select(func.count(Application.id)).where(
                Application.job_id.in_(job_ids)
            )

        if status:
            query = query.where(Application.status == status)
            count_query = count_query.where(Application.status == status)
        if job_id:
            query = query.where(Application.job_id == job_id)
            count_query = count_query.where(Application.job_id == job_id)

        # Get total
        total_result = await self.db.execute(count_query)
        total = total_result.scalar() or 0

        # Get paginated results
        query = query.order_by(Application.created_at.desc()).limit(limit).offset(offset)
        result = await self.db.execute(query)
        applications = result.scalars().all()

        return ApplicationListResponse(
            applications=[self._application_to_response(app) for app in applications],
            total=total,
            limit=limit,
            offset=offset,
        )

    async def update_status(
        self,
        application_id: int,
        recruiter_id: int,
        status_data: ApplicationUpdateRequest,
    ) -> ApplicationResponse:
        """
        Update application status.

        Args:
            application_id: Application ID
            recruiter_id: Recruiter ID
            status_data: Status update data

        Returns:
            Updated application
        """
        application = await self._get_application(application_id)
        if not application:
            raise_not_found("Application")

        # Check authorization
        job = await self._get_job(application.job_id)
        if job.recruiter_id != recruiter_id:
            raise_forbidden("You can only update applications for your own jobs")

        # Update status
        application.status = status_data.status
        application.status_updated_at = datetime.utcnow()
        if status_data.notes:
            application.notes = status_data.notes

        await self.db.commit()
        await self.db.refresh(application)

        return self._application_to_response(application)

    async def withdraw_application(
        self,
        application_id: int,
        candidate_id: int,
    ) -> None:
        """
        Withdraw an application.

        Args:
            application_id: Application ID
            candidate_id: Candidate ID
        """
        application = await self._get_application(application_id)
        if not application:
            raise_not_found("Application")

        if application.candidate_id != candidate_id:
            raise_forbidden("You can only withdraw your own applications")

        if application.status not in [ApplicationStatus.PENDING, ApplicationStatus.REVIEWED]:
            raise BusinessLogicError("Cannot withdraw application at this stage")

        application.status = ApplicationStatus.WITHDRAWN
        application.status_updated_at = datetime.utcnow()

        await self.db.commit()

    async def _get_application(self, application_id: int) -> Optional[Application]:
        """Get application by ID."""
        result = await self.db.execute(
            select(Application).where(Application.id == application_id)
        )
        return result.scalar_one_or_none()

    async def _get_application_with_details(self, application_id: int) -> Optional[Application]:
        """Get application with related data."""
        result = await self.db.execute(
            select(Application)
            .options(
                selectinload(Application.job),
                selectinload(Application.candidate),
            )
            .where(Application.id == application_id)
        )
        return result.scalar_one_or_none()

    async def _get_job(self, job_id: int) -> Optional[Job]:
        """Get job by ID."""
        result = await self.db.execute(
            select(Job).where(Job.id == job_id)
        )
        return result.scalar_one_or_none()

    async def _get_candidate_by_user(self, user_id: int) -> Optional[Candidate]:
        """Get candidate by user ID."""
        result = await self.db.execute(
            select(Candidate).where(Candidate.user_id == user_id)
        )
        return result.scalar_one_or_none()

    async def _get_recruiter_by_user(self, user_id: int) -> Optional[any]:
        """Get recruiter by user ID."""
        from app.database.models.recruiter import Recruiter
        result = await self.db.execute(
            select(Recruiter).where(Recruiter.user_id == user_id)
        )
        return result.scalar_one_or_none()

    async def _get_match_score(self, candidate_id: int, job_id: int) -> Optional[dict]:
        """Get match score for candidate-job pair."""
        result = await self.db.execute(
            select(CandidateScore).where(
                CandidateScore.candidate_id == candidate_id,
                CandidateScore.job_id == job_id,
            )
        )
        score = result.scalar_one_or_none()
        if score:
            return {
                "overall_score": round(score.overall_score, 1),
                "recommendation": score.recommendation,
            }
        return None

    def _application_to_response(self, application: Application) -> ApplicationResponse:
        """Convert Application model to response schema."""
        return ApplicationResponse(
            id=application.id,
            candidate_id=application.candidate_id,
            job_id=application.job_id,
            status=application.status,
            cover_letter=application.cover_letter,
            notes=application.notes,
            created_at=application.created_at,
            status_updated_at=application.status_updated_at,
        )

    def _application_to_detail_response(
        self,
        application: Application,
        match_score: Optional[dict],
    ) -> ApplicationDetailResponse:
        """Convert Application model to detail response schema."""
        job = application.job
        candidate = application.candidate

        return ApplicationDetailResponse(
            id=application.id,
            candidate_id=application.candidate_id,
            job_id=application.job_id,
            status=application.status,
            cover_letter=application.cover_letter,
            notes=application.notes,
            created_at=application.created_at,
            status_updated_at=application.status_updated_at,
            candidate={
                "id": candidate.id,
                "full_name": candidate.full_name,
                "location": candidate.location,
            } if candidate else None,
            job={
                "id": job.id,
                "title": job.title,
                "location": job.location,
            } if job else None,
            match_score=match_score,
        )


def get_application_service(db: AsyncSession) -> ApplicationService:
    """Factory function for ApplicationService."""
    return ApplicationService(db)
