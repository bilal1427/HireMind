"""
Candidate routes for HireMind AI platform.
Handles candidate profile management.
"""

from typing import Optional

from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import DBSession, CurrentCandidate, CurrentUser, CurrentRecruiter
from app.database.database import get_db
from app.schemas.candidate import (
    CandidateUpdate,
    CandidateResponse,
    CandidateListResponse,
    CandidateSkillCreate,
    CandidateSkillResponse,
)
from app.services.candidate_service import CandidateService, get_candidate_service

router = APIRouter(prefix="/candidates", tags=["Candidates"])


@router.get(
    "/me",
    response_model=CandidateResponse,
    summary="Get current candidate profile",
    description="Get the profile of the currently authenticated candidate."
)
async def get_my_profile(
    current_user: CurrentCandidate,
    db: DBSession
) -> CandidateResponse:
    """
    Get current candidate's profile.

    Returns full profile including skills and contact information.
    """
    candidate_service = get_candidate_service(db)
    return await candidate_service.get_candidate_profile(current_user.id)


@router.put(
    "/me",
    response_model=CandidateResponse,
    summary="Update candidate profile",
    description="Update the current candidate's profile."
)
async def update_my_profile(
    update_data: CandidateUpdate,
    current_user: CurrentCandidate,
    db: DBSession
) -> CandidateResponse:
    """
    Update candidate profile.

    - **full_name**: Full name
    - **phone**: Phone number
    - **location**: City/Location
    - **bio**: Bio/Summary
    """
    candidate_service = get_candidate_service(db)
    await candidate_service.update_profile(current_user.id, update_data)
    return await candidate_service.get_candidate_profile(current_user.id)


@router.post(
    "/me/skills",
    response_model=CandidateSkillResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add skill to profile",
    description="Add a skill to the candidate's profile."
)
async def add_skill(
    skill_data: CandidateSkillCreate,
    current_user: CurrentCandidate,
    db: DBSession
) -> CandidateSkillResponse:
    """
    Add a skill to profile.

    - **skill_name**: Name of the skill
    - **proficiency_level**: Skill level (1-5)
    - **years_of_experience**: Years of experience
    - **is_primary**: Mark as primary skill
    """
    candidate_service = get_candidate_service(db)
    candidate_skill = await candidate_service.add_skill(current_user.id, skill_data)

    return CandidateSkillResponse(
        id=candidate_skill.id,
        skill_id=candidate_skill.skill_id,
        skill_name=candidate_skill.skill.name,
        proficiency_level=candidate_skill.proficiency_level,
        years_of_experience=candidate_skill.years_of_experience,
        is_primary=candidate_skill.is_primary,
    )


@router.delete(
    "/me/skills/{skill_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Remove skill from profile",
    description="Remove a skill from the candidate's profile."
)
async def remove_skill(
    skill_id: int,
    current_user: CurrentCandidate,
    db: DBSession
) -> None:
    """Remove a skill from profile."""
    candidate_service = get_candidate_service(db)
    await candidate_service.remove_skill(current_user.id, skill_id)


@router.get(
    "/",
    response_model=CandidateListResponse,
    summary="List candidates",
    description="List all candidates with pagination and filters (recruiter only)."
)
async def list_candidates(
    db: DBSession,
    current_user: CurrentRecruiter,
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    search: Optional[str] = Query(None, description="Search in name/bio"),
    location: Optional[str] = Query(None, description="Filter by location"),
    skill: Optional[str] = Query(None, description="Filter by skill"),
) -> CandidateListResponse:
    """
    List candidates.

    Recruiters can browse and search candidates.
    """
    candidate_service = get_candidate_service(db)
    return await candidate_service.list_candidates(
        page=page,
        page_size=page_size,
        search=search,
        location=location,
        skill=skill,
    )


@router.get(
    "/{candidate_id}",
    response_model=CandidateResponse,
    summary="Get candidate details",
    description="Get detailed information about a candidate (recruiter only)."
)
async def get_candidate(
    candidate_id: int,
    current_user: CurrentRecruiter,
    db: DBSession
) -> CandidateResponse:
    """
    Get candidate details.

    Recruiters can view candidate profiles.
    """
    candidate_service = get_candidate_service(db)
    candidate = await candidate_service.get_candidate(candidate_id)
    return candidate_service._candidate_to_response(candidate)
