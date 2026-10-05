"""
Schemas module for HireMind AI platform.
Pydantic models for request validation and response serialization.
"""

from app.schemas.auth import (
    UserRegisterRequest,
    RecruiterRegisterRequest,
    CandidateRegisterRequest,
    UserLoginRequest,
    TokenResponse,
    UserResponse,
    UserProfileResponse,
    AuthResponse,
    PasswordChangeRequest,
    PasswordResetRequest,
    PasswordResetConfirm,
)
from app.schemas.user import UserBase, UserCreate, UserUpdate, UserInDB

__all__ = [
    # Auth schemas
    "UserRegisterRequest",
    "RecruiterRegisterRequest",
    "CandidateRegisterRequest",
    "UserLoginRequest",
    "TokenResponse",
    "UserResponse",
    "UserProfileResponse",
    "AuthResponse",
    "PasswordChangeRequest",
    "PasswordResetRequest",
    "PasswordResetConfirm",
    # User schemas
    "UserBase",
    "UserCreate",
    "UserUpdate",
    "UserInDB",
]
