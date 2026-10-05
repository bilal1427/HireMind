"""
FastAPI dependencies for HireMind AI platform.
Provides authentication, authorization, and database session dependencies.
"""

from typing import Annotated, Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.constants.roles import UserRole, VALID_ROLES
from app.core.exceptions import raise_unauthorized, raise_forbidden
from app.core.security import decode_access_token
from app.database.database import get_db
from app.database.models.user import User


# HTTP Bearer token scheme
security = HTTPBearer(auto_error=False)
optional_security = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: Annotated[Optional[HTTPAuthorizationCredentials], Depends(security)],
    db: Annotated[AsyncSession, Depends(get_db)]
) -> User:
    """
    Extract and validate the current authenticated user from JWT token.

    Args:
        credentials: Bearer token from Authorization header
        db: Database session

    Returns:
        User object if authentication successful

    Raises:
        HTTPException: 401 if token invalid or user not found
    """
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authenticated",
        )

    token = credentials.credentials

    payload = decode_access_token(token)
    if payload is None:
        raise_unauthorized("Could not validate credentials")

    user_id: int | None = payload.get("sub")
    if user_id is None:
        raise_unauthorized("Invalid token payload")

    # Convert sub to int
    try:
        user_id = int(user_id)
    except (ValueError, TypeError):
        raise_unauthorized("Invalid user identifier in token")

    # Fetch user from database
    result = await db.execute(
        select(User).where(User.id == user_id)
    )
    user = result.scalar_one_or_none()

    if user is None:
        raise_unauthorized("User not found")

    if not user.is_active:
        raise_unauthorized("User account is deactivated")

    return user


async def get_optional_current_user(
    credentials: Annotated[Optional[HTTPAuthorizationCredentials], Depends(optional_security)],
    db: Annotated[AsyncSession, Depends(get_db)]
) -> Optional[User]:
    """Return the current user when a valid bearer token is supplied."""
    if credentials is None:
        return None
    return await get_current_user(credentials, db)


async def get_current_active_user(
    current_user: Annotated[User, Depends(get_current_user)]
) -> User:
    """
    Verify that the current user is active.
    This is redundant with get_current_user check but provides explicit dependency.

    Args:
        current_user: Current authenticated user

    Returns:
        User if active

    Raises:
        HTTPException: 401 if user inactive
    """
    if not current_user.is_active:
        raise_unauthorized("Inactive user")
    return current_user


def require_role(required_role: UserRole):
    """
    Dependency factory that enforces role-based authorization.

    Usage:
        @router.post("/jobs")
        async def create_job(
            user: User = Depends(require_role(UserRole.RECRUITER))
        ):
            ...

    Args:
        required_role: The UserRole required to access the endpoint

    Returns:
        Dependency function that validates role
    """
    async def role_checker(
        current_user: Annotated[User, Depends(get_current_user)]
    ) -> User:
        if current_user.role != required_role.value:
            raise_forbidden(
                f"This action requires {required_role.value} role. "
                f"You have {current_user.role} role."
            )
        return current_user

    return role_checker


def require_roles(required_roles: list[UserRole]):
    """
    Dependency factory that allows multiple roles.

    Args:
        required_roles: List of UserRoles that can access the endpoint

    Returns:
        Dependency function that validates role membership
    """
    async def roles_checker(
        current_user: Annotated[User, Depends(get_current_user)]
    ) -> User:
        role_values = [role.value for role in required_roles]
        if current_user.role not in role_values:
            raise_forbidden(
                f"This action requires one of: {', '.join(role_values)}"
            )
        return current_user

    return roles_checker


# Convenience dependencies for common roles
require_recruiter = require_role(UserRole.RECRUITER)
require_candidate = require_role(UserRole.CANDIDATE)


# Type aliases for cleaner function signatures
DBSession = Annotated[AsyncSession, Depends(get_db)]
CurrentUser = Annotated[User, Depends(get_current_user)]
OptionalCurrentUser = Annotated[Optional[User], Depends(get_optional_current_user)]
CurrentRecruiter = Annotated[User, Depends(require_recruiter)]
CurrentCandidate = Annotated[User, Depends(require_candidate)]
