"""
Matching service for HireMind AI platform.
Explainable candidate-job matching with weighted scoring.
"""

import json
from datetime import datetime
from typing import Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database.models.candidate import Candidate
from app.database.models.job import Job
from app.database.models.skill import Skill, CandidateSkill, JobSkill
from app.database.models.application import Application
from app.database.models.candidate_score import CandidateScore
from app.schemas.matching import (
    MatchRequest,
    MatchResponse,
    ScoreBreakdown,
    JobMatchResponse,
    CandidateMatchResult,
    CandidateJobRecommendations,
    JobRecommendation,
)
from app.core.exceptions import raise_not_found
from app.utils.skill_normalizer import normalize_skill, SkillNormalizer


class MatchingService:
    """
    Service for candidate-job matching.

    Scoring weights:
    - Skill Match: 40%
    - Experience: 25%
    - Education: 15%
    - Projects: 10%
    - Certifications: 10%
    """

    WEIGHTS = {
        "skill": 0.40,
        "experience": 0.25,
        "education": 0.15,
        "project": 0.10,
        "certification": 0.10,
    }

    def __init__(self, db: AsyncSession):
        self.db = db
        self.skill_normalizer = SkillNormalizer()

    async def analyze_match(
        self,
        request: MatchRequest,
        save_result: bool = True,
    ) -> MatchResponse:
        """
        Analyze match between candidate and job.

        Args:
            request: Match request with candidate_id and job_id
            save_result: Whether to save result to database

        Returns:
            MatchResponse with detailed scoring
        """
        # Get candidate with skills
        candidate = await self._get_candidate_with_skills(request.candidate_id)
        if not candidate:
            raise_not_found("Candidate")

        # Get job with skills
        job = await self._get_job_with_skills(request.job_id)
        if not job:
            raise_not_found("Job")

        # Calculate individual scores
        skill_score, matched_skills, missing_skills = await self._calculate_skill_score(
            candidate, job
        )
        experience_score = await self._calculate_experience_score(candidate, job)
        education_score = await self._calculate_education_score(candidate, job)
        project_score = await self._calculate_project_score(candidate, job)
        certification_score = await self._calculate_certification_score(candidate, job)

        # Calculate overall score
        scores = ScoreBreakdown(
            skill_score=skill_score,
            experience_score=experience_score,
            education_score=education_score,
            project_score=project_score,
            certification_score=certification_score,
        )

        overall_score = scores.weighted_total

        # Generate recommendation
        recommendation = self._generate_recommendation(overall_score)

        # Generate explanation
        explanation = self._generate_explanation(
            overall_score, scores, matched_skills, missing_skills, recommendation
        )

        # Skill gap analysis
        skill_gap_analysis = {
            "matched_count": len(matched_skills),
            "missing_count": len(missing_skills),
            "total_required": len(matched_skills) + len(missing_skills),
            "match_percentage": round(
                (len(matched_skills) / (len(matched_skills) + len(missing_skills)) * 100)
                if (len(matched_skills) + len(missing_skills)) > 0 else 0,
                1
            ),
        }

        # Save result if requested
        if save_result:
            await self._save_match_result(
                candidate_id=request.candidate_id,
                job_id=request.job_id,
                overall_score=overall_score,
                scores=scores,
                matched_skills=matched_skills,
                missing_skills=missing_skills,
                skill_gap_analysis=skill_gap_analysis,
                recommendation=recommendation,
                explanation=explanation,
            )

        return MatchResponse(
            candidate_id=request.candidate_id,
            job_id=request.job_id,
            overall_score=round(overall_score, 1),
            scores=scores,
            matched_skills=matched_skills,
            missing_skills=missing_skills,
            skill_gap_analysis=skill_gap_analysis,
            recommendation=recommendation,
            explanation=explanation,
            scoring_method="heuristic",
            model_version="1.0.0",
            created_at=datetime.utcnow(),
        )

    async def get_candidates_for_job(
        self,
        job_id: int,
        recruiter_id: int,
        min_score: Optional[float] = None,
        limit: int = 50,
    ) -> JobMatchResponse:
        """
        Get ranked candidates for a job.

        Args:
            job_id: Job ID
            recruiter_id: Recruiter ID (for authorization)
            min_score: Minimum score filter
            limit: Maximum results

        Returns:
            JobMatchResponse with ranked candidates
        """
        # Get job
        job = await self._get_job_with_skills(job_id)
        if not job:
            raise_not_found("Job")

        # Verify ownership
        if job.recruiter_id != recruiter_id:
            from app.core.exceptions import raise_forbidden
            raise_forbidden("You can only view candidates for your own jobs")

        # Get existing scores
        result = await self.db.execute(
            select(CandidateScore)
            .where(CandidateScore.job_id == job_id)
            .order_by(CandidateScore.overall_score.desc())
            .limit(limit)
        )
        scores = result.scalars().all()

        candidates = []
        for score in scores:
            if min_score and score.overall_score < min_score:
                continue

            candidate = await self._get_candidate(score.candidate_id)

            matched_skills = []
            missing_skills = []
            if score.matched_skills:
                matched_skills = json.loads(score.matched_skills)
            if score.missing_skills:
                missing_skills = json.loads(score.missing_skills)

            candidates.append(CandidateMatchResult(
                candidate_id=score.candidate_id,
                candidate_name=candidate.full_name if candidate else "Unknown",
                overall_score=round(score.overall_score, 1),
                recommendation=score.recommendation or "consider",
                matched_skills=matched_skills,
                missing_skills=missing_skills,
            ))

        return JobMatchResponse(
            job_id=job_id,
            job_title=job.title,
            candidates=candidates,
            total_candidates=len(candidates),
        )

    async def get_jobs_for_candidate(
        self,
        candidate_id: int,
        min_score: Optional[float] = None,
        limit: int = 20,
    ) -> CandidateJobRecommendations:
        """Get recommended jobs for a candidate."""
        # Get candidate
        candidate = await self._get_candidate(candidate_id)
        if not candidate:
            raise_not_found("Candidate")

        # Get scores for this candidate
        result = await self.db.execute(
            select(CandidateScore)
            .where(CandidateScore.candidate_id == candidate_id)
            .order_by(CandidateScore.overall_score.desc())
            .limit(limit)
        )
        scores = result.scalars().all()

        recommendations = []
        for score in scores:
            if min_score and score.overall_score < min_score:
                continue

            job = await self._get_job(score.job_id)
            if not job or not job.is_active:
                continue

            recruiter = await self._get_recruiter(job.recruiter_id)

            matched_skills = json.loads(score.matched_skills) if score.matched_skills else []

            recommendations.append(JobRecommendation(
                job_id=score.job_id,
                job_title=job.title,
                company_name=recruiter.company_name if recruiter else "Unknown",
                location=job.location,
                overall_score=round(score.overall_score, 1),
                recommendation=score.recommendation or "consider",
                matched_skills=matched_skills,
            ))

        return CandidateJobRecommendations(
            candidate_id=candidate_id,
            recommendations=recommendations,
            total=len(recommendations),
        )

    async def _calculate_skill_score(
        self,
        candidate: Candidate,
        job: Job,
    ) -> tuple[float, list[str], list[str]]:
        """
        Calculate skill match score.

        Returns:
            Tuple of (score, matched_skills, missing_skills)
        """
        # Get candidate skills
        candidate_skill_names = set()
        for cs in candidate.candidate_skills:
            normalized = normalize_skill(cs.skill.name)
            candidate_skill_names.add(normalized.lower())

        # Get job required skills
        job_skill_names = set()
        for js in job.skills:
            normalized = normalize_skill(js.skill.name)
            job_skill_names.add(normalized.lower())

        # Calculate matches
        matched = candidate_skill_names.intersection(job_skill_names)
        missing = job_skill_names - candidate_skill_names

        # Score based on match ratio
        if len(job_skill_names) == 0:
            score = 50.0  # Default score if no skills required
        else:
            score = (len(matched) / len(job_skill_names)) * 100

        return score, list(matched), list(missing)

    async def _calculate_experience_score(
        self,
        candidate: Candidate,
        job: Job,
    ) -> float:
        """Calculate experience match score."""
        # For MVP, use a heuristic based on skill proficiency and years
        total_years = 0.0
        skill_count = 0

        for cs in candidate.candidate_skills:
            if cs.years_of_experience:
                total_years += cs.years_of_experience
                skill_count += 1

        avg_years = total_years / skill_count if skill_count > 0 else 0

        # Map years to score
        if avg_years >= 5:
            return 90.0
        elif avg_years >= 3:
            return 75.0
        elif avg_years >= 1:
            return 60.0
        else:
            return 40.0

    async def _calculate_education_score(
        self,
        candidate: Candidate,
        job: Job,
    ) -> float:
        """Calculate education match score."""
        # For MVP, return a default score
        # In a full implementation, would parse education from resume
        return 60.0

    async def _calculate_project_score(
        self,
        candidate: Candidate,
        job: Job,
    ) -> float:
        """Calculate project match score."""
        # For MVP, return a default score
        return 50.0

    async def _calculate_certification_score(
        self,
        candidate: Candidate,
        job: Job,
    ) -> float:
        """Calculate certification match score."""
        # For MVP, return a default score
        return 50.0

    def _generate_recommendation(self, overall_score: float) -> str:
        """Generate recommendation based on score."""
        if overall_score >= 80:
            return "highly_recommended"
        elif overall_score >= 65:
            return "recommended"
        elif overall_score >= 45:
            return "consider"
        else:
            return "not_recommended"

    def _generate_explanation(
        self,
        overall_score: float,
        scores: ScoreBreakdown,
        matched_skills: list[str],
        missing_skills: list[str],
        recommendation: str,
    ) -> str:
        """Generate human-readable explanation."""
        parts = []

        if overall_score >= 80:
            parts.append("Excellent match for this position.")
        elif overall_score >= 65:
            parts.append("Good match with some areas to consider.")
        elif overall_score >= 45:
            parts.append("Moderate match with notable gaps.")
        else:
            parts.append("Limited match for this position.")

        # Skill analysis
        if matched_skills:
            parts.append(
                f"Strong alignment in {len(matched_skills)} skill(s): {', '.join(matched_skills[:5])}."
            )

        if missing_skills:
            parts.append(
                f"Missing {len(missing_skills)} required skill(s): {', '.join(missing_skills[:5])}."
            )

        # Score breakdown
        if scores.skill_score >= 70:
            parts.append("Technical skills are well-aligned.")
        elif scores.skill_score < 50:
            parts.append("Technical skills need development.")

        return " ".join(parts)

    async def _save_match_result(
        self,
        candidate_id: int,
        job_id: int,
        overall_score: float,
        scores: ScoreBreakdown,
        matched_skills: list[str],
        missing_skills: list[str],
        skill_gap_analysis: dict,
        recommendation: str,
        explanation: str,
    ) -> CandidateScore:
        """Save match result to database."""
        # Check if score already exists
        existing = await self.db.execute(
            select(CandidateScore).where(
                CandidateScore.candidate_id == candidate_id,
                CandidateScore.job_id == job_id,
            )
        )
        score_record = existing.scalar_one_or_none()

        if score_record:
            # Update existing
            score_record.overall_score = overall_score
            score_record.skill_score = scores.skill_score
            score_record.experience_score = scores.experience_score
            score_record.education_score = scores.education_score
            score_record.project_score = scores.project_score
            score_record.certification_score = scores.certification_score
            score_record.matched_skills = json.dumps(matched_skills)
            score_record.missing_skills = json.dumps(missing_skills)
            score_record.skill_gap_analysis = json.dumps(skill_gap_analysis)
            score_record.recommendation = recommendation
            score_record.explanation = explanation
        else:
            # Create new
            score_record = CandidateScore(
                candidate_id=candidate_id,
                job_id=job_id,
                overall_score=overall_score,
                skill_score=scores.skill_score,
                experience_score=scores.experience_score,
                education_score=scores.education_score,
                project_score=scores.project_score,
                certification_score=scores.certification_score,
                matched_skills=json.dumps(matched_skills),
                missing_skills=json.dumps(missing_skills),
                skill_gap_analysis=json.dumps(skill_gap_analysis),
                recommendation=recommendation,
                explanation=explanation,
                scoring_method="heuristic",
                model_version="1.0.0",
            )
            self.db.add(score_record)

        await self.db.commit()
        return score_record

    async def _get_candidate_with_skills(self, candidate_id: int) -> Optional[Candidate]:
        """Get candidate with skills loaded."""
        result = await self.db.execute(
            select(Candidate)
            .options(selectinload(Candidate.candidate_skills).selectinload(CandidateSkill.skill))
            .where(Candidate.id == candidate_id)
        )
        return result.scalar_one_or_none()

    async def _get_candidate(self, candidate_id: int) -> Optional[Candidate]:
        """Get candidate by ID."""
        result = await self.db.execute(
            select(Candidate).where(Candidate.id == candidate_id)
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

    async def _get_job(self, job_id: int) -> Optional[Job]:
        """Get job by ID."""
        result = await self.db.execute(
            select(Job).where(Job.id == job_id)
        )
        return result.scalar_one_or_none()

    async def _get_recruiter(self, recruiter_id: int) -> Optional[any]:
        """Get recruiter by ID."""
        from app.database.models.recruiter import Recruiter
        result = await self.db.execute(
            select(Recruiter).where(Recruiter.id == recruiter_id)
        )
        return result.scalar_one_or_none()


def get_matching_service(db: AsyncSession) -> MatchingService:
    """Factory function for MatchingService."""
    return MatchingService(db)
