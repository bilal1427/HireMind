"""
Resume service for HireMind AI platform.
Handles resume upload, parsing, and management.
"""

import os
import json
from pathlib import Path
from datetime import datetime
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import UploadFile

from app.core.config import settings
from app.core.exceptions import FileUploadError, raise_not_found, raise_forbidden
from app.database.models.candidate import Candidate
from app.database.models.resume import Resume
from app.database.models.skill import Skill, CandidateSkill
from app.utils.validators import validate_upload_file, sanitize_filename
from app.utils.file_parser import FileParser
from app.utils.resume_parser import parse_resume
from app.schemas.resume import ResumeUploadResponse, ResumeResponse, ResumeListResponse
from app.rag.ingestion import get_document_ingester


class ResumeService:
    """Service for resume operations."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.upload_dir = Path(settings.upload_dir)
        self.upload_dir.mkdir(parents=True, exist_ok=True)

    async def upload_resume(
        self,
        user_id: int,
        file: UploadFile,
        is_primary: bool = False,
    ) -> ResumeUploadResponse:
        """
        Upload and parse a resume.

        Args:
            user_id: User ID
            file: Uploaded file
            is_primary: Whether this is the primary resume

        Returns:
            ResumeUploadResponse with parsing results
        """
        # Get candidate
        candidate = await self._get_candidate_by_user(user_id)
        if not candidate:
            raise_not_found("Candidate profile")

        # Validate file
        is_valid, error = await validate_upload_file(file)
        if not is_valid:
            raise FileUploadError(error)

        # Read file content
        content = await file.read()
        await file.seek(0)

        # Generate safe filename
        safe_filename = sanitize_filename(file.filename)
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        stored_filename = f"{candidate.id}_{timestamp}_{safe_filename}"
        file_path = self.upload_dir / stored_filename

        # Save file
        with open(file_path, "wb") as f:
            f.write(content)

        # Extract text
        try:
            file_ext = Path(file.filename).suffix
            text = await FileParser.extract_text(content, file_ext)
        except FileUploadError:
            # Clean up file if parsing fails
            os.remove(file_path)
            raise

        # Parse resume
        parsed_data = parse_resume(text)

        # Create resume record
        resume = Resume(
            candidate_id=candidate.id,
            file_name=file.filename,
            file_path=str(file_path),
            file_size=len(content),
            mime_type=file.content_type,
            is_parsed=True,
            parsed_text=text,
            parsed_name=parsed_data.get("name"),
            parsed_email=parsed_data.get("email"),
            parsed_phone=parsed_data.get("phone"),
            parsed_education=json.dumps(parsed_data.get("education", [])),
            parsed_experience=json.dumps(parsed_data.get("experience", [])),
            parsed_skills=json.dumps(parsed_data.get("skills", [])),
            parsed_projects=json.dumps(parsed_data.get("projects", [])),
            parsed_certifications=json.dumps(parsed_data.get("certifications", [])),
            is_primary=is_primary,
        )
        self.db.add(resume)

        # If primary, unset other primary resumes
        if is_primary:
            await self._unset_other_primary(candidate.id, resume.id)

        # Extract and store skills
        await self._extract_and_store_skills(candidate.id, parsed_data.get("skills", []))

        await self.db.commit()
        await self.db.refresh(resume)

        # Ingest into RAG system
        try:
            ingester = get_document_ingester()
            ingester.ingest_resume(
                resume_id=resume.id,
                candidate_id=candidate.id,
                text=text,
                candidate_name=parsed_data.get("name"),
                recruiter_id=None,  # Will be set when candidate applies to job
            )
        except Exception as e:
            # Log error but don't fail the upload
            print(f"Warning: Failed to ingest resume into RAG system: {e}")

        return ResumeUploadResponse(
            id=resume.id,
            file_name=resume.file_name,
            file_size=resume.file_size,
            is_parsed=resume.is_parsed,
            parsing_error=resume.parsing_error,
            message="Resume uploaded and parsed successfully",
        )

    async def get_resume(self, resume_id: int, user_id: int) -> Resume:
        """
        Get a resume by ID with authorization check.

        Args:
            resume_id: Resume ID
            user_id: User ID for authorization

        Returns:
            Resume object
        """
        result = await self.db.execute(
            select(Resume).where(Resume.id == resume_id)
        )
        resume = result.scalar_one_or_none()

        if not resume:
            raise_not_found("Resume")

        # Check authorization
        candidate = await self._get_candidate_by_user(user_id)
        if not candidate or resume.candidate_id != candidate.id:
            raise_forbidden("You don't have access to this resume")

        return resume

    async def list_resumes(self, user_id: int) -> ResumeListResponse:
        """
        List all resumes for the current candidate.

        Args:
            user_id: User ID

        Returns:
            ResumeListResponse
        """
        candidate = await self._get_candidate_by_user(user_id)
        if not candidate:
            raise_not_found("Candidate profile")

        result = await self.db.execute(
            select(Resume)
            .where(Resume.candidate_id == candidate.id)
            .order_by(Resume.created_at.desc())
        )
        resumes = result.scalars().all()

        return ResumeListResponse(
            resumes=[self._resume_to_response(r) for r in resumes],
            total=len(resumes),
        )

    async def delete_resume(self, resume_id: int, user_id: int) -> None:
        """
        Delete a resume.

        Args:
            resume_id: Resume ID
            user_id: User ID for authorization
        """
        resume = await self.get_resume(resume_id, user_id)

        # Delete file
        if os.path.exists(resume.file_path):
            os.remove(resume.file_path)

        # Delete database record
        await self.db.delete(resume)
        await self.db.commit()

    async def set_primary_resume(self, resume_id: int, user_id: int) -> Resume:
        """
        Set a resume as primary.

        Args:
            resume_id: Resume ID
            user_id: User ID

        Returns:
            Updated Resume
        """
        resume = await self.get_resume(resume_id, user_id)

        # Unset other primary resumes
        await self._unset_other_primary(resume.candidate_id, resume.id)

        # Set this one as primary
        resume.is_primary = True
        await self.db.commit()
        await self.db.refresh(resume)

        return resume

    async def reparse_resume(self, resume_id: int, user_id: int) -> Resume:
        """
        Re-parse a resume.

        Args:
            resume_id: Resume ID
            user_id: User ID

        Returns:
            Updated Resume
        """
        resume = await self.get_resume(resume_id, user_id)

        # Read file content
        with open(resume.file_path, "rb") as f:
            content = f.read()

        # Re-extract text
        file_ext = Path(resume.file_name).suffix
        text = await FileParser.extract_text(content, file_ext)

        # Re-parse
        parsed_data = parse_resume(text)

        # Update resume record
        resume.parsed_text = text
        resume.parsed_name = parsed_data.get("name")
        resume.parsed_email = parsed_data.get("email")
        resume.parsed_phone = parsed_data.get("phone")
        resume.parsed_education = json.dumps(parsed_data.get("education", []))
        resume.parsed_experience = json.dumps(parsed_data.get("experience", []))
        resume.parsed_skills = json.dumps(parsed_data.get("skills", []))
        resume.parsed_projects = json.dumps(parsed_data.get("projects", []))
        resume.parsed_certifications = json.dumps(parsed_data.get("certifications", []))
        resume.parsing_error = None

        await self.db.commit()
        await self.db.refresh(resume)

        return resume

    async def _get_candidate_by_user(self, user_id: int) -> Optional[Candidate]:
        """Get candidate by user ID."""
        result = await self.db.execute(
            select(Candidate).where(Candidate.user_id == user_id)
        )
        return result.scalar_one_or_none()

    async def _unset_other_primary(self, candidate_id: int, exclude_id: int) -> None:
        """Unset primary flag on other resumes."""
        result = await self.db.execute(
            select(Resume).where(
                Resume.candidate_id == candidate_id,
                Resume.id != exclude_id,
                Resume.is_primary == True,
            )
        )
        for resume in result.scalars().all():
            resume.is_primary = False

    async def _extract_and_store_skills(self, candidate_id: int, skills: list[str]) -> None:
        """Extract and store skills from parsed resume."""
        for skill_name in skills:
            if not skill_name:
                continue

            # Get or create skill
            skill = await self._get_or_create_skill(skill_name)

            # Check if candidate already has this skill
            existing = await self.db.execute(
                select(CandidateSkill).where(
                    CandidateSkill.candidate_id == candidate_id,
                    CandidateSkill.skill_id == skill.id,
                )
            )
            if not existing.scalar_one_or_none():
                # Add skill to candidate
                candidate_skill = CandidateSkill(
                    candidate_id=candidate_id,
                    skill_id=skill.id,
                    is_primary=True,
                )
                self.db.add(candidate_skill)

    async def _get_or_create_skill(self, skill_name: str) -> Skill:
        """Get existing skill or create new one."""
        from app.utils.skill_normalizer import normalize_skill

        normalized = normalize_skill(skill_name)

        result = await self.db.execute(
            select(Skill).where(Skill.name.ilike(normalized))
        )
        skill = result.scalar_one_or_none()

        if not skill:
            skill = Skill(name=normalized, normalized_name=normalized.lower())
            self.db.add(skill)
            await self.db.flush()

        return skill

    def _resume_to_response(self, resume: Resume) -> ResumeResponse:
        """Convert Resume model to response schema."""
        skills = []
        if resume.parsed_skills:
            try:
                skills = json.loads(resume.parsed_skills)
            except json.JSONDecodeError:
                skills = []

        return ResumeResponse(
            id=resume.id,
            candidate_id=resume.candidate_id,
            file_name=resume.file_name,
            file_size=resume.file_size,
            mime_type=resume.mime_type,
            is_parsed=resume.is_parsed,
            parsed_name=resume.parsed_name,
            parsed_email=resume.parsed_email,
            parsed_phone=resume.parsed_phone,
            parsed_skills=skills,
            parsing_error=resume.parsing_error,
            is_primary=resume.is_primary,
            created_at=resume.created_at,
        )


def get_resume_service(db: AsyncSession) -> ResumeService:
    """Factory function for ResumeService."""
    return ResumeService(db)
