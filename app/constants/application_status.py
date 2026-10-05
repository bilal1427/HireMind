"""
Application status constants for HireMind AI platform.
Status changes should be validated - no arbitrary status strings allowed.
"""

from enum import Enum


class ApplicationStatus(str, Enum):
    """Candidate application status workflow."""
    APPLIED = "applied"
    SCREENING = "screening"
    SHORTLISTED = "shortlisted"
    INTERVIEW = "interview"
    SELECTED = "selected"
    REJECTED = "rejected"


# Status constants for easy access
APPLIED = ApplicationStatus.APPLIED.value
SCREENING = ApplicationStatus.SCREENING.value
SHORTLISTED = ApplicationStatus.SHORTLISTED.value
INTERVIEW = ApplicationStatus.INTERVIEW.value
SELECTED = ApplicationStatus.SELECTED.value
REJECTED = ApplicationStatus.REJECTED.value

# Valid statuses for validation
VALID_STATUSES = [status.value for status in ApplicationStatus]

# Allowed status transitions (from -> to)
STATUS_TRANSITIONS: dict[str, list[str]] = {
    APPLIED: [SCREENING, REJECTED],
    SCREENING: [SHORTLISTED, REJECTED],
    SHORTLISTED: [INTERVIEW, REJECTED],
    INTERVIEW: [SELECTED, REJECTED],
    SELECTED: [],  # Terminal state
    REJECTED: [],  # Terminal state
}


def is_valid_transition(current_status: str, new_status: str) -> bool:
    """
    Check if a status transition is valid.

    Args:
        current_status: Current application status
        new_status: Desired new status

    Returns:
        True if transition is allowed, False otherwise
    """
    if current_status not in STATUS_TRANSITIONS:
        return False
    return new_status in STATUS_TRANSITIONS[current_status]
