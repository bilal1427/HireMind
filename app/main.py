"""
Main FastAPI application for HireMind AI.
AI-Powered Recruitment & Candidate Management Platform.
"""

from contextlib import asynccontextmanager
import os
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.database.database import engine
from app.database.base import Base
from app.api.routes import auth, jobs, candidate, recruiter, resumes, applications, matching, interviews, chat, dashboard


os.makedirs("/tmp", exist_ok=True)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """
    Application lifespan handler.
    Handles startup and shutdown events.
    """
    # Startup: Create database tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    yield

    # Shutdown: Cleanup if needed
    await engine.dispose()


app = FastAPI(
    title="HireMind AI",
    description="AI-Powered Recruitment & Candidate Management Platform",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routers
app.include_router(auth.router, prefix="/api")
app.include_router(jobs.router, prefix="/api")
app.include_router(candidate.router, prefix="/api")
app.include_router(recruiter.router, prefix="/api")
app.include_router(resumes.router, prefix="/api")
app.include_router(applications.router, prefix="/api")
app.include_router(matching.router, prefix="/api")
app.include_router(interviews.router, prefix="/api")
app.include_router(chat.router, prefix="/api")
app.include_router(dashboard.router, prefix="/api")


@app.get("/", tags=["Root"])
async def root() -> dict:
    """Root endpoint - API health check."""
    return {
        "message": "HireMind AI Backend is running",
        "version": "1.0.0",
        "docs": "/api/docs"
    }


@app.get("/health", tags=["Health"])
async def health_check() -> dict:
    """Health check endpoint."""
    return {
        "status": "healthy",
        "environment": settings.app_env
    }
