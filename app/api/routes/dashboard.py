"""
Dashboard routes for HireMind AI platform.
Analytics and overview endpoints.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import DBSession, CurrentRecruiter, CurrentCandidate
from app.database.database import get_db
from app.schemas.dashboard import RecruiterDashboard, CandidateDashboard
from app.services.dashboard_service import DashboardService, get_dashboard_service

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get(
    "/recruiter",
    response_model=RecruiterDashboard,
    summary="Recruiter dashboard",
    description="Get analytics and overview for recruiter dashboard."
)
async def recruiter_dashboard(
    current_user: CurrentRecruiter,
    db: DBSession
) -> RecruiterDashboard:
    """
    Get recruiter dashboard data.

    Returns:
    - Active and total jobs count
    - Total applications
    - Applications by status
    - Upcoming interviews
    - Recent candidates
    """
    dashboard_service = get_dashboard_service(db)
    return await dashboard_service.get_recruiter_dashboard(current_user.id)


@router.get(
    "/candidate",
    response_model=CandidateDashboard,
    summary="Candidate dashboard",
    description="Get analytics and overview for candidate dashboard."
)
async def candidate_dashboard(
    current_user: CurrentCandidate,
    db: DBSession
) -> CandidateDashboard:
    """
    Get candidate dashboard data.

    Returns:
    - Application status overview
    - Upcoming interviews
    - Profile completeness
    - Recommended jobs
    """
    dashboard_service = get_dashboard_service(db)
    return await dashboard_service.get_candidate_dashboard(current_user.id)
