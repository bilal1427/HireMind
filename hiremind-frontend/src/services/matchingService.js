import { MOCK_DELAY, RANDOM_FAILURE_RATE } from '../lib/constants';
import { sleep } from '../lib/utils';
import { MOCK_JOBS, MOCK_CANDIDATES } from '../data/mockData';

function randomFailure() {
  return Math.random() < RANDOM_FAILURE_RATE;
}

function computeMatch(candidate, job) {
  const skillIntersection = candidate.skills.filter(s => job.skills.includes(s));
  const skillScore = job.skills.length > 0
    ? Math.round((skillIntersection.length / job.skills.length) * 100)
    : 60;
  const expDiff = candidate.yearsOfExperience - job.experienceMin;
  const expScore = expDiff < 0
    ? Math.max(20, 50 + expDiff * 10)
    : expDiff > (job.experienceMax - job.experienceMin)
      ? 75
      : Math.min(100, 75 + expDiff * 4);
  const locationMatch = job.location === candidate.location
    ? 100
    : job.workMode === 'remote' || candidate.remote
      ? 85
      : candidate.willingToRelocate
        ? 70
        : 40;
  const tierBonus = (candidate.education?.collegeTier || 3) === 1 ? 10 : candidate.education?.collegeTier === 2 ? 5 : 0;
  const overall = Math.round(
    skillScore * 0.40 +
    expScore * 0.30 +
    locationMatch * 0.20 +
    tierBonus * 2
  );
  return {
    overallScore: Math.min(100, Math.max(20, overall)),
    skillScore,
    experienceScore: Math.round(expScore),
    locationScore: locationMatch,
    educationScore: 60 + tierBonus * 2,
    matchedSkills: skillIntersection,
    missingSkills: job.skills.filter(s => !candidate.skills.includes(s)),
    extraSkills: candidate.skills.filter(s => !job.skills.includes(s)).slice(0, 5),
    explanation: skillIntersection.length === job.skills.length
      ? 'Excellent skill overlap with all required competencies.'
      : skillIntersection.length >= job.skills.length * 0.7
        ? 'Strong match with most required skills.'
        : 'Partial skill coverage, some upskilling needed.',
  };
}

export async function getRecommendedJobs(candidateId, filters = {}) {
  await sleep(MOCK_DELAY * 1.3);
  if (randomFailure()) {
    throw new Error('Failed to load recommended jobs.');
  }
  const candidate = MOCK_CANDIDATES.find(c => c.id === candidateId) || MOCK_CANDIDATES[0];
  const scored = MOCK_JOBS
    .filter(j => j.isActive)
    .map(job => {
      const match = computeMatch(candidate, job);
      return { ...job, match: match.overallScore, matchDetails: match };
    })
    .sort((a, b) => b.match - a.match);
  const topJobs = scored.slice(0, filters.limit || 20);
  return {
    data: topJobs,
    total: scored.length,
    averageMatch: Math.round(topJobs.reduce((s, j) => s + j.match, 0) / topJobs.length),
  };
}

export async function getMatchScore(candidateId, jobId) {
  await sleep(MOCK_DELAY * 0.8);
  if (randomFailure()) {
    throw new Error('Failed to compute match score.');
  }
  const candidate = MOCK_CANDIDATES.find(c => c.id === candidateId) || MOCK_CANDIDATES[0];
  const job = MOCK_JOBS.find(j => j.id === jobId) || MOCK_JOBS[0];
  return computeMatch(candidate, job);
}

