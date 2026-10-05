"""
Interview feedback model for HireMind AI platform.
"""

from datetime import datetime

from sqlalchemy import String, Text, DateTime, ForeignKey, Integer, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class InterviewFeedback(Base):
    """Interview feedback model."""
    __tablename__ = "interview_feedback"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    interview_id: Mapped[int] = mapped_column(
        ForeignKey("interviews.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    recruiter_id: Mapped[int] = mapped_column(
        ForeignKey("recruiters.id", ondelete="CASCADE"),
        nullable=False
    )

    rating: Mapped[int] = mapped_column(
        nullable=False
    )  # 1-5 scale

    technical_skills: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True
    )  # 1-5

    communication: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True
    )  # 1-5

    cultural_fit: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True
    )  # 1-5

    problem_solving: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True
    )  # 1-5

    strengths: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )

    weaknesses: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )

    recommendation: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True
    )  # strong_yes, yes, neutral, no, strong_no

    summary: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )

    additional_notes: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )

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
    interview = relationship("Interview", back_populates="feedback")
    recruiter = relationship("Recruiter", backref="interview_feedbacks")

    __table_args__ = (
        Index('ix_interview_feedback_interview', 'interview_id'),
    )
