"""
Interview model for HireMind AI platform.
"""

from datetime import datetime

from sqlalchemy import String, Text, DateTime, ForeignKey, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class Interview(Base):
    """Interview scheduling model."""
    __tablename__ = "interviews"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    application_id: Mapped[int] = mapped_column(
        ForeignKey("applications.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    recruiter_id: Mapped[int] = mapped_column(
        ForeignKey("recruiters.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

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

    interview_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False
    )  # phone, video, onsite, technical, behavioral, final

    status: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="scheduled"
    )  # scheduled, completed, cancelled, rescheduled

    scheduled_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False
    )

    duration_minutes: Mapped[int] = mapped_column(
        nullable=False,
        default=60
    )

    location: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True
    )  # Physical location or meeting link

    meeting_link: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True
    )

    notes: Mapped[str | None] = mapped_column(
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
    application = relationship("Application", backref="interviews")
    recruiter = relationship("Recruiter", backref="interviews")
    candidate = relationship("Candidate", backref="interviews")
    job = relationship("Job", backref="interviews")
    feedback = relationship("InterviewFeedback", back_populates="interview", cascade="all, delete-orphan")

    __table_args__ = (
        Index('ix_interviews_scheduled', 'scheduled_at'),
        Index('ix_interviews_recruiter_status', 'recruiter_id', 'status'),
    )
