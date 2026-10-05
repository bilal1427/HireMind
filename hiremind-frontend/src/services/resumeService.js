import { MOCK_DELAY, RANDOM_FAILURE_RATE, STORAGE_KEYS } from '../lib/constants';
import { generateId, sleep } from '../lib/utils';

function randomFailure() {
  return Math.random() < RANDOM_FAILURE_RATE;
}

function getStoredResumes() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.RESUMES);
    if (raw) return JSON.parse(raw);
  } catch {
  }
  return [];
}

function saveStoredResumes(resumes) {
  try {
    localStorage.setItem(STORAGE_KEYS.RESUMES, JSON.stringify(resumes));
  } catch {
  }
}

function generateParseResult(fileName) {
  const templates = [
    {
      personalInfo: {
        name: fileName?.replace(/\.(pdf|doc|docx)$/i, '').replace(/[_-]/g, ' ') || 'Candidate',
        email: 'candidate@email.com',
        phone: '+91 9876543210',
        location: 'Bangalore',
        links: ['https://linkedin.com/in/candidate', 'https://github.com/candidate'],
      },
      summary: 'Experienced software developer with 5+ years building scalable web applications using React, Node.js, and cloud technologies.',
      skills: ['React', 'TypeScript', 'JavaScript', 'Node.js', 'Express', 'MongoDB', 'PostgreSQL', 'AWS', 'Docker', 'Git', 'HTML5', 'CSS3', 'Tailwind CSS', 'Redux', 'Next.js'],
      experience: [
        {
          company: 'TechCorp Solutions',
          title: 'Senior Frontend Engineer',
          duration: 'Jan 2022 - Present',
          location: 'Bangalore',
          highlights: [
            'Led migration of legacy frontend to React/TypeScript, reducing page load time by 60%',
            'Architected micro-frontend platform serving 2M+ monthly active users',
            'Mentored 5 junior engineers on best practices and code quality',
            'Implemented CI/CD pipeline reducing deployment time from 45min to 8min',
          ],
        },
        {
          company: 'StartupXYZ',
          title: 'Full Stack Developer',
          duration: 'Jun 2019 - Dec 2021',
          location: 'Mumbai',
          highlights: [
            'Built core product features from scratch with React + Node.js stack',
            'Designed REST APIs consumed by web and mobile apps (100K+ users)',
            'Integrated payment gateways processing ₹20Cr+ monthly',
          ],
        },
      ],
      education: [
        {
          degree: 'B.Tech in Computer Science',
          college: 'Indian Institute of Technology, Bombay',
          year: '2015 - 2019',
          cgpa: '8.6/10',
        },
      ],
      certifications: ['AWS Certified Solutions Architect - Associate (2023)'],
      projects: [
        { name: 'Analytics Dashboard', description: 'Real-time analytics dashboard with React, D3.js, and WebSockets', tech: ['React', 'D3.js', 'WebSocket', 'Node.js'] },
        { name: 'Task Manager', description: 'Open-source task management app with 500+ GitHub stars', tech: ['Next.js', 'Prisma', 'PostgreSQL'] },
      ],
      languages: ['English', 'Hindi', 'Marathi'],
      estimatedExperience: 5,
      matchScore: 82,
      confidence: 91,
    },
  ];
  return templates[Math.floor(Math.random() * templates.length)];
}

export async function uploadResume(file) {
  await sleep(MOCK_DELAY * 2.5);
  if (randomFailure()) {
    throw new Error('Resume upload failed. Please try again.');
  }
  const resumes = getStoredResumes();
  const resumeId = 'res_' + generateId();
  const resume = {
    id: resumeId,
    fileName: file?.name || `resume_${Date.now()}.pdf`,
    fileSize: file?.size || 250000 + Math.floor(Math.random() * 2000000),
    fileType: file?.type || 'application/pdf',
    uploadedAt: new Date().toISOString(),
    status: 'parsed',
    primary: resumes.length === 0,
    url: `/resumes/${resumeId}.pdf`,
    parseResult: generateParseResult(file?.name),
    ocrAttempted: true,
    ocrConfidence: 85 + Math.floor(Math.random() * 15),
  };
  const updated = [resume, ...resumes.map(r => ({ ...r, primary: false }))];
  saveStoredResumes(updated);
  return resume;
}

export async function getResume(resumeId = null) {
  await sleep(MOCK_DELAY * 0.6);
  if (randomFailure()) {
    throw new Error('Failed to load resume.');
  }
  const resumes = getStoredResumes();
  if (resumeId) {
    const found = resumes.find(r => r.id === resumeId);
    if (found) return found;
  }
  const primary = resumes.find(r => r.primary);
  if (primary) return primary;
  if (resumes.length > 0) return resumes[0];
  return null;
}

export async function getResumes() {
  await sleep(MOCK_DELAY * 0.5);
  if (randomFailure()) {
    throw new Error('Failed to load resumes.');
  }
  return getStoredResumes();
}

export async function deleteResume(resumeId) {
  await sleep(MOCK_DELAY * 0.7);
  if (randomFailure()) {
    throw new Error('Failed to delete resume.');
  }
  const resumes = getStoredResumes();
  const wasPrimary = resumes.find(r => r.id === resumeId)?.primary;
  const remaining = resumes.filter(r => r.id !== resumeId);
  if (wasPrimary && remaining.length > 0) {
    remaining[0].primary = true;
  }
  saveStoredResumes(remaining);
  return { success: true, id: resumeId };
}

export async function setPrimaryResume(resumeId) {
  await sleep(MOCK_DELAY * 0.4);
  if (randomFailure()) {
    throw new Error('Failed to update resume.');
  }
  const resumes = getStoredResumes().map(r => ({
    ...r,
    primary: r.id === resumeId,
  }));
  saveStoredResumes(resumes);
  return { success: true, primaryId: resumeId };
}

export async function downloadResume(resumeId) {
  await sleep(MOCK_DELAY * 1.2);
  if (randomFailure()) {
    throw new Error('Failed to download resume.');
  }
  const resumes = getStoredResumes();
  const resume = resumes.find(r => r.id === resumeId) || resumes[0];
  if (!resume) {
    throw new Error('Resume not found');
  }
  try {
    const blob = new Blob(
      ['%PDF-1.4 mock resume content. Use real PDF in production.'],
      { type: 'application/pdf' }
    );
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = resume.fileName || 'resume.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch {
  }
  return { success: true, fileName: resume.fileName };
}

export async function parseResume(file) {
  await sleep(MOCK_DELAY * 1.8);
  if (randomFailure()) {
    throw new Error('Failed to parse resume.');
  }
  return generateParseResult(file?.name);
}
