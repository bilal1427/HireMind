"""
Custom exceptions for HireMind AI platform.
Provides consistent error responses across the application.
"""

from fastapi import HTTPException, status


class HireMindException(Exception):
    """Base exception for HireMind AI."""
    def __init__(self, message: str, status_code: int = status.HTTP_400_BAD_REQUEST):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)


class AuthenticationError(HireMindException):
    """Raised when authentication fails."""
    def __init__(self, message: str = "Could not validate credentials"):
        super().__init__(message, status.HTTP_401_UNAUTHORIZED)


class AuthorizationError(HireMindException):
    """Raised when user lacks permission for an action."""
    def __init__(self, message: str = "Not authorized to perform this action"):
        super().__init__(message, status.HTTP_403_FORBIDDEN)


class NotFoundError(HireMindException):
    """Raised when a requested resource is not found."""
    def __init__(self, resource: str = "Resource"):
        super().__init__(f"{resource} not found", status.HTTP_404_NOT_FOUND)


class ConflictError(HireMindException):
    """Raised when there's a conflict with existing data."""
    def __init__(self, message: str = "Resource already exists"):
        super().__init__(message, status.HTTP_409_CONFLICT)


class ValidationError(HireMindException):
    """Raised when input validation fails."""
    def __init__(self, message: str = "Validation error"):
        super().__init__(message, status.HTTP_422_UNPROCESSABLE_ENTITY)


class BusinessLogicError(HTTPException):
    """Raised when a request violates a business rule."""
    def __init__(self, message: str = "Business rule violation"):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=message,
        )


class FileUploadError(HireMindException):
    """Raised when file upload/validation fails."""
    def __init__(self, message: str = "File upload failed"):
        super().__init__(message, status.HTTP_400_BAD_REQUEST)


class InvalidStatusTransitionError(HireMindException):
    """Raised when an invalid status transition is attempted."""
    def __init__(self, current_status: str, new_status: str):
        super().__init__(
            f"Cannot transition from '{current_status}' to '{new_status}'",
            status.HTTP_400_BAD_REQUEST
        )


# Helper functions to raise HTTP exceptions
def raise_not_found(resource: str = "Resource") -> None:
    """Raise a 404 Not Found HTTP exception."""
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=f"{resource} not found"
    )


def raise_unauthorized(message: str = "Could not validate credentials") -> None:
    """Raise a 401 Unauthorized HTTP exception."""
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=message,
        headers={"WWW-Authenticate": "Bearer"},
    )


def raise_forbidden(message: str = "Not authorized to perform this action") -> None:
    """Raise a 403 Forbidden HTTP exception."""
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail=message
    )


def raise_conflict(message: str = "Resource already exists") -> None:
    """Raise a 409 Conflict HTTP exception."""
    raise HTTPException(
        status_code=status.HTTP_409_CONFLICT,
        detail=message
    )


def raise_bad_request(message: str = "Invalid request") -> None:
    """Raise a 400 Bad Request HTTP exception."""
    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail=message
    )
