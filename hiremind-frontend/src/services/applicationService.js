import { MOCK_DELAY, RANDOM_FAILURE_RATE, STORAGE_KEYS } from '../lib/constants';
import { generateId, sleep } from '../lib/utils';
import { MOCK_APPLICATIONS, MOCK_JOBS, MOCK_CANDIDATES } from '../data/mockData';

function randomFailure() {
  return Math.random() < RANDOM_FAILURE_RATE;
}

function getStoredApplications() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.APPLICATIONS);
    if (raw) return JSON.parse(raw);
  } catch {
  }
  return MOCK_APPLICATIONS;
}

function saveStoredApplications(applications) {
  try {
    localStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify(applications));
  } catch {
  }
}

export async function getApplications(filters = {}) {
  await sleep(MOCK_DELAY);
  if (randomFailure()) {
    throw new Error('Failed to load applications.');
  }
  let applications = [...getStoredApplications()];
  if (filters.jobId) {
    applications = applications.filter(a => a.jobId === filters.jobId);
  }
  if (filters.candidateId) {
    applications = applications.filter(a => a.candidateId === filters.candidateId);
  }
  if (filters.status && filters.status !== 'all') {
    applications = applications.filter(a => a.status === filters.status);
  }
  if (filters.location && filters.location !== 'all') {
    applications = applications.filter(a => a.jobLocation?.toLowerCase().includes(filters.location.toLowerCase()));
  }
  if (filters.search) {
    const q = filters.search.toLowerCase();
    applications = applications.filter(a =>
      a.jobTitle.toLowerCase().includes(q) ||
      a.companyName.toLowerCase().includes(q) ||
      a.candidateName.toLowerCase().includes(q) ||
      a.candidateSkills?.some(s => s.toLowerCase().includes(q))
    );
  }
  if (filters.minScore !== undefined) {
    applications = applications.filter(a => (a.overallScore || 0) >= filters.minScore);
  }
  if (filters.bookmarked) {
    applications = applications.filter(a => a.bookmarked === true);
  }
  const sort = filters.sort || 'recent';
  switch (sort) {
    case 'recent':
      applications = applications.sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt));
      break;
    case 'score-high':
      applications = applications.sort((a, b) => (b.overallScore || 0) - (a.overallScore || 0));
      break;
    case 'oldest':
      applications = applications.sort((a, b) => new Date(a.appliedAt) - new Date(b.appliedAt));
      break;
  }
  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const start = (page - 1) * limit;
  return {
    data: applications.slice(start, start + limit),
    total: applications.length,
    page,
    limit,
    totalPages: Math.ceil(applications.length / limit),
    hasNext: start + limit < applications.length,
    hasPrev: page > 1,
    aggregations: {
      byStatus: [
        { status: 'applied', count: applications.filter(a => a.status === 'applied').length },
        { status: 'screening', count: applications.filter(a => a.status === 'screening').length },
        { status: 'shortlisted', count: applications.filter(a => a.status === 'shortlisted').length },
        { status: 'interview', count: applications.filter(a => a.status === 'interview').length },
        { status: 'selected', count: applications.filter(a => a.status === 'selected').length },
        { status: 'rejected', count: applications.filter(a => a.status === 'rejected').length },
      ],
    },
  };
}

export async function getApplicationById(id) {
  await sleep(MOCK_DELAY * 0.7);
  if (randomFailure()) {
    throw new Error('Failed to load application details.');
  }
  const applications = getStoredApplications();
  const found = applications.find(a => a.id === id);
  if (!found) {
    throw new Error('Application not found');
  }
  return found;
}

