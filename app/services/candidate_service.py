"""
Candidate service for HireMind AI platform.
Handles candidate profile management.
"""

from typing import Optional, List

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database.models.candidate import Candidate
from app.database.models.skill import Skill, CandidateSkill
from app.database.models.resume import Resume
from app.database.models.application import Application
from app.schemas.candidate import (
    CandidateCreateRequest,
    CandidateUpdateRequest,
    CandidateResponse,
    CandidateListResponse,
    CandidateDetailResponse,
)
from app.core.exceptions import raise_not_found


class CandidateService:
    """Service for candidate operations."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_candidate(self, candidate_id: int) -> CandidateDetailResponse:
        """
        Get candidate profile by ID.

        Args:
            candidate_id: Candidate ID

        Returns:
            Candidate profile
        """
        candidate = await self._get_candidate_with_skills(candidate_id)
        if not candidate:
            raise_not_found("Candidate")

        # Get primary resume
        primary_resume = await self._get_primary_resume(candidate_id)

        # Get application stats
        stats = await self._get_application_stats(candidate_id)

        return self._candidate_to_detail_response(candidate, primary_resume, stats)

    async def get_candidate_by_user(self, user_id: int) -> Optional[Candidate]:
        """Get candidate by user ID."""
        result = await self.db.execute(
            select(Candidate).where(Candidate.user_id == user_id)
        )
        return result.scalar_one_or_none()

    async def update_candidate(
        self,
        user_id: int,
        update_data: CandidateUpdateRequest,
    ) -> CandidateResponse:
        """
        Update candidate profile.

        Args:
            user_id: User ID
            update_data: Update data

        Returns:
            Updated candidate
        """
        candidate = await self.get_candidate_by_user(user_id)
        if not candidate:
            raise_not_found("Candidate profile")

        # Update fields
        if update_data.full_name is not None:
            candidate.full_name = update_data.full_name
        if update_data.phone is not None:
            candidate.phone = update_data.phone
        if update_data.location is not None:
            candidate.location = update_data.location
        if update_data.linkedin_url is not None:
            candidate.linkedin_url = update_data.linkedin_url
        if update_data.github_url is not None:
            candidate.github_url = update_data.github_url
        if update_data.portfolio_url is not None:
            candidate.portfolio_url = update_data.portfolio_url
        if update_data.summary is not None:
            candidate.summary = update_data.summary

        await self.db.commit()
        await self.db.refresh(candidate)

        return self._candidate_to_response(candidate)

    async def list_candidates(
        self,
        recruiter_id: Optional[int] = None,
        skill: Optional[str] = None,
        location: Optional[str] = None,
        search: Optional[str] = None,
        limit: int = 20,
        offset: int = 0,
    ) -> CandidateListResponse:
        """
        List candidates with filters.

        Args:
            recruiter_id: Filter by recruiter (candidates who applied to their jobs)
            skill: Filter by skill
            location: Filter by location
            search: Search in name and summary
            limit: Max results
            offset: Pagination offset

        Returns:
            List of candidates
        """
        query = select(Candidate).options(
            selectinload(Candidate.candidate_skills).selectinload(CandidateSkill.skill)
        )

        # If recruiter_id, only show candidates who applied to their jobs
        if recruiter_id:
            from app.database.models.job import Job
            subquery = (
                select(Application.candidate_id)
                .join(Job, Application.job_id == Job.id)
                .where(Job.recruiter_id == recruiter_id)
                .distinct()
            )
            query = query.where(Candidate.id.in_(subquery))

        if location:
            query = query.where(Candidate.location.ilike(f"%{location}%"))
        if search:
            query = query.where(
                (Candidate.full_name.ilike(f"%{search}%")) |
                (Candidate.summary.ilike(f"%{search}%"))
            )
        if skill:
            skill_filter = select(CandidateSkill.candidate_id).join(Skill).where(
                Skill.name.ilike(f"%{skill}%")
            )
            query = query.where(Candidate.id.in_(skill_filter))

        # Get total count
        count_query = select(func.count(Candidate.id))
        if recruiter_id:
            from app.database.models.job import Job
            subquery = (
                select(Application.candidate_id)
                .join(Job, Application.job_id == Job.id)
                .where(Job.recruiter_id == recruiter_id)
                .distinct()
            )
            count_query = count_query.where(Candidate.id.in_(subquery))
        if location:
            count_query = count_query.where(Candidate.location.ilike(f"%{location}%"))
        if search:
            count_query = count_query.where(
                (Candidate.full_name.ilike(f"%{search}%")) |
                (Candidate.summary.ilike(f"%{search}%"))
            )
        if skill:
            skill_filter = select(CandidateSkill.candidate_id).join(Skill).where(
                Skill.name.ilike(f"%{skill}%")
            )
            count_query = count_query.where(Candidate.id.in_(skill_filter))

        total_result = await self.db.execute(count_query)
        total = total_result.scalar() or 0

        # Get paginated results
        query = query.order_by(Candidate.created_at.desc()).limit(limit).offset(offset)
        result = await self.db.execute(query)
        candidates = result.scalars().all()

        return CandidateListResponse(
            candidates=[self._candidate_to_response(c) for c in candidates],
            total=total,
            limit=limit,
            offset=offset,
        )

    async def add_skill_to_candidate(
        self,
        candidate_id: int,
        skill_name: str,
        years_of_experience: Optional[float] = None,
        proficiency_level: Optional[str] = None,
    ) -> None:
        """
        Add a skill to a candidate.

        Args:
            candidate_id: Candidate ID
            skill_name: Skill name
            years_of_experience: Optional years of experience
            proficiency_level: Optional proficiency level
        """
        # Get or create skill
        skill = await self._get_or_create_skill(skill_name)

        # Check if candidate already has this skill
        existing = await self.db.execute(
            select(CandidateSkill).where(
                CandidateSkill.candidate_id == candidate_id,
                CandidateSkill.skill_id == skill.id,
            )
        )
        if not existing.scalar_one_or_none():
            candidate_skill = CandidateSkill(
                candidate_id=candidate_id,
                skill_id=skill.id,
                years_of_experience=years_of_experience,
                proficiency_level=proficiency_level,
                is_primary=True,
            )
            self.db.add(candidate_skill)
            await self.db.commit()

    async def remove_skill_from_candidate(
        self,
        candidate_id: int,
        skill_name: str,
    ) -> None:
        """Remove a skill from a candidate."""
        skill = await self._get_skill_by_name(skill_name)
        if not skill:
            return

        result = await self.db.execute(
            select(CandidateSkill).where(
                CandidateSkill.candidate_id == candidate_id,
                CandidateSkill.skill_id == skill.id,
            )
        )
        candidate_skill = result.scalar_one_or_none()
        if candidate_skill:
            await self.db.delete(candidate_skill)
            await self.db.commit()

    async def _get_candidate_with_skills(self, candidate_id: int) -> Optional[Candidate]:
        """Get candidate with skills loaded."""
        result = await self.db.execute(
            select(Candidate)
            .options(
                selectinload(Candidate.candidate_skills).selectinload(CandidateSkill.skill)
            )
            .where(Candidate.id == candidate_id)
        )
        return result.scalar_one_or_none()

    async def _get_primary_resume(self, candidate_id: int) -> Optional[Resume]:
        """Get primary resume for candidate."""
        result = await self.db.execute(
            select(Resume).where(
                Resume.candidate_id == candidate_id,
                Resume.is_primary == True,
            )
        )
        return result.scalar_one_or_none()

    async def _get_application_stats(self, candidate_id: int) -> dict:
        """Get application statistics for candidate."""
        total = await self.db.execute(
            select(func.count(Application.id)).where(
                Application.candidate_id == candidate_id
            )
        )
        total_count = total.scalar() or 0

        pending = await self.db.execute(
            select(func.count(Application.id)).where(
                Application.candidate_id == candidate_id,
                Application.status == "pending",
            )
        )
        pending_count = pending.scalar() or 0

        return {
            "total_applications": total_count,
            "pending_applications": pending_count,
        }

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

    async def _get_skill_by_name(self, skill_name: str) -> Optional[Skill]:
        """Get skill by name."""
        from app.utils.skill_normalizer import normalize_skill

        normalized = normalize_skill(skill_name)
        result = await self.db.execute(
            select(Skill).where(Skill.name.ilike(normalized))
        )
        return result.scalar_one_or_none()

    def _candidate_to_response(self, candidate: Candidate) -> CandidateResponse:
        """Convert Candidate model to response schema."""
        skills = []
        if candidate.candidate_skills:
            for cs in candidate.candidate_skills:
                if cs.skill:
                    skills.append({
                        "name": cs.skill.name,
                        "years_of_experience": cs.years_of_experience,
                        "proficiency_level": cs.proficiency_level,
                    })

        return CandidateResponse(
            id=candidate.id,
            user_id=candidate.user_id,
            full_name=candidate.full_name,
            phone=candidate.phone,
            location=candidate.location,
            linkedin_url=candidate.linkedin_url,
            github_url=candidate.github_url,
            portfolio_url=candidate.portfolio_url,
            summary=candidate.summary,
            skills=skills,
            created_at=candidate.created_at,
            updated_at=candidate.updated_at,
        )

    def _candidate_to_detail_response(
        self,
        candidate: Candidate,
        primary_resume: Optional[Resume],
        stats: dict,
    ) -> CandidateDetailResponse:
        """Convert Candidate model to detail response schema."""
        skills = []
        if candidate.candidate_skills:
            for cs in candidate.candidate_skills:
                if cs.skill:
                    skills.append({
                        "name": cs.skill.name,
                        "years_of_experience": cs.years_of_experience,
                        "proficiency_level": cs.proficiency_level,
                    })

        resume_data = None
        if primary_resume:
            import json
            resume_data = {
                "id": primary_resume.id,
                "file_name": primary_resume.file_name,
                "parsed_name": primary_resume.parsed_name,
                "parsed_email": primary_resume.parsed_email,
                "parsed_phone": primary_resume.parsed_phone,
                "parsed_skills": json.loads(primary_resume.parsed_skills) if primary_resume.parsed_skills else [],
            }

        return CandidateDetailResponse(
            id=candidate.id,
            user_id=candidate.user_id,
            full_name=candidate.full_name,
            phone=candidate.phone,
            location=candidate.location,
            linkedin_url=candidate.linkedin_url,
            github_url=candidate.github_url,
            portfolio_url=candidate.portfolio_url,
            summary=candidate.summary,
            skills=skills,
            primary_resume=resume_data,
            application_stats=stats,
            created_at=candidate.created_at,
            updated_at=candidate.updated_at,
        )


def get_candidate_service(db: AsyncSession) -> CandidateService:
    """Factory function for CandidateService."""
    return CandidateService(db)
