"""
Chat routes for RAG-based AI assistant.
"""

from typing import Optional
import json
from datetime import datetime

from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, Field

from app.core.dependencies import DBSession, CurrentRecruiter, CurrentUser
from app.database.database import get_db
from app.database.models.chat import ChatSession, ChatMessage
from app.database.models.document import Document
from app.rag.service import get_rag_service
from app.rag.ingestion import get_document_ingester
from app.core.exceptions import raise_not_found

router = APIRouter(prefix="/rag", tags=["RAG Assistant"])


class ChatMessageRequest(BaseModel):
    """Chat message schema."""
    message: str = Field(..., min_length=1, max_length=2000)
    session_id: Optional[int] = Field(None, description="Continue existing session")
    context_type: Optional[str] = Field(None, description="candidate, job, general")
    context_id: Optional[int] = Field(None, description="candidate_id or job_id")


class ChatMessageResponse(BaseModel):
    """Chat response schema."""
    message: str
    session_id: int
    sources: list[dict] = []
    context_used: Optional[str] = None


class DocumentUploadRequest(BaseModel):
    """Document upload schema."""
    title: str = Field(..., min_length=1, max_length=200)
    content: str = Field(..., min_length=10)
    document_type: str = Field(..., description="policy, guide, template, other")
    candidate_id: Optional[int] = None
    job_id: Optional[int] = None


class DocumentResponse(BaseModel):
    """Document response schema."""
    id: int
    title: str
    document_type: str
    chunks_created: int
    message: str


@router.post(
    "/documents",
    response_model=DocumentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload document to knowledge base",
    description="Upload a document to the RAG knowledge base."
)
async def upload_document(
    document: DocumentUploadRequest,
    current_user: CurrentRecruiter,
    db: DBSession
) -> DocumentResponse:
    """
    Upload a document to the RAG knowledge base.

    Documents can be:
    - HR policies
    - Interview guides
    - Job descriptions
    - Candidate resumes (auto-indexed)

    The document will be chunked and embedded for semantic search.
    """
    # Create document record
    doc = Document(
        recruiter_id=current_user.recruiter.id,
        title=document.title,
        content=document.content,
        document_type=document.document_type,
        candidate_id=document.candidate_id,
        job_id=document.job_id,
    )
    db.add(doc)
    await db.commit()
    await db.refresh(doc)

    # Ingest into RAG system
    ingester = get_document_ingester()
    chunks_created = ingester.ingest_hr_document(
        document_id=doc.id,
        recruiter_id=current_user.recruiter.id,
        title=document.title,
        content=document.content,
        document_type=document.document_type,
        candidate_id=document.candidate_id,
        job_id=document.job_id,
    )

    return DocumentResponse(
        id=doc.id,
        title=doc.title,
        document_type=doc.document_type,
        chunks_created=chunks_created,
        message="Document successfully ingested into knowledge base",
    )


@router.post(
    "/chat",
    response_model=ChatMessageResponse,
    summary="Chat with AI assistant",
    description="Ask questions about candidates, jobs, or HR topics."
)
async def chat(
    chat_message: ChatMessageRequest,
    current_user: CurrentRecruiter,
    db: DBSession
) -> ChatMessageResponse:
    """
    Chat with the AI recruitment assistant.

    Example questions:
    - "Which candidates have React experience?"
    - "Who has the best match for the Senior Developer position?"
    - "What skills is candidate John missing for this role?"
    - "Summarize the interview feedback for candidate Sarah"

    The assistant uses RAG to provide accurate, grounded answers
    based on the documents in the knowledge base.

    **Authorization**: Recruiters can only query information
    about candidates who applied to their jobs.
    """
    # Get or create chat session
    session = None
    if chat_message.session_id:
        result = await db.execute(
            select(ChatSession).where(
                ChatSession.id == chat_message.session_id,
                ChatSession.recruiter_id == current_user.recruiter.id
            )
        )
        session = result.scalar_one_or_none()

    if not session:
        session = ChatSession(
            recruiter_id=current_user.recruiter.id,
            context_type=chat_message.context_type,
            context_id=chat_message.context_id,
        )
        db.add(session)
        await db.commit()
        await db.refresh(session)

    # Get answer from RAG service
    rag_service = get_rag_service(db)
    answer, sources = await rag_service.ask(
        question=chat_message.message,
        recruiter_id=current_user.recruiter.id,
        context_type=chat_message.context_type or session.context_type,
        context_id=chat_message.context_id or session.context_id,
    )

    # Save user message
    user_message = ChatMessage(
        session_id=session.id,
        role="user",
        content=chat_message.message,
    )
    db.add(user_message)

    # Save assistant message
    assistant_message = ChatMessage(
        session_id=session.id,
        role="assistant",
        content=answer,
        metadata=json.dumps({"sources": sources}),
    )
    db.add(assistant_message)

    await db.commit()

    return ChatMessageResponse(
        message=answer,
        session_id=session.id,
        sources=sources,
        context_used=chat_message.context_type,
    )


