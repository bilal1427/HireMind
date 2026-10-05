"""
Database initialization script for HireMind AI.
Run this script to set up the database and create initial data.
"""

import asyncio
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import select
from app.database.database import engine, AsyncSessionLocal
from app.database.base import Base
from app.database.models import User, Recruiter, Candidate, Skill
from app.core.security import get_password_hash
from app.constants.roles import UserRole


async def create_tables():
    """Create all database tables."""
    print("Creating database tables...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("✓ Tables created successfully")


async def create_default_skills():
    """Create default skills in the database."""
    print("Creating default skills...")

    default_skills = [
        # Programming Languages
        "Python", "JavaScript", "TypeScript", "Java", "C++", "C#", "Go", "Rust",
        "Ruby", "PHP", "Swift", "Kotlin", "Scala", "R", "MATLAB",

        # Frontend
        "React", "Angular", "Vue.js", "Next.js", "HTML", "CSS", "Sass", "Tailwind CSS",
        "Redux", "Webpack", "Vite",

        # Backend
        "Django", "Flask", "FastAPI", "Spring Boot", "Express.js", "Node.js",
        "ASP.NET", "Ruby on Rails", "GraphQL", "REST API",

        # Databases
        "PostgreSQL", "MySQL", "MongoDB", "Redis", "Elasticsearch", "SQLite",
        "Oracle", "SQL Server", "Cassandra", "DynamoDB",

        # Cloud & DevOps
        "AWS", "Azure", "GCP", "Docker", "Kubernetes", "Jenkins", "GitHub Actions",
        "Terraform", "Ansible", "CI/CD", "Linux", "Nginx",

        # Data Science & ML
        "Machine Learning", "Deep Learning", "TensorFlow", "PyTorch", "scikit-learn",
        "Pandas", "NumPy", "Data Analysis", "Computer Vision", "NLP",

        # Other
        "Git", "Agile", "Scrum", "Microservices", "System Design", "API Design",
        "Testing", "TDD", "DevOps", "Software Architecture",
    ]

    async with AsyncSessionLocal() as session:
        for skill_name in default_skills:
            # Check if skill exists
            result = await session.execute(
                select(Skill).where(Skill.name == skill_name)
            )
            if not result.scalar_one_or_none():
                skill = Skill(
                    name=skill_name,
                    normalized_name=skill_name.lower(),
                    category=_categorize_skill(skill_name),
                )
                session.add(skill)

        await session.commit()

    print(f"✓ Created {len(default_skills)} default skills")


def _categorize_skill(skill_name: str) -> str:
    """Categorize a skill."""
    skill_lower = skill_name.lower()

    if skill_lower in ["python", "javascript", "typescript", "java", "c++", "c#", "go", "rust", "ruby", "php", "swift", "kotlin", "scala", "r", "matlab"]:
        return "programming_language"
    elif skill_lower in ["react", "angular", "vue.js", "next.js", "html", "css", "sass", "tailwind css", "redux", "webpack", "vite"]:
        return "frontend"
    elif skill_lower in ["django", "flask", "fastapi", "spring boot", "express.js", "node.js", "asp.net", "ruby on rails", "graphql", "rest api"]:
        return "backend"
    elif skill_lower in ["postgresql", "mysql", "mongodb", "redis", "elasticsearch", "sqlite", "oracle", "sql server", "cassandra", "dynamodb"]:
        return "database"
    elif skill_lower in ["aws", "azure", "gcp", "docker", "kubernetes", "jenkins", "github actions", "terraform", "ansible", "ci/cd", "linux", "nginx"]:
        return "devops"
    elif skill_lower in ["machine learning", "deep learning", "tensorflow", "pytorch", "scikit-learn", "pandas", "numpy", "data analysis", "computer vision", "nlp"]:
        return "data_science"
    else:
        return "general"


async def create_test_users():
    """Create test users for development."""
    print("Creating test users...")

    async with AsyncSessionLocal() as session:
        # Check if test recruiter exists
        result = await session.execute(
            select(User).where(User.email == "recruiter@test.com")
        )
        if not result.scalar_one_or_none():
            # Create test recruiter
            recruiter_user = User(
                email="recruiter@test.com",
                hashed_password=get_password_hash("password123"),
                role=UserRole.RECRUITER,
                is_active=True,
            )
            session.add(recruiter_user)
            await session.flush()

            recruiter = Recruiter(
                user_id=recruiter_user.id,
                full_name="Test Recruiter",
                company_name="Tech Corp",
                designation="HR Manager",
            )
            session.add(recruiter)

            print("  ✓ Created test recruiter (recruiter@test.com / password123)")

        # Check if test candidate exists
        result = await session.execute(
            select(User).where(User.email == "candidate@test.com")
        )
        if not result.scalar_one_or_none():
            # Create test candidate
            candidate_user = User(
                email="candidate@test.com",
                hashed_password=get_password_hash("password123"),
                role=UserRole.CANDIDATE,
                is_active=True,
            )
            session.add(candidate_user)
            await session.flush()

            candidate = Candidate(
                user_id=candidate_user.id,
                full_name="Test Candidate",
                location="New York, NY",
            )
            session.add(candidate)

            print("  ✓ Created test candidate (candidate@test.com / password123)")

        await session.commit()

    print("✓ Test users created")


async def main():
    """Main initialization function."""
    print("=" * 60)
    print("HireMind AI - Database Initialization")
    print("=" * 60)
    print()

    try:
        await create_tables()
        await create_default_skills()
        await create_test_users()

        print()
        print("=" * 60)
        print("✓ Database initialization completed successfully!")
        print("=" * 60)
        print()
        print("Test credentials:")
        print("  Recruiter: recruiter@test.com / password123")
        print("  Candidate: candidate@test.com / password123")
        print()

    except Exception as e:
        print()
        print("=" * 60)
        print(f"✗ Error during initialization: {e}")
        print("=" * 60)
        raise


if __name__ == "__main__":
    asyncio.run(main())
