"""
API routes module for HireMind AI platform.
"""

from app.api.routes import (
    auth,
    jobs,
    candidate,
    recruiter,
    resumes,
    applications,
    matching,
    interviews,
    chat,
    dashboard,
)

__all__ = [
    "auth",
    "jobs",
    "candidate",
    "recruiter",
    "resumes",
    "applications",
    "matching",
    "interviews",
    "chat",
    "dashboard",
]
