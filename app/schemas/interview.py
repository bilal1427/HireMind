"""
Interview schemas for HireMind AI API.
"""

from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


# Request schemas
class InterviewCreateRequest(BaseModel):
    """Interview creation request."""
    application_id: int
    scheduled_at: datetime
    duration_minutes: int = Field(default=60, ge=15, le=480)
    interview_type: str = Field(..., description="phone, video, onsite")
    location: Optional[str] = None
    meeting_link: Optional[str] = None
    notes: Optional[str] = None


class InterviewUpdateRequest(BaseModel):
    """Interview update request."""
    scheduled_at: Optional[datetime] = None
    duration_minutes: Optional[int] = Field(None, ge=15, le=480)
    interview_type: Optional[str] = None
    location: Optional[str] = None
    meeting_link: Optional[str] = None
    notes: Optional[str] = None
    status: Optional[str] = Field(None, description="scheduled, completed, cancelled")


class FeedbackCreateRequest(BaseModel):
    """Interview feedback creation request."""
    rating: int = Field(..., ge=1, le=5)
    strengths: Optional[str] = None
    weaknesses: Optional[str] = None
    technical_score: Optional[int] = Field(None, ge=1, le=5)
    communication_score: Optional[int] = Field(None, ge=1, le=5)
    culture_fit_score: Optional[int] = Field(None, ge=1, le=5)
    recommendation: str = Field(..., description="hire, no_hire, maybe")
    notes: Optional[str] = None


# Response schemas
class InterviewResponse(BaseModel):
    """Interview response."""
    id: int
    application_id: int
    scheduled_at: datetime
    duration_minutes: int
    interview_type: str
    location: Optional[str] = None
    meeting_link: Optional[str] = None
    status: str
    notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class FeedbackResponse(BaseModel):
    """Interview feedback response."""
    id: int
    interview_id: int
    recruiter_id: int
    rating: int
    strengths: Optional[str] = None
    weaknesses: Optional[str] = None
    technical_score: Optional[int] = None
    communication_score: Optional[int] = None
    culture_fit_score: Optional[int] = None
    recommendation: str
    notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class InterviewDetailResponse(BaseModel):
    """Interview detail response with related data."""
    id: int
    application_id: int
    scheduled_at: datetime
    duration_minutes: int
    interview_type: str
    location: Optional[str] = None
    meeting_link: Optional[str] = None
    status: str
    notes: Optional[str] = None
    created_at: datetime
    candidate: Optional[dict] = None
    job: Optional[dict] = None
    feedback: Optional[FeedbackResponse] = None

    class Config:
        from_attributes = True


class InterviewListResponse(BaseModel):
    """List of interviews response."""
    interviews: List[InterviewResponse]
    total: int
    limit: int
    offset: int


InterviewCreate = InterviewCreateRequest
InterviewUpdate = InterviewUpdateRequest
InterviewFeedbackCreate = FeedbackCreateRequest
InterviewFeedbackResponse = FeedbackResponse
