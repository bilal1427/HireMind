"""
Skill models for HireMind AI platform.
Includes Skill, CandidateSkill, and JobSkill models.
"""

from datetime import datetime

from sqlalchemy import String, Text, DateTime, ForeignKey, Integer, Index, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class Skill(Base):
    """Normalized skill model."""
    __tablename__ = "skills"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        unique=True,
        index=True
    )

    category: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True
    )  # e.g., "Programming Languages", "Frameworks", "Tools"

    normalized_name: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True
    )  # Normalized form for matching

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )

    # Relationships
    candidate_skills = relationship("CandidateSkill", back_populates="skill")
    job_skills = relationship("JobSkill", back_populates="skill")


class CandidateSkill(Base):
    """Association between candidates and skills."""
    __tablename__ = "candidate_skills"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    candidate_id: Mapped[int] = mapped_column(
        ForeignKey("candidates.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    skill_id: Mapped[int] = mapped_column(
        ForeignKey("skills.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    proficiency_level: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True
    )  # 1-5 scale

    years_of_experience: Mapped[float | None] = mapped_column(
        nullable=True
    )

    is_primary: Mapped[bool] = mapped_column(
        default=False,
        nullable=False
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )

    # Relationships
    candidate = relationship("Candidate", backref="candidate_skills")
    skill = relationship("Skill", back_populates="candidate_skills")

    __table_args__ = (
        UniqueConstraint('candidate_id', 'skill_id', name='uq_candidate_skill'),
    )


class JobSkill(Base):
    """Association between jobs and skills."""
    __tablename__ = "job_skills"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    job_id: Mapped[int] = mapped_column(
        ForeignKey("jobs.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    skill_id: Mapped[int] = mapped_column(
        ForeignKey("skills.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    is_required: Mapped[bool] = mapped_column(
        default=True,
        nullable=False
    )

    min_years_experience: Mapped[float | None] = mapped_column(
        nullable=True
    )

    importance_weight: Mapped[float | None] = mapped_column(
        nullable=True
    )  # Weight for matching algorithm

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )

    # Relationships
    job = relationship("Job", back_populates="skills")
    skill = relationship("Skill", back_populates="job_skills")

    __table_args__ = (
        UniqueConstraint('job_id', 'skill_id', name='uq_job_skill'),
        Index('ix_job_skills_required', 'job_id', 'is_required'),
    )