export async function getSkillGap(candidateId, jobId = null, targetRole = null) {
  await sleep(MOCK_DELAY * 1);
  if (randomFailure()) {
    throw new Error('Failed to analyze skill gaps.');
  }
  const candidate = MOCK_CANDIDATES.find(c => c.id === candidateId) || MOCK_CANDIDATES[0];
  let targetSkills = [];
  let targetTitle = targetRole;
  if (jobId) {
    const job = MOCK_JOBS.find(j => j.id === jobId);
    if (job) {
      targetSkills = job.skills;
      targetTitle = job.title;
    }
  } else if (targetRole) {
    const related = MOCK_JOBS.filter(j => j.title.toLowerCase().includes(targetRole.toLowerCase()));
    const skillCounts = {};
    related.slice(0, 10).forEach(j => j.skills.forEach(s => {
      skillCounts[s] = (skillCounts[s] || 0) + 1;
    }));
    targetSkills = Object.entries(skillCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([s]) => s);
  } else {
    targetTitle = candidate.title + ' (Next level)';
    const related = MOCK_JOBS.filter(j => {
      const titleLow = j.title.toLowerCase();
      const candTitleLow = (candidate.title || '').toLowerCase();
      return candTitleLow.split(' ').some(w => titleLow.includes(w));
    });
    const skillCounts = {};
    related.slice(0, 15).forEach(j => j.skills.forEach(s => {
      skillCounts[s] = (skillCounts[s] || 0) + 1;
    }));
    targetSkills = Object.entries(skillCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([s]) => s);
  }
  const currentSkills = candidate.skills || [];
  const gaps = targetSkills.filter(s => !currentSkills.includes(s));
  const strengths = targetSkills.filter(s => currentSkills.includes(s));
  const learningResources = {
    'React': { courses: ['React - The Complete Guide (Udemy)', 'Advanced React Patterns (Frontend Masters)'], docs: 'https://react.dev', hours: 40 },
    'TypeScript': { courses: ['TypeScript: Complete Developer Guide', 'Advanced TypeScript (Matt Pocock)'], docs: 'https://www.typescriptlang.org/docs', hours: 30 },
    'Next.js': { courses: ['Next.js 15 Complete Course'], docs: 'https://nextjs.org/docs', hours: 25 },
    'Node.js': { courses: ['Node.js Developer Course', 'Advanced Node.js Concepts'], docs: 'https://nodejs.org/docs', hours: 45 },
    'AWS': { courses: ['AWS Certified Solutions Architect'], docs: 'https://aws.amazon.com/docs', hours: 60 },
    'Kubernetes': { courses: ['Certified Kubernetes Administrator (CKA)'], docs: 'https://kubernetes.io/docs', hours: 80 },
    'Python': { courses: ['Complete Python Bootcamp'], docs: 'https://docs.python.org', hours: 40 },
    'Machine Learning': { courses: ['Machine Learning Specialization (Coursera)'], docs: 'https://scikit-learn.org', hours: 100 },
  };
  return {
    targetTitle,
    targetSkills,
    currentSkills,
    strengths: strengths.map(s => ({
      skill: s,
      demand: Math.round(70 + Math.random() * 30),
      proficiency: Math.round(60 + Math.random() * 30),
    })),
    gaps: gaps.map(s => ({
      skill: s,
      demand: Math.round(60 + Math.random() * 40),
      priority: gaps.indexOf(s) < 3 ? 'critical' : gaps.indexOf(s) < 6 ? 'high' : 'medium',
      estimatedHours: learningResources[s]?.hours || 20,
      resources: learningResources[s] || { courses: ['Generic online course'], docs: '#', hours: 25 },
    })),
    suggestions: gaps.length === 0
      ? ['You have all the key skills! Consider deepening expertise with advanced certifications.']
      : [
          `Focus on ${gaps[0]} first — highest demand for ${targetTitle} roles.`,
          gaps.length > 1 ? `Next, prioritize ${gaps[1]} to improve candidacy.` : '',
          'Consider contributing to open-source projects to demonstrate real-world skills.',
        ].filter(Boolean),
    overallReadiness: Math.round((strengths.length / Math.max(1, targetSkills.length)) * 100),
  };
}

export async function compareCandidates(candidateIds, jobId = null) {
  await sleep(MOCK_DELAY * 1.2);
  if (randomFailure()) {
    throw new Error('Failed to compare candidates.');
  }
  const job = jobId ? MOCK_JOBS.find(j => j.id === jobId) : null;
  const candidates = candidateIds
    .map(id => MOCK_CANDIDATES.find(c => c.id === id))
    .filter(Boolean);
  return candidates.map(candidate => {
    const match = job ? computeMatch(candidate, job) : null;
    return {
      id: candidate.id,
      name: candidate.name,
      avatar: candidate.avatar,
      title: candidate.title,
      location: candidate.location,
      experience: candidate.yearsOfExperience,
      skills: candidate.skills,
      skillsCount: candidate.skills.length,
      education: candidate.education,
      collegeTier: candidate.education?.collegeTier || 3,
      cgpa: candidate.education?.cgpa,
      currentCompany: candidate.currentCompany,
      expectedSalary: candidate.expectedSalary,
      noticePeriod: candidate.noticePeriod,
      score: candidate.score,
      matchScore: match?.overallScore || Math.round(50 + Math.random() * 45),
      matchDetails: match,
      languages: candidate.languages?.length || 1,
      projectsCount: candidate.projects?.length || 0,
      certificationsCount: candidate.certifications?.length || 0,
      overallRank: 0,
    };
  }).sort((a, b) => b.matchScore - a.matchScore).map((c, idx) => ({ ...c, overallRank: idx + 1 }));
}
