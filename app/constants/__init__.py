"""
Constants module for HireMind AI platform.
"""

from app.constants.roles import UserRole, RECRUITER, CANDIDATE, VALID_ROLES
from app.constants.application_status import (
    ApplicationStatus,
    APPLIED,
    SCREENING,
    SHORTLISTED,
    INTERVIEW,
    SELECTED,
    REJECTED,
    VALID_STATUSES,
    STATUS_TRANSITIONS,
    is_valid_transition,
)
from app.constants.interview_types import (
    InterviewType,
    InterviewStatus,
    INTERVIEW_TYPES,
    INTERVIEW_STATUSES,
)

__all__ = [
    # Roles
    "UserRole",
    "RECRUITER",
    "CANDIDATE",
    "VALID_ROLES",
    # Application Status
    "ApplicationStatus",
    "APPLIED",
    "SCREENING",
    "SHORTLISTED",
    "INTERVIEW",
    "SELECTED",
    "REJECTED",
    "VALID_STATUSES",
    "STATUS_TRANSITIONS",
    "is_valid_transition",
    # Interview Types
    "InterviewType",
    "InterviewStatus",
    "INTERVIEW_TYPES",
    "INTERVIEW_STATUSES",
]
