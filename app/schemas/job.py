"""
Job schemas for HireMind AI API.
"""

from datetime import datetime
from typing import Any, Optional, List
from pydantic import BaseModel, Field
from decimal import Decimal


# Request schemas
class JobCreateRequest(BaseModel):
    """Job creation request."""
    title: str = Field(..., min_length=1, max_length=200)
    description: str = Field(..., min_length=10)
    requirements: Optional[str] = Field(None, max_length=10000)
    location: Optional[str] = Field(None, max_length=150)
    salary_min: Optional[float] = Field(None, ge=0)
    salary_max: Optional[float] = Field(None, ge=0)
    job_type: Optional[str] = Field(None, max_length=50, description="full-time, part-time, contract, remote")
    experience_level: Optional[str] = Field(None, max_length=50, description="entry, mid, senior, lead")
    skills: Optional[List[Any]] = Field(default=[], description="List of required skills")


class JobUpdateRequest(BaseModel):
    """Job update request."""
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, min_length=10)
    requirements: Optional[str] = Field(None, max_length=10000)
    location: Optional[str] = Field(None, max_length=150)
    salary_min: Optional[float] = Field(None, ge=0)
    salary_max: Optional[float] = Field(None, ge=0)
    job_type: Optional[str] = Field(None, max_length=50)
    experience_level: Optional[str] = Field(None, max_length=50)
    skills: Optional[List[Any]] = None
    is_active: Optional[bool] = None


# Response schemas
class JobResponse(BaseModel):
    """Job response."""
    id: int
    recruiter_id: int
    title: str
    description: str
    requirements: Optional[str] = None
    location: Optional[str] = None
    salary_min: Optional[float] = None
    salary_max: Optional[float] = None
    job_type: Optional[str] = None
    experience_level: Optional[str] = None
    is_active: bool
    skills: List[str] = []
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class JobDetailResponse(BaseModel):
    """Job detail response with application count."""
    id: int
    recruiter_id: int
    title: str
    description: str
    requirements: Optional[str] = None
    location: Optional[str] = None
    salary_min: Optional[float] = None
    salary_max: Optional[float] = None
    job_type: Optional[str] = None
    experience_level: Optional[str] = None
    is_active: bool
    skills: List[str] = []
    application_count: int = 0
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class JobListResponse(BaseModel):
    """List of jobs response."""
    jobs: List[JobResponse]
    total: int
    limit: int
    offset: int
    page: int = 1
    page_size: int = 10


JobCreate = JobCreateRequest
JobUpdate = JobUpdateRequest
