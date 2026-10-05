"""
Utilities module for HireMind AI platform.
"""

from app.utils.validators import (
    validate_email,
    validate_phone,
    validate_file_type,
    validate_mime_type,
    validate_file_size,
    validate_upload_file,
    validate_skill_name,
    validate_years_experience,
    validate_proficiency_level,
    sanitize_filename,
    ALLOWED_EXTENSIONS,
    ALLOWED_MIME_TYPES,
    MAX_FILE_SIZE_MB,
)
from app.utils.text_cleaner import (
    clean_text,
    extract_email,
    extract_phone,
    normalize_whitespace,
    remove_special_characters,
    extract_sections,
    truncate_text,
)
from app.utils.skill_normalizer import (
    SkillNormalizer,
    get_skill_normalizer,
    normalize_skill,
    normalize_skills,
    SKILL_NORMALIZATION_MAP,
    SKILL_CATEGORIES,
)
from app.utils.file_parser import FileParser
from app.utils.resume_parser import (
    ResumeParser,
    get_resume_parser,
    parse_resume,
)

__all__ = [
    # Validators
    "validate_email",
    "validate_phone",
    "validate_file_type",
    "validate_mime_type",
    "validate_file_size",
    "validate_upload_file",
    "validate_skill_name",
    "validate_years_experience",
    "validate_proficiency_level",
    "sanitize_filename",
    "ALLOWED_EXTENSIONS",
    "ALLOWED_MIME_TYPES",
    "MAX_FILE_SIZE_MB",
    # Text cleaner
    "clean_text",
    "extract_email",
    "extract_phone",
    "normalize_whitespace",
    "remove_special_characters",
    "extract_sections",
    "truncate_text",
    # Skill normalizer
    "SkillNormalizer",
    "get_skill_normalizer",
    "normalize_skill",
    "normalize_skills",
    "SKILL_NORMALIZATION_MAP",
    "SKILL_CATEGORIES",
    # File parser
    "FileParser",
    # Resume parser
    "ResumeParser",
    "get_resume_parser",
    "parse_resume",
]
