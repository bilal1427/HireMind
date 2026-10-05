"""
Resume parsing utilities for HireMind AI platform.
Extracts structured information from resume text.
"""

import re
import json
from typing import Optional
from datetime import datetime

from app.utils.text_cleaner import (
    clean_text,
    extract_email,
    extract_phone,
    extract_sections,
    remove_urls,
)
from app.utils.skill_normalizer import normalize_skills, SKILL_CATEGORIES


class ResumeParser:
    """Parser for extracting structured data from resume text."""

    # Common section headers in resumes
    SECTION_HEADERS = [
        "education", "experience", "work experience", "professional experience",
        "skills", "technical skills", "projects", "certifications", "languages",
        "summary", "objective", "profile", "about", "achievements", "awards",
        "publications", "interests", "hobbies", "references"
    ]

    # Common skill keywords for extraction
    SKILL_PATTERNS = [
        # Programming languages
        r'\b(python|java|javascript|typescript|c\+\+|c#|ruby|go|rust|php|swift|kotlin)\b',
        # Frameworks
        r'\b(react|angular|vue|django|flask|fastapi|spring|node\.?js|next\.?js|express)\b',
        # Databases
        r'\b(postgresql|mysql|mongodb|redis|elasticsearch|sqlite|oracle|sql\s*server)\b',
        # Cloud/DevOps
        r'\b(aws|azure|gcp|docker|kubernetes|jenkins|terraform|ansible|ci/cd|git)\b',
        # ML/AI
        r'\b(machine\s*learning|deep\s*learning|tensorflow|pytorch|scikit-learn|pandas|numpy)\b',
        # Other common
        r'\b(api|rest|graphql|microservices|agile|scrum|linux|unix)\b',
    ]

    # Education degree patterns
    DEGREE_PATTERNS = [
        r"(bachelor'?s?|master'?s?|ph\.?d\.?|doctorate|b\.?tech|m\.?tech|b\.?e|m\.?e|mba|b\.?sc|m\.?sc|b\.?a|m\.?a)\s*(?:of\s*)?(?:science|arts|engineering|technology|business|computer)?",
        r"(bsc|msc|be|me|btech|mtech|bs|ms|ba|ma)\s*(?:in\s*)?([a-zA-Z\s]+)",
    ]

    def __init__(self):
        """Initialize the resume parser."""
        pass

    def parse(self, text: str) -> dict:
        """
        Parse resume text and extract structured information.

        Args:
            text: Raw resume text

        Returns:
            Dictionary with parsed data
        """
        # Clean the text first
        cleaned_text = clean_text(text)

        # Extract sections
        sections = extract_sections(cleaned_text, self.SECTION_HEADERS)

        # Parse individual components
        result = {
            "name": self._extract_name(cleaned_text),
            "email": extract_email(cleaned_text),
            "phone": extract_phone(cleaned_text),
            "education": self._parse_education(sections.get("Education", sections.get("EDUCATION", ""))),
            "experience": self._parse_experience(
                sections.get("Experience", sections.get("Work Experience",
                sections.get("Professional Experience", "")))
            ),
            "skills": self._extract_skills(cleaned_text, sections),
            "projects": self._parse_projects(sections.get("Projects", sections.get("PROJECTS", ""))),
            "certifications": self._parse_certifications(
                sections.get("Certifications", sections.get("CERTIFICATIONS", ""))
            ),
            "languages": self._parse_languages(sections.get("Languages", sections.get("LANGUAGES", ""))),
        }

        return result

    def _extract_name(self, text: str) -> Optional[str]:
        """
        Extract candidate name from resume.
        Usually appears at the top of the resume.
        """
        lines = text.split('\n')

        # Look at first few lines for name
        for line in lines[:5]:
            line = line.strip()
            if not line:
                continue

            # Skip lines that look like contact info
            if '@' in line or re.search(r'\d{3}', line) or 'linkedin' in line.lower():
                continue

            # Check if line looks like a name (2-4 words, each capitalized)
            words = line.split()
            if 2 <= len(words) <= 4:
                if all(word[0].isupper() for word in words if len(word) > 1):
                    # Likely a name
                    return line

        return None

    def _extract_skills(self, text: str, sections: dict) -> list[str]:
        """
        Extract skills from resume.

        Args:
            text: Full resume text
            sections: Extracted sections

        Returns:
            List of extracted skills
        """
        skills = set()

        # Look in skills section first
        skills_section = sections.get("Skills", sections.get("Technical Skills", ""))
        if skills_section:
            # Extract skills from section
            for line in skills_section.split('\n'):
                # Split by common delimiters
                for delimiter in [',', '•', '|', '/', ';']:
                    if delimiter in line:
                        parts = line.split(delimiter)
                        skills.update(p.strip() for p in parts if p.strip())
                        break

        # Also scan full text for skill patterns
        for pattern in self.SKILL_PATTERNS:
            matches = re.findall(pattern, text, re.IGNORECASE)
            for match in matches:
                if isinstance(match, tuple):
                    # Some patterns return tuples
                    match = match[0]
                skills.add(match)

        # Normalize and deduplicate
        normalized = normalize_skills(list(skills))

        return sorted(normalized)

    def _parse_education(self, text: str) -> list[dict]:
        """
        Parse education entries.

        Args:
            text: Education section text

        Returns:
            List of education entries
        """
        if not text:
            return []

        entries = []
        lines = text.split('\n')

        current_entry = {}

        for line in lines:
            line = line.strip()
            if not line:
                if current_entry:
                    entries.append(current_entry)
                    current_entry = {}
                continue

            # Check for degree
            degree_match = None
            for pattern in self.DEGREE_PATTERNS:
                match = re.search(pattern, line, re.IGNORECASE)
                if match:
                    degree_match = match
                    break

            if degree_match:
                if current_entry:
                    entries.append(current_entry)
                current_entry = {
                    "degree": degree_match.group(0).strip(),
                    "institution": None,
                    "field": None,
                    "start_date": None,
                    "end_date": None,
                }

            # Look for institution name (often contains "University", "College", "Institute")
            if re.search(r'\b(university|college|institute|school)\b', line, re.IGNORECASE):
                if current_entry:
                    current_entry["institution"] = line

            # Look for dates
            date_match = re.search(r'(\d{4})\s*[-–]\s*(\d{4}|present|current)', line, re.IGNORECASE)
            if date_match and current_entry:
                current_entry["start_date"] = date_match.group(1)
                current_entry["end_date"] = date_match.group(2)

        # Add last entry
        if current_entry:
            entries.append(current_entry)

        return entries

    def _parse_experience(self, text: str) -> list[dict]:
        """
        Parse work experience entries.

        Args:
            text: Experience section text

        Returns:
            List of experience entries
        """
        if not text:
            return []

        entries = []
        lines = text.split('\n')

        current_entry = {}

        for line in lines:
            line = line.strip()
            if not line:
                continue

            # Check for company/title line (often first line of entry)
            # Look for job title keywords
            title_keywords = ['engineer', 'developer', 'manager', 'analyst', 'designer',
                            'lead', 'senior', 'junior', 'intern', 'consultant']

            if any(kw in line.lower() for kw in title_keywords):
                if current_entry:
                    entries.append(current_entry)
                current_entry = {
                    "title": line,
                    "company": None,
                    "location": None,
                    "start_date": None,
                    "end_date": None,
                    "description": [],
                }
            elif current_entry:
                # Check for company (often second line)
                if not current_entry.get("company") and len(line) > 2:
                    current_entry["company"] = line

                # Check for dates
                date_match = re.search(
                    r'(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)?\.?\s*(\d{4})\s*[-–]\s*(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)?\.?\s*(\d{4}|present|current)',
                    line, re.IGNORECASE
                )
                if date_match:
                    current_entry["start_date"] = f"{date_match.group(1) or ''} {date_match.group(2)}".strip()
                    current_entry["end_date"] = f"{date_match.group(3) or ''} {date_match.group(4)}".strip()

                # Add to description
                current_entry["description"].append(line)

        if current_entry:
            entries.append(current_entry)

        return entries

    def _parse_projects(self, text: str) -> list[dict]:
        """Parse project entries."""
        if not text:
            return []

        projects = []
        lines = text.split('\n')

        current_project = None

        for line in lines:
            line = line.strip()
            if not line:
                continue

            # First line is usually project name
            if not current_project:
                current_project = {
                    "name": line,
                    "description": "",
                    "technologies": [],
                }
            else:
                # Check if this is a new project (starts with bullet or number)
                if line.startswith(('•', '-', '*', '1.', '2.', '3.', '4.', '5.')):
                    if current_project:
                        projects.append(current_project)
                    current_project = {
                        "name": line.lstrip('•-*123456789. '),
                        "description": "",
                        "technologies": [],
                    }
                else:
                    # Add to description
                    if current_project["description"]:
                        current_project["description"] += " " + line
                    else:
                        current_project["description"] = line

        if current_project:
            projects.append(current_project)

        return projects

    def _parse_certifications(self, text: str) -> list[dict]:
        """Parse certification entries."""
        if not text:
            return []

        certs = []
        lines = text.split('\n')

        for line in lines:
            line = line.strip()
            if not line:
                continue

            # Look for certification entries
            cert = {
                "name": line,
                "issuer": None,
                "date": None,
            }

            # Try to extract date
            date_match = re.search(r'(\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{4})', line)
            if date_match:
                cert["date"] = date_match.group(1)

            certs.append(cert)

        return certs

    def _parse_languages(self, text: str) -> list[str]:
        """Parse language entries."""
        if not text:
            return []

        languages = []
        lines = text.split('\n')

        for line in lines:
            line = line.strip()
            if not line:
                continue

            # Split by common delimiters
            parts = re.split(r'[,•|/;]', line)
            for part in parts:
                # Remove proficiency indicators
                lang = re.sub(r'\s*[-–:]\s*(fluent|native|intermediate|beginner|advanced|proficient)\s*', '', part, flags=re.IGNORECASE)
                lang = lang.strip()
                if lang and len(lang) > 1:
                    languages.append(lang)

        return languages


# Singleton instance
_parser = None


def get_resume_parser() -> ResumeParser:
    """Get the singleton resume parser instance."""
    global _parser
    if _parser is None:
        _parser = ResumeParser()
    return _parser


def parse_resume(text: str) -> dict:
    """Convenience function to parse resume text."""
    return get_resume_parser().parse(text)
