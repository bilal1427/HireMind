"""
Matching routes for HireMind AI platform.
Candidate-job matching with explainable scoring.
"""

from typing import Optional

from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import DBSession, CurrentUser, CurrentRecruiter, CurrentCandidate
from app.database.database import get_db
from app.schemas.matching import (
    MatchRequest,
    MatchResponse,
    JobMatchResponse,
    CandidateJobRecommendations,
)
from app.services.matching_service import MatchingService, get_matching_service
from app.services.recruiter_service import RecruiterService, get_recruiter_service

router = APIRouter(prefix="/matching", tags=["Matching"])


@router.post(
    "/analyze",
    response_model=MatchResponse,
    summary="Analyze candidate-job match",
    description="Analyze the match between a candidate and a job with detailed scoring."
)
async def analyze_match(
    request: MatchRequest,
    current_user: CurrentUser,
    db: DBSession
) -> MatchResponse:
    """
    Analyze candidate-job match.

    Returns detailed scoring breakdown:
    - **overall_score**: Weighted total (0-100)
    - **skill_score**: Skill match percentage (40% weight)
    - **experience_score**: Experience match (25% weight)
    - **education_score**: Education match (15% weight)
    - **project_score**: Project relevance (10% weight)
    - **certification_score**: Certification bonus (10% weight)
    - **matched_skills**: Skills that match
    - **missing_skills**: Required skills not found
    - **recommendation**: highly_recommended, recommended, consider, not_recommended
    - **explanation**: Human-readable explanation
    """
    matching_service = get_matching_service(db)
    return await matching_service.analyze_match(request)


@router.get(
    "/job/{job_id}",
    response_model=JobMatchResponse,
    summary="Get ranked candidates for a job",
    description="Get all candidates ranked by match score for a specific job (recruiter only)."
)
async def get_candidates_for_job(
    job_id: int,
    current_user: CurrentRecruiter,
    db: DBSession,
    min_score: Optional[float] = Query(None, ge=0, le=100, description="Minimum score filter"),
    limit: int = Query(50, ge=1, le=100, description="Maximum results"),
) -> JobMatchResponse:
    """
    Get ranked candidates for a job.

    Recruiters can view all candidates ranked by match score
    for jobs they own.

    Scores are cached from previous analysis or calculated on-demand.
    """
    # Get recruiter
    recruiter_service = get_recruiter_service(db)
    recruiter = await recruiter_service.get_recruiter_by_user(current_user.id)

    if not recruiter:
        from app.core.exceptions import raise_not_found
        raise_not_found("Recruiter profile")

    matching_service = get_matching_service(db)
    return await matching_service.get_candidates_for_job(
        job_id=job_id,
        recruiter_id=recruiter.id,
        min_score=min_score,
        limit=limit,
    )


@router.get(
    "/candidate/{candidate_id}",
    response_model=CandidateJobRecommendations,
    summary="Get recommended jobs for a candidate",
    description="Get job recommendations for a candidate."
)
async def get_jobs_for_candidate(
    candidate_id: int,
    current_user: CurrentUser,
    db: DBSession,
    min_score: Optional[float] = Query(None, ge=0, le=100, description="Minimum score filter"),
    limit: int = Query(20, ge=1, le=50, description="Maximum results"),
) -> CandidateJobRecommendations:
    """
    Get recommended jobs for a candidate.

    Candidates can view job recommendations based on their profile.
    """
    matching_service = get_matching_service(db)
    return await matching_service.get_jobs_for_candidate(
        candidate_id=candidate_id,
        min_score=min_score,
        limit=limit,
    )


@router.get(
    "/my-recommendations",
    response_model=CandidateJobRecommendations,
    summary="Get job recommendations for current candidate",
    description="Get personalized job recommendations."
)
async def get_my_recommendations(
    current_user: CurrentCandidate,
    db: DBSession,
    min_score: Optional[float] = Query(None, ge=0, le=100),
    limit: int = Query(20, ge=1, le=50),
) -> CandidateJobRecommendations:
    """
    Get personalized job recommendations.

    Returns jobs ranked by match score based on your profile.
    """
    from app.services.candidate_service import CandidateService, get_candidate_service

    candidate_service = get_candidate_service(db)
    candidate = await candidate_service.get_candidate_by_user(current_user.id)

    if not candidate:
        from app.core.exceptions import raise_not_found
        raise_not_found("Candidate profile")

    matching_service = get_matching_service(db)
    return await matching_service.get_jobs_for_candidate(
        candidate_id=candidate.id,
        min_score=min_score,
        limit=limit,
    )
