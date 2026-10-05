"""
Dashboard service for HireMind AI platform.
Provides aggregated statistics and metrics.
"""

from datetime import datetime, timedelta
from typing import Optional

from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.models.job import Job
from app.database.models.application import Application
from app.database.models.candidate import Candidate
from app.database.models.interview import Interview
from app.database.models.candidate_score import CandidateScore
from app.schemas.dashboard import DashboardStats, RecruiterDashboard, CandidateDashboard
from app.constants.application_status import ApplicationStatus


class DashboardService:
    """Service for dashboard statistics."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_recruiter_dashboard(self, recruiter_id: int) -> RecruiterDashboard:
        """
        Get dashboard data for a recruiter.

        Args:
            recruiter_id: Recruiter ID

        Returns:
            RecruiterDashboard with stats
        """
        # Get job stats
        total_jobs = await self._count(Job, Job.recruiter_id == recruiter_id)
        active_jobs = await self._count(
            Job,
            and_(Job.recruiter_id == recruiter_id, Job.is_active == True)
        )

        # Get application stats
        job_ids = await self._get_recruiter_job_ids(recruiter_id)
        total_applications = await self._count(
            Application,
            Application.job_id.in_(job_ids)
        ) if job_ids else 0

        pending_applications = await self._count(
            Application,
            and_(
                Application.job_id.in_(job_ids),
                Application.status == ApplicationStatus.PENDING
            )
        ) if job_ids else 0

        # Get interview stats
        scheduled_interviews = await self._count_scheduled_interviews(recruiter_id)

        # Get recent applications
        recent_applications = await self._get_recent_applications_for_recruiter(recruiter_id, limit=5)

        # Get top candidates
        top_candidates = await self._get_top_candidates_for_recruiter(recruiter_id, limit=5)

        # Application status breakdown
        status_breakdown = await self._get_application_status_breakdown(recruiter_id)

        return RecruiterDashboard(
            total_jobs=total_jobs,
            active_jobs=active_jobs,
            total_applications=total_applications,
            pending_applications=pending_applications,
            scheduled_interviews=scheduled_interviews,
            recent_applications=recent_applications,
            top_candidates=top_candidates,
            application_status_breakdown=status_breakdown,
        )

    async def get_candidate_dashboard(self, candidate_id: int) -> CandidateDashboard:
        """
        Get dashboard data for a candidate.

        Args:
            candidate_id: Candidate ID

        Returns:
            CandidateDashboard with stats
        """
        # Application stats
        total_applications = await self._count(
            Application,
            Application.candidate_id == candidate_id
        )

        pending_applications = await self._count(
            Application,
            and_(
                Application.candidate_id == candidate_id,
                Application.status == ApplicationStatus.PENDING
            )
        )

        interviews_scheduled = await self._count_candidate_interviews(candidate_id)

        # Get recent applications
        recent_applications = await self._get_recent_applications_for_candidate(candidate_id, limit=5)

        # Get recommended jobs
        recommended_jobs = await self._get_recommended_jobs_for_candidate(candidate_id, limit=5)

        # Application status breakdown
        status_breakdown = await self._get_candidate_status_breakdown(candidate_id)

        return CandidateDashboard(
            total_applications=total_applications,
            pending_applications=pending_applications,
            interviews_scheduled=interviews_scheduled,
            recent_applications=recent_applications,
            recommended_jobs=recommended_jobs,
            application_status_breakdown=status_breakdown,
        )

    async def _count(self, model, condition) -> int:
        """Count records matching condition."""
        result = await self.db.execute(
            select(func.count(model.id)).where(condition)
        )
        return result.scalar() or 0

    async def _get_recruiter_job_ids(self, recruiter_id: int) -> list:
        """Get list of job IDs for a recruiter."""
        result = await self.db.execute(
            select(Job.id).where(Job.recruiter_id == recruiter_id)
        )
        return [row[0] for row in result.fetchall()]

    async def _count_scheduled_interviews(self, recruiter_id: int) -> int:
        """Count scheduled interviews for recruiter's jobs."""
        from app.database.models.job import Job

        result = await self.db.execute(
            select(func.count(Interview.id))
            .join(Application, Interview.application_id == Application.id)
            .join(Job, Application.job_id == Job.id)
            .where(
                Job.recruiter_id == recruiter_id,
                Interview.status == "scheduled",
                Interview.scheduled_at >= datetime.utcnow()
            )
        )
        return result.scalar() or 0

    async def _count_candidate_interviews(self, candidate_id: int) -> int:
        """Count scheduled interviews for candidate."""
        result = await self.db.execute(
            select(func.count(Interview.id))
            .join(Application, Interview.application_id == Application.id)
            .where(
                Application.candidate_id == candidate_id,
                Interview.status == "scheduled",
                Interview.scheduled_at >= datetime.utcnow()
            )
        )
        return result.scalar() or 0

    async def _get_recent_applications_for_recruiter(
        self,
        recruiter_id: int,
        limit: int = 5
    ) -> list:
        """Get recent applications for recruiter."""
        from app.database.models.job import Job
        from sqlalchemy.orm import selectinload

        result = await self.db.execute(
            select(Application)
            .options(
                selectinload(Application.job),
                selectinload(Application.candidate),
            )
            .join(Job, Application.job_id == Job.id)
            .where(Job.recruiter_id == recruiter_id)
            .order_by(Application.created_at.desc())
            .limit(limit)
        )
        applications = result.scalars().all()

        return [
            {
                "id": app.id,
                "candidate_name": app.candidate.full_name if app.candidate else None,
                "job_title": app.job.title if app.job else None,
                "status": app.status,
                "created_at": app.created_at.isoformat(),
            }
            for app in applications
        ]

    async def _get_recent_applications_for_candidate(
        self,
        candidate_id: int,
        limit: int = 5
    ) -> list:
        """Get recent applications for candidate."""
        from sqlalchemy.orm import selectinload

        result = await self.db.execute(
            select(Application)
            .options(selectinload(Application.job))
            .where(Application.candidate_id == candidate_id)
            .order_by(Application.created_at.desc())
            .limit(limit)
        )
        applications = result.scalars().all()

        return [
            {
                "id": app.id,
                "job_title": app.job.title if app.job else None,
                "company": None,  # Would need to join recruiter
                "status": app.status,
                "created_at": app.created_at.isoformat(),
            }
            for app in applications
        ]

    async def _get_top_candidates_for_recruiter(
        self,
        recruiter_id: int,
        limit: int = 5
    ) -> list:
        """Get top candidates based on match scores."""
        from app.database.models.job import Job
        from sqlalchemy.orm import selectinload

        result = await self.db.execute(
            select(CandidateScore)
            .options(selectinload(CandidateScore.candidate))
            .join(Job, CandidateScore.job_id == Job.id)
            .where(Job.recruiter_id == recruiter_id)
            .order_by(CandidateScore.overall_score.desc())
            .limit(limit)
        )
        scores = result.scalars().all()

        return [
            {
                "candidate_id": score.candidate_id,
                "candidate_name": score.candidate.full_name if score.candidate else None,
                "overall_score": round(score.overall_score, 1),
                "recommendation": score.recommendation,
            }
            for score in scores
        ]

    async def _get_recommended_jobs_for_candidate(
        self,
        candidate_id: int,
        limit: int = 5
    ) -> list:
        """Get recommended jobs for candidate."""
        from sqlalchemy.orm import selectinload

        result = await self.db.execute(
            select(CandidateScore)
            .options(selectinload(CandidateScore.job))
            .where(CandidateScore.candidate_id == candidate_id)
            .order_by(CandidateScore.overall_score.desc())
            .limit(limit)
        )
        scores = result.scalars().all()

        return [
            {
                "job_id": score.job_id,
                "job_title": score.job.title if score.job else None,
                "overall_score": round(score.overall_score, 1),
                "recommendation": score.recommendation,
            }
            for score in scores
            if score.job and score.job.is_active
        ]

    async def _get_application_status_breakdown(self, recruiter_id: int) -> dict:
        """Get application status breakdown for recruiter."""
        from app.database.models.job import Job

        result = await self.db.execute(
            select(Application.status, func.count(Application.id))
            .join(Job, Application.job_id == Job.id)
            .where(Job.recruiter_id == recruiter_id)
            .group_by(Application.status)
        )

        breakdown = {}
        for row in result.fetchall():
            breakdown[row[0]] = row[1]

        return breakdown

    async def _get_candidate_status_breakdown(self, candidate_id: int) -> dict:
        """Get application status breakdown for candidate."""
        result = await self.db.execute(
            select(Application.status, func.count(Application.id))
            .where(Application.candidate_id == candidate_id)
            .group_by(Application.status)
        )

        breakdown = {}
        for row in result.fetchall():
            breakdown[row[0]] = row[1]

        return breakdown


def get_dashboard_service(db: AsyncSession) -> DashboardService:
    """Factory function for DashboardService."""
    return DashboardService(db)
