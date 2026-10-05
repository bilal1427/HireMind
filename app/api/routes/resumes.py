"""
Resume routes for HireMind AI platform.
Handles resume upload, parsing, and management.
"""

from typing import Annotated

from fastapi import APIRouter, Depends, status, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import DBSession, CurrentCandidate
from app.database.database import get_db
from app.schemas.resume import ResumeUploadResponse, ResumeListResponse, ResumeResponse
from app.services.resume_service import ResumeService, get_resume_service

router = APIRouter(prefix="/resumes", tags=["Resumes"])


@router.post(
    "/upload",
    response_model=ResumeUploadResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload resume",
    description="Upload and parse a resume (PDF or DOCX)."
)
async def upload_resume(
    current_user: CurrentCandidate,
    db: DBSession,
    file: UploadFile = File(..., description="Resume file (PDF or DOCX)"),
    is_primary: bool = Form(False, description="Set as primary resume"),
) -> ResumeUploadResponse:
    """
    Upload and parse a resume.

    Supported formats: PDF, DOCX
    Maximum file size: 5MB

    The resume will be automatically parsed to extract:
    - Contact information (name, email, phone)
    - Education
    - Work experience
    - Skills
    - Projects
    - Certifications
    """
    resume_service = get_resume_service(db)
    return await resume_service.upload_resume(current_user.id, file, is_primary)


@router.get(
    "/",
    response_model=ResumeListResponse,
    summary="List resumes",
    description="List all resumes for the current candidate."
)
async def list_resumes(
    current_user: CurrentCandidate,
    db: DBSession
) -> ResumeListResponse:
    """
    List all uploaded resumes for the current candidate.
    """
    resume_service = get_resume_service(db)
    return await resume_service.list_resumes(current_user.id)


@router.get(
    "/{resume_id}",
    response_model=ResumeResponse,
    summary="Get resume details",
    description="Get detailed information about a specific resume."
)
async def get_resume(
    resume_id: int,
    current_user: CurrentCandidate,
    db: DBSession
) -> ResumeResponse:
    """
    Get resume details by ID.

    Returns parsed resume information including extracted skills.
    """
    resume_service = get_resume_service(db)
    resume = await resume_service.get_resume(resume_id, current_user.id)
    return resume_service._resume_to_response(resume)


@router.delete(
    "/{resume_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete resume",
    description="Delete a resume."
)
async def delete_resume(
    resume_id: int,
    current_user: CurrentCandidate,
    db: DBSession
) -> None:
    """
    Delete a resume.

    Permanently deletes the resume file and all associated data.
    """
    resume_service = get_resume_service(db)
    await resume_service.delete_resume(resume_id, current_user.id)


@router.post(
    "/{resume_id}/set-primary",
    response_model=ResumeResponse,
    summary="Set primary resume",
    description="Set a resume as the primary resume."
)
async def set_primary_resume(
    resume_id: int,
    current_user: CurrentCandidate,
    db: DBSession
) -> ResumeResponse:
    """
    Set a resume as primary.

    The primary resume is used for job applications by default.
    """
    resume_service = get_resume_service(db)
    resume = await resume_service.set_primary_resume(resume_id, current_user.id)
    return resume_service._resume_to_response(resume)


@router.post(
    "/{resume_id}/reparse",
    response_model=ResumeResponse,
    summary="Re-parse resume",
    description="Re-parse a resume to update extracted information."
)
async def reparse_resume(
    resume_id: int,
    current_user: CurrentCandidate,
    db: DBSession
) -> ResumeResponse:
    """
    Re-parse a resume.

    Useful if the parsing didn't extract information correctly.
    May improve results as the parser is updated.
    """
    resume_service = get_resume_service(db)
    resume = await resume_service.reparse_resume(resume_id, current_user.id)
    return resume_service._resume_to_response(resume)
