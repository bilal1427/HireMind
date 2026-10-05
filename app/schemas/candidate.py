"""
Candidate schemas for HireMind AI API.
"""

from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, EmailStr


# Request schemas
class CandidateCreateRequest(BaseModel):
    """Candidate creation request."""
    email: EmailStr
    password: str = Field(..., min_length=8)
    full_name: str = Field(..., min_length=1, max_length=150)
    phone: Optional[str] = Field(None, max_length=20)
    location: Optional[str] = Field(None, max_length=150)


class CandidateUpdateRequest(BaseModel):
    """Candidate update request."""
    full_name: Optional[str] = Field(None, min_length=1, max_length=150)
    phone: Optional[str] = Field(None, max_length=20)
    location: Optional[str] = Field(None, max_length=150)
    linkedin_url: Optional[str] = Field(None, max_length=500)
    github_url: Optional[str] = Field(None, max_length=500)
    portfolio_url: Optional[str] = Field(None, max_length=500)
    summary: Optional[str] = Field(None, max_length=1000)


# Response schemas
class CandidateResponse(BaseModel):
    """Candidate response."""
    id: int
    user_id: int
    full_name: str
    phone: Optional[str] = None
    location: Optional[str] = None
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    portfolio_url: Optional[str] = None
    summary: Optional[str] = None
    skills: List[Dict[str, Any]] = []
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class CandidateDetailResponse(BaseModel):
    """Candidate detail response with resume and stats."""
    id: int
    user_id: int
    full_name: str
    phone: Optional[str] = None
    location: Optional[str] = None
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    portfolio_url: Optional[str] = None
    summary: Optional[str] = None
    skills: List[Dict[str, Any]] = []
    primary_resume: Optional[Dict[str, Any]] = None
    application_stats: Dict[str, int] = {}
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class CandidateListResponse(BaseModel):
    """List of candidates response."""
    candidates: List[CandidateResponse]
    total: int
    limit: int
    offset: int


class CandidateSkillCreate(BaseModel):
    """Candidate skill creation request."""
    skill_name: str = Field(..., min_length=1, max_length=100)
    proficiency_level: Optional[int] = Field(None, ge=1, le=5)
    years_of_experience: Optional[float] = Field(None, ge=0)
    is_primary: bool = False


class CandidateSkillResponse(BaseModel):
    """Candidate skill response."""
    id: int
    skill_id: int
    skill_name: str
    proficiency_level: Optional[int] = None
    years_of_experience: Optional[float] = None
    is_primary: bool

    class Config:
        from_attributes = True


CandidateCreate = CandidateCreateRequest
CandidateUpdate = CandidateUpdateRequest
