"""
Text cleaning utilities for HireMind AI platform.
Handles text normalization, encoding fixes, and cleaning.
"""

import re
import unicodedata
from typing import Optional


def clean_text(text: str) -> str:
    """
    Clean and normalize text content.

    Args:
        text: Raw text to clean

    Returns:
        Cleaned text
    """
    if not text:
        return ""

    # Normalize unicode characters
    text = unicodedata.normalize('NFKC', text)

    # Remove null bytes and control characters (except newlines and tabs)
    text = ''.join(char for char in text if char.isprintable() or char in '\n\t')

    # Normalize whitespace
    text = re.sub(r'[ \t]+', ' ', text)  # Multiple spaces to single
    text = re.sub(r'\n{3,}', '\n\n', text)  # Multiple newlines to double

    # Remove leading/trailing whitespace from each line
    lines = [line.strip() for line in text.split('\n')]
    text = '\n'.join(lines)

    return text.strip()


def extract_email(text: str) -> Optional[str]:
    """Extract first email address from text."""
    pattern = r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'
    match = re.search(pattern, text)
    return match.group(0) if match else None


def extract_phone(text: str) -> Optional[str]:
    """Extract first phone number from text."""
    # Various phone formats
    patterns = [
        r'\+?1?[-.\s]?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}',  # US format
        r'\+?[0-9]{1,3}[-.\s]?[0-9]{8,14}',  # International
    ]

    for pattern in patterns:
        match = re.search(pattern, text)
        if match:
            return match.group(0)
    return None


def extract_urls(text: str) -> list[str]:
    """Extract URLs from text."""
    pattern = r'https?://[^\s<>"{}|\\^`\[\]]+'
    return re.findall(pattern, text)


def remove_urls(text: str) -> str:
    """Remove URLs from text."""
    pattern = r'https?://[^\s<>"{}|\\^`\[\]]+'
    return re.sub(pattern, '', text)


def normalize_whitespace(text: str) -> str:
    """Normalize all whitespace to single spaces."""
    return ' '.join(text.split())


def remove_special_characters(text: str, keep_newlines: bool = False) -> str:
    """
    Remove special characters, keeping only alphanumeric and basic punctuation.

    Args:
        text: Input text
        keep_newlines: Whether to preserve newline characters

    Returns:
        Text with special characters removed
    """
    if keep_newlines:
        pattern = r'[^\w\s\n.,!?;:\-\'"()]'
    else:
        pattern = r'[^\w\s.,!?;:\-\'"()]'

    return re.sub(pattern, '', text)


def extract_sections(text: str, section_headers: list[str]) -> dict[str, str]:
    """
    Extract sections from resume/job description text.

    Args:
        text: Full document text
        section_headers: List of possible section headers (case-insensitive)

    Returns:
        Dictionary mapping header to section content
    """
    sections = {}
    lines = text.split('\n')

    current_section = None
    current_content = []

    # Normalize headers for matching
    header_map = {h.lower(): h for h in section_headers}

    for line in lines:
        stripped = line.strip().lower().rstrip(':')

        # Check if this line is a section header
        if stripped in header_map:
            # Save previous section
            if current_section and current_content:
                sections[current_section] = '\n'.join(current_content).strip()

            current_section = header_map[stripped]
            current_content = []
        else:
            if current_section:
                current_content.append(line)

    # Save last section
    if current_section and current_content:
        sections[current_section] = '\n'.join(current_content).strip()

    return sections


def count_words(text: str) -> int:
    """Count words in text."""
    return len(text.split())


def truncate_text(text: str, max_length: int, suffix: str = "...") -> str:
    """
    Truncate text to maximum length.

    Args:
        text: Input text
        max_length: Maximum character length
        suffix: Suffix to append when truncated

    Returns:
        Truncated text
    """
    if len(text) <= max_length:
        return text

    return text[:max_length - len(suffix)].rsplit(' ', 1)[0] + suffix
