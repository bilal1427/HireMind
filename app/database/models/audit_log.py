"""
Audit log model for tracking sensitive operations.
"""

from datetime import datetime

from sqlalchemy import String, Text, DateTime, ForeignKey, Index, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class AuditLog(Base):
    """Audit log model for security and compliance."""
    __tablename__ = "audit_logs"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )

    action: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        index=True
    )  # login, logout, register, update_profile, upload_resume, etc.

    resource_type: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True
    )  # user, candidate, job, application, resume, etc.

    resource_id: Mapped[int | None] = mapped_column(
        nullable=True
    )

    details: Mapped[str | None] = mapped_column(
        JSON,
        nullable=True
    )  # Additional context as JSON

    ip_address: Mapped[str | None] = mapped_column(
        String(45),
        nullable=True
    )

    user_agent: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True
    )

    status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="success"
    )  # success, failure

    error_message: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
        index=True
    )

    # Relationships
    user = relationship("User", backref="audit_logs")

    __table_args__ = (
        Index('ix_audit_logs_action_created', 'action', 'created_at'),
        Index('ix_audit_logs_user_action', 'user_id', 'action'),
    )
