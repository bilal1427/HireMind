"""
Interview type constants for HireMind AI platform.
"""

from enum import Enum


class InterviewType(str, Enum):
    """Types of interviews."""
    PHONE = "phone"
    VIDEO = "video"
    ONSITE = "onsite"
    TECHNICAL = "technical"
    BEHAVIORAL = "behavioral"
    FINAL = "final"


class InterviewStatus(str, Enum):
    """Interview scheduling status."""
    SCHEDULED = "scheduled"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    RESCHEDULED = "rescheduled"


# Constants for easy access
INTERVIEW_TYPES = [itype.value for itype in InterviewType]
INTERVIEW_STATUSES = [istatus.value for istatus in InterviewStatus]
