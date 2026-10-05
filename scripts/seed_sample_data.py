"""
Sample data seeder for HireMind AI.
Creates sample jobs and applications for testing.
Run with: python scripts/seed_data.py
"""

import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import select
from app.database.database import AsyncSessionLocal
from app.database.models import User, Recruiter, Candidate, Job, Skill, Application
from app.core.security import get_password_hash
from app.constants.roles import UserRole


async def seed_sample_data():
    """Create sample data for testing."""
    print("Seeding sample data...")

    async with AsyncSessionLocal() as db:
        # Create sample recruiter if not exists
        result = await db.execute(
            select(User).where(User.email == "recruiter@test.com")
        )
        if not result.scalar_one_or_none():
            recruiter_user = User(
                email="recruiter@test.com",
                hashed_password=get_password_hash("password123"),
                role=UserRole.RECRUITER,
                is_active=True,
            )
            db.add(recruiter_user)
            await db.flush()

            recruiter = Recruiter(
                user_id=recruiter_user.id,
                full_name="Sarah Johnson",
                company_name="Tech Innovations Inc.",
                designation="Senior HR Manager",
                phone="+1-555-0101",
            )
            db.add(recruiter)
            print("✓ Created sample recruiter")

        # Create sample candidate if not exists
        result = await db.execute(
            select(User).where(User.email == "candidate@test.com")
        )
        if not result.scalar_one_or_none():
            candidate_user = User(
                email="candidate@test.com",
                hashed_password=get_password_hash("password123"),
                role=UserRole.CANDIDATE,
                is_active=True,
            )
            db.add(candidate_user)
            await db.flush()

            candidate = Candidate(
                user_id=candidate_user.id,
                full_name="John Doe",
                location="San Francisco, CA",
                phone="+1-555-0201",
                summary="Full-stack developer with 5 years of experience in Python, JavaScript, and cloud technologies.",
            )
            db.add(candidate)
            print("✓ Created sample candidate")

        await db.commit()

        # Get recruiter
        result = await db.execute(
            select(Recruiter).join(User).where(User.email == "recruiter@test.com")
        )
        recruiter = result.scalar_one_or_none()

        # Create sample jobs
        if recruiter:
            sample_jobs = [
                {
                    "title": "Senior Python Developer",
                    "description": "We are looking for an experienced Python developer to join our backend team. You will work on microservices architecture, API development, and database optimization.",
                    "requirements": "5+ years of Python experience\nExperience with FastAPI or Django\nPostgreSQL and Redis knowledge\nDocker and Kubernetes experience\nStrong problem-solving skills",
                    "location": "San Francisco, CA",
                    "salary_min": 120000,
                    "salary_max": 160000,
                    "job_type": "full-time",
                    "experience_level": "senior",
                    "skills": ["Python", "FastAPI", "PostgreSQL", "Docker", "Kubernetes"],
                },
                {
                    "title": "Frontend Developer",
                    "description": "Join our frontend team to build beautiful, responsive web applications using React and modern JavaScript.",
                    "requirements": "3+ years of React experience\nTypeScript proficiency\nExperience with state management\nCSS and responsive design\nUnit testing experience",
                    "location": "Remote",
                    "salary_min": 90000,
                    "salary_max": 130000,
                    "job_type": "full-time",
                    "experience_level": "mid",
                    "skills": ["React", "TypeScript", "JavaScript", "CSS", "Redux"],
                },
                {
                    "title": "Data Scientist",
                    "description": "We're looking for a data scientist to help us build ML models and derive insights from our data.",
                    "requirements": "MS in Computer Science, Statistics, or related field\nExperience with Python ML libraries\nSQL and data analysis skills\nKnowledge of deep learning frameworks\nStrong communication skills",
                    "location": "New York, NY",
                    "salary_min": 110000,
                    "salary_max": 150000,
                    "job_type": "full-time",
                    "experience_level": "mid",
                    "skills": ["Python", "Machine Learning", "TensorFlow", "SQL", "Data Analysis"],
                },
            ]

            for job_data in sample_jobs:
                result = await db.execute(
                    select(Job).where(
                        Job.recruiter_id == recruiter.id,
                        Job.title == job_data["title"]
                    )
                )
                if not result.scalar_one_or_none():
                    job = Job(
                        recruiter_id=recruiter.id,
                        title=job_data["title"],
                        description=job_data["description"],
                        requirements=job_data["requirements"],
                        location=job_data["location"],
                        salary_min=job_data["salary_min"],
                        salary_max=job_data["salary_max"],
                        job_type=job_data["job_type"],
                        experience_level=job_data["experience_level"],
                    )
                    db.add(job)
                    await db.flush()

                    # Add skills
                    for skill_name in job_data["skills"]:
                        result = await db.execute(
                            select(Skill).where(Skill.name == skill_name)
                        )
                        skill = result.scalar_one_or_none()
                        if skill:
                            from app.database.models.skill import JobSkill
                            job_skill = JobSkill(
                                job_id=job.id,
                                skill_id=skill.id,
                                is_required=True,
                            )
                            db.add(job_skill)

                    print(f"✓ Created job: {job_data['title']}")

            await db.commit()

        print("\n✓ Sample data seeding completed!")
        print("\nTest credentials:")
        print("  Recruiter: recruiter@test.com / password123")
        print("  Candidate: candidate@test.com / password123")


if __name__ == "__main__":
    asyncio.run(seed_sample_data())
