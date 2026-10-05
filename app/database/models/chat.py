"""
Chat models for HireMind AI RAG assistant.
"""

from datetime import datetime

from sqlalchemy import String, Text, DateTime, ForeignKey, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class ChatSession(Base):
    """Chat session model for RAG assistant."""
    __tablename__ = "chat_sessions"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    recruiter_id: Mapped[int] = mapped_column(
        ForeignKey("recruiters.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    title: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True
    )

    context_type: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True
    )  # candidate, job, general

    context_id: Mapped[int | None] = mapped_column(
        nullable=True
    )  # candidate_id or job_id if context-specific

    is_active: Mapped[bool] = mapped_column(
        default=True,
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
    recruiter = relationship("Recruiter", backref="chat_sessions")
    messages = relationship("ChatMessage", back_populates="session", cascade="all, delete-orphan")

    __table_args__ = (
        Index('ix_chat_sessions_recruiter_active', 'recruiter_id', 'is_active'),
    )


class ChatMessage(Base):
    """Chat message model."""
    __tablename__ = "chat_messages"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    session_id: Mapped[int] = mapped_column(
        ForeignKey("chat_sessions.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    role: Mapped[str] = mapped_column(
        String(20),
        nullable=False
    )  # user, assistant

    content: Mapped[str] = mapped_column(
        Text,
        nullable=False
    )

    sources: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )  # JSON array of source documents referenced

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )

    # Relationships
    session = relationship("ChatSession", back_populates="messages")

    __table_args__ = (
        Index('ix_chat_messages_session_created', 'session_id', 'created_at'),
    )
