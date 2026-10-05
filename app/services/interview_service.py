"""
Interview service for HireMind AI platform.
Handles interview scheduling and feedback management.
"""

from datetime import datetime
from typing import Optional, List

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database.models.interview import Interview
from app.database.models.interview_feedback import InterviewFeedback
from app.database.models.application import Application
from app.database.models.job import Job
from app.database.models.candidate import Candidate
from app.schemas.interview import (
    InterviewCreateRequest,
    InterviewUpdateRequest,
    InterviewResponse,
    InterviewListResponse,
    InterviewDetailResponse,
    FeedbackCreateRequest,
    FeedbackResponse,
)
from app.core.exceptions import raise_not_found, raise_forbidden, BusinessLogicError


class InterviewService:
    """Service for interview operations."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def schedule_interview(
        self,
        recruiter_id: int,
        interview_data: InterviewCreateRequest,
    ) -> InterviewResponse:
        """
        Schedule an interview.

        Args:
            recruiter_id: Recruiter ID
            interview_data: Interview data

        Returns:
            Scheduled interview
        """
        # Verify application exists and belongs to recruiter
        application = await self._get_application_with_job(interview_data.application_id)
        if not application:
            raise_not_found("Application")

        job = application.job
        if job.recruiter_id != recruiter_id:
            raise_forbidden("You can only schedule interviews for your own job postings")

        # Check if interview already scheduled
        existing = await self.db.execute(
            select(Interview).where(
                Interview.application_id == interview_data.application_id,
                Interview.status == "scheduled",
            )
        )
        if existing.scalar_one_or_none():
            raise BusinessLogicError("An interview is already scheduled for this application")

        # Create interview
        interview = Interview(
            application_id=interview_data.application_id,
            scheduled_at=interview_data.scheduled_at,
            duration_minutes=interview_data.duration_minutes,
            interview_type=interview_data.interview_type,
            location=interview_data.location,
            meeting_link=interview_data.meeting_link,
            notes=interview_data.notes,
            status="scheduled",
        )
        self.db.add(interview)

        # Update application status
        application.status = "interview_scheduled"
        application.status_updated_at = datetime.utcnow()

        await self.db.commit()
        await self.db.refresh(interview)

        return self._interview_to_response(interview)

    async def get_interview(
        self,
        interview_id: int,
        user_role: str,
        user_id: int,
    ) -> InterviewDetailResponse:
        """
        Get interview details.

        Args:
            interview_id: Interview ID
            user_role: User role
            user_id: User ID

        Returns:
            Interview details
        """
        interview = await self._get_interview_with_details(interview_id)
        if not interview:
            raise_not_found("Interview")

        # Check authorization
        application = interview.application
        job = application.job

        if user_role == "candidate":
            candidate = await self._get_candidate_by_user(user_id)
            if not candidate or application.candidate_id != candidate.id:
                raise_forbidden("You don't have access to this interview")
        else:  # recruiter
            recruiter = await self._get_recruiter_by_user(user_id)
            if not recruiter or job.recruiter_id != recruiter.id:
                raise_forbidden("You don't have access to this interview")

        # Get feedback
        feedback = await self._get_interview_feedback(interview_id)

        return self._interview_to_detail_response(interview, feedback)

    async def list_interviews(
        self,
        user_role: str,
        user_id: int,
        status: Optional[str] = None,
        upcoming: Optional[bool] = None,
        limit: int = 20,
        offset: int = 0,
    ) -> InterviewListResponse:
        """
        List interviews.

        Args:
            user_role: User role
            user_id: User ID
            status: Filter by status
            upcoming: Filter upcoming interviews
            limit: Max results
            offset: Pagination offset

        Returns:
            List of interviews
        """
        query = select(Interview).options(
            selectinload(Interview.application).selectinload(Application.job),
            selectinload(Interview.application).selectinload(Application.candidate),
        )

        if user_role == "candidate":
            candidate = await self._get_candidate_by_user(user_id)
            if not candidate:
                raise_not_found("Candidate profile")

            # Get interviews for this candidate
            subquery = select(Application.id).where(
                Application.candidate_id == candidate.id
            )
            query = query.where(Interview.application_id.in_(subquery))
        else:  # recruiter
            recruiter = await self._get_recruiter_by_user(user_id)
            if not recruiter:
                raise_not_found("Recruiter profile")

            # Get interviews for recruiter's jobs
            from app.database.models.job import Job
            subquery = (
                select(Application.id)
                .join(Job, Application.job_id == Job.id)
                .where(Job.recruiter_id == recruiter.id)
            )
            query = query.where(Interview.application_id.in_(subquery))

        if status:
            query = query.where(Interview.status == status)
        if upcoming:
            query = query.where(Interview.scheduled_at >= datetime.utcnow())
            query = query.where(Interview.status == "scheduled")

        # Get total count
        count_query = select(func.count(Interview.id))
        if user_role == "candidate":
            candidate = await self._get_candidate_by_user(user_id)
            if candidate:
                subquery = select(Application.id).where(
                    Application.candidate_id == candidate.id
                )
                count_query = count_query.where(Interview.application_id.in_(subquery))
        else:
            recruiter = await self._get_recruiter_by_user(user_id)
            if recruiter:
                from app.database.models.job import Job
                subquery = (
                    select(Application.id)
                    .join(Job, Application.job_id == Job.id)
                    .where(Job.recruiter_id == recruiter.id)
                )
                count_query = count_query.where(Interview.application_id.in_(subquery))
        if status:
            count_query = count_query.where(Interview.status == status)
        if upcoming:
            count_query = count_query.where(Interview.scheduled_at >= datetime.utcnow())
            count_query = count_query.where(Interview.status == "scheduled")

        total_result = await self.db.execute(count_query)
        total = total_result.scalar() or 0

        # Get paginated results
        query = query.order_by(Interview.scheduled_at).limit(limit).offset(offset)
        result = await self.db.execute(query)
        interviews = result.scalars().all()

        return InterviewListResponse(
            interviews=[self._interview_to_response(i) for i in interviews],
            total=total,
            limit=limit,
            offset=offset,
        )

    async def update_interview(
        self,
        interview_id: int,
        recruiter_id: int,
        update_data: InterviewUpdateRequest,
    ) -> InterviewResponse:
        """
        Update an interview.

        Args:
            interview_id: Interview ID
            recruiter_id: Recruiter ID
            update_data: Update data

        Returns:
            Updated interview
        """
        interview = await self._get_interview(interview_id)
        if not interview:
            raise_not_found("Interview")

        # Check authorization
        application = await self._get_application(interview.application_id)
        job = await self._get_job(application.job_id)
        if job.recruiter_id != recruiter_id:
            raise_forbidden("You can only update your own interviews")

        # Update fields
        if update_data.scheduled_at is not None:
            interview.scheduled_at = update_data.scheduled_at
        if update_data.duration_minutes is not None:
            interview.duration_minutes = update_data.duration_minutes
        if update_data.interview_type is not None:
            interview.interview_type = update_data.interview_type
        if update_data.location is not None:
            interview.location = update_data.location
        if update_data.meeting_link is not None:
            interview.meeting_link = update_data.meeting_link
        if update_data.notes is not None:
            interview.notes = update_data.notes
        if update_data.status is not None:
            interview.status = update_data.status

        await self.db.commit()
        await self.db.refresh(interview)

        return self._interview_to_response(interview)

    async def add_feedback(
        self,
        interview_id: int,
        recruiter_id: int,
        feedback_data: FeedbackCreateRequest,
    ) -> FeedbackResponse:
        """
        Add feedback for an interview.

        Args:
            interview_id: Interview ID
            recruiter_id: Recruiter ID
            feedback_data: Feedback data

        Returns:
            Created feedback
        """
        interview = await self._get_interview(interview_id)
        if not interview:
            raise_not_found("Interview")

        # Check authorization
        application = await self._get_application(interview.application_id)
        job = await self._get_job(application.job_id)
        if job.recruiter_id != recruiter_id:
            raise_forbidden("You can only add feedback for your own interviews")

        # Check if feedback already exists
        existing = await self.db.execute(
            select(InterviewFeedback).where(
                InterviewFeedback.interview_id == interview_id
            )
        )
        if existing.scalar_one_or_none():
            raise BusinessLogicError("Feedback already exists for this interview")

        # Create feedback
        feedback = InterviewFeedback(
            interview_id=interview_id,
            recruiter_id=recruiter_id,
            rating=feedback_data.rating,
            strengths=feedback_data.strengths,
            weaknesses=feedback_data.weaknesses,
            technical_score=feedback_data.technical_score,
            communication_score=feedback_data.communication_score,
            culture_fit_score=feedback_data.culture_fit_score,
            recommendation=feedback_data.recommendation,
            notes=feedback_data.notes,
        )
        self.db.add(feedback)

        # Update interview status
        interview.status = "completed"

        await self.db.commit()
        await self.db.refresh(feedback)

        return self._feedback_to_response(feedback)

    async def cancel_interview(
        self,
        interview_id: int,
        user_role: str,
        user_id: int,
        reason: Optional[str] = None,
    ) -> None:
        """Cancel an interview."""
        interview = await self._get_interview(interview_id)
        if not interview:
            raise_not_found("Interview")

        # Check authorization
        application = await self._get_application(interview.application_id)
        job = await self._get_job(application.job_id)

        if user_role == "candidate":
            candidate = await self._get_candidate_by_user(user_id)
            if not candidate or application.candidate_id != candidate.id:
                raise_forbidden("You can only cancel your own interviews")
        else:
            recruiter = await self._get_recruiter_by_user(user_id)
            if not recruiter or job.recruiter_id != recruiter.id:
                raise_forbidden("You can only cancel your own interviews")

        interview.status = "cancelled"
        interview.notes = f"Cancelled: {reason}" if reason else "Cancelled"

        await self.db.commit()

    async def _get_interview(self, interview_id: int) -> Optional[Interview]:
        """Get interview by ID."""
        result = await self.db.execute(
            select(Interview).where(Interview.id == interview_id)
        )
        return result.scalar_one_or_none()

    async def _get_interview_with_details(self, interview_id: int) -> Optional[Interview]:
        """Get interview with related data."""
        result = await self.db.execute(
            select(Interview)
            .options(
                selectinload(Interview.application).selectinload(Application.job),
                selectinload(Interview.application).selectinload(Application.candidate),
            )
            .where(Interview.id == interview_id)
        )
        return result.scalar_one_or_none()

    async def _get_application(self, application_id: int) -> Optional[Application]:
        """Get application by ID."""
        result = await self.db.execute(
            select(Application).where(Application.id == application_id)
        )
        return result.scalar_one_or_none()

    async def _get_application_with_job(self, application_id: int) -> Optional[Application]:
        """Get application with job."""
        result = await self.db.execute(
            select(Application)
            .options(selectinload(Application.job))
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

    async def _get_interview_feedback(self, interview_id: int) -> Optional[InterviewFeedback]:
        """Get feedback for interview."""
        result = await self.db.execute(
            select(InterviewFeedback).where(
                InterviewFeedback.interview_id == interview_id
            )
        )
        return result.scalar_one_or_none()

    def _interview_to_response(self, interview: Interview) -> InterviewResponse:
        """Convert Interview model to response schema."""
        return InterviewResponse(
            id=interview.id,
            application_id=interview.application_id,
            scheduled_at=interview.scheduled_at,
            duration_minutes=interview.duration_minutes,
            interview_type=interview.interview_type,
            location=interview.location,
            meeting_link=interview.meeting_link,
            status=interview.status,
            notes=interview.notes,
            created_at=interview.created_at,
        )

    def _interview_to_detail_response(
        self,
        interview: Interview,
        feedback: Optional[InterviewFeedback],
    ) -> InterviewDetailResponse:
        """Convert Interview model to detail response schema."""
        application = interview.application
        job = application.job if application else None
        candidate = application.candidate if application else None

        feedback_data = None
        if feedback:
            feedback_data = self._feedback_to_response(feedback)

        return InterviewDetailResponse(
            id=interview.id,
            application_id=interview.application_id,
            scheduled_at=interview.scheduled_at,
            duration_minutes=interview.duration_minutes,
            interview_type=interview.interview_type,
            location=interview.location,
            meeting_link=interview.meeting_link,
            status=interview.status,
            notes=interview.notes,
            created_at=interview.created_at,
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
            feedback=feedback_data,
        )

    def _feedback_to_response(self, feedback: InterviewFeedback) -> FeedbackResponse:
        """Convert InterviewFeedback model to response schema."""
        return FeedbackResponse(
            id=feedback.id,
            interview_id=feedback.interview_id,
            recruiter_id=feedback.recruiter_id,
            rating=feedback.rating,
            strengths=feedback.strengths,
            weaknesses=feedback.weaknesses,
            technical_score=feedback.technical_score,
            communication_score=feedback.communication_score,
            culture_fit_score=feedback.culture_fit_score,
            recommendation=feedback.recommendation,
            notes=feedback.notes,
            created_at=feedback.created_at,
        )


def get_interview_service(db: AsyncSession) -> InterviewService:
    """Factory function for InterviewService."""
    return InterviewService(db)