export async function applyToJob(jobId, candidateData, answers = []) {
  await sleep(MOCK_DELAY * 1.4);
  if (randomFailure()) {
    throw new Error('Failed to submit application. Please try again.');
  }
  const applications = getStoredApplications();
  const alreadyApplied = applications.find(a => a.jobId === jobId && a.candidateId === candidateData?.id);
  if (alreadyApplied) {
    throw new Error('You have already applied to this job.');
  }
  const job = MOCK_JOBS.find(j => j.id === jobId);
  const candidate = candidateData?.id
    ? MOCK_CANDIDATES.find(c => c.id === candidateData.id) || candidateData
    : candidateData || MOCK_CANDIDATES[0];
  const scoreComponents = {
    resumeMatchScore: 55 + Math.floor(Math.random() * 45),
    skillMatchScore: 50 + Math.floor(Math.random() * 50),
    experienceMatch: 45 + Math.floor(Math.random() * 55),
    cultureFitScore: 50 + Math.floor(Math.random() * 50),
  };
  const overallScore = Math.round(
    scoreComponents.resumeMatchScore * 0.3 +
    scoreComponents.skillMatchScore * 0.3 +
    scoreComponents.experienceMatch * 0.25 +
    scoreComponents.cultureFitScore * 0.15
  );
  const application = {
    id: 'app_' + generateId(),
    jobId,
    jobTitle: job?.title || 'Unknown Position',
    jobLocation: job?.location || 'Not specified',
    jobType: job?.type || 'full-time',
    companyId: job?.companyId || 'c1',
    companyName: job?.companyName || 'Unknown Company',
    companyLogo: job?.companyLogo || 'COMP',
    candidateId: candidate?.id || 'cand_' + generateId(),
    candidateName: candidate?.name || 'Candidate',
    candidateTitle: candidate?.title || '',
    candidateAvatar: candidate?.avatar || 'bg-blue-500',
    candidateSkills: candidate?.skills?.slice(0, 6) || [],
    candidateExperience: candidate?.yearsOfExperience || 0,
    candidateScore: candidate?.score || overallScore,
    candidateLocation: candidate?.location || '',
    status: 'applied',
    appliedAt: new Date().toISOString(),
    screeningAt: null,
    shortlistedAt: null,
    interviewAt: null,
    selectedAt: null,
    rejectedAt: null,
    ...scoreComponents,
    overallScore,
    answers,
    notes: null,
    reviewedBy: null,
    bookmarked: false,
    flagged: false,
  };
  const updated = [application, ...applications];
  saveStoredApplications(updated);
  return application;
}

export async function updateApplicationStatus(id, status, notes = null) {
  await sleep(MOCK_DELAY * 0.9);
  if (randomFailure()) {
    throw new Error('Failed to update application status.');
  }
  const applications = getStoredApplications();
  const index = applications.findIndex(a => a.id === id);
  if (index === -1) {
    throw new Error('Application not found');
  }
  const now = new Date().toISOString();
  const updates = { status };
  if (status === 'screening' && !applications[index].screeningAt) updates.screeningAt = now;
  if (status === 'shortlisted' && !applications[index].shortlistedAt) updates.shortlistedAt = now;
  if (status === 'interview' && !applications[index].interviewAt) updates.interviewAt = now;
  if (status === 'selected' && !applications[index].selectedAt) updates.selectedAt = now;
  if (status === 'rejected' && !applications[index].rejectedAt) updates.rejectedAt = now;
  if (notes) updates.notes = notes;
  applications[index] = { ...applications[index], ...updates };
  saveStoredApplications(applications);
  return applications[index];
}

export async function toggleBookmark(id) {
  await sleep(MOCK_DELAY * 0.3);
  const applications = getStoredApplications();
  const index = applications.findIndex(a => a.id === id);
  if (index === -1) throw new Error('Application not found');
  applications[index].bookmarked = !applications[index].bookmarked;
  saveStoredApplications(applications);
  return applications[index];
}

export async function bulkUpdateStatus(ids, status) {
  await sleep(MOCK_DELAY * 1.2);
  if (randomFailure()) {
    throw new Error('Bulk update failed. Some updates may not have been applied.');
  }
  const applications = getStoredApplications();
  const now = new Date().toISOString();
  for (let i = 0; i < applications.length; i++) {
    if (ids.includes(applications[i].id)) {
      applications[i].status = status;
      if (status === 'screening' && !applications[i].screeningAt) applications[i].screeningAt = now;
      if (status === 'shortlisted' && !applications[i].shortlistedAt) applications[i].shortlistedAt = now;
      if (status === 'rejected' && !applications[i].rejectedAt) applications[i].rejectedAt = now;
    }
  }
  saveStoredApplications(applications);
  return { success: true, updatedCount: ids.length, status };
}
