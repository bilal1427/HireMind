"""
Tests for RAG system.
"""

import pytest
from unittest.mock import Mock, patch, MagicMock

from app.rag.chunking import TextChunker, chunk_text
from app.rag.embeddings import EmbeddingGenerator
from app.rag.prompts import (
    HR_ASSISTANT_SYSTEM_PROMPT,
    get_candidate_query_prompt,
)


class TestChunking:
    """Tests for text chunking."""

    def test_chunk_basic_text(self):
        """Test basic text chunking."""
        text = "This is a test. " * 100
        chunks = chunk_text(text, chunk_size=100, chunk_overlap=10)

        assert len(chunks) > 1
        for chunk in chunks:
            assert len(chunk.text) <= 120  # Allow some flexibility

    def test_chunk_empty_text(self):
        """Test chunking empty text."""
        chunks = chunk_text("")
        assert len(chunks) == 0

    def test_chunk_preserves_metadata(self):
        """Test that metadata is preserved in chunks."""
        metadata = {"test": "value", "id": 123}
        chunks = chunk_text("Test content", metadata=metadata)

        assert len(chunks) > 0
        for chunk in chunks:
            assert chunk.metadata["test"] == "value"
            assert chunk.metadata["id"] == 123

    def test_chunk_with_separator(self):
        """Test chunking respects separators."""
        text = "Paragraph one.\n\nParagraph two.\n\nParagraph three."
        chunker = TextChunker(chunk_size=50, separator="\n\n")
        chunks = chunker.chunk(text)

        assert len(chunks) >= 1


class TestEmbeddings:
    """Tests for embedding generation."""

    @patch("app.rag.embeddings.SentenceTransformer")
    def test_embedding_generator_singleton(self, mock_transformer):
        """Test that embedding generator is singleton."""
        mock_model = Mock()
        mock_model.encode.return_value = [0.1, 0.2, 0.3]
        mock_transformer.return_value = mock_model

        gen1 = EmbeddingGenerator.get_instance()
        gen2 = EmbeddingGenerator.get_instance()

        assert gen1 is gen2

    @patch("app.rag.embeddings.SentenceTransformer")
    def test_generate_embedding(self, mock_transformer):
        """Test generating single embedding."""
        mock_model = Mock()
        mock_model.encode.return_value = [0.1, 0.2, 0.3]
        mock_transformer.return_value = mock_model

        gen = EmbeddingGenerator()
        embedding = gen.generate("test text")

        assert isinstance(embedding, list)
        assert len(embedding) > 0


class TestPrompts:
    """Tests for RAG prompts."""

    def test_hr_assistant_system_prompt(self):
        """Test HR assistant prompt exists."""
        assert HR_ASSISTANT_SYSTEM_PROMPT is not None
        assert "recruitment" in HR_ASSISTANT_SYSTEM_PROMPT.lower()
        assert "decision support" in HR_ASSISTANT_SYSTEM_PROMPT.lower()

    def test_candidate_query_prompt(self):
        """Test candidate query prompt generation."""
        prompt = get_candidate_query_prompt(
            question="What skills does this candidate have?",
            context="Candidate has Python, JavaScript skills."
        )

        assert "What skills" in prompt
        assert "Python, JavaScript" in prompt

    def test_job_match_prompt(self):
        """Test job match prompt generation."""
        from app.rag.prompts import get_job_match_prompt

        prompt = get_job_match_prompt(
            job_title="Senior Developer",
            candidate_name="John Doe",
            match_score=85.5,
            context="Strong technical skills",
            question="Why this score?"
        )

        assert "Senior Developer" in prompt
        assert "John Doe" in prompt
        assert "85.5" in prompt


class TestRAGService:
    """Tests for RAG service."""

    @pytest.mark.asyncio
    async def test_ask_without_results(self, db_session):
        """Test asking question when no results found."""
        from app.rag.service import RAGService

        service = RAGService(db_session)

        with patch.object(service.retriever, 'search_all') as mock_search:
            mock_search.return_value = {"resumes": [], "jobs": [], "hr_documents": []}

            answer, sources = await service.ask(
                question="Test question",
                recruiter_id=1
            )

            assert "couldn't find" in answer.lower()
            assert len(sources) == 0


class TestSkillNormalizationInRAG:
    """Test skill normalization is used in RAG."""

    def test_skill_normalizer_used(self):
        """Test that skill normalizer exists and works."""
        from app.utils.skill_normalizer import SkillNormalizer

        normalizer = SkillNormalizer()

        # Test common transformations
        assert normalizer.normalize("ReactJS") == "React"
        assert normalizer.normalize("nodejs") == "Node.js"
        assert normalizer.normalize("Postgres") == "PostgreSQL"
