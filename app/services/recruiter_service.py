"""
Recruiter service for HireMind AI platform.
Handles recruiter profile management.
"""

from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.models.recruiter import Recruiter
from app.schemas.recruiter import (
    RecruiterUpdateRequest,
    RecruiterResponse,
    RecruiterDetailResponse,
)
from app.core.exceptions import raise_not_found


class RecruiterService:
    """Service for recruiter operations."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_recruiter(self, recruiter_id: int) -> RecruiterDetailResponse:
        """
        Get recruiter profile by ID.

        Args:
            recruiter_id: Recruiter ID

        Returns:
            Recruiter profile
        """
        recruiter = await self._get_recruiter(recruiter_id)
        if not recruiter:
            raise_not_found("Recruiter")

        return self._recruiter_to_detail_response(recruiter)

    async def get_recruiter_by_user(self, user_id: int) -> Optional[Recruiter]:
        """Get recruiter by user ID."""
        result = await self.db.execute(
            select(Recruiter).where(Recruiter.user_id == user_id)
        )
        return result.scalar_one_or_none()

    async def get_or_create_recruiter_for_user(self, user_id: int, email: str | None = None) -> Recruiter:
        """Get a recruiter profile, creating a minimal one for recruiter users if missing."""
        recruiter = await self.get_recruiter_by_user(user_id)
        if recruiter:
            return recruiter

        display_name = email.split("@", 1)[0] if email else f"Recruiter {user_id}"
        recruiter = Recruiter(
            user_id=user_id,
            full_name=display_name,
            company_name="Independent Recruiter",
        )
        self.db.add(recruiter)
        await self.db.commit()
        await self.db.refresh(recruiter)
        return recruiter

    async def update_recruiter(
        self,
        user_id: int,
        update_data: RecruiterUpdateRequest,
    ) -> RecruiterResponse:
        """
        Update recruiter profile.

        Args:
            user_id: User ID
            update_data: Update data

        Returns:
            Updated recruiter
        """
        recruiter = await self.get_recruiter_by_user(user_id)
        if not recruiter:
            raise_not_found("Recruiter profile")

        # Update fields
        if update_data.full_name is not None:
            recruiter.full_name = update_data.full_name
        if update_data.phone is not None:
            recruiter.phone = update_data.phone
        if update_data.company_name is not None:
            recruiter.company_name = update_data.company_name
        if update_data.designation is not None:
            recruiter.designation = update_data.designation
        if update_data.company_website is not None:
            recruiter.company_website = update_data.company_website

        await self.db.commit()
        await self.db.refresh(recruiter)

        return self._recruiter_to_response(recruiter)

    async def _get_recruiter(self, recruiter_id: int) -> Optional[Recruiter]:
        """Get recruiter by ID."""
        result = await self.db.execute(
            select(Recruiter).where(Recruiter.id == recruiter_id)
        )
        return result.scalar_one_or_none()

    def _recruiter_to_response(self, recruiter: Recruiter) -> RecruiterResponse:
        """Convert Recruiter model to response schema."""
        return RecruiterResponse(
            id=recruiter.id,
            user_id=recruiter.user_id,
            full_name=recruiter.full_name,
            phone=recruiter.phone,
            company_name=recruiter.company_name,
            designation=recruiter.designation,
            company_website=recruiter.company_website,
            created_at=recruiter.created_at,
            updated_at=recruiter.updated_at,
        )

    def _recruiter_to_detail_response(self, recruiter: Recruiter) -> RecruiterDetailResponse:
        """Convert Recruiter model to detail response schema."""
        from sqlalchemy import func
        from app.database.models.job import Job

        # Get job count
        # This would be done in a separate query in production
        return RecruiterDetailResponse(
            id=recruiter.id,
            user_id=recruiter.user_id,
            full_name=recruiter.full_name,
            phone=recruiter.phone,
            company_name=recruiter.company_name,
            designation=recruiter.designation,
            company_website=recruiter.company_website,
            created_at=recruiter.created_at,
            updated_at=recruiter.updated_at,
        )


def get_recruiter_service(db: AsyncSession) -> RecruiterService:
    """Factory function for RecruiterService."""
    return RecruiterService(db)
