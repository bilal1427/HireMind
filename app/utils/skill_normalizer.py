"""
Skill normalization service for HireMind AI platform.
Maps skill variations to canonical names.
"""

from typing import Optional
import re


# Skill normalization mapping
# Maps common variations to canonical skill names
SKILL_NORMALIZATION_MAP = {
    # JavaScript ecosystem
    "js": "JavaScript",
    "javascript": "JavaScript",
    "ecmascript": "JavaScript",
    "reactjs": "React",
    "react.js": "React",
    "react js": "React",
    "react-native": "React Native",
    "react native": "React Native",
    "nodejs": "Node.js",
    "node.js": "Node.js",
    "node js": "Node.js",
    "node": "Node.js",
    "vuejs": "Vue.js",
    "vue.js": "Vue.js",
    "vue js": "Vue.js",
    "vue": "Vue.js",
    "angularjs": "Angular",
    "angular.js": "Angular",
    "angular js": "Angular",
    "nextjs": "Next.js",
    "next.js": "Next.js",
    "next js": "Next.js",
    "typescript": "TypeScript",
    "ts": "TypeScript",

    # Python ecosystem
    "python": "Python",
    "python3": "Python",
    "python 3": "Python",
    "django": "Django",
    "django framework": "Django",
    "flask": "Flask",
    "flask framework": "Flask",
    "fastapi": "FastAPI",
    "fast api": "FastAPI",
    "fast-api": "FastAPI",

    # Java ecosystem
    "java": "Java",
    "spring": "Spring Framework",
    "spring framework": "Spring Framework",
    "springframework": "Spring Framework",
    "springboot": "Spring Boot",
    "spring boot": "Spring Boot",
    "spring-boot": "Spring Boot",
    "java ee": "Java EE",
    "javaee": "Java EE",
    "jakarta ee": "Jakarta EE",
    "jakartaee": "Jakarta EE",
    "hibernate": "Hibernate",
    "hibernate orm": "Hibernate",

    # Databases
    "postgres": "PostgreSQL",
    "postgresql": "PostgreSQL",
    "psql": "PostgreSQL",
    "mysql": "MySQL",
    "mariadb": "MariaDB",
    "mongodb": "MongoDB",
    "mongo": "MongoDB",
    "redis": "Redis",
    "elasticsearch": "Elasticsearch",
    "elastic search": "Elasticsearch",
    "sql": "SQL",
    "nosql": "NoSQL",
    "sqlite": "SQLite",

    # Cloud & DevOps
    "aws": "AWS",
    "amazon web services": "AWS",
    "azure": "Azure",
    "microsoft azure": "Azure",
    "gcp": "GCP",
    "google cloud": "GCP",
    "google cloud platform": "GCP",
    "docker": "Docker",
    "kubernetes": "Kubernetes",
    "k8s": "Kubernetes",
    "jenkins": "Jenkins",
    "terraform": "Terraform",
    "ansible": "Ansible",
    "ci/cd": "CI/CD",
    "cicd": "CI/CD",

    # Machine Learning & Data
    "ml": "Machine Learning",
    "machine learning": "Machine Learning",
    "ai": "Artificial Intelligence",
    "artificial intelligence": "Artificial Intelligence",
    "deep learning": "Deep Learning",
    "nlp": "Natural Language Processing",
    "natural language processing": "Natural Language Processing",
    "tensorflow": "TensorFlow",
    "pytorch": "PyTorch",
    "py torch": "PyTorch",
    "scikit-learn": "scikit-learn",
    "sklearn": "scikit-learn",
    "pandas": "pandas",
    "numpy": "NumPy",
    "num py": "NumPy",
    "data science": "Data Science",
    "data analysis": "Data Analysis",

    # Mobile
    "android": "Android",
    "android development": "Android",
    "ios": "iOS",
    "ios development": "iOS",
    "swift": "Swift",
    "kotlin": "Kotlin",
    "flutter": "Flutter",
    "flutter framework": "Flutter",

    # Other languages
    "c#": "C#",
    "csharp": "C#",
    "c sharp": "C#",
    ".net": ".NET",
    "dotnet": ".NET",
    "dot net": ".NET",
    "c++": "C++",
    "cpp": "C++",
    "c plus plus": "C++",
    "c": "C",
    "go": "Go",
    "golang": "Go",
    "rust": "Rust",
    "ruby": "Ruby",
    "rails": "Ruby on Rails",
    "ruby on rails": "Ruby on Rails",
    "rubyonrails": "Ruby on Rails",
    "php": "PHP",
    "laravel": "Laravel",
    "symfony": "Symfony",

    # Web Technologies
    "html": "HTML",
    "html5": "HTML5",
    "css": "CSS",
    "css3": "CSS3",
    "sass": "Sass",
    "scss": "Sass",
    "less": "LESS",
    "tailwind": "Tailwind CSS",
    "tailwindcss": "Tailwind CSS",
    "tailwind css": "Tailwind CSS",
    "bootstrap": "Bootstrap",

    # Tools & Others
    "git": "Git",
    "github": "GitHub",
    "gitlab": "GitLab",
    "bitbucket": "Bitbucket",
    "jira": "Jira",
    "confluence": "Confluence",
    "slack": "Slack",
    "figma": "Figma",
    "graphql": "GraphQL",
    "graph ql": "GraphQL",
    "rest": "REST API",
    "restapi": "REST API",
    "rest api": "REST API",
    "restful": "REST API",
    "api": "API Development",
    "api development": "API Development",

    # Testing
    "testing": "Software Testing",
    "software testing": "Software Testing",
    "unit testing": "Unit Testing",
    "jest": "Jest",
    "mocha": "Mocha",
    "pytest": "pytest",
    "selenium": "Selenium",
    "cypress": "Cypress",
}

