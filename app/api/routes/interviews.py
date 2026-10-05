"""
Interview routes for HireMind AI platform.
Handles interview scheduling and feedback.
"""

from typing import Optional

from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import DBSession, CurrentUser, CurrentRecruiter, CurrentCandidate
from app.database.database import get_db
from app.schemas.interview import (
    InterviewCreate,
    InterviewUpdate,
    InterviewResponse,
    InterviewListResponse,
    InterviewFeedbackCreate,
    InterviewFeedbackResponse,
)
from app.services.interview_service import InterviewService, get_interview_service

router = APIRouter(prefix="/interviews", tags=["Interviews"])


@router.post(
    "/",
    response_model=InterviewResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Schedule an interview",
    description="Schedule an interview for an application (recruiter only)."
)
async def schedule_interview(
    interview_data: InterviewCreate,
    current_user: CurrentRecruiter,
    db: DBSession
) -> InterviewResponse:
    """
    Schedule an interview.

    - **application_id**: ID of the application
    - **interview_type**: phone, video, onsite, technical, behavioral, final
    - **scheduled_at**: Date and time of interview
    - **duration_minutes**: Duration in minutes (default: 60)
    - **location**: Physical location or meeting link
    - **meeting_link**: Video conference link
    - **notes**: Additional notes
    """
    interview_service = get_interview_service(db)
    interview = await interview_service.schedule_interview(current_user.id, interview_data)

    # Get enriched response
    result = await interview_service._enrich_interviews([interview])
    return result[0]


@router.get(
    "/",
    response_model=InterviewListResponse,
    summary="List interviews",
    description="List interviews (recruiters see their own, candidates see their own)."
)
async def list_interviews(
    db: DBSession,
    current_user: CurrentUser,
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    status: Optional[str] = Query(None, description="Filter by status"),
) -> InterviewListResponse:
    """
    List interviews.

    - Recruiters see interviews they scheduled
    - Candidates see their own interviews
    """
    interview_service = get_interview_service(db)

    if current_user.role == "recruiter":
        return await interview_service.list_interviews_recruiter(
            user_id=current_user.id,
            page=page,
            page_size=page_size,
            status=status,
        )
    else:  # candidate
        return await interview_service.list_interviews_candidate(
            user_id=current_user.id,
            page=page,
            page_size=page_size,
            status=status,
        )


@router.get(
    "/{interview_id}",
    response_model=InterviewResponse,
    summary="Get interview details",
    description="Get detailed information about an interview."
)
async def get_interview(
    interview_id: int,
    current_user: CurrentUser,
    db: DBSession
) -> InterviewResponse:
    """
    Get interview details.

    Both recruiters and candidates can view interview details.
    """
    interview_service = get_interview_service(db)
    interview = await interview_service.get_interview(interview_id)

    result = await interview_service._enrich_interviews([interview])
    return result[0]


@router.put(
    "/{interview_id}",
    response_model=InterviewResponse,
    summary="Update interview",
    description="Update interview details (recruiter only)."
)
async def update_interview(
    interview_id: int,
    update_data: InterviewUpdate,
    current_user: CurrentRecruiter,
    db: DBSession
) -> InterviewResponse:
    """
    Update interview.

    Only the recruiter who scheduled the interview can update it.
    """
    interview_service = get_interview_service(db)
    interview = await interview_service.update_interview(
        user_id=current_user.id,
        interview_id=interview_id,
        update_data=update_data,
    )

    result = await interview_service._enrich_interviews([interview])
    return result[0]


@router.post(
    "/{interview_id}/feedback",
    response_model=InterviewFeedbackResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add interview feedback",
    description="Add feedback for a completed interview (recruiter only)."
)
async def add_feedback(
    interview_id: int,
    feedback_data: InterviewFeedbackCreate,
    current_user: CurrentRecruiter,
    db: DBSession
) -> InterviewFeedbackResponse:
    """
    Add interview feedback.

    - **rating**: Overall rating (1-5)
    - **technical_skills**: Technical skills score (1-5)
    - **communication**: Communication score (1-5)
    - **cultural_fit**: Cultural fit score (1-5)
    - **problem_solving**: Problem solving score (1-5)
    - **strengths**: Candidate's strengths
    - **weaknesses**: Areas for improvement
    - **recommendation**: strong_yes, yes, neutral, no, strong_no
    - **summary**: Overall summary
    """
    interview_service = get_interview_service(db)
    feedback = await interview_service.add_feedback(
        user_id=current_user.id,
        interview_id=interview_id,
        feedback_data=feedback_data,
    )

    return feedback
