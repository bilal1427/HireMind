# HireMind AI

AI-Powered Recruitment & Candidate Management Platform

## Overview

HireMind AI is a production-oriented recruitment platform connecting recruiters and candidates with AI-powered matching, resume parsing, and a RAG-based assistant.

## Tech Stack

- **Backend**: FastAPI, SQLAlchemy 2.x (async), PostgreSQL
- **Frontend**: React.js (to be implemented)
- **AI/ML**: scikit-learn, sentence-transformers
- **RAG**: ChromaDB, embeddings, semantic retrieval
- **Auth**: JWT, bcrypt password hashing, RBAC

## Project Structure

```
HireMind/
├── app/
│   ├── main.py                 # FastAPI application entry point
│   ├── api/routes/             # API route handlers
│   ├── core/                   # Config, security, dependencies
│   ├── database/models/        # SQLAlchemy ORM models
│   ├── schemas/                # Pydantic request/response schemas
│   ├── services/               # Business logic layer
│   ├── ml/                     # Machine learning modules
│   ├── rag/                    # RAG system components
│   └── utils/                  # Utility functions
├── tests/                      # Test suite
├── uploads/                    # Resume uploads
├── chroma_data/                # ChromaDB persistence
├── requirements.txt
├── Dockerfile
└── README.md
```

## Getting Started

### Prerequisites

- Python 3.11+
- PostgreSQL 14+
- Virtual environment (recommended)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd HireMind
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

5. **Create PostgreSQL database**
   ```sql
   CREATE DATABASE hiremind;
   CREATE USER hiremind WITH PASSWORD 'hiremind123';
   GRANT ALL PRIVILEGES ON DATABASE hiremind TO hiremind;
   ```

6. **Run the application**
   ```bash
   uvicorn app.main:app --reload
   ```

7. **Access the API**
   - API: http://localhost:8000
   - Docs: http://localhost:8000/api/docs
   - ReDoc: http://localhost:8000/api/redoc

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login and get JWT token
- `GET /api/auth/me` - Get current user profile

### Jobs
- `POST /api/jobs` - Create job posting
- `GET /api/jobs` - List jobs
- `GET /api/jobs/{id}` - Get job details

### Candidates
- `GET /api/candidates` - List candidates
- `GET /api/candidates/{id}` - Get candidate profile

### Resumes
- `POST /api/resumes/upload` - Upload resume
- `GET /api/resumes/{id}` - Get resume details

### Applications
- `POST /api/applications` - Apply for job
- `GET /api/applications` - List applications
- `PUT /api/applications/{id}/status` - Update status

### Matching
- `POST /api/matching/analyze` - Analyze candidate-job match

### Interviews
- `POST /api/interviews` - Schedule interview
- `GET /api/interviews` - List interviews

### RAG Assistant
- `POST /api/rag/chat` - Chat with AI assistant

## User Roles

- **RECRUITER**: Create jobs, view candidates, manage applications, schedule interviews
- **CANDIDATE**: Create profile, upload resume, apply for jobs, track applications

## Development Status

### Completed
- [x] Backend infrastructure
- [x] Authentication (JWT, password hashing)
- [x] RBAC (role-based access control)
- [x] Database models (14 tables)
- [x] Core API routes

### In Progress
- [ ] Resume parsing and skill extraction
- [ ] Candidate-job matching algorithm
- [ ] RAG assistant implementation
- [ ] Frontend application
- [ ] Test coverage

## Security

- JWT-based authentication
- Bcrypt password hashing
- RBAC enforced at backend
- Input validation with Pydantic
- SQL injection prevention via SQLAlchemy
- File upload validation

## License

MIT License
