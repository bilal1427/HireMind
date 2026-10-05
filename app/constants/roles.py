"""
User roles for HireMind AI platform.
Only two roles exist: RECRUITER and CANDIDATE.
No ADMIN role unless explicitly requested.
"""

from enum import Enum


class UserRole(str, Enum):
    """User roles for RBAC."""
    RECRUITER = "recruiter"
    CANDIDATE = "candidate"


# Role constants for easy access
RECRUITER = UserRole.RECRUITER.value
CANDIDATE = UserRole.CANDIDATE.value

# Valid roles for validation
VALID_ROLES = [role.value for role in UserRole]