@router.get(
    "/sessions",
    summary="List chat sessions",
    description="Get previous chat sessions."
)
async def list_sessions(
    current_user: CurrentRecruiter,
    db: DBSession,
    limit: int = 20,
    offset: int = 0,
) -> dict:
    """List previous chat sessions."""
    result = await db.execute(
        select(ChatSession)
        .where(ChatSession.recruiter_id == current_user.recruiter.id)
        .order_by(ChatSession.created_at.desc())
        .limit(limit)
        .offset(offset)
    )
    sessions = result.scalars().all()

    return {
        "sessions": [
            {
                "id": session.id,
                "context_type": session.context_type,
                "context_id": session.context_id,
                "created_at": session.created_at.isoformat(),
                "updated_at": session.updated_at.isoformat() if session.updated_at else None,
            }
            for session in sessions
        ],
        "total": len(sessions),
    }


@router.get(
    "/sessions/{session_id}",
    summary="Get chat session history",
    description="Get all messages in a chat session."
)
async def get_session_history(
    session_id: int,
    current_user: CurrentRecruiter,
    db: DBSession,
) -> dict:
    """Get chat session with all messages."""
    result = await db.execute(
        select(ChatSession).where(
            ChatSession.id == session_id,
            ChatSession.recruiter_id == current_user.recruiter.id
        )
    )
    session = result.scalar_one_or_none()

    if not session:
        raise_not_found("Chat session")

    # Get messages
    result = await db.execute(
        select(ChatMessage)
        .where(ChatMessage.session_id == session_id)
        .order_by(ChatMessage.created_at)
    )
    messages = result.scalars().all()

    return {
        "session": {
            "id": session.id,
            "context_type": session.context_type,
            "context_id": session.context_id,
            "created_at": session.created_at.isoformat(),
        },
        "messages": [
            {
                "id": msg.id,
                "role": msg.role,
                "content": msg.content,
                "created_at": msg.created_at.isoformat(),
            }
            for msg in messages
        ],
    }


@router.delete(
    "/sessions/{session_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete chat session",
    description="Delete a chat session and its messages."
)
async def delete_session(
    session_id: int,
    current_user: CurrentRecruiter,
    db: DBSession,
) -> None:
    """Delete a chat session."""
    result = await db.execute(
        select(ChatSession).where(
            ChatSession.id == session_id,
            ChatSession.recruiter_id == current_user.recruiter.id
        )
    )
    session = result.scalar_one_or_none()

    if not session:
        raise_not_found("Chat session")

    await db.delete(session)
    await db.commit()


@router.get(
    "/documents",
    summary="List uploaded documents",
    description="Get list of documents in the knowledge base."
)
async def list_documents(
    current_user: CurrentRecruiter,
    db: DBSession,
    document_type: Optional[str] = None,
    limit: int = 20,
    offset: int = 0,
) -> dict:
    """List documents in the knowledge base."""
    query = select(Document).where(
        Document.recruiter_id == current_user.recruiter.id
    )

    if document_type:
        query = query.where(Document.document_type == document_type)

    query = query.order_by(Document.created_at.desc()).limit(limit).offset(offset)

    result = await db.execute(query)
    documents = result.scalars().all()

    return {
        "documents": [
            {
                "id": doc.id,
                "title": doc.title,
                "document_type": doc.document_type,
                "candidate_id": doc.candidate_id,
                "job_id": doc.job_id,
                "created_at": doc.created_at.isoformat(),
            }
            for doc in documents
        ],
        "total": len(documents),
    }


@router.delete(
    "/documents/{document_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete document from knowledge base",
    description="Remove a document from the RAG system."
)
async def delete_document(
    document_id: int,
    current_user: CurrentRecruiter,
    db: DBSession,
) -> None:
    """Delete a document from the knowledge base."""
    result = await db.execute(
        select(Document).where(
            Document.id == document_id,
            Document.recruiter_id == current_user.recruiter.id
        )
    )
    document = result.scalar_one_or_none()

    if not document:
        raise_not_found("Document")

    # Delete from RAG system
    ingester = get_document_ingester()
    ingester.delete_document(document_id)

    # Delete from database
    await db.delete(document)
    await db.commit()
