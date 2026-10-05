"""
Tests for resume upload and parsing.
"""

import io
import pytest
from httpx import AsyncClient
from unittest.mock import AsyncMock, patch, MagicMock


class TestResumeUpload:
    """Tests for resume upload."""

    @pytest.mark.asyncio
    async def test_upload_pdf_resume(self, client: AsyncClient, auth_headers, test_candidate):
        """Test uploading a PDF resume."""
        # Create a simple PDF-like content
        pdf_content = b"%PDF-1.4\n%Test PDF content\n%%EOF"

        with patch("app.services.resume_service.FileParser.extract_text", new_callable=AsyncMock) as mock_extract:
            mock_extract.return_value = "John Doe\nSoftware Engineer\nPython, JavaScript"

            with patch("app.utils.resume_parser.parse_resume") as mock_parse:
                mock_parse.return_value = {
                    "name": "John Doe",
                    "email": "john@example.com",
                    "phone": "+1234567890",
                    "skills": ["Python", "JavaScript"],
                    "education": [],
                    "experience": [],
                    "projects": [],
                    "certifications": [],
                }

                response = await client.post(
                    "/api/resumes/upload",
                    files={"file": ("resume.pdf", io.BytesIO(pdf_content), "application/pdf")},
                    data={"is_primary": "false"},
                    headers=auth_headers
                )

        assert response.status_code == 201
        data = response.json()
        assert "id" in data
        assert data["is_parsed"] == True

    @pytest.mark.asyncio
    async def test_upload_docx_resume(self, client: AsyncClient, auth_headers, test_candidate):
        """Test uploading a DOCX resume."""
        docx_content = b"PK\x03\x04" + b"\x00" * 100  # Fake DOCX header

        with patch("app.services.resume_service.FileParser.extract_text", new_callable=AsyncMock) as mock_extract:
            mock_extract.return_value = "Jane Smith\nDeveloper\nReact, Node.js"

            with patch("app.utils.resume_parser.parse_resume") as mock_parse:
                mock_parse.return_value = {
                    "name": "Jane Smith",
                    "email": "jane@example.com",
                    "phone": None,
                    "skills": ["React", "Node.js"],
                    "education": [],
                    "experience": [],
                    "projects": [],
                    "certifications": [],
                }

                response = await client.post(
                    "/api/resumes/upload",
                    files={"file": ("resume.docx", io.BytesIO(docx_content), "application/vnd.openxmlformats-officedocument.wordprocessingml.document")},
                    data={"is_primary": "true"},
                    headers=auth_headers
                )

        assert response.status_code == 201

    @pytest.mark.asyncio
    async def test_upload_invalid_file_type(self, client: AsyncClient, auth_headers):
        """Test uploading invalid file type."""
        response = await client.post(
            "/api/resumes/upload",
            files={"file": ("resume.txt", io.BytesIO(b"text content"), "text/plain")},
            data={"is_primary": "false"},
            headers=auth_headers
        )
        assert response.status_code == 400

    @pytest.mark.asyncio
    async def test_upload_without_auth(self, client: AsyncClient):
        """Test uploading resume without authentication."""
        response = await client.post(
            "/api/resumes/upload",
            files={"file": ("resume.pdf", io.BytesIO(b"content"), "application/pdf")},
            data={"is_primary": "false"},
        )
        assert response.status_code == 403


class TestResumeListing:
    """Tests for resume listing."""

    @pytest.mark.asyncio
    async def test_list_resumes(self, client: AsyncClient, auth_headers, test_candidate, db_session):
        """Test listing resumes for current candidate."""
        from app.database.models.resume import Resume

        # Create a resume
        resume = Resume(
            candidate_id=test_candidate.id,
            file_name="test_resume.pdf",
            file_path="/tmp/test_resume.pdf",
            file_size=1024,
            mime_type="application/pdf",
            is_parsed=True,
        )
        db_session.add(resume)
        await db_session.commit()

        response = await client.get("/api/resumes", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["total"] >= 1
        assert len(data["resumes"]) >= 1


class TestResumeDeletion:
    """Tests for resume deletion."""

    @pytest.mark.asyncio
    async def test_delete_resume(self, client: AsyncClient, auth_headers, test_candidate, db_session):
        """Test deleting a resume."""
        from app.database.models.resume import Resume
        import os

        # Create a temporary file
        temp_path = "/tmp/test_delete_resume.pdf"
        with open(temp_path, "w") as f:
            f.write("test")

        resume = Resume(
            candidate_id=test_candidate.id,
            file_name="delete_me.pdf",
            file_path=temp_path,
            file_size=100,
            mime_type="application/pdf",
        )
        db_session.add(resume)
        await db_session.commit()
        await db_session.refresh(resume)

        response = await client.delete(
            f"/api/resumes/{resume.id}",
            headers=auth_headers
        )
        assert response.status_code == 204

    @pytest.mark.asyncio
    async def test_delete_other_user_resume_forbidden(self, client: AsyncClient, recruiter_auth_headers, test_candidate, db_session):
        """Test that users cannot delete other users' resumes."""
        from app.database.models.resume import Resume

        resume = Resume(
            candidate_id=test_candidate.id,
            file_name="protected.pdf",
            file_path="/tmp/protected.pdf",
            file_size=100,
            mime_type="application/pdf",
        )
        db_session.add(resume)
        await db_session.commit()
        await db_session.refresh(resume)

        response = await client.delete(
            f"/api/resumes/{resume.id}",
            headers=recruiter_auth_headers
        )
        assert response.status_code == 403


class TestResumeParsing:
    """Tests for resume parsing functionality."""

    def test_skill_extraction(self):
        """Test skill extraction from resume text."""
        from app.utils.resume_parser import parse_resume

        text = """
        John Doe
        Software Engineer

        Skills: Python, JavaScript, React, Node.js, PostgreSQL, Docker

        Experience:
        Senior Developer at Tech Corp (2020-2023)
        """

        result = parse_resume(text)

        assert "Python" in result["skills"]
        assert "JavaScript" in result["skills"]
        assert len(result["skills"]) >= 5

    def test_contact_extraction(self):
        """Test contact information extraction."""
        from app.utils.resume_parser import parse_resume

        text = """
        Jane Smith
        Email: jane.smith@example.com
        Phone: +1 (555) 123-4567

        Software Developer
        """

        result = parse_resume(text)

        assert result["email"] == "jane.smith@example.com"
        assert result["phone"] is not None

    def test_skill_normalization(self):
        """Test that skills are normalized correctly."""
        from app.utils.skill_normalizer import normalize_skill

        assert normalize_skill("ReactJS") == "React"
        assert normalize_skill("nodejs") == "Node.js"
        assert normalize_skill("Postgres") == "PostgreSQL"
        assert normalize_skill("JS") == "JavaScript"
