import { MOCK_DELAY, RANDOM_FAILURE_RATE, STORAGE_KEYS } from '../lib/constants';
import { generateId, sleep } from '../lib/utils';
import { MOCK_INTERVIEWS } from '../data/mockData';

function randomFailure() {
  return Math.random() < RANDOM_FAILURE_RATE;
}

function getStoredInterviews() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.INTERVIEWS);
    if (raw) return JSON.parse(raw);
  } catch {
  }
  return MOCK_INTERVIEWS;
}

function saveStoredInterviews(interviews) {
  try {
    localStorage.setItem(STORAGE_KEYS.INTERVIEWS, JSON.stringify(interviews));
  } catch {
  }
}

export async function getInterviews(filters = {}) {
  await sleep(MOCK_DELAY);
  if (randomFailure()) {
    throw new Error('Failed to load interviews.');
  }
  let interviews = [...getStoredInterviews()];
  if (filters.candidateId) {
    interviews = interviews.filter(i => i.candidateId === filters.candidateId);
  }
  if (filters.jobId) {
    interviews = interviews.filter(i => i.jobId === filters.jobId);
  }
  if (filters.applicationId) {
    interviews = interviews.filter(i => i.applicationId === filters.applicationId);
  }
  if (filters.status && filters.status !== 'all') {
    interviews = interviews.filter(i => i.status === filters.status);
  }
  if (filters.type && filters.type !== 'all') {
    interviews = interviews.filter(i => i.type === filters.type);
  }
  if (filters.upcoming) {
    const now = new Date();
    interviews = interviews.filter(i => new Date(i.startTime) > now && i.status === 'scheduled');
  }
  if (filters.past) {
    const now = new Date();
    interviews = interviews.filter(i => new Date(i.endTime) < now);
  }
  if (filters.dateFrom) {
    interviews = interviews.filter(i => new Date(i.startTime) >= new Date(filters.dateFrom));
  }
  if (filters.dateTo) {
    interviews = interviews.filter(i => new Date(i.startTime) <= new Date(filters.dateTo));
  }
  if (filters.search) {
    const q = filters.search.toLowerCase();
    interviews = interviews.filter(i =>
      i.candidateName.toLowerCase().includes(q) ||
      i.jobTitle.toLowerCase().includes(q) ||
      i.interviewer?.name?.toLowerCase().includes(q)
    );
  }
  interviews = interviews.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
  const page = filters.page || 1;
  const limit = filters.limit || 30;
  const start = (page - 1) * limit;
  const now = new Date();
  return {
    data: interviews.slice(start, start + limit),
    total: interviews.length,
    page,
    limit,
    totalPages: Math.ceil(interviews.length / limit),
    stats: {
      upcoming: interviews.filter(i => new Date(i.startTime) > now && i.status === 'scheduled').length,
      completed: interviews.filter(i => i.status === 'completed').length,
      cancelled: interviews.filter(i => i.status === 'cancelled').length,
      noShow: interviews.filter(i => i.status === 'no_show').length,
      avgRating: (() => {
        const rated = interviews.filter(i => i.rating);
        if (rated.length === 0) return 0;
        return (rated.reduce((s, i) => s + i.rating, 0) / rated.length).toFixed(1);
      })(),
    },
  };
}

export async function getInterviewById(id) {
  await sleep(MOCK_DELAY * 0.6);
  if (randomFailure()) {
    throw new Error('Failed to load interview details.');
  }
  const interviews = getStoredInterviews();
  const found = interviews.find(i => i.id === id);
  if (!found) {
    throw new Error('Interview not found');
  }
  return found;
}

