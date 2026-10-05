"""
Tests for matching service.
"""

import pytest
from httpx import AsyncClient

from app.services.matching_service import MatchingService
from app.schemas.matching import MatchRequest


class TestMatchingService:
    """Tests for matching service."""

    @pytest.mark.asyncio
    async def test_analyze_match_basic(self, db_session, test_candidate, test_job, test_skill):
        """Test basic match analysis."""
        from app.database.models.skill import CandidateSkill

        # Add skill to candidate
        cs = CandidateSkill(
            candidate_id=test_candidate.id,
            skill_id=test_skill.id,
            is_primary=True,
        )
        db_session.add(cs)
        await db_session.commit()

        # Analyze match
        matching_service = MatchingService(db_session)
        result = await matching_service.analyze_match(
            MatchRequest(candidate_id=test_candidate.id, job_id=test_job.id),
            save_result=False
        )

        assert result.candidate_id == test_candidate.id
        assert result.job_id == test_job.id
        assert 0 <= result.overall_score <= 100
        assert result.recommendation in ["highly_recommended", "recommended", "consider", "not_recommended"]
        assert result.explanation is not None

    @pytest.mark.asyncio
    async def test_match_score_breakdown(self, db_session, test_candidate, test_job):
        """Test that match score has proper breakdown."""
        matching_service = MatchingService(db_session)
        result = await matching_service.analyze_match(
            MatchRequest(candidate_id=test_candidate.id, job_id=test_job.id),
            save_result=False
        )

        assert result.scores.skill_score >= 0
        assert result.scores.experience_score >= 0
        assert result.scores.education_score >= 0
        assert result.scores.project_score >= 0
        assert result.scores.certification_score >= 0

        # Verify weighted calculation
        expected = (
            result.scores.skill_score * 0.40 +
            result.scores.experience_score * 0.25 +
            result.scores.education_score * 0.15 +
            result.scores.project_score * 0.10 +
            result.scores.certification_score * 0.10
        )
        assert abs(result.overall_score - expected) < 0.1

    @pytest.mark.asyncio
    async def test_match_skill_comparison(self, db_session, test_candidate, test_job, test_skill):
        """Test skill matching in match analysis."""
        from app.database.models.skill import CandidateSkill, JobSkill

        # Add skill to candidate
        cs = CandidateSkill(
            candidate_id=test_candidate.id,
            skill_id=test_skill.id,
        )
        db_session.add(cs)

        # Add skill to job
        js = JobSkill(
            job_id=test_job.id,
            skill_id=test_skill.id,
            is_required=True,
        )
        db_session.add(js)
        await db_session.commit()

        matching_service = MatchingService(db_session)
        result = await matching_service.analyze_match(
            MatchRequest(candidate_id=test_candidate.id, job_id=test_job.id),
            save_result=False
        )

        # Python should be in matched skills
        assert "python" in [s.lower() for s in result.matched_skills]


class TestMatchingAPI:
    """Tests for matching API endpoints."""

    @pytest.mark.asyncio
    async def test_analyze_match_endpoint(self, client: AsyncClient, auth_headers, test_candidate, test_job):
        """Test match analysis endpoint."""
        response = await client.post(
            "/api/matching/analyze",
            json={
                "candidate_id": test_candidate.id,
                "job_id": test_job.id,
            },
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "overall_score" in data
        assert "scores" in data
        assert "recommendation" in data
        assert "explanation" in data

    @pytest.mark.asyncio
    async def test_analyze_match_nonexistent_candidate(self, client: AsyncClient, auth_headers, test_job):
        """Test match analysis with nonexistent candidate."""
        response = await client.post(
            "/api/matching/analyze",
            json={
                "candidate_id": 99999,
                "job_id": test_job.id,
            },
            headers=auth_headers
        )
        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_analyze_match_nonexistent_job(self, client: AsyncClient, auth_headers, test_candidate):
        """Test match analysis with nonexistent job."""
        response = await client.post(
            "/api/matching/analyze",
            json={
                "candidate_id": test_candidate.id,
                "job_id": 99999,
            },
            headers=auth_headers
        )
        assert response.status_code == 404


class TestSkillGapAnalysis:
    """Tests for skill gap analysis."""

    @pytest.mark.asyncio
    async def test_skill_gap_identification(self, db_session, test_candidate, test_job):
        """Test that missing skills are identified."""
        from app.database.models.skill import Skill, JobSkill

        # Create a skill the candidate doesn't have
        missing_skill = Skill(
            name="Docker",
            normalized_name="docker",
        )
        db_session.add(missing_skill)
        await db_session.commit()
        await db_session.refresh(missing_skill)

        # Add to job requirements
        js = JobSkill(
            job_id=test_job.id,
            skill_id=missing_skill.id,
            is_required=True,
        )
        db_session.add(js)
        await db_session.commit()

        matching_service = MatchingService(db_session)
        result = await matching_service.analyze_match(
            MatchRequest(candidate_id=test_candidate.id, job_id=test_job.id),
            save_result=False
        )

        # Docker should be in missing skills
        assert "docker" in [s.lower() for s in result.missing_skills]
        assert result.skill_gap_analysis["missing_count"] >= 1
