import { MOCK_DELAY, RANDOM_FAILURE_RATE, STORAGE_KEYS } from '../lib/constants';
import { generateId, sleep } from '../lib/utils';
import { MOCK_CANDIDATES } from '../data/mockData';

function randomFailure() {
  return Math.random() < RANDOM_FAILURE_RATE;
}

function getStoredCandidates() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PROFILE);
    if (raw) {
      return { ...MOCK_CANDIDATES, [generateId()]: JSON.parse(raw) };
    }
  } catch {
  }
  return MOCK_CANDIDATES;
}

function saveStoredProfile(profile) {
  try {
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
  } catch {
  }
}

export async function getProfile(candidateId = null) {
  await sleep(MOCK_DELAY * 0.8);
  if (randomFailure()) {
    throw new Error('Failed to load profile.');
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PROFILE);
    if (raw) return JSON.parse(raw);
  } catch {
  }
  if (candidateId) {
    const found = MOCK_CANDIDATES.find(c => c.id === candidateId);
    if (found) return found;
  }
  const defaultProfile = MOCK_CANDIDATES[0] || {
    id: 'cand_default',
    name: 'Rahul Sharma',
    email: 'rahul.sharma@email.com',
    phone: '+91 9876543210',
    avatar: 'bg-blue-500',
    title: 'Senior React Developer',
    headline: 'Passionate about building scalable web applications',
    yearsOfExperience: 5,
    currentCompany: 'Infosys',
    currentSalary: 18,
    expectedSalary: 28,
    location: 'Bangalore',
    preferredLocations: ['Bangalore', 'Remote'],
    willingToRelocate: true,
    remote: true,
    education: {
      degree: 'B.Tech in Computer Science',
      college: 'Indian Institute of Technology, Bombay',
      collegeTier: 1,
      graduationYear: 2020,
      cgpa: '8.7',
    },
    skills: ['React', 'TypeScript', 'Node.js', 'Next.js', 'Redux', 'Tailwind CSS', 'PostgreSQL', 'AWS'],
    certifications: ['AWS Certified Solutions Architect'],
    projects: [{
      name: 'E-Commerce Platform',
      description: 'Built end-to-end e-commerce platform serving 100K+ customers',
      tech: ['React', 'Node.js', 'MongoDB', 'AWS'],
      link: 'https://github.com/rahul/project1',
    }],
    experience: [{
      company: 'Infosys',
      title: 'Senior Software Engineer',
      startDate: new Date(2022, 5, 1).toISOString(),
      endDate: null,
      description: 'Leading frontend development for banking product, managing team of 4',
    }],
    languages: ['English', 'Hindi'],
    noticePeriod: '30 days',
    resumeUrl: '/resumes/default.pdf',
    score: 87,
    hasWorkAuthorization: true,
    createdAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
    lastActive: new Date().toISOString(),
  };
  saveStoredProfile(defaultProfile);
  return defaultProfile;
}

export async function updateProfile(candidateId, updates) {
  await sleep(MOCK_DELAY);
  if (randomFailure()) {
    throw new Error('Failed to update profile. Please try again.');
  }
  const current = await getProfile(candidateId);
  const updated = {
    ...current,
    ...updates,
    id: current.id,
    skills: updates.skills ? [...new Set([...(updates.skills || []), ...(current.skills || [])])] : current.skills,
  };
  saveStoredProfile(updated);
  return updated;
}

export async function getCandidates(filters = {}) {
  await sleep(MOCK_DELAY);
  if (randomFailure()) {
    throw new Error('Failed to load candidates.');
  }
  let candidates = [...getStoredCandidates()];
  if (filters.search) {
    const q = filters.search.toLowerCase();
    candidates = candidates.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.title?.toLowerCase().includes(q) ||
      c.skills.some(s => s.toLowerCase().includes(q)) ||
      c.currentCompany?.toLowerCase().includes(q)
    );
  }
  if (filters.location && filters.location !== 'all') {
    candidates = candidates.filter(c => c.location?.toLowerCase().includes(filters.location.toLowerCase()));
  }
  if (filters.experienceMin !== undefined && filters.experienceMin !== null) {
    candidates = candidates.filter(c => c.yearsOfExperience >= filters.experienceMin);
  }
  if (filters.experienceMax !== undefined && filters.experienceMax !== null) {
    candidates = candidates.filter(c => c.yearsOfExperience <= filters.experienceMax);
  }
  if (filters.salaryMin !== undefined && filters.salaryMin !== null) {
    candidates = candidates.filter(c => c.expectedSalary >= filters.salaryMin);
  }
  if (filters.salaryMax !== undefined && filters.salaryMax !== null) {
    candidates = candidates.filter(c => c.expectedSalary <= filters.salaryMax);
  }
  if (Array.isArray(filters.skills) && filters.skills.length > 0) {
    candidates = candidates.filter(c => filters.skills.some(s => c.skills?.includes(s)));
  }
  if (filters.available && filters.available !== 'all') {
    if (filters.available === 'immediate') {
      candidates = candidates.filter(c => ['Immediate', '15 days'].includes(c.noticePeriod));
    } else if (filters.available === '30days') {
      candidates = candidates.filter(c => ['Immediate', '15 days', '30 days'].includes(c.noticePeriod));
    }
  }
  if (filters.remote) {
    candidates = candidates.filter(c => c.remote === true || c.willingToRelocate === true);
  }
  if (filters.minScore !== undefined) {
    candidates = candidates.filter(c => (c.score || 0) >= filters.minScore);
  }
  const sort = filters.sort || 'relevance';
  switch (sort) {
    case 'score-high':
      candidates = candidates.sort((a, b) => (b.score || 0) - (a.score || 0));
      break;
    case 'experience-high':
      candidates = candidates.sort((a, b) => b.yearsOfExperience - a.yearsOfExperience);
      break;
    case 'recent':
      candidates = candidates.sort((a, b) => new Date(b.lastActive || b.createdAt) - new Date(a.lastActive || a.createdAt));
      break;
    case 'relevance':
    default:
      break;
  }
  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const start = (page - 1) * limit;
  return {
    data: candidates.slice(start, start + limit),
    total: candidates.length,
    page,
    limit,
    totalPages: Math.ceil(candidates.length / limit),
    hasNext: start + limit < candidates.length,
    hasPrev: page > 1,
  };
}

export async function getCandidateById(id) {
  await sleep(MOCK_DELAY * 0.7);
  if (randomFailure()) {
    throw new Error('Failed to load candidate details.');
  }
  const candidates = getStoredCandidates();
  const found = candidates.find(c => c.id === id);
  if (!found) {
    throw new Error('Candidate not found');
  }
  return found;
}
