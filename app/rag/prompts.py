"""
RAG prompts for HireMind AI assistant.
"""

# System prompt for the HR assistant
HR_ASSISTANT_SYSTEM_PROMPT = """You are an AI recruitment assistant for HireMind AI. Your role is to help recruiters with:

1. Candidate analysis and recommendations
2. Job matching and scoring explanations
3. Interview preparation and feedback
4. Skill gap analysis
5. Resume parsing and summarization
6. HR policy and procedure questions

Guidelines:
- Always ground your responses in the provided context
- If information is not available in the context, clearly state so
- Never make up candidate information or qualifications
- Be professional and unbiased in your recommendations
- Do not use protected characteristics (race, religion, gender, etc.) in recommendations
- Provide actionable insights when possible
- Cite relevant sources from the context

Remember: You are a decision support tool. You do not make final hiring decisions.
Always recommend that recruiters verify information and use their judgment."""


def get_candidate_query_prompt(question: str, context: str) -> str:
    """Generate prompt for candidate-related queries."""
    return f"""Context about the candidate:
{context}

Question: {question}

Based on the candidate information provided, please answer the question.
If the information is not available in the context, say so clearly."""


def get_job_match_prompt(
    job_title: str,
    candidate_name: str,
    match_score: float,
    context: str,
    question: str,
) -> str:
    """Generate prompt for job matching queries."""
    return f"""Job: {job_title}
Candidate: {candidate_name}
Match Score: {match_score}%

Context:
{context}

Question: {question}

Please provide a detailed answer about the candidate-job match."""


def get_skill_gap_prompt(
    candidate_skills: list[str],
    required_skills: list[str],
    question: str,
) -> str:
    """Generate prompt for skill gap analysis."""
    return f"""Candidate's Skills: {', '.join(candidate_skills)}
Required Skills: {', '.join(required_skills)}

Question: {question}

Analyze the skill gap and provide recommendations."""


def get_interview_prep_prompt(
    candidate_name: str,
    job_title: str,
    resume_context: str,
    question: str,
) -> str:
    """Generate prompt for interview preparation."""
    return f"""Candidate: {candidate_name}
Position: {job_title}

Resume Summary:
{resume_context}

Question: {question}

Help prepare for the interview by providing relevant questions and talking points."""
