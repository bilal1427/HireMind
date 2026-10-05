"""
Authentication service for HireMind AI platform.
Handles user registration, login, and token management.
"""

from datetime import timedelta

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.constants.roles import UserRole
from app.core.config import settings
from app.core.exceptions import raise_conflict, raise_unauthorized
from app.core.security import hash_password, verify_password, create_access_token
from app.database.models.candidate import Candidate
from app.database.models.recruiter import Recruiter
from app.database.models.user import User
from app.schemas.auth import (
    UserRegisterRequest,
    RecruiterRegisterRequest,
    CandidateRegisterRequest,
    UserLoginRequest,
    AuthResponse,
    UserResponse,
)


class AuthService:
    """Service class for authentication operations."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def register_user(self, user_data: UserRegisterRequest) -> User:
        """
        Register a new user with the specified role.

        Args:
            user_data: User registration data

        Returns:
            Created User object

        Raises:
            HTTPException: 409 if email already exists
        """
        # Check if email already exists
        existing_user = await self._get_user_by_email(user_data.email)
        if existing_user:
            raise_conflict("Email already registered")

        # Create user
        hashed_password = hash_password(user_data.password)
        user = User(
            email=user_data.email,
            password_hash=hashed_password,
            role=user_data.role,
        )
        self.db.add(user)
        await self.db.flush()  # Get user.id without committing

        # Create role-specific profile
        if user_data.role == UserRole.RECRUITER.value:
            recruiter_data = user_data if isinstance(user_data, RecruiterRegisterRequest) else None
            if recruiter_data:
                recruiter = Recruiter(
                    user_id=user.id,
                    full_name=recruiter_data.full_name,
                    company_name=recruiter_data.company_name,
                    phone=getattr(recruiter_data, 'phone', None),
                    designation=getattr(recruiter_data, 'designation', None),
                )
                self.db.add(recruiter)
        elif user_data.role == UserRole.CANDIDATE.value:
            candidate_data = user_data if isinstance(user_data, CandidateRegisterRequest) else None
            if candidate_data:
                candidate = Candidate(
                    user_id=user.id,
                    full_name=candidate_data.full_name,
                    phone=getattr(candidate_data, 'phone', None),
                    location=getattr(candidate_data, 'location', None),
                )
                self.db.add(candidate)

        await self.db.commit()
        await self.db.refresh(user)

        return user

    async def login(self, credentials: UserLoginRequest) -> AuthResponse:
        """
        Authenticate user and return token.

        Args:
            credentials: Login credentials

        Returns:
            AuthResponse with token and user info

        Raises:
            HTTPException: 401 if credentials invalid
        """
        user = await self._get_user_by_email(credentials.email)

        if not user:
            raise_unauthorized("Invalid email or password")

        if not user.is_active:
            raise_unauthorized("Account is deactivated")

        if not verify_password(credentials.password, user.password_hash):
            raise_unauthorized("Invalid email or password")

        # Create access token
        access_token = create_access_token(
            data={"sub": str(user.id), "role": user.role}
        )

        return AuthResponse(
            access_token=access_token,
            token_type="bearer",
            expires_in=settings.access_token_expire_minutes * 60,
            user=UserResponse.model_validate(user)
        )

    async def get_current_user_profile(self, user_id: int) -> dict:
        """
        Get the current user's profile with role-specific data.

        Args:
            user_id: User ID

        Returns:
            Dictionary with user and profile data
        """
        user = await self._get_user_by_id(user_id)
        if not user:
            raise_unauthorized("User not found")

        profile_data = {
            "user": UserResponse.model_validate(user),
            "profile": None
        }

        if user.role == UserRole.RECRUITER.value:
            result = await self.db.execute(
                select(Recruiter).where(Recruiter.user_id == user.id)
            )
            recruiter = result.scalar_one_or_none()
            if recruiter:
                profile_data["profile"] = {
                    "full_name": recruiter.full_name,
                    "company_name": recruiter.company_name,
                    "phone": recruiter.phone,
                    "designation": recruiter.designation,
                    "bio": recruiter.bio,
                }
        elif user.role == UserRole.CANDIDATE.value:
            result = await self.db.execute(
                select(Candidate).where(Candidate.user_id == user.id)
            )
            candidate = result.scalar_one_or_none()
            if candidate:
                profile_data["profile"] = {
                    "full_name": candidate.full_name,
                    "phone": candidate.phone,
                    "location": candidate.location,
                    "bio": candidate.bio,
                }

        return profile_data

    async def _get_user_by_email(self, email: str) -> User | None:
        """Fetch user by email."""
        result = await self.db.execute(
            select(User).where(User.email == email.lower())
        )
        return result.scalar_one_or_none()

    async def _get_user_by_id(self, user_id: int) -> User | None:
        """Fetch user by ID."""
        result = await self.db.execute(
            select(User).where(User.id == user_id)
        )
        return result.scalar_one_or_none()


# Factory function for dependency injection
def get_auth_service(db: AsyncSession) -> AuthService:
    """Factory function to create AuthService instance."""
    return AuthService(db)
