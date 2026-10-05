"""
Matching schemas for HireMind AI platform.
Explainable candidate-job matching results.
"""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class MatchRequest(BaseModel):
    """Request to analyze candidate-job match."""
    candidate_id: int
    job_id: int


class ScoreBreakdown(BaseModel):
    """Detailed score breakdown."""
    skill_score: float = Field(..., ge=0, le=100)
    experience_score: float = Field(..., ge=0, le=100)
    education_score: float = Field(..., ge=0, le=100)
    project_score: float = Field(..., ge=0, le=100)
    certification_score: float = Field(..., ge=0, le=100)

    @property
    def weighted_total(self) -> float:
        """Calculate weighted overall score."""
        return (
            self.skill_score * 0.40 +
            self.experience_score * 0.25 +
            self.education_score * 0.15 +
            self.project_score * 0.10 +
            self.certification_score * 0.10
        )


class MatchResponse(BaseModel):
    """Full match analysis response."""
    candidate_id: int
    job_id: int
    overall_score: float = Field(..., ge=0, le=100)
    scores: ScoreBreakdown
    matched_skills: list[str]
    missing_skills: list[str]
    skill_gap_analysis: dict
    recommendation: str  # highly_recommended, recommended, consider, not_recommended
    explanation: str
    scoring_method: str = "heuristic"
    model_version: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class CandidateMatchResult(BaseModel):
    """Match result for a candidate (for job listing)."""
    candidate_id: int
    candidate_name: str
    overall_score: float
    recommendation: str
    matched_skills: list[str]
    missing_skills: list[str]


class JobMatchResponse(BaseModel):
    """All candidates ranked for a job."""
    job_id: int
    job_title: str
    candidates: list[CandidateMatchResult]
    total_candidates: int


class JobRecommendation(BaseModel):
    """Job recommendation for a candidate."""
    job_id: int
    job_title: str
    company_name: str
    location: Optional[str]
    overall_score: float
    recommendation: str
    matched_skills: list[str]


class CandidateJobRecommendations(BaseModel):
    """Job recommendations for a candidate."""
    candidate_id: int
    recommendations: list[JobRecommendation]
    total: int