# Common skill categories
SKILL_CATEGORIES = {
    "Programming Languages": [
        "Python", "JavaScript", "TypeScript", "Java", "C#", "C++", "C", "Go", "Rust", "Ruby", "PHP", "Swift", "Kotlin"
    ],
    "Web Frameworks": [
        "React", "Angular", "Vue.js", "Django", "Flask", "FastAPI", "Spring Framework", "Spring Boot", "Ruby on Rails", "Laravel", "Next.js"
    ],
    "Databases": [
        "PostgreSQL", "MySQL", "MongoDB", "Redis", "Elasticsearch", "SQLite", "MariaDB"
    ],
    "Cloud & DevOps": [
        "AWS", "Azure", "GCP", "Docker", "Kubernetes", "Jenkins", "Terraform", "Ansible", "CI/CD"
    ],
    "Machine Learning & AI": [
        "Machine Learning", "Artificial Intelligence", "Deep Learning", "Natural Language Processing", "TensorFlow", "PyTorch", "scikit-learn"
    ],
    "Mobile Development": [
        "Android", "iOS", "React Native", "Flutter", "Swift", "Kotlin"
    ],
    "Frontend": [
        "HTML", "HTML5", "CSS", "CSS3", "JavaScript", "TypeScript", "React", "Angular", "Vue.js", "Tailwind CSS", "Bootstrap", "Sass"
    ],
    "Backend": [
        "Node.js", "Python", "Java", "Django", "FastAPI", "Spring Boot", "REST API", "GraphQL"
    ],
    "Tools": [
        "Git", "GitHub", "GitLab", "Jira", "Confluence", "Figma", "Docker"
    ],
    "Testing": [
        "Software Testing", "Unit Testing", "Jest", "pytest", "Selenium", "Cypress"
    ],
}


class SkillNormalizer:
    """Service for normalizing skill names."""

    def __init__(self, custom_mapping: Optional[dict[str, str]] = None):
        """
        Initialize the skill normalizer.

        Args:
            custom_mapping: Optional custom skill mappings to add
        """
        self.mapping = SKILL_NORMALIZATION_MAP.copy()
        if custom_mapping:
            self.mapping.update({k.lower(): v for k, v in custom_mapping.items()})

    def normalize(self, skill: str) -> str:
        """
        Normalize a skill name to its canonical form.

        Args:
            skill: Raw skill name

        Returns:
            Normalized skill name
        """
        if not skill:
            return skill

        # Clean and lowercase for lookup
        cleaned = skill.strip().lower()

        # Remove common suffixes for matching
        cleaned = re.sub(r'\s+(developer|engineer|programming|framework|language)$', '', cleaned)

        # Look up in mapping
        if cleaned in self.mapping:
            return self.mapping[cleaned]

        # If not found, return original (capitalized)
        return skill.strip().title()

    def get_category(self, skill: str) -> Optional[str]:
        """
        Get the category for a skill.

        Args:
            skill: Skill name (should be normalized)

        Returns:
            Category name or None
        """
        normalized = self.normalize(skill)

        for category, skills in SKILL_CATEGORIES.items():
            if normalized in skills:
                return category

        return None

    def normalize_list(self, skills: list[str]) -> list[str]:
        """
        Normalize a list of skills.

        Args:
            skills: List of raw skill names

        Returns:
            List of normalized skill names (deduplicated)
        """
        normalized = [self.normalize(s) for s in skills if s]
        # Remove duplicates while preserving order
        seen = set()
        result = []
        for skill in normalized:
            if skill.lower() not in seen:
                seen.add(skill.lower())
                result.append(skill)
        return result

    def skills_match(self, skill1: str, skill2: str) -> bool:
        """
        Check if two skill names refer to the same skill.

        Args:
            skill1: First skill name
            skill2: Second skill name

        Returns:
            True if skills match
        """
        return self.normalize(skill1).lower() == self.normalize(skill2).lower()


# Singleton instance
_normalizer = None


def get_skill_normalizer() -> SkillNormalizer:
    """Get the singleton skill normalizer instance."""
    global _normalizer
    if _normalizer is None:
        _normalizer = SkillNormalizer()
    return _normalizer


def normalize_skill(skill: str) -> str:
    """Convenience function to normalize a single skill."""
    return get_skill_normalizer().normalize(skill)


def normalize_skills(skills: list[str]) -> list[str]:
    """Convenience function to normalize a list of skills."""
    return get_skill_normalizer().normalize_list(skills)