export async function scheduleInterview(data) {
  await sleep(MOCK_DELAY * 1.3);
  if (randomFailure()) {
    throw new Error('Failed to schedule interview. Please try again.');
  }
  const {
    applicationId,
    jobId, jobTitle,
    candidateId, candidateName, candidateAvatar, candidateTitle,
    type, startTime, endTime, duration,
    location, meetingLink,
    interviewer, round, notes,
    companyName, companyLogo,
  } = data;
  const start = new Date(startTime);
  const end = endTime ? new Date(endTime) : new Date(start.getTime() + (duration || 60) * 60 * 1000);
  const interview = {
    id: 'int_' + generateId(),
    applicationId: applicationId || 'app_' + generateId(),
    jobId: jobId || 'job_1001',
    jobTitle: jobTitle || 'Software Engineer',
    companyName: companyName || 'HireMind AI',
    companyLogo: companyLogo || 'HMA',
    candidateId: candidateId || 'cand_2001',
    candidateName: candidateName || 'Candidate Name',
    candidateAvatar: candidateAvatar || 'bg-blue-500',
    candidateTitle: candidateTitle || 'Software Engineer',
    type: type || 'video',
    status: 'scheduled',
    round: round || 1,
    startTime: start.toISOString(),
    endTime: end.toISOString(),
    duration: duration || Math.round((end - start) / 60000),
    location: type === 'onsite' ? (location || 'Office Address') : null,
    meetingLink: type !== 'onsite' ? (meetingLink || `https://meet.google.com/hiremind-${Math.random().toString(36).slice(2, 10)}`) : null,
    interviewer: interviewer || {
      id: 'rec_1',
      name: 'Recruiter Name',
      role: 'Hiring Manager',
      email: 'recruiter@company.com',
    },
    notes: notes || null,
    rating: null,
    feedback: null,
    createdBy: 'rec_1',
    createdAt: new Date().toISOString(),
  };
  const updated = [interview, ...getStoredInterviews()];
  saveStoredInterviews(updated);
  return interview;
}

export async function updateInterview(id, updates) {
  await sleep(MOCK_DELAY * 0.9);
  if (randomFailure()) {
    throw new Error('Failed to update interview.');
  }
  const interviews = getStoredInterviews();
  const index = interviews.findIndex(i => i.id === id);
  if (index === -1) throw new Error('Interview not found');
  if (updates.startTime) interviews[index].startTime = new Date(updates.startTime).toISOString();
  if (updates.endTime) interviews[index].endTime = new Date(updates.endTime).toISOString();
  if (updates.startTime || updates.endTime) {
    const s = new Date(interviews[index].startTime);
    const e = new Date(interviews[index].endTime);
    interviews[index].duration = Math.round((e - s) / 60000);
  }
  interviews[index] = {
    ...interviews[index],
    ...updates,
    startTime: interviews[index].startTime,
    endTime: interviews[index].endTime,
    duration: interviews[index].duration,
  };
  saveStoredInterviews(interviews);
  return interviews[index];
}

export async function submitFeedback(id, feedback) {
  await sleep(MOCK_DELAY * 1.1);
  if (randomFailure()) {
    throw new Error('Failed to submit feedback.');
  }
  const interviews = getStoredInterviews();
  const index = interviews.findIndex(i => i.id === id);
  if (index === -1) throw new Error('Interview not found');
  const rating = feedback.overall ||
    Math.round(
      ((feedback.technicalSkill || 0) +
        (feedback.communication || 0) +
        (feedback.problemSolving || 0) +
        (feedback.culturalFit || 0)) / 4
    ) || 3;
  interviews[index] = {
    ...interviews[index],
    status: 'completed',
    rating,
    feedback: {
      technicalSkill: feedback.technicalSkill || Math.round(rating + (Math.random() * 2 - 1)),
      communication: feedback.communication || Math.round(rating + (Math.random() * 2 - 1)),
      problemSolving: feedback.problemSolving || Math.round(rating + (Math.random() * 2 - 1)),
      culturalFit: feedback.culturalFit || Math.round(rating + (Math.random() * 2 - 1)),
      overall: rating,
      comments: feedback.comments || 'Interview completed successfully.',
    },
    notes: feedback.comments || interviews[index].notes,
  };
  saveStoredInterviews(interviews);
  return interviews[index];
}

export async function cancelInterview(id, reason = '') {
  await sleep(MOCK_DELAY * 0.7);
  if (randomFailure()) {
    throw new Error('Failed to cancel interview.');
  }
  const interviews = getStoredInterviews();
  const index = interviews.findIndex(i => i.id === id);
  if (index === -1) throw new Error('Interview not found');
  interviews[index].status = 'cancelled';
  interviews[index].notes = reason
    ? (interviews[index].notes ? `${interviews[index].notes}\n\nCancellation reason: ${reason}` : `Cancelled: ${reason}`)
    : interviews[index].notes;
  saveStoredInterviews(interviews);
  return interviews[index];
}
