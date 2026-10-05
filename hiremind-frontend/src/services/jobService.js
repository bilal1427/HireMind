import { MOCK_DELAY, RANDOM_FAILURE_RATE, STORAGE_KEYS } from '../lib/constants';
import { generateId, sleep } from '../lib/utils';
import { MOCK_JOBS } from '../data/mockData';

function randomFailure() {
  return Math.random() < RANDOM_FAILURE_RATE;
}

function getStoredJobs() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.JOBS);
    if (raw) return JSON.parse(raw);
  } catch {
  }
  return MOCK_JOBS;
}

function saveStoredJobs(jobs) {
  try {
    localStorage.setItem(STORAGE_KEYS.JOBS, JSON.stringify(jobs));
  } catch {
  }
}

function normalizeJob(job) {
  return {
    ...job,
    applicants: typeof job.applicants === 'number' ? job.applicants : 0,
    views: typeof job.views === 'number' ? job.views : 0,
  };
}

export async function getJobs(filters = {}) {
  await sleep(MOCK_DELAY);
  if (randomFailure()) {
    throw new Error('Failed to load jobs. Please try again.');
  }
  let jobs = getStoredJobs();
  if (filters.search) {
    const q = filters.search.toLowerCase();
    jobs = jobs.filter(j =>
      j.title.toLowerCase().includes(q) ||
      j.companyName.toLowerCase().includes(q) ||
      j.skills.some(s => s.toLowerCase().includes(q)) ||
      j.location.toLowerCase().includes(q)
    );
  }
  if (filters.location && filters.location !== 'all') {
    jobs = jobs.filter(j => j.location.toLowerCase().includes(filters.location.toLowerCase()));
  }
  if (filters.type && filters.type !== 'all') {
    jobs = jobs.filter(j => j.type === filters.type);
  }
  if (filters.workMode && filters.workMode !== 'all') {
    jobs = jobs.filter(j => j.workMode === filters.workMode);
  }
  if (filters.department && filters.department !== 'all') {
    jobs = jobs.filter(j => j.department === filters.department);
  }
  if (filters.experienceMin !== undefined && filters.experienceMin !== null) {
    jobs = jobs.filter(j => j.experienceMax >= filters.experienceMin);
  }
  if (filters.experienceMax !== undefined && filters.experienceMax !== null) {
    jobs = jobs.filter(j => j.experienceMin <= filters.experienceMax);
  }
  if (filters.salaryMin !== undefined && filters.salaryMin !== null) {
    jobs = jobs.filter(j => j.salaryMax >= filters.salaryMin);
  }
  if (filters.salaryMax !== undefined && filters.salaryMax !== null) {
    jobs = jobs.filter(j => j.salaryMin <= filters.salaryMax);
  }
  if (Array.isArray(filters.skills) && filters.skills.length > 0) {
    jobs = jobs.filter(j => filters.skills.some(s => j.skills.includes(s)));
  }
  if (filters.isActive !== undefined && filters.isActive !== null) {
    jobs = jobs.filter(j => j.isActive === filters.isActive);
  }
  if (filters.isFeatured) {
    jobs = jobs.filter(j => j.isFeatured);
  }
  const sort = filters.sort || 'newest';
  switch (sort) {
    case 'newest':
      jobs = [...jobs].sort((a, b) => new Date(b.postedAt) - new Date(a.postedAt));
      break;
    case 'salary-high':
      jobs = [...jobs].sort((a, b) => b.salaryMax - a.salaryMax);
      break;
    case 'salary-low':
      jobs = [...jobs].sort((a, b) => a.salaryMin - b.salaryMin);
      break;
    case 'most-applicants':
      jobs = [...jobs].sort((a, b) => b.applicants - a.applicants);
      break;
    case 'relevant':
    default:
      break;
  }
  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const start = (page - 1) * limit;
  const paginated = jobs.slice(start, start + limit);
  return {
    data: paginated.map(normalizeJob),
    total: jobs.length,
    page,
    limit,
    totalPages: Math.ceil(jobs.length / limit),
    hasNext: start + limit < jobs.length,
    hasPrev: page > 1,
  };
}

export async function getJobById(id) {
  await sleep(MOCK_DELAY * 0.7);
  if (randomFailure()) {
    throw new Error('Failed to load job details.');
  }
  const jobs = getStoredJobs();
  const job = jobs.find(j => j.id === id);
  if (!job) {
    throw new Error('Job not found');
  }
  return normalizeJob(job);
}

export async function createJob(jobData) {
  await sleep(MOCK_DELAY * 1.2);
  if (randomFailure()) {
    throw new Error('Failed to create job posting. Please try again.');
  }
  const jobs = getStoredJobs();
  const newJob = {
    id: 'job_' + generateId(),
    title: jobData.title,
    companyId: jobData.companyId || 'c1',
    companyName: jobData.companyName || 'HireMind AI',
    companyLogo: jobData.companyLogo || 'HMA',
    companyIndustry: jobData.companyIndustry || 'Technology',
    location: jobData.location,
    workMode: jobData.workMode || 'hybrid',
    type: jobData.type || 'full-time',
    department: jobData.department || 'engineering',
    salaryMin: jobData.salaryMin || 5,
    salaryMax: jobData.salaryMax || 15,
    experienceMin: jobData.experienceMin || 0,
    experienceMax: jobData.experienceMax || 3,
    skills: jobData.skills || [],
    description: jobData.description || '',
    responsibilities: jobData.responsibilities || [],
    requirements: jobData.requirements || [],
    benefits: jobData.benefits || [
      'Competitive salary', 'Health insurance', 'Remote options', 'Learning budget',
    ],
    postedBy: jobData.postedBy || 'rec_1',
    postedAt: new Date().toISOString(),
    isActive: jobData.isActive !== undefined ? jobData.isActive : true,
    isFeatured: false,
    views: 0,
    applicants: 0,
    questions: jobData.questions || [],
  };
  const updated = [newJob, ...jobs];
  saveStoredJobs(updated);
  return normalizeJob(newJob);
}

export async function updateJob(id, updates) {
  await sleep(MOCK_DELAY);
  if (randomFailure()) {
    throw new Error('Failed to update job. Please try again.');
  }
  const jobs = getStoredJobs();
  const index = jobs.findIndex(j => j.id === id);
  if (index === -1) throw new Error('Job not found');
  const updated = { ...jobs[index], ...updates };
  jobs[index] = updated;
  saveStoredJobs(jobs);
  return normalizeJob(updated);
}

export async function deleteJob(id) {
  await sleep(MOCK_DELAY * 0.8);
  if (randomFailure()) {
    throw new Error('Failed to delete job.');
  }
  const jobs = getStoredJobs();
  const filtered = jobs.filter(j => j.id !== id);
  saveStoredJobs(filtered);
  return { success: true, id };
}

export async function toggleJobActive(id) {
  await sleep(MOCK_DELAY * 0.6);
  if (randomFailure()) {
    throw new Error('Failed to update job status.');
  }
  const jobs = getStoredJobs();
  const index = jobs.findIndex(j => j.id === id);
  if (index === -1) throw new Error('Job not found');
  jobs[index].isActive = !jobs[index].isActive;
  saveStoredJobs(jobs);
  return normalizeJob(jobs[index]);
}

export async function incrementJobViews(id) {
  try {
    const jobs = getStoredJobs();
    const job = jobs.find(j => j.id === id);
    if (job) {
      job.views = (job.views || 0) + 1;
      saveStoredJobs(jobs);
    }
  } catch {
  }
  return { success: true };
}
