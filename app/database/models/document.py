"""
Document model for RAG document storage.
"""

from datetime import datetime

from sqlalchemy import String, Text, DateTime, ForeignKey, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class Document(Base):
    """Document model for RAG system."""
    __tablename__ = "documents"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    recruiter_id: Mapped[int | None] = mapped_column(
        ForeignKey("recruiters.id", ondelete="CASCADE"),
        nullable=True,
        index=True
    )

    candidate_id: Mapped[int | None] = mapped_column(
        ForeignKey("candidates.id", ondelete="CASCADE"),
        nullable=True,
        index=True
    )

    job_id: Mapped[int | None] = mapped_column(
        ForeignKey("jobs.id", ondelete="CASCADE"),
        nullable=True,
        index=True
    )

    document_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        index=True
    )  # resume, job_description, hr_policy, interview_guide, etc.

    title: Mapped[str] = mapped_column(
        String(255),
        nullable=False
    )

    content: Mapped[str] = mapped_column(
        Text,
        nullable=False
    )

    file_path: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True
    )

    chunk_count: Mapped[int] = mapped_column(
        default=0,
        nullable=False
    )

    is_indexed: Mapped[bool] = mapped_column(
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
    recruiter = relationship("Recruiter", backref="documents")
    candidate = relationship("Candidate", backref="documents")
    job = relationship("Job", backref="documents")

    __table_args__ = (
        Index('ix_documents_type_indexed', 'document_type', 'is_indexed'),
    )
