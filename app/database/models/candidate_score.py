"""
Candidate score model for HireMind AI platform.
Stores explainable matching scores.
"""

from datetime import datetime

from sqlalchemy import String, Text, DateTime, ForeignKey, Float, Integer, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class CandidateScore(Base):
    """Candidate-job matching score model."""
    __tablename__ = "candidate_scores"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    candidate_id: Mapped[int] = mapped_column(
        ForeignKey("candidates.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    job_id: Mapped[int] = mapped_column(
        ForeignKey("jobs.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    application_id: Mapped[int | None] = mapped_column(
        ForeignKey("applications.id", ondelete="SET NULL"),
        nullable=True
    )

    # Overall score (weighted combination)
    overall_score: Mapped[float] = mapped_column(
        Float,
        nullable=False
    )  # 0-100

    # Individual component scores
    skill_score: Mapped[float | None] = mapped_column(
        Float,
        nullable=True
    )  # 0-100 (40% weight)

    experience_score: Mapped[float | None] = mapped_column(
        Float,
        nullable=True
    )  # 0-100 (25% weight)

    education_score: Mapped[float | None] = mapped_column(
        Float,
        nullable=True
    )  # 0-100 (15% weight)

    project_score: Mapped[float | None] = mapped_column(
        Float,
        nullable=True
    )  # 0-100 (10% weight)

    certification_score: Mapped[float | None] = mapped_column(
        Float,
        nullable=True
    )  # 0-100 (10% weight)

    # Match details
    matched_skills: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )  # JSON array of matched skill names

    missing_skills: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )  # JSON array of missing skill names

    skill_gap_analysis: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )  # JSON object with detailed analysis

    # Explanation
    recommendation: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True
    )  # highly_recommended, recommended, consider, not_recommended

    explanation: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )  # Human-readable explanation

    # Model metadata
    model_version: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True
    )

    scoring_method: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
        default="heuristic"
    )  # heuristic, ml_model, semantic_similarity

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False
    )

    # Relationships
    candidate = relationship("Candidate", backref="scores")
    job = relationship("Job", backref="candidate_scores")
    application = relationship("Application", backref="score")

    __table_args__ = (
        Index('ix_candidate_scores_job_overall', 'job_id', 'overall_score'),
        Index('ix_candidate_scores_candidate_job', 'candidate_id', 'job_id', unique=True),
    )
