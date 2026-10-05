"""
ChromaDB setup and management for HireMind AI RAG system.
"""

import chromadb
from chromadb.config import Settings
from typing import Optional

from app.core.config import settings


class ChromaManager:
    """Manager for ChromaDB client and collections."""

    _instance: Optional['ChromaManager'] = None

    def __init__(self):
        """Initialize ChromaDB client."""
        self.client = chromadb.PersistentClient(
            path=settings.chroma_persist_directory,
            settings=Settings(
                anonymized_telemetry=False,
            )
        )
        self._collections = {}

    @classmethod
    def get_instance(cls) -> 'ChromaManager':
        """Get singleton instance."""
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def get_collection(self, name: str) -> chromadb.Collection:
        """
        Get or create a collection.

        Args:
            name: Collection name

        Returns:
            Collection object
        """
        if name not in self._collections:
            self._collections[name] = self.client.get_or_create_collection(
                name=name,
                metadata={"hnsw:space": "cosine"}
            )
        return self._collections[name]

    def list_collections(self) -> list[str]:
        """List all collection names."""
        return [c.name for c in self.client.list_collections()]

    def delete_collection(self, name: str) -> None:
        """Delete a collection."""
        self.client.delete_collection(name)
        if name in self._collections:
            del self._collections[name]

    def count_documents(self, collection_name: str) -> int:
        """Count documents in a collection."""
        collection = self.get_collection(collection_name)
        return collection.count()


# Collection names
RESUMES_COLLECTION = "resumes"
JOBS_COLLECTION = "jobs"
HR_DOCUMENTS_COLLECTION = "hr_documents"


def get_chroma_manager() -> ChromaManager:
    """Get the ChromaDB manager instance."""
    return ChromaManager.get_instance()


def get_resumes_collection() -> chromadb.Collection:
    """Get the resumes collection."""
    return get_chroma_manager().get_collection(RESUMES_COLLECTION)


def get_jobs_collection() -> chromadb.Collection:
    """Get the jobs collection."""
    return get_chroma_manager().get_collection(JOBS_COLLECTION)


def get_hr_documents_collection() -> chromadb.Collection:
    """Get the HR documents collection."""
    return get_chroma_manager().get_collection(HR_DOCUMENTS_COLLECTION)
