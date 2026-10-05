"""
Job service for HireMind AI platform.
Handles job posting creation, updates, and management.
"""

from datetime import datetime
from typing import Optional, List
import json

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database.models.job import Job
from app.database.models.skill import Skill, JobSkill
from app.database.models.recruiter import Recruiter
from app.database.models.application import Application
from app.schemas.job import (
    JobCreateRequest,
    JobUpdateRequest,
    JobResponse,
    JobListResponse,
    JobDetailResponse,
)
from app.core.exceptions import raise_not_found, raise_forbidden
from app.core.config import settings


class JobService:
    """Service for job operations."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_job(
        self,
        recruiter_id: int,
        job_data: JobCreateRequest,
    ) -> JobResponse:
        """
        Create a new job posting.

        Args:
            recruiter_id: Recruiter ID
            job_data: Job creation data

        Returns:
            Created job
        """
        # Create job
        job = Job(
            recruiter_id=recruiter_id,
            title=job_data.title,
            description=job_data.description,
            requirements=job_data.requirements,
            location=job_data.location,
            salary_min=job_data.salary_min,
            salary_max=job_data.salary_max,
            job_type=job_data.job_type,
            experience_level=job_data.experience_level,
        )
        self.db.add(job)
        await self.db.flush()

        # Add skills
        if job_data.skills:
            await self._add_job_skills(job.id, job_data.skills)

        await self.db.commit()
        await self.db.refresh(job)

        await self._sync_job_to_rag(job, recruiter_id)

        return await self.get_job(job.id)

    async def get_job(self, job_id: int) -> JobDetailResponse:
        """
        Get job details by ID.

        Args:
            job_id: Job ID

        Returns:
            Job details
        """
        job = await self._get_job_with_skills(job_id)
        if not job:
            raise_not_found("Job")

        # Get application count
        result = await self.db.execute(
            select(func.count(Application.id)).where(
                Application.job_id == job_id
            )
        )
        application_count = result.scalar() or 0

        return self._job_to_detail_response(job, application_count)

    async def list_jobs(
        self,
        recruiter_id: Optional[int] = None,
        is_active: Optional[bool] = None,
        location: Optional[str] = None,
        job_type: Optional[str] = None,
        experience_level: Optional[str] = None,
        search: Optional[str] = None,
        limit: int = 20,
        offset: int = 0,
        page: int = 1,
        page_size: int = 20,
    ) -> JobListResponse:
        """
        List jobs with filters.

        Args:
            recruiter_id: Filter by recruiter
            is_active: Filter by active status
            location: Filter by location
            job_type: Filter by job type
            experience_level: Filter by experience level
            search: Search in title and description
            limit: Max results
            offset: Pagination offset

        Returns:
            List of jobs
        """
        query = select(Job).options(selectinload(Job.skills).selectinload(JobSkill.skill))

        if recruiter_id:
            query = query.where(Job.recruiter_id == recruiter_id)
        if is_active is not None:
            query = query.where(Job.is_active == is_active)
        if location:
            query = query.where(Job.location.ilike(f"%{location}%"))
        if job_type:
            query = query.where(Job.job_type == job_type)
        if experience_level:
            query = query.where(Job.experience_level == experience_level)
        if search:
            query = query.where(
                (Job.title.ilike(f"%{search}%")) |
                (Job.description.ilike(f"%{search}%"))
            )

        # Get total count
        count_query = select(func.count(Job.id))
        if recruiter_id:
            count_query = count_query.where(Job.recruiter_id == recruiter_id)
        if is_active is not None:
            count_query = count_query.where(Job.is_active == is_active)
        if location:
            count_query = count_query.where(Job.location.ilike(f"%{location}%"))
        if job_type:
            count_query = count_query.where(Job.job_type == job_type)
        if experience_level:
            count_query = count_query.where(Job.experience_level == experience_level)
        if search:
            count_query = count_query.where(
                (Job.title.ilike(f"%{search}%")) |
                (Job.description.ilike(f"%{search}%"))
            )

        total_result = await self.db.execute(count_query)
        total = total_result.scalar() or 0

        # Get paginated results
        query = query.order_by(Job.created_at.desc()).limit(limit).offset(offset)
        result = await self.db.execute(query)
        jobs = result.scalars().all()

        return JobListResponse(
            jobs=[self._job_to_response(job) for job in jobs],
            total=total,
            limit=limit,
            offset=offset,
            page=page,
            page_size=page_size,
        )

    async def update_job(
        self,
        job_id: int,
        recruiter_id: int,
        job_data: JobUpdateRequest,
    ) -> JobResponse:
        """
        Update a job posting.

        Args:
            job_id: Job ID
            recruiter_id: Recruiter ID (for authorization)
            job_data: Update data

        Returns:
            Updated job
        """
        job = await self._get_job(job_id)
        if not job:
            raise_not_found("Job")

        if job.recruiter_id != recruiter_id:
            raise_forbidden("You can only update your own job postings")

        # Update fields
        if job_data.title is not None:
            job.title = job_data.title
        if job_data.description is not None:
            job.description = job_data.description
        if job_data.requirements is not None:
            job.requirements = job_data.requirements
        if job_data.location is not None:
            job.location = job_data.location
        if job_data.salary_min is not None:
            job.salary_min = job_data.salary_min
        if job_data.salary_max is not None:
            job.salary_max = job_data.salary_max
        if job_data.job_type is not None:
            job.job_type = job_data.job_type
        if job_data.experience_level is not None:
            job.experience_level = job_data.experience_level
        if job_data.is_active is not None:
            job.is_active = job_data.is_active

        job.updated_at = datetime.utcnow()

        # Update skills if provided
        if job_data.skills is not None:
            await self._update_job_skills(job.id, job_data.skills)

        await self.db.commit()
        await self.db.refresh(job)

        await self._sync_job_to_rag(job, recruiter_id, replace=True)

        return await self.get_job(job.id)

    async def delete_job(
        self,
        job_id: int,
        recruiter_id: int,
    ) -> None:
        """
        Delete a job posting.

        Args:
            job_id: Job ID
            recruiter_id: Recruiter ID (for authorization)
        """
        job = await self._get_job(job_id)
        if not job:
            raise_not_found("Job")

        if job.recruiter_id != recruiter_id:
            raise_forbidden("You can only delete your own job postings")

        if settings.enable_rag_ingestion:
            try:
                from app.rag.ingestion import get_document_ingester

                ingester = get_document_ingester()
                ingester.delete_job(job.id)
            except Exception as e:
                print(f"Warning: Failed to delete job from RAG system: {e}")

        await self.db.delete(job)
        await self.db.commit()

    async def toggle_job_status(self, job_id: int, recruiter_id: int) -> JobResponse:
        """Toggle a job posting's active status."""
        job = await self._get_job(job_id)
        if not job:
            raise_not_found("Job")

        if job.recruiter_id != recruiter_id:
            raise_forbidden("You can only update your own job postings")

        job.is_active = not job.is_active
        job.updated_at = datetime.utcnow()
        await self.db.commit()
        await self.db.refresh(job)
        return await self.get_job(job.id)

    async def _sync_job_to_rag(self, job: Job, recruiter_id: int, replace: bool = False) -> None:
        """Index a job in RAG when explicitly enabled."""
        if not settings.enable_rag_ingestion:
            return

        try:
            from app.rag.ingestion import get_document_ingester

            ingester = get_document_ingester()
            if replace:
                ingester.delete_job(job.id)
            ingester.ingest_job(
                job_id=job.id,
                recruiter_id=recruiter_id,
                title=job.title,
                description=job.description,
                requirements=job.requirements,
                location=job.location,
            )
        except Exception as e:
            print(f"Warning: Failed to sync job with RAG system: {e}")

    async def _get_job(self, job_id: int) -> Optional[Job]:
        """Get job by ID."""
        result = await self.db.execute(
            select(Job).where(Job.id == job_id)
        )
        return result.scalar_one_or_none()

    async def _get_job_with_skills(self, job_id: int) -> Optional[Job]:
        """Get job with skills loaded."""
        result = await self.db.execute(
            select(Job)
            .options(selectinload(Job.skills).selectinload(JobSkill.skill))
            .where(Job.id == job_id)
        )
        return result.scalar_one_or_none()

    async def _add_job_skills(self, job_id: int, skills: List[str]) -> None:
        """Add skills to a job."""
        for skill_data in skills:
            skill_name = skill_data.get("skill_name") if isinstance(skill_data, dict) else skill_data
            if not skill_name:
                continue

            # Get or create skill
            skill = await self._get_or_create_skill(skill_name)

            # Check if job already has this skill
            existing = await self.db.execute(
                select(JobSkill).where(
                    JobSkill.job_id == job_id,
                    JobSkill.skill_id == skill.id,
                )
            )
            if not existing.scalar_one_or_none():
                job_skill = JobSkill(
                    job_id=job_id,
                    skill_id=skill.id,
                    is_required=True,
                )
                self.db.add(job_skill)

    async def _update_job_skills(self, job_id: int, skills: List[str]) -> None:
        """Update job skills (replace all)."""
        # Delete existing skills
        result = await self.db.execute(
            select(JobSkill).where(JobSkill.job_id == job_id)
        )
        for job_skill in result.scalars().all():
            await self.db.delete(job_skill)

        # Add new skills
        await self._add_job_skills(job_id, skills)

    async def _get_or_create_skill(self, skill_name: str) -> Skill:
        """Get existing skill or create new one."""
        from app.utils.skill_normalizer import normalize_skill

        normalized = normalize_skill(skill_name)

        result = await self.db.execute(
            select(Skill).where(Skill.name.ilike(normalized))
        )
        skill = result.scalar_one_or_none()

        if not skill:
            skill = Skill(name=normalized, normalized_name=normalized.lower())
            self.db.add(skill)
            await self.db.flush()

        return skill

    def _job_to_response(self, job: Job) -> JobResponse:
        """Convert Job model to response schema."""
        skills = []
        if hasattr(job, 'skills') and job.skills:
            for js in job.skills:
                if js.skill:
                    skills.append(js.skill.name)

        return JobResponse(
            id=job.id,
            recruiter_id=job.recruiter_id,
            title=job.title,
            description=job.description,
            requirements=job.requirements,
            location=job.location,
            salary_min=float(job.salary_min) if job.salary_min else None,
            salary_max=float(job.salary_max) if job.salary_max else None,
            job_type=job.job_type,
            experience_level=job.experience_level,
            is_active=job.is_active,
            skills=skills,
            created_at=job.created_at,
            updated_at=job.updated_at,
        )

    def _job_to_detail_response(self, job: Job, application_count: int) -> JobDetailResponse:
        """Convert Job model to detail response schema."""
        skills = []
        if hasattr(job, 'skills') and job.skills:
            for js in job.skills:
                if js.skill:
                    skills.append(js.skill.name)

        return JobDetailResponse(
            id=job.id,
            recruiter_id=job.recruiter_id,
            title=job.title,
            description=job.description,
            requirements=job.requirements,
            location=job.location,
            salary_min=float(job.salary_min) if job.salary_min else None,
            salary_max=float(job.salary_max) if job.salary_max else None,
            job_type=job.job_type,
            experience_level=job.experience_level,
            is_active=job.is_active,
            skills=skills,
            application_count=application_count,
            created_at=job.created_at,
            updated_at=job.updated_at,
        )


def get_job_service(db: AsyncSession) -> JobService:
    """Factory function for JobService."""
    return JobService(db)
