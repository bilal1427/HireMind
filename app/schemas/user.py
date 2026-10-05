"""
User schemas for HireMind AI platform.
"""

from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


class UserBase(BaseModel):
    """Base user schema."""
    email: EmailStr
    role: str = Field(..., pattern="^(recruiter|candidate)$")


class UserCreate(UserBase):
    """User creation schema."""
    password: str = Field(..., min_length=8, max_length=128)


class UserUpdate(BaseModel):
    """User update schema."""
    email: EmailStr | None = None
    is_active: bool | None = None


class UserInDB(BaseModel):
    """User schema with all database fields."""
    id: int
    email: str
    role: str
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
