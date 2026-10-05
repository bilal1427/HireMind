"""
Security module for HireMind AI platform.
Handles password hashing, JWT token creation and validation.
"""

from datetime import datetime, timedelta, timezone
from typing import Any

from bcrypt import hashpw, gensalt, checkpw
from jose import JWTError, jwt

from app.core.config import settings


def hash_password(password: str) -> str:
    """
    Hash a password using bcrypt.

    Args:
        password: Plain text password

    Returns:
        Hashed password string
    """
    salt = gensalt()
    hashed = hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a password against its hash.

    Args:
        plain_password: Plain text password to verify
        hashed_password: Stored password hash

    Returns:
        True if password matches, False otherwise
    """
    return checkpw(
        plain_password.encode("utf-8"),
        hashed_password.encode("utf-8")
    )


def create_access_token(
    data: dict[str, Any],
    expires_delta: timedelta | None = None
) -> str:
    """
    Create a JWT access token.

    Args:
        data: Payload data to encode in the token
        expires_delta: Optional custom expiration time

    Returns:
        Encoded JWT token string
    """
    to_encode = data.copy()

    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            minutes=settings.access_token_expire_minutes
        )

    to_encode.update({
        "exp": expire,
        "iat": datetime.now(timezone.utc)
    })

    encoded_jwt = jwt.encode(
        to_encode,
        settings.jwt_secret_key,
        algorithm=settings.jwt_algorithm
    )

    return encoded_jwt


def decode_access_token(token: str) -> dict[str, Any] | None:
    """
    Decode and validate a JWT access token.

    Args:
        token: JWT token string

    Returns:
        Decoded payload if valid, None if invalid or expired
    """
    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret_key,
            algorithms=[settings.jwt_algorithm]
        )
        return payload
    except JWTError:
        return None


def create_password_reset_token(email: str) -> str:
    """
    Create a password reset token (for future use).

    Args:
        email: User's email address

    Returns:
        Password reset token
    """
    delta = timedelta(hours=24)  # Reset tokens valid for 24 hours
    return create_access_token(
        data={"sub": email, "type": "password_reset"},
        expires_delta=delta
    )


def verify_password_reset_token(token: str) -> str | None:
    """
    Verify a password reset token.

    Args:
        token: Password reset token

    Returns:
        Email if valid, None otherwise
    """
    payload = decode_access_token(token)
    if payload is None:
        return None

    if payload.get("type") != "password_reset":
        return None

    return payload.get("sub")
