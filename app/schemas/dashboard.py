"""
Dashboard schemas for HireMind AI API.
"""

from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class DashboardStats(BaseModel):
    """General dashboard statistics."""
    total_jobs: int = 0
    active_jobs: int = 0
    total_candidates: int = 0
    total_applications: int = 0


class RecentApplication(BaseModel):
    """Recent application summary."""
    id: int
    candidate_name: Optional[str] = None
    job_title: Optional[str] = None
    status: str
    created_at: str


class TopCandidate(BaseModel):
    """Top candidate summary."""
    candidate_id: int
    candidate_name: Optional[str] = None
    overall_score: float
    recommendation: str


class RecommendedJob(BaseModel):
    """Recommended job summary."""
    job_id: int
    job_title: Optional[str] = None
    overall_score: float
    recommendation: str


class RecruiterDashboard(BaseModel):
    """Recruiter dashboard data."""
    total_jobs: int = 0
    active_jobs: int = 0
    total_applications: int = 0
    pending_applications: int = 0
    scheduled_interviews: int = 0
    recent_applications: List[Dict[str, Any]] = []
    top_candidates: List[Dict[str, Any]] = []
    application_status_breakdown: Dict[str, int] = {}


class CandidateDashboard(BaseModel):
    """Candidate dashboard data."""
    total_applications: int = 0
    pending_applications: int = 0
    interviews_scheduled: int = 0
    recent_applications: List[Dict[str, Any]] = []
    recommended_jobs: List[Dict[str, Any]] = []
    application_status_breakdown: Dict[str, int] = {}
