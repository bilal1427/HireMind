"""
Document ingestion for RAG system.
"""

from typing import Optional
from datetime import datetime

from app.rag.chroma import (
    get_resumes_collection,
    get_jobs_collection,
    get_hr_documents_collection,
)
from app.rag.chunking import chunk_text


class DocumentIngester:
    """Ingest documents into ChromaDB for RAG."""

    def ingest_resume(
        self,
        resume_id: int,
        candidate_id: int,
        text: str,
        candidate_name: Optional[str] = None,
        recruiter_id: Optional[int] = None,
    ) -> int:
        """
        Ingest a resume into the RAG system.

        Args:
            resume_id: Resume database ID
            candidate_id: Candidate database ID
            text: Resume text content
            candidate_name: Optional candidate name for metadata
            recruiter_id: Optional recruiter ID (for authorization)

        Returns:
            Number of chunks ingested
        """
        collection = get_resumes_collection()

        # Chunk the text
        chunks = chunk_text(
            text,
            metadata={
                "resume_id": resume_id,
                "candidate_id": candidate_id,
                "candidate_name": candidate_name,
                "recruiter_id": recruiter_id,
                "document_type": "resume",
                "ingested_at": datetime.utcnow().isoformat(),
            }
        )

        if not chunks:
            return 0

        # Generate embeddings
        from app.rag.embeddings import generate_embedding, generate_embeddings

        texts = [chunk.text for chunk in chunks]
        embeddings = generate_embeddings(texts) if len(texts) > 1 else [generate_embedding(texts[0])]

        # Create IDs
        ids = [f"resume_{resume_id}_chunk_{i}" for i in range(len(chunks))]

        # Prepare metadatas
        metadatas = [chunk.metadata for chunk in chunks]

        # Add to collection
        collection.add(
            ids=ids,
            embeddings=embeddings,
            documents=texts,
            metadatas=metadatas,
        )

        return len(chunks)

    def ingest_job(
        self,
        job_id: int,
        recruiter_id: int,
        title: str,
        description: str,
        requirements: Optional[str] = None,
        location: Optional[str] = None,
    ) -> int:
        """
        Ingest a job posting into the RAG system.

        Args:
            job_id: Job database ID
            recruiter_id: Recruiter database ID
            title: Job title
            description: Job description
            requirements: Optional requirements
            location: Optional location

        Returns:
            Number of chunks ingested
        """
        collection = get_jobs_collection()

        # Combine text
        full_text = f"Job Title: {title}\n\n{description}"
        if requirements:
            full_text += f"\n\nRequirements:\n{requirements}"

        # Chunk the text
        chunks = chunk_text(
            full_text,
            metadata={
                "job_id": job_id,
                "recruiter_id": recruiter_id,
                "job_title": title,
                "location": location,
                "document_type": "job",
                "ingested_at": datetime.utcnow().isoformat(),
            }
        )

        if not chunks:
            return 0

        # Generate embeddings
        from app.rag.embeddings import generate_embedding, generate_embeddings

        texts = [chunk.text for chunk in chunks]
        embeddings = generate_embeddings(texts) if len(texts) > 1 else [generate_embedding(texts[0])]

        # Create IDs
        ids = [f"job_{job_id}_chunk_{i}" for i in range(len(chunks))]

        # Prepare metadatas
        metadatas = [chunk.metadata for chunk in chunks]

        # Add to collection
        collection.add(
            ids=ids,
            embeddings=embeddings,
            documents=texts,
            metadatas=metadatas,
        )

        return len(chunks)

    def ingest_hr_document(
        self,
        document_id: int,
        recruiter_id: int,
        title: str,
        content: str,
        document_type: str,
        candidate_id: Optional[int] = None,
        job_id: Optional[int] = None,
    ) -> int:
        """
        Ingest an HR document into the RAG system.

        Args:
            document_id: Document database ID
            recruiter_id: Recruiter database ID
            title: Document title
            content: Document content
            document_type: Type of document
            candidate_id: Optional related candidate ID
            job_id: Optional related job ID

        Returns:
            Number of chunks ingested
        """
        collection = get_hr_documents_collection()

        # Chunk the text
        chunks = chunk_text(
            content,
            metadata={
                "document_id": document_id,
                "recruiter_id": recruiter_id,
                "title": title,
                "document_type": document_type,
                "candidate_id": candidate_id,
                "job_id": job_id,
                "ingested_at": datetime.utcnow().isoformat(),
            }
        )

        if not chunks:
            return 0

        # Generate embeddings
        from app.rag.embeddings import generate_embedding, generate_embeddings

        texts = [chunk.text for chunk in chunks]
        embeddings = generate_embeddings(texts) if len(texts) > 1 else [generate_embedding(texts[0])]

        # Create IDs
        ids = [f"doc_{document_id}_chunk_{i}" for i in range(len(chunks))]

        # Prepare metadatas
        metadatas = [chunk.metadata for chunk in chunks]

        # Add to collection
        collection.add(
            ids=ids,
            embeddings=embeddings,
            documents=texts,
            metadatas=metadatas,
        )

        return len(chunks)

    def delete_resume(self, resume_id: int) -> None:
        """Delete a resume from the RAG system."""
        collection = get_resumes_collection()
        # Query for all chunks belonging to this resume
        results = collection.get(
            where={"resume_id": resume_id},
        )
        if results["ids"]:
            collection.delete(ids=results["ids"])

    def delete_job(self, job_id: int) -> None:
        """Delete a job from the RAG system."""
        collection = get_jobs_collection()
        results = collection.get(
            where={"job_id": job_id},
        )
        if results["ids"]:
            collection.delete(ids=results["ids"])

    def delete_document(self, document_id: int) -> None:
        """Delete an HR document from the RAG system."""
        collection = get_hr_documents_collection()
        results = collection.get(
            where={"document_id": document_id},
        )
        if results["ids"]:
            collection.delete(ids=results["ids"])


def get_document_ingester() -> DocumentIngester:
    """Get a document ingester instance."""
    return DocumentIngester()
