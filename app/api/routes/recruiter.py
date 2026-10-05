"""
Recruiter routes for HireMind AI platform.
Handles recruiter profile management.
"""

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import DBSession, CurrentRecruiter
from app.database.database import get_db
from app.schemas.recruiter import RecruiterUpdate, RecruiterResponse
from app.services.recruiter_service import RecruiterService, get_recruiter_service

router = APIRouter(prefix="/recruiters", tags=["Recruiters"])


@router.get(
    "/me",
    response_model=RecruiterResponse,
    summary="Get current recruiter profile",
    description="Get the profile of the currently authenticated recruiter."
)
async def get_my_profile(
    current_user: CurrentRecruiter,
    db: DBSession
) -> RecruiterResponse:
    """
    Get current recruiter's profile.

    Returns full profile including company information.
    """
    recruiter_service = get_recruiter_service(db)
    return await recruiter_service.get_recruiter_profile(current_user.id)


@router.put(
    "/me",
    response_model=RecruiterResponse,
    summary="Update recruiter profile",
    description="Update the current recruiter's profile."
)
async def update_my_profile(
    update_data: RecruiterUpdate,
    current_user: CurrentRecruiter,
    db: DBSession
) -> RecruiterResponse:
    """
    Update recruiter profile.

    - **full_name**: Full name
    - **company_name**: Company name
    - **phone**: Phone number
    - **designation**: Job title
    - **bio**: Bio/About
    """
    recruiter_service = get_recruiter_service(db)
    await recruiter_service.update_profile(current_user.id, update_data)
    return await recruiter_service.get_recruiter_profile(current_user.id)
