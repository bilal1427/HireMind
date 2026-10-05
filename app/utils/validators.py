"""
Validation utilities for HireMind AI platform.
"""

import re
from typing import Optional
from pathlib import PurePath

from fastapi import UploadFile

from app.core.exceptions import FileUploadError


# Allowed file extensions and MIME types for resume upload
ALLOWED_EXTENSIONS = {".pdf", ".docx"}
ALLOWED_MIME_TYPES = {
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
}
MAX_FILE_SIZE_MB = 5
MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024


def validate_email(email: str) -> bool:
    """Validate email format."""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))


def validate_phone(phone: str) -> bool:
    """Validate phone number format."""
    # Allow various phone formats
    pattern = r'^[\+]?[(]?[0-9]{1,3}[)]?[-\s\.]?[0-9]{1,4}[-\s\.]?[0-9]{1,4}[-\s\.]?[0-9]{1,9}$'
    return bool(re.match(pattern, phone))


def validate_file_type(filename: str) -> bool:
    """Validate file extension is allowed."""
    ext = PurePath(filename).suffix.lower()
    return ext in ALLOWED_EXTENSIONS


def validate_mime_type(mime_type: str) -> bool:
    """Validate MIME type is allowed."""
    return mime_type in ALLOWED_MIME_TYPES


def validate_file_size(size_bytes: int) -> bool:
    """Validate file size is within limit."""
    return size_bytes <= MAX_FILE_SIZE_BYTES


async def validate_upload_file(file: UploadFile) -> tuple[bool, Optional[str]]:
    """
    Comprehensive file validation.

    Returns:
        Tuple of (is_valid, error_message)
    """
    # Check filename
    if not file.filename:
        return False, "No filename provided"

    # Check file extension
    if not validate_file_type(file.filename):
        return False, f"File type not allowed. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}"

    # Check MIME type
    if file.content_type and not validate_mime_type(file.content_type):
        return False, f"MIME type '{file.content_type}' not allowed"

    # Read file content to check size
    content = await file.read()
    await file.seek(0)  # Reset file pointer

    if not validate_file_size(len(content)):
        return False, f"File size exceeds maximum of {MAX_FILE_SIZE_MB}MB"

    return True, None


def validate_skill_name(name: str) -> bool:
    """Validate skill name format."""
    if not name or len(name) > 100:
        return False
    # Allow alphanumeric, spaces, hyphens, dots, #, +
    pattern = r'^[a-zA-Z0-9\s\-\.\#\+]+$'
    return bool(re.match(pattern, name.strip()))


def validate_years_experience(years: Optional[float]) -> bool:
    """Validate years of experience value."""
    if years is None:
        return True
    return 0 <= years <= 50


def validate_proficiency_level(level: Optional[int]) -> bool:
    """Validate proficiency level (1-5 scale)."""
    if level is None:
        return True
    return 1 <= level <= 5


def sanitize_filename(filename: str) -> str:
    """
    Sanitize filename for safe storage.
    Remove path components and dangerous characters.
    """
    name = filename.replace("\\", "/").replace("../", "_").replace("/", "_")

    # Replace dangerous characters
    name = re.sub(r'[^\w\s\-.]', '_', name)

    # Limit length
    if len(name) > 255:
        ext = PurePath(name).suffix
        name = name[:255 - len(ext)] + ext

    return name
