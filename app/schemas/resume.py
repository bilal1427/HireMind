"""
Resume schemas for HireMind AI platform.
"""

from datetime import datetime
from typing import Optional, Any

from pydantic import BaseModel, Field


class ResumeUploadResponse(BaseModel):
    """Response after resume upload."""
    id: int
    file_name: str
    file_size: int
    is_parsed: bool
    parsing_error: Optional[str]
    message: str

    model_config = {"from_attributes": True}


class ParsedResumeData(BaseModel):
    """Parsed resume data structure."""
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    education: list[dict] = Field(default_factory=list)
    experience: list[dict] = Field(default_factory=list)
    skills: list[str] = Field(default_factory=list)
    projects: list[dict] = Field(default_factory=list)
    certifications: list[dict] = Field(default_factory=list)
    languages: list[str] = Field(default_factory=list)


class ResumeResponse(BaseModel):
    """Full resume response."""
    id: int
    candidate_id: int
    file_name: str
    file_size: int
    mime_type: str
    is_parsed: bool
    parsed_name: Optional[str]
    parsed_email: Optional[str]
    parsed_phone: Optional[str]
    parsed_skills: Optional[list[str]] = None
    parsing_error: Optional[str]
    is_primary: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class ResumeListResponse(BaseModel):
    """List of resumes for a candidate."""
    resumes: list[ResumeResponse]
    total: int


class ResumeDetailResponse(ResumeResponse):
    """Detailed resume with full parsed content."""
    parsed_text: Optional[str]
    parsed_education: Optional[list[dict]]
    parsed_experience: Optional[list[dict]]
    parsed_projects: Optional[list[dict]]
    parsed_certifications: Optional[list[dict]]
