"""
RAG service for HireMind AI.
Orchestrates retrieval and response generation.
"""

from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession

from app.rag.prompts import (
    HR_ASSISTANT_SYSTEM_PROMPT,
    get_candidate_query_prompt,
    get_job_match_prompt,
    get_skill_gap_prompt,
    get_interview_prep_prompt,
)


class RAGService:
    """Service for RAG-based Q&A."""

    def __init__(self, db: AsyncSession):
        self.db = db
        from app.rag.retrieval import get_retriever

        self.retriever = get_retriever()

    async def ask(
        self,
        question: str,
        recruiter_id: int,
        context_type: Optional[str] = None,
        context_id: Optional[int] = None,
    ) -> tuple[str, list[dict]]:
        """
        Ask a question and get an answer based on retrieved context.

        Args:
            question: User's question
            recruiter_id: Recruiter ID for authorization
            context_type: Optional context type (candidate, job)
            context_id: Optional context ID

        Returns:
            Tuple of (answer, sources)
        """
        # Retrieve relevant documents
        if context_type == "candidate" and context_id:
            results = self.retriever.search_resumes(
                question,
                candidate_id=context_id,
                n_results=5,
            )
        elif context_type == "job" and context_id:
            results = self.retriever.search_jobs(
                question,
                recruiter_id=recruiter_id,
                n_results=5,
            )
        else:
            # Search all collections
            all_results = self.retriever.search_all(
                question,
                recruiter_id=recruiter_id,
            )
            # Combine and sort by score
            results = []
            for collection_results in all_results.values():
                results.extend(collection_results)
            results = sorted(results, key=lambda x: x.score, reverse=True)[:5]

        if not results:
            return "I couldn't find any relevant information to answer your question. Please try rephrasing or provide more context.", []

        # Build context from results
        context_parts = []
        sources = []

        for result in results:
            context_parts.append(result.text)
            sources.append({
                "text": result.text[:200] + "..." if len(result.text) > 200 else result.text,
                "metadata": result.metadata,
                "score": round(result.score, 3),
            })

        context = "\n\n---\n\n".join(context_parts)

        # Generate answer (for MVP, return context-based response without LLM)
        # In production, this would call an LLM API
        answer = self._generate_mvp_answer(question, context, results)

        return answer, sources

    def _generate_mvp_answer(
        self,
        question: str,
        context: str,
        results: list,
    ) -> str:
        """
        Generate MVP answer without LLM.

        For the MVP, we return a structured response based on retrieved context.
        In production, this would be replaced with LLM-generated answers.
        """
        # Determine the type of query
        question_lower = question.lower()

        if "skills" in question_lower or "experience" in question_lower:
            return self._format_skills_answer(results)
        elif "match" in question_lower or "score" in question_lower:
            return self._format_match_answer(results)
        elif "interview" in question_lower:
            return self._format_interview_answer(results)
        else:
            # Generic answer
            return self._format_generic_answer(question, results)

    def _format_skills_answer(self, results: list) -> str:
        """Format answer about skills."""
        if not results:
            return "No skill information found."

        # Extract skills from metadata or text
        parts = ["Based on the retrieved information:\n"]

        for i, result in enumerate(results[:3], 1):
            candidate_name = result.metadata.get("candidate_name", "Unknown")
            parts.append(f"\n{i}. {candidate_name}: {result.text[:300]}...")

        return "\n".join(parts)

    def _format_match_answer(self, results: list) -> str:
        """Format answer about matching."""
        if not results:
            return "No matching information found."

        parts = ["Here's what I found about candidate-job matches:\n"]

        for result in results[:3]:
            metadata = result.metadata
            if "job_title" in metadata:
                parts.append(f"- Job: {metadata['job_title']}")
            if "score" in result.metadata:
                parts.append(f"  Match score: {result.score:.1%}")

        return "\n".join(parts)

    def _format_interview_answer(self, results: list) -> str:
        """Format interview-related answer."""
        return f"Based on the candidate information:\n\n{results[0].text[:500]}...\n\nFor interview preparation, consider asking about the skills and experiences mentioned above."

    def _format_generic_answer(self, question: str, results: list) -> str:
        """Format a generic answer."""
        return f"I found {len(results)} relevant documents for your question. Here's the most relevant information:\n\n{results[0].text[:500]}{'...' if len(results[0].text) > 500 else ''}"


def get_rag_service(db: AsyncSession) -> RAGService:
    """Factory function for RAGService."""
    return RAGService(db)
