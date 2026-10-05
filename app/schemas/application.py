"""
Application schemas for HireMind AI API.
"""

from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


# Request schemas
class ApplicationCreateRequest(BaseModel):
    """Application creation request."""
    job_id: int
    cover_letter: Optional[str] = Field(None, max_length=5000)


class ApplicationUpdateRequest(BaseModel):
    """Application status update request."""
    status: str = Field(..., description="pending, reviewed, interview_scheduled, hired, rejected, withdrawn")
    notes: Optional[str] = Field(None, max_length=1000)


# Response schemas
class ApplicationResponse(BaseModel):
    """Application response."""
    id: int
    candidate_id: int
    job_id: int
    status: str
    cover_letter: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime
    status_updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ApplicationDetailResponse(BaseModel):
    """Application detail response with related data."""
    id: int
    candidate_id: int
    job_id: int
    status: str
    cover_letter: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime
    status_updated_at: Optional[datetime] = None
    candidate: Optional[Dict[str, Any]] = None
    job: Optional[Dict[str, Any]] = None
    match_score: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True


class ApplicationListResponse(BaseModel):
    """List of applications response."""
    applications: List[ApplicationResponse]
    total: int
    limit: int
    offset: int


ApplicationCreate = ApplicationCreateRequest
ApplicationUpdateStatus = ApplicationUpdateRequest
