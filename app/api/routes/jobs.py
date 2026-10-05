"""
Job routes for HireMind AI platform.
Full CRUD operations with RBAC.
"""

from typing import Annotated, Optional

from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import DBSession, CurrentRecruiter, OptionalCurrentUser
from app.database.database import get_db
from app.database.models.recruiter import Recruiter
from app.schemas.job import JobCreate, JobUpdate, JobResponse, JobListResponse
from app.services.job_service import JobService, get_job_service
from app.services.recruiter_service import RecruiterService, get_recruiter_service

router = APIRouter(prefix="/jobs", tags=["Jobs"])


@router.post(
    "",
    response_model=JobResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new job posting",
    description="Create a new job posting. Requires recruiter role."
)
async def create_job(
    job_data: JobCreate,
    current_user: CurrentRecruiter,
    db: DBSession
) -> JobResponse:
    """
    Create a new job posting.

    - **title**: Job title
    - **description**: Full job description
    - **requirements**: Optional requirements
    - **location**: Optional job location
    - **job_type**: full-time, part-time, contract, remote
    - **experience_level**: entry, mid, senior, lead
    - **skills**: List of required/preferred skills
    """
    # Get recruiter profile
    recruiter_service = get_recruiter_service(db)
    recruiter = await recruiter_service.get_or_create_recruiter_for_user(
        current_user.id,
        current_user.email,
    )

    job_service = get_job_service(db)
    job = await job_service.create_job(recruiter.id, job_data)

    return job


@router.get(
    "",
    response_model=JobListResponse,
    summary="List job postings",
    description="List all job postings with pagination and filters."
)
async def list_jobs(
    db: DBSession,
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(10, ge=1, le=100, description="Items per page"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    search: Optional[str] = Query(None, description="Search in title/description"),
    location: Optional[str] = Query(None, description="Filter by location"),
    job_type: Optional[str] = Query(None, description="Filter by job type"),
    current_user: OptionalCurrentUser = None,
) -> JobListResponse:
    """
    List job postings.

    Public endpoint - shows active jobs to all users.
    Recruiters see their own jobs (including inactive).
    """
    job_service = get_job_service(db)

    # Determine filter based on user role
    recruiter_id = None
    if current_user and current_user.role == "recruiter":
        from app.services.recruiter_service import get_recruiter_service
        recruiter_service = get_recruiter_service(db)
        recruiter = await recruiter_service.get_recruiter_by_user(current_user.id)
        if recruiter:
            recruiter_id = recruiter.id

    # For candidates/public, only show active jobs
    if not recruiter_id:
        is_active = True

    return await job_service.list_jobs(
        limit=page_size,
        offset=(page - 1) * page_size,
        recruiter_id=recruiter_id,
        is_active=is_active,
        search=search,
        location=location,
        job_type=job_type,
        page=page,
        page_size=page_size,
    )


@router.get(
    "/{job_id}",
    response_model=JobResponse,
    summary="Get job details",
    description="Get detailed information about a specific job."
)
async def get_job(
    job_id: int,
    db: DBSession,
    current_user: OptionalCurrentUser = None,
) -> JobResponse:
    """
    Get job details by ID.

    Returns full job information including required skills.
    """
    job_service = get_job_service(db)
    job = await job_service.get_job(job_id)

    return job_service._job_to_response(job)


@router.put(
    "/{job_id}",
    response_model=JobResponse,
    summary="Update job posting",
    description="Update a job posting. Only the job owner can update."
)
async def update_job(
    job_id: int,
    job_data: JobUpdate,
    current_user: CurrentRecruiter,
    db: DBSession
) -> JobResponse:
    """
    Update a job posting.

    Only the recruiter who created the job can update it.
    """
    # Get recruiter profile
    recruiter_service = get_recruiter_service(db)
    recruiter = await recruiter_service.get_or_create_recruiter_for_user(
        current_user.id,
        current_user.email,
    )

    job_service = get_job_service(db)
    job = await job_service.update_job(job_id, recruiter.id, job_data)

    return job


@router.delete(
    "/{job_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete job posting",
    description="Delete a job posting. Only the job owner can delete."
)
async def delete_job(
    job_id: int,
    current_user: CurrentRecruiter,
    db: DBSession
) -> None:
    """
    Delete a job posting.

    Only the recruiter who created the job can delete it.
    """
    recruiter_service = get_recruiter_service(db)
    recruiter = await recruiter_service.get_or_create_recruiter_for_user(
        current_user.id,
        current_user.email,
    )

    job_service = get_job_service(db)
    await job_service.delete_job(job_id, recruiter.id)


@router.post(
    "/{job_id}/toggle-status",
    response_model=JobResponse,
    summary="Toggle job active status",
    description="Activate or deactivate a job posting."
)
async def toggle_job_status(
    job_id: int,
    current_user: CurrentRecruiter,
    db: DBSession
) -> JobResponse:
    """
    Toggle job active status.

    Allows recruiters to quickly activate/deactivate job postings.
    """
    recruiter_service = get_recruiter_service(db)
    recruiter = await recruiter_service.get_or_create_recruiter_for_user(
        current_user.id,
        current_user.email,
    )

    job_service = get_job_service(db)
    job = await job_service.toggle_job_status(job_id, recruiter.id)

    return job
