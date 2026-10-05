"""
Resume model for HireMind AI platform.
"""

from datetime import datetime

from sqlalchemy import String, Text, DateTime, ForeignKey, Boolean, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class Resume(Base):
    """Resume model with parsed data."""
    __tablename__ = "resumes"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    candidate_id: Mapped[int] = mapped_column(
        ForeignKey("candidates.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    file_name: Mapped[str] = mapped_column(
        String(255),
        nullable=False
    )

    file_path: Mapped[str] = mapped_column(
        String(500),
        nullable=False
    )

    file_size: Mapped[int] = mapped_column(
        nullable=False
    )  # in bytes

    mime_type: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )

    is_parsed: Mapped[bool] = mapped_column(
        default=False,
        nullable=False
    )

    parsed_text: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )

    # Parsed structured data
    parsed_name: Mapped[str | None] = mapped_column(
        String(150),
        nullable=True
    )

    parsed_email: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True
    )

    parsed_phone: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True
    )

    parsed_education: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )  # JSON string

    parsed_experience: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )  # JSON string

    parsed_skills: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )  # JSON string

    parsed_projects: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )  # JSON string

    parsed_certifications: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )  # JSON string

    parsing_error: Mapped[str | None] = mapped_column(
        Text,
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

    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False
    )

    # Relationships
    candidate = relationship("Candidate", backref="resumes")

    __table_args__ = (
        Index('ix_resumes_candidate_primary', 'candidate_id', 'is_primary'),
    )
