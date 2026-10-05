"""
Recruiter schemas for HireMind AI API.
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, EmailStr


# Request schemas
class RecruiterRegisterRequest(BaseModel):
    """Recruiter registration request."""
    email: EmailStr
    password: str = Field(..., min_length=8)
    full_name: str = Field(..., min_length=1, max_length=150)
    phone: Optional[str] = Field(None, max_length=20)
    company_name: str = Field(..., min_length=1, max_length=200)
    designation: Optional[str] = Field(None, max_length=100)


class RecruiterUpdateRequest(BaseModel):
    """Recruiter update request."""
    full_name: Optional[str] = Field(None, min_length=1, max_length=150)
    phone: Optional[str] = Field(None, max_length=20)
    company_name: Optional[str] = Field(None, min_length=1, max_length=200)
    designation: Optional[str] = Field(None, max_length=100)
    company_website: Optional[str] = Field(None, max_length=500)


# Response schemas
class RecruiterResponse(BaseModel):
    """Recruiter response."""
    id: int
    user_id: int
    full_name: str
    phone: Optional[str] = None
    company_name: str
    designation: Optional[str] = None
    company_website: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class RecruiterDetailResponse(BaseModel):
    """Recruiter detail response with stats."""
    id: int
    user_id: int
    full_name: str
    phone: Optional[str] = None
    company_name: str
    designation: Optional[str] = None
    company_website: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


RecruiterRegister = RecruiterRegisterRequest
RecruiterUpdate = RecruiterUpdateRequest
