# HireMind AI - Backend Setup Guide

## Quick Start

### 1. Prerequisites

- Python 3.11+
- PostgreSQL 14+
- Virtual environment (recommended)

### 2. Database Setup

Create a PostgreSQL database:

```sql
-- Connect to PostgreSQL as superuser
psql -U postgres

-- Create database and user
CREATE DATABASE hiremind;
CREATE USER hiremind WITH PASSWORD 'hiremind123';
GRANT ALL PRIVILEGES ON DATABASE hiremind TO hiremind;

-- Connect to the database
\c hiremind

-- Grant schema permissions
GRANT ALL ON SCHEMA public TO hiremind;
```

### 3. Environment Configuration

The `.env` file has been created with default values. Update as needed:

```bash
# Navigate to project directory
cd HireMind

# Review and update .env if needed
# Default settings:
# - Database: postgresql+asyncpg://hiremind:hiremind123@localhost:5432/hiremind
# - JWT Secret: your-super-secret-jwt-key-change-this-in-production
# - CORS: http://localhost:5173,http://localhost:3000
```

**Important:** Change the `JWT_SECRET_KEY` in production!

### 4. Install Dependencies

```bash
# Create virtual environment
python -m venv .venv

# Activate virtual environment
# On Windows:
.venv\Scripts\activate
# On Linux/Mac:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 5. Initialize Database

```bash
# Run the database initialization script
python scripts/init_db.py
```

This will:
- Create all database tables
- Add default skills
- Create test users (recruiter@test.com / candidate@test.com)

### 6. Run the Application

```bash
# Start the development server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 7. Access the API

- **API Root**: http://localhost:8000
- **Swagger UI**: http://localhost:8000/api/docs
- **ReDoc**: http://localhost:8000/api/redoc
- **Health Check**: http://localhost:8000/health

## Test Credentials

Two test accounts are created automatically:

**Recruiter Account:**
- Email: `recruiter@test.com`
- Password: `password123`

**Candidate Account:**
- Email: `candidate@test.com`
- Password: `password123`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login and get JWT token
- `GET /api/auth/me` - Get current user profile

### Jobs (Recruiter)
- `POST /api/jobs` - Create job posting
- `GET /api/jobs` - List jobs
- `GET /api/jobs/{id}` - Get job details
- `PUT /api/jobs/{id}` - Update job
- `DELETE /api/jobs/{id}` - Delete job

### Candidates
- `GET /api/candidates` - List candidates (recruiters only)
- `GET /api/candidates/{id}` - Get candidate profile
- `PUT /api/candidates/me` - Update own profile

### Resumes (Candidate)
- `POST /api/resumes/upload` - Upload resume
- `GET /api/resumes` - List own resumes
- `GET /api/resumes/{id}` - Get resume details
- `DELETE /api/resumes/{id}` - Delete resume

### Applications
- `POST /api/applications` - Apply for job (candidate)
- `GET /api/applications` - List applications
- `GET /api/applications/{id}` - Get application details
- `PUT /api/applications/{id}/status` - Update status (recruiter)

### Matching
- `POST /api/matching/analyze` - Analyze candidate-job match
- `GET /api/matching/jobs/{job_id}/candidates` - Get ranked candidates for job
- `GET /api/matching/candidates/{candidate_id}/jobs` - Get recommended jobs

### Interviews
- `POST /api/interviews` - Schedule interview
- `GET /api/interviews` - List interviews
- `GET /api/interviews/{id}` - Get interview details
- `PUT /api/interviews/{id}` - Update interview
- `POST /api/interviews/{id}/feedback` - Add feedback

### RAG Assistant
- `POST /api/rag/documents` - Upload document to knowledge base
- `POST /api/rag/chat` - Chat with AI assistant
- `GET /api/rag/sessions` - List chat sessions

### Dashboard
- `GET /api/dashboard/recruiter` - Recruiter dashboard stats
- `GET /api/dashboard/candidate` - Candidate dashboard stats

## Project Structure

```
HireMind/
├── app/
│   ├── main.py                 # FastAPI application entry
│   ├── api/routes/             # API route handlers
│   ├── core/                   # Config, security, dependencies
│   ├── database/models/        # SQLAlchemy ORM models (14 tables)
│   ├── schemas/                # Pydantic request/response schemas
│   ├── services/               # Business logic layer
│   ├── ml/                     # Machine learning modules
│   ├── rag/                    # RAG system components
│   └── utils/                  # Utility functions
├── scripts/
│   └── init_db.py              # Database initialization
├── tests/                      # Test suite
├── uploads/                    # Resume uploads (auto-created)
├── chroma_data/                # ChromaDB persistence (auto-created)
├── requirements.txt
└── .env                        # Environment configuration
```

## Features Implemented

### ✅ Core Features
- User authentication (JWT)
- Role-based access control (RBAC)
- Recruiter and candidate profiles
- Job posting management
- Resume upload and parsing
- Application tracking
- Interview scheduling

### ✅ AI/ML Features
- Resume parsing with skill extraction
- Candidate-job matching algorithm
- Job role prediction (heuristic + ML)
- RAG-based AI assistant
- Semantic search with ChromaDB

### ✅ Matching System
- Weighted scoring (skills, experience, education, projects, certifications)
- Skill gap analysis
- Recommendation engine
- Explainable matching

## Development

### Run Tests

```bash
pytest tests/ -v
```

### Database Migrations

If you need to modify the database schema:

```bash
# After model changes, recreate tables (development only)
# Drop and recreate database, then run init script
python scripts/init_db.py
```

## Production Deployment

### Security Checklist

1. Change `JWT_SECRET_KEY` to a secure random value
2. Set `DEBUG=false` in `.env`
3. Set `APP_ENV=production`
4. Use HTTPS
5. Configure proper CORS origins
6. Set up database backups
7. Use environment variables for secrets
8. Enable rate limiting
9. Set up logging and monitoring

### Generate Secure JWT Secret

```python
import secrets
print(secrets.token_urlsafe(32))
```

## Troubleshooting

### Database Connection Error

```bash
# Check PostgreSQL is running
# Windows: Check Services
# Linux: sudo systemctl status postgresql

# Verify connection string in .env
DATABASE_URL=postgresql+asyncpg://hiremind:hiremind123@localhost:5432/hiremind
```

### Import Errors

```bash
# Ensure virtual environment is activated
.venv\Scripts\activate  # Windows
source .venv/bin/activate  # Linux/Mac

# Reinstall dependencies
pip install -r requirements.txt
```

### Port Already in Use

```bash
# Use a different port
uvicorn app.main:app --reload --port 8001
```

## Support

For issues or questions, please refer to the API documentation at:
- Swagger UI: http://localhost:8000/api/docs
- ReDoc: http://localhost:8000/api/redoc
