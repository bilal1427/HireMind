"""
Application routes for HireMind AI platform.
Handles job applications and status management.
"""

from typing import Optional

from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import DBSession, CurrentUser, CurrentCandidate, CurrentRecruiter
from app.database.database import get_db
from app.schemas.application import (
    ApplicationCreate,
    ApplicationUpdateStatus,
    ApplicationResponse,
    ApplicationListResponse,
)
from app.services.application_service import ApplicationService, get_application_service

router = APIRouter(prefix="/applications", tags=["Applications"])


@router.post(
    "/",
    response_model=ApplicationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Apply for a job",
    description="Submit an application for a job posting."
)
async def apply_for_job(
    application_data: ApplicationCreate,
    current_user: CurrentCandidate,
    db: DBSession
) -> ApplicationResponse:
    """
    Apply for a job.

    - **job_id**: ID of the job to apply for
    - **resume_id**: Optional resume ID (uses primary if not specified)
    - **cover_letter**: Optional cover letter text
    """
    application_service = get_application_service(db)
    application = await application_service.apply_for_job(current_user.id, application_data)

    # Get enriched response
    result = await application_service.get_application(application.id)
    return (await application_service._enrich_applications([result]))[0]


@router.get(
    "/",
    response_model=ApplicationListResponse,
    summary="List applications",
    description="List applications (candidates see their own, recruiters see applications for their jobs)."
)
async def list_applications(
    db: DBSession,
    current_user: CurrentUser,
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    status: Optional[str] = Query(None, description="Filter by status"),
    job_id: Optional[int] = Query(None, description="Filter by job (recruiter only)"),
) -> ApplicationListResponse:
    """
    List applications.

    - Candidates see their own applications
    - Recruiters see applications for their jobs
    """
    application_service = get_application_service(db)

    if current_user.role == "candidate":
        return await application_service.list_applications_candidate(
            user_id=current_user.id,
            page=page,
            page_size=page_size,
            status=status,
        )
    else:  # recruiter
        return await application_service.list_applications_recruiter(
            user_id=current_user.id,
            page=page,
            page_size=page_size,
            job_id=job_id,
            status=status,
        )


@router.get(
    "/{application_id}",
    response_model=ApplicationResponse,
    summary="Get application details",
    description="Get detailed information about an application."
)
async def get_application(
    application_id: int,
    current_user: CurrentUser,
    db: DBSession
) -> ApplicationResponse:
    """
    Get application details.

    Candidates can view their own applications.
    Recruiters can view applications for their jobs.
    """
    application_service = get_application_service(db)
    application = await application_service.get_application(application_id)

    # Authorization is handled in the service
    return application


@router.put(
    "/{application_id}/status",
    response_model=ApplicationResponse,
    summary="Update application status",
    description="Update the status of an application (recruiter only)."
)
async def update_application_status(
    application_id: int,
    update_data: ApplicationUpdateStatus,
    current_user: CurrentRecruiter,
    db: DBSession
) -> ApplicationResponse:
    """
    Update application status.

    Only recruiters can update status, and only for their own job postings.

    Valid status transitions:
    - applied → screening, rejected
    - screening → shortlisted, rejected
    - shortlisted → interview, rejected
    - interview → selected, rejected
    """
    application_service = get_application_service(db)
    application = await application_service.update_status(
        user_id=current_user.id,
        application_id=application_id,
        update_data=update_data,
    )

    return application
