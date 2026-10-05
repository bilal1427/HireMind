"""
Authentication schemas for HireMind AI platform.
Pydantic models for request validation and response serialization.
"""

from datetime import datetime

from pydantic import BaseModel, EmailStr, Field, field_validator


class UserRegisterRequest(BaseModel):
    """User registration request schema."""
    email: EmailStr = Field(..., description="User's email address")
    password: str = Field(..., min_length=8, max_length=128, description="Password (min 8 characters)")
    role: str = Field(..., description="User role: 'recruiter' or 'candidate'")
    full_name: str = Field(..., min_length=2, max_length=150, description="User's full name")

    @field_validator("role")
    @classmethod
    def validate_role(cls, v: str) -> str:
        """Validate that role is either recruiter or candidate."""
        from app.constants.roles import VALID_ROLES
        if v.lower() not in VALID_ROLES:
            raise ValueError(f"Role must be one of: {', '.join(VALID_ROLES)}")
        return v.lower()


class RecruiterRegisterRequest(UserRegisterRequest):
    """Recruiter-specific registration request."""
    role: str = "recruiter"
    company_name: str = Field(..., min_length=2, max_length=200, description="Company name")
    phone: str | None = Field(None, max_length=20, description="Phone number")
    designation: str | None = Field(None, max_length=100, description="Job title/designation")


class CandidateRegisterRequest(UserRegisterRequest):
    """Candidate-specific registration request."""
    role: str = "candidate"
    phone: str | None = Field(None, max_length=20, description="Phone number")
    location: str | None = Field(None, max_length=150, description="Location/City")


class UserLoginRequest(BaseModel):
    """User login request schema."""
    email: EmailStr = Field(..., description="User's email address")
    password: str = Field(..., description="User's password")


class TokenResponse(BaseModel):
    """JWT token response schema."""
    access_token: str = Field(..., description="JWT access token")
    token_type: str = Field(default="bearer", description="Token type")
    expires_in: int = Field(..., description="Token expiration in seconds")


class UserResponse(BaseModel):
    """User response schema (without sensitive data)."""
    id: int
    email: str
    role: str
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class UserProfileResponse(BaseModel):
    """Extended user profile with role-specific data."""
    user: UserResponse
    profile: dict | None = None  # Will contain candidate or recruiter details


class AuthResponse(BaseModel):
    """Authentication response with token and user info."""
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserResponse


class PasswordChangeRequest(BaseModel):
    """Password change request schema."""
    current_password: str = Field(..., description="Current password")
    new_password: str = Field(..., min_length=8, max_length=128, description="New password")


class PasswordResetRequest(BaseModel):
    """Password reset request schema."""
    email: EmailStr = Field(..., description="Email address for password reset")


class PasswordResetConfirm(BaseModel):
    """Password reset confirmation schema."""
    token: str = Field(..., description="Password reset token")
    new_password: str = Field(..., min_length=8, max_length=128, description="New password")
