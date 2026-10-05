"""
Semantic retrieval for RAG system.
"""

from typing import Optional
from dataclasses import dataclass

from app.rag.chroma import (
    get_resumes_collection,
    get_jobs_collection,
    get_hr_documents_collection,
)
from app.rag.embeddings import generate_embedding


@dataclass
class SearchResult:
    """Represents a search result."""
    id: str
    text: str
    score: float
    metadata: dict


class SemanticRetriever:
    """Semantic search over document collections."""

    def search_resumes(
        self,
        query: str,
        recruiter_id: Optional[int] = None,
        candidate_id: Optional[int] = None,
        n_results: int = 5,
    ) -> list[SearchResult]:
        """
        Search resumes by semantic similarity.

        Args:
            query: Search query
            recruiter_id: Optional filter by recruiter (for authorization)
            candidate_id: Optional filter by candidate
            n_results: Number of results

        Returns:
            List of SearchResult objects
        """
        collection = get_resumes_collection()

        # Generate query embedding
        query_embedding = generate_embedding(query)

        # Build where filter
        where_filter = None
        if recruiter_id is not None:
            where_filter = {"recruiter_id": recruiter_id}
        elif candidate_id is not None:
            where_filter = {"candidate_id": candidate_id}

        # Query
        results = collection.query(
            query_embeddings=[query_embedding],
            n_results=n_results,
            where=where_filter,
            include=["documents", "metadatas", "distances"]
        )

        # Convert to SearchResult objects
        search_results = []
        if results["ids"] and results["ids"][0]:
            for i, doc_id in enumerate(results["ids"][0]):
                search_results.append(SearchResult(
                    id=doc_id,
                    text=results["documents"][0][i],
                    score=1 - results["distances"][0][i],  # Convert distance to similarity
                    metadata=results["metadatas"][0][i],
                ))

        return search_results

    def search_jobs(
        self,
        query: str,
        recruiter_id: Optional[int] = None,
        n_results: int = 5,
    ) -> list[SearchResult]:
        """
        Search jobs by semantic similarity.

        Args:
            query: Search query
            recruiter_id: Optional filter by recruiter
            n_results: Number of results

        Returns:
            List of SearchResult objects
        """
        collection = get_jobs_collection()

        query_embedding = generate_embedding(query)

        where_filter = None
        if recruiter_id is not None:
            where_filter = {"recruiter_id": recruiter_id}

        results = collection.query(
            query_embeddings=[query_embedding],
            n_results=n_results,
            where=where_filter,
            include=["documents", "metadatas", "distances"]
        )

        search_results = []
        if results["ids"] and results["ids"][0]:
            for i, doc_id in enumerate(results["ids"][0]):
                search_results.append(SearchResult(
                    id=doc_id,
                    text=results["documents"][0][i],
                    score=1 - results["distances"][0][i],
                    metadata=results["metadatas"][0][i],
                ))

        return search_results

    def search_hr_documents(
        self,
        query: str,
        recruiter_id: Optional[int] = None,
        document_type: Optional[str] = None,
        n_results: int = 5,
    ) -> list[SearchResult]:
        """
        Search HR documents by semantic similarity.

        Args:
            query: Search query
            recruiter_id: Optional filter by recruiter
            document_type: Optional filter by document type
            n_results: Number of results

        Returns:
            List of SearchResult objects
        """
        collection = get_hr_documents_collection()

        query_embedding = generate_embedding(query)

        where_filter = None
        if recruiter_id is not None:
            where_filter = {"recruiter_id": recruiter_id}
            if document_type:
                where_filter["document_type"] = document_type
        elif document_type:
            where_filter = {"document_type": document_type}

        results = collection.query(
            query_embeddings=[query_embedding],
            n_results=n_results,
            where=where_filter,
            include=["documents", "metadatas", "distances"]
        )

        search_results = []
        if results["ids"] and results["ids"][0]:
            for i, doc_id in enumerate(results["ids"][0]):
                search_results.append(SearchResult(
                    id=doc_id,
                    text=results["documents"][0][i],
                    score=1 - results["distances"][0][i],
                    metadata=results["metadatas"][0][i],
                ))

        return search_results

    def search_all(
        self,
        query: str,
        recruiter_id: Optional[int] = None,
        n_results_per_collection: int = 3,
    ) -> dict[str, list[SearchResult]]:
        """
        Search all collections.

        Args:
            query: Search query
            recruiter_id: Optional filter by recruiter
            n_results_per_collection: Results per collection

        Returns:
            Dictionary of results by collection
        """
        return {
            "resumes": self.search_resumes(query, recruiter_id, n_results=n_results_per_collection),
            "jobs": self.search_jobs(query, recruiter_id, n_results=n_results_per_collection),
            "hr_documents": self.search_hr_documents(query, recruiter_id, n_results=n_results_per_collection),
        }


def get_retriever() -> SemanticRetriever:
    """Get a semantic retriever instance."""
    return SemanticRetriever()


def search_resumes(query: str, **kwargs) -> list[SearchResult]:
    """Convenience function to search resumes."""
    return get_retriever().search_resumes(query, **kwargs)


def search_jobs(query: str, **kwargs) -> list[SearchResult]:
    """Convenience function to search jobs."""
    return get_retriever().search_jobs(query, **kwargs)


def search_hr_documents(query: str, **kwargs) -> list[SearchResult]:
    """Convenience function to search HR documents."""
    return get_retriever().search_hr_documents(query, **kwargs)
