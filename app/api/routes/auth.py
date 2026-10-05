"""
Authentication routes for HireMind AI platform.
Handles user registration, login, and profile management.
"""

from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import DBSession, CurrentUser
from app.database.database import get_db
from app.schemas.auth import (
    UserRegisterRequest,
    RecruiterRegisterRequest,
    CandidateRegisterRequest,
    UserLoginRequest,
    AuthResponse,
    UserProfileResponse,
    UserResponse,
)
from app.services.auth_service import AuthService, get_auth_service

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post(
    "/register",
    response_model=AuthResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user",
    description="Register a new user (recruiter or candidate) with email and password."
)
async def register(
    user_data: UserRegisterRequest,
    db: DBSession
) -> AuthResponse:
    """
    Register a new user.

    - **email**: Valid email address
    - **password**: Minimum 8 characters
    - **role**: Must be 'recruiter' or 'candidate'
    - **full_name**: User's full name
    """
    auth_service = get_auth_service(db)

    # Handle role-specific registration
    if user_data.role == "recruiter":
        recruiter_data = RecruiterRegisterRequest(
            email=user_data.email,
            password=user_data.password,
            role=user_data.role,
            full_name=user_data.full_name,
            company_name=getattr(user_data, 'company_name', 'Company'),
        )
        user = await auth_service.register_user(recruiter_data)
    else:
        candidate_data = CandidateRegisterRequest(
            email=user_data.email,
            password=user_data.password,
            role=user_data.role,
            full_name=user_data.full_name,
        )
        user = await auth_service.register_user(candidate_data)

    # Auto-login after registration
    login_data = UserLoginRequest(email=user_data.email, password=user_data.password)
    return await auth_service.login(login_data)


@router.post(
    "/register/recruiter",
    response_model=AuthResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new recruiter",
    description="Register a new recruiter with company information."
)
async def register_recruiter(
    user_data: RecruiterRegisterRequest,
    db: DBSession
) -> AuthResponse:
    """
    Register a new recruiter.

    - **email**: Valid email address
    - **password**: Minimum 8 characters
    - **full_name**: Recruiter's full name
    - **company_name**: Name of the company
    - **phone**: Optional phone number
    - **designation**: Optional job title
    """
    auth_service = get_auth_service(db)
    user = await auth_service.register_user(user_data)

    # Auto-login after registration
    login_data = UserLoginRequest(email=user_data.email, password=user_data.password)
    return await auth_service.login(login_data)


@router.post(
    "/register/candidate",
    response_model=AuthResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new candidate",
    description="Register a new candidate with profile information."
)
async def register_candidate(
    user_data: CandidateRegisterRequest,
    db: DBSession
) -> AuthResponse:
    """
    Register a new candidate.

    - **email**: Valid email address
    - **password**: Minimum 8 characters
    - **full_name**: Candidate's full name
    - **phone**: Optional phone number
    - **location**: Optional location/city
    """
    auth_service = get_auth_service(db)
    user = await auth_service.register_user(user_data)

    # Auto-login after registration
    login_data = UserLoginRequest(email=user_data.email, password=user_data.password)
    return await auth_service.login(login_data)


@router.post(
    "/login",
    response_model=AuthResponse,
    summary="User login",
    description="Authenticate user and return JWT token."
)
async def login(
    credentials: UserLoginRequest,
    db: DBSession
) -> AuthResponse:
    """
    Login with email and password.

    Returns JWT token and user information.
    """
    auth_service = get_auth_service(db)
    return await auth_service.login(credentials)


@router.get(
    "/me",
    response_model=UserProfileResponse,
    summary="Get current user profile",
    description="Get the authenticated user's profile with role-specific information."
)
async def get_current_user(
    current_user: CurrentUser,
    db: DBSession
) -> UserProfileResponse:
    """
    Get current user's profile.

    Requires valid JWT token in Authorization header.
    Returns user details along with recruiter or candidate profile.
    """
    auth_service = get_auth_service(db)
    profile_data = await auth_service.get_current_user_profile(current_user.id)

    return UserProfileResponse(**profile_data)


@router.post(
    "/logout",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="User logout",
    description="Logout user (client should discard token)."
)
async def logout(current_user: CurrentUser) -> None:
    """
    Logout endpoint.

    With JWT, actual logout is handled client-side by discarding the token.
    This endpoint exists for API completeness and potential future token blacklisting.
    """
    # JWT is stateless - client discards token
    # Future: implement token blacklisting for added security
    return None
