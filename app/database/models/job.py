"""
Job model for HireMind AI platform.
"""

from datetime import datetime

from sqlalchemy import String, Text, DateTime, ForeignKey, Numeric, Boolean, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class Job(Base):
    """Job posting model."""
    __tablename__ = "jobs"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    recruiter_id: Mapped[int] = mapped_column(
        ForeignKey("recruiters.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    title: Mapped[str] = mapped_column(
        String(200),
        nullable=False,
        index=True
    )

    description: Mapped[str] = mapped_column(
        Text,
        nullable=False
    )

    requirements: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )

    location: Mapped[str | None] = mapped_column(
        String(150),
        nullable=True
    )

    salary_min: Mapped[float | None] = mapped_column(
        Numeric(12, 2),
        nullable=True
    )

    salary_max: Mapped[float | None] = mapped_column(
        Numeric(12, 2),
        nullable=True
    )

    job_type: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True
    )  # full-time, part-time, contract, remote

    experience_level: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True
    )  # entry, mid, senior, lead

    is_active: Mapped[bool] = mapped_column(
        default=True,
        nullable=False,
        index=True
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
    recruiter = relationship("Recruiter", backref="jobs")
    skills = relationship("JobSkill", back_populates="job", cascade="all, delete-orphan")

    __table_args__ = (
        Index('ix_jobs_recruiter_active', 'recruiter_id', 'is_active'),
    )
