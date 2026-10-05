"""
Tests for utility modules.
"""

import pytest
from io import BytesIO

from app.utils.validators import (
    validate_email,
    validate_phone,
    validate_file_type,
    validate_file_size,
    sanitize_filename,
)
from app.utils.skill_normalizer import normalize_skill, normalize_skills, SkillNormalizer
from app.utils.text_cleaner import clean_text, extract_email, extract_phone


class TestValidators:
    """Tests for validation utilities."""

    def test_validate_email_valid(self):
        """Test valid email validation."""
        assert validate_email("user@example.com") == True
        assert validate_email("user.name@example.com") == True
        assert validate_email("user+tag@example.org") == True

    def test_validate_email_invalid(self):
        """Test invalid email validation."""
        assert validate_email("invalid") == False
        assert validate_email("user@") == False
        assert validate_email("@example.com") == False

    def test_validate_phone_valid(self):
        """Test valid phone validation."""
        assert validate_phone("+1234567890") == True
        assert validate_phone("123-456-7890") == True
        assert validate_phone("(123) 456-7890") == True

    def test_validate_file_type(self):
        """Test file type validation."""
        assert validate_file_type("resume.pdf") == True
        assert validate_file_type("resume.docx") == True
        assert validate_file_type("resume.txt") == False
        assert validate_file_type("resume.exe") == False

    def test_validate_file_size(self):
        """Test file size validation."""
        assert validate_file_size(1024) == True  # 1KB
        assert validate_file_size(5 * 1024 * 1024) == True  # 5MB
        assert validate_file_size(6 * 1024 * 1024) == False  # 6MB

    def test_sanitize_filename(self):
        """Test filename sanitization."""
        assert sanitize_filename("resume.pdf") == "resume.pdf"
        assert sanitize_filename("../../../etc/passwd") == "___etc_passwd"
        assert sanitize_filename("file<script>.pdf") == "file_script_.pdf"


class TestSkillNormalizer:
    """Tests for skill normalization."""

    def test_normalize_javascript_variants(self):
        """Test JavaScript variants are normalized."""
        assert normalize_skill("JS") == "JavaScript"
        assert normalize_skill("js") == "JavaScript"
        assert normalize_skill("ReactJS") == "React"
        assert normalize_skill("React.js") == "React"
        assert normalize_skill("NodeJS") == "Node.js"

    def test_normalize_python_variants(self):
        """Test Python variants are normalized."""
        assert normalize_skill("python") == "Python"
        assert normalize_skill("Python3") == "Python"

    def test_normalize_database_variants(self):
        """Test database variants are normalized."""
        assert normalize_skill("Postgres") == "PostgreSQL"
        assert normalize_skill("postgres") == "PostgreSQL"
        assert normalize_skill("Mongo") == "MongoDB"

    def test_normalize_list(self):
        """Test normalizing a list of skills."""
        skills = ["js", "ReactJS", "postgres", "Python"]
        normalized = normalize_skills(skills)
        assert "JavaScript" in normalized
        assert "React" in normalized
        assert "PostgreSQL" in normalized
        assert "Python" in normalized

    def test_skills_match(self):
        """Test skill matching."""
        normalizer = SkillNormalizer()
        assert normalizer.skills_match("JS", "JavaScript") == True
        assert normalizer.skills_match("ReactJS", "React") == True
        assert normalizer.skills_match("Python", "Java") == False


class TestTextCleaner:
    """Tests for text cleaning utilities."""

    def test_clean_text_removes_extra_whitespace(self):
        """Test that extra whitespace is removed."""
        text = "Hello    world\n\n\nTest"
        cleaned = clean_text(text)
        assert "    " not in cleaned
        assert "\n\n\n" not in cleaned

    def test_extract_email(self):
        """Test email extraction."""
        text = "Contact me at john.doe@example.com for more info."
        email = extract_email(text)
        assert email == "john.doe@example.com"

    def test_extract_phone(self):
        """Test phone extraction."""
        text = "Call me at +1 (555) 123-4567"
        phone = extract_phone(text)
        assert phone is not None

    def test_extract_email_none(self):
        """Test email extraction when none exists."""
        text = "No email here"
        email = extract_email(text)
        assert email is None


class TestFileParser:
    """Tests for file parsing utilities."""

    @pytest.mark.asyncio
    async def test_extract_text_from_pdf(self):
        """Test PDF text extraction."""
        from app.utils.file_parser import FileParser

        # Create a minimal valid PDF
        pdf_content = b"""%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] >>
endobj
xref
0 4
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
trailer
<< /Root 1 0 R /Size 4 >>
startxref
190
%%EOF"""

        text = await FileParser.extract_text(pdf_content, ".pdf")
        assert isinstance(text, str)

    @pytest.mark.asyncio
    async def test_extract_text_unsupported_type(self):
        """Test that unsupported file types raise error."""
        from app.utils.file_parser import FileParser
        from app.core.exceptions import FileUploadError

        with pytest.raises(FileUploadError):
            await FileParser.extract_text(b"content", ".txt")


class TestResumeParser:
    """Tests for resume parsing."""

    def test_parse_basic_resume(self):
        """Test parsing basic resume."""
        from app.utils.resume_parser import parse_resume

        text = """
        John Doe
        Software Engineer

        Email: john@example.com
        Phone: +1234567890

        Skills: Python, JavaScript, React, Node.js

        Experience:
        Senior Developer at Tech Corp (2020-2023)
        - Built web applications
        - Led team of 5

        Education:
        BS Computer Science, MIT, 2018
        """

        result = parse_resume(text)

        assert result["email"] == "john@example.com"
        assert result["phone"] is not None
        assert "Python" in result["skills"]
        assert "JavaScript" in result["skills"]
