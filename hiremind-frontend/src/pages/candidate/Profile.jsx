import { useEffect, useState, useCallback } from 'react';
import {
  FiUser,
  FiBriefcase,
  FiCode,
  FiFolder,
  FiAward,
  FiTarget,
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiSave,
  FiX,
  FiMapPin,
  FiPhone,
  FiMail,
  FiCalendar,
  FiDollarSign,
} from 'react-icons/fi';
import { FaUserGraduate } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/Card';
import { Tabs, TabList, Tab, TabPanels, TabPanel } from '@/components/ui/Tabs';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Skeleton, SkeletonCard, SkeletonInput, SkeletonText, SkeletonList } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { getProfile, updateProfile } from '@/services/candidateService';
import { generateId, formatDate } from '@/lib/utils';
import { SKILL_CATEGORIES } from '@/lib/constants';

const ALL_SKILLS = SKILL_CATEGORIES.flatMap(c => c.skills);

function EducationItem({ entry, onEdit, onDelete }) {
  return (
    <div className="p-4 rounded-xl border border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-800/40">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0">
              <FaUserGraduate className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="font-semibold text-surface-900 dark:text-surface-50">{entry.degree}</h4>
              <p className="text-sm text-surface-600 dark:text-surface-400">{entry.institution}</p>
              <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5 text-xs text-surface-500 dark:text-surface-400">
                <span className="flex items-center gap-1"><FiCalendar className="w-3 h-3" />{entry.year}</span>
                {entry.cgpa && <span>CGPA: {entry.cgpa}</span>}
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button variant="ghost" size="sm" onClick={() => onEdit(entry)}>
            <FiEdit2 className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onDelete(entry)} className="hover:text-red-600 dark:hover:text-red-400">
            <FiTrash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function ExperienceItem({ entry, onEdit, onDelete }) {
  return (
    <div className="p-4 rounded-xl border border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-800/40">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-sky-100 dark:bg-sky-900/40 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
              <FiBriefcase className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="font-semibold text-surface-900 dark:text-surface-50">{entry.role}</h4>
              <p className="text-sm text-surface-600 dark:text-surface-400">{entry.company}</p>
              <p className="text-xs text-surface-500 dark:text-surface-400 mt-1">
                {entry.duration || `${formatDate(entry.startDate, 'MMM yyyy')} — ${entry.endDate ? formatDate(entry.endDate, 'MMM yyyy') : 'Present'}`}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button variant="ghost" size="sm" onClick={() => onEdit(entry)}>
            <FiEdit2 className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onDelete(entry)} className="hover:text-red-600 dark:hover:text-red-400">
            <FiTrash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
      {entry.description && (
        <p className="text-sm text-surface-600 dark:text-surface-400 mb-3 ml-13 pl-[52px]">
          {entry.description}
        </p>
      )}
      {entry.achievements?.length > 0 && (
        <ul className="ml-13 pl-[52px] space-y-1.5">
          {entry.achievements.map((a, i) => (
            <li key={i} className="text-sm text-surface-600 dark:text-surface-400 flex gap-2">
              <span className="text-brand-500 mt-1 shrink-0">•</span>
              <span>{a}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ProjectCard({ project, onEdit, onDelete }) {
  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <div className="h-36 bg-gradient-to-br from-brand-500 via-violet-500 to-indigo-600 relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center text-white/30">
          <FiFolder className="w-16 h-16" />
        </div>
        {project.link && (
          <a
            href={project.link}
            target="_blank"
            rel="noreferrer"
            className="absolute top-3 right-3 p-2 rounded-lg bg-white/20 backdrop-blur text-white hover:bg-white/30 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
          </a>
        )}
      </div>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h4 className="font-semibold text-surface-900 dark:text-surface-50">{project.title}</h4>
          <div className="flex items-center gap-0.5 shrink-0">
            <Button variant="ghost" size="sm" onClick={() => onEdit(project)}>
              <FiEdit2 className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onDelete(project)} className="hover:text-red-600 dark:hover:text-red-400">
              <FiTrash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <p className="text-sm text-surface-600 dark:text-surface-400 mb-3 line-clamp-2 min-h-[2.5rem]">
          {project.description}
        </p>
        <div className="flex flex-wrap gap-1">
          {(project.techStack || []).slice(0, 5).map(t => (
            <Badge key={t} variant="soft" size="sm">{t}</Badge>
          ))}
          {(project.techStack || []).length > 5 && (
            <Badge variant="default" size="sm">+{(project.techStack || []).length - 5}</Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function CertificationItem({ cert, onEdit, onDelete }) {
  return (
    <div className="p-4 rounded-xl border border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-800/40 flex items-start gap-4">
      <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
        <FiAward className="w-5 h-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h4 className="font-semibold text-surface-900 dark:text-surface-50">{cert.name}</h4>
            <p className="text-sm text-surface-600 dark:text-surface-400">{cert.issuer}</p>
            <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5 text-xs text-surface-500 dark:text-surface-400">
              <span className="flex items-center gap-1"><FiCalendar className="w-3 h-3" />{cert.date}</span>
              {cert.certId && <span>ID: {cert.certId}</span>}
            </div>
            {cert.link && (
              <a href={cert.link} target="_blank" rel="noreferrer" className="text-xs text-brand-600 dark:text-brand-400 font-medium hover:underline mt-1 inline-flex items-center gap-1">
                View certificate
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
              </a>
            )}
          </div>
          <div className="flex items-center gap-0.5 shrink-0">
            <Button variant="ghost" size="sm" onClick={() => onEdit(cert)}>
              <FiEdit2 className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onDelete(cert)} className="hover:text-red-600 dark:hover:text-red-400">
              <FiTrash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ModalWrapper({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-lg max-h-[90vh] overflow-auto rounded-2xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-surface-200 dark:border-surface-800 sticky top-0 bg-white dark:bg-surface-900 z-10">
          <h3 className="font-semibold text-lg text-surface-900 dark:text-surface-50">{title}</h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-500">
            <FiX className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export default function Profile() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState(null);
  const [activeTab, setActiveTab] = useState('personal');
  const [dirty, setDirty] = useState(false);

  const [personal, setPersonal] = useState({ firstName: '', lastName: '', email: '', phone: '', dob: '', address: '' });
  const [education, setEducation] = useState([]);
  const [experience, setExperience] = useState([]);
  const [skills, setSkills] = useState([]);
  const [projects, setProjects] = useState([]);
  const [certifications, setCertifications] = useState([]);
  const [goals, setGoals] = useState({ text: '', preferredRole: '', expectedSalary: '', locations: [], noticePeriod: '' });

  const [eduModal, setEduModal] = useState(false);
  const [editingEdu, setEditingEdu] = useState(null);
  const [eduForm, setEduForm] = useState({ id: '', degree: '', institution: '', cgpa: '', year: '' });

  const [expModal, setExpModal] = useState(false);
  const [editingExp, setEditingExp] = useState(null);
  const [expForm, setExpForm] = useState({ id: '', company: '', role: '', startDate: '', endDate: '', description: '', achievements: [] });
  const [newAchievement, setNewAchievement] = useState('');

  const [projModal, setProjModal] = useState(false);
  const [editingProj, setEditingProj] = useState(null);
  const [projForm, setProjForm] = useState({ id: '', title: '', description: '', techStack: [], link: '' });

  const [certModal, setCertModal] = useState(false);
  const [editingCert, setEditingCert] = useState(null);
  const [certForm, setCertForm] = useState({ id: '', name: '', issuer: '', date: '', certId: '', link: '' });

  const [skillInput, setSkillInput] = useState('');

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getProfile(user?.id);
      setProfile(data);
      const names = (data.name || user?.name || '').split(' ');
      setPersonal({
        firstName: names[0] || '',
        lastName: names.slice(1).join(' ') || '',
        email: data.email || user?.email || '',
        phone: data.phone || user?.phone || '',
        dob: data.dob || '',
        address: data.location || data.address || '',
      });
      setEducation(data.education ? (Array.isArray(data.education) ? data.education : [{
        id: generateId(),
        degree: data.education.degree || '',
        institution: data.education.college || '',
        cgpa: data.education.cgpa || '',
        year: data.education.graduationYear ? String(data.education.graduationYear) : '',
      }]) : []);
      setExperience(data.experience ? (Array.isArray(data.experience) ? data.experience.map(e => ({
        id: e.id || generateId(),
        company: e.company || '',
        role: e.title || e.role || '',
        startDate: e.startDate || '',
        endDate: e.endDate || '',
        description: e.description || '',
        achievements: e.achievements || [],
        duration: e.duration || '',
      })) : []) : []);
      setSkills(data.skills || []);
      setProjects(data.projects ? (Array.isArray(data.projects) ? data.projects.map(p => ({
        id: p.id || generateId(),
        title: p.name || p.title || '',
        description: p.description || '',
        techStack: p.tech || p.techStack || [],
        link: p.link || '',
      })) : []) : []);
      setCertifications(data.certifications ? (Array.isArray(data.certifications) ? data.certifications.map((c, i) => {
        if (typeof c === 'string') return { id: generateId(), name: c, issuer: 'N/A', date: '', certId: '', link: '' };
        return { id: c.id || generateId(), ...c };
      }) : []) : []);
      setGoals({
        text: data.careerGoals || '',
        preferredRole: data.title || '',
        expectedSalary: data.expectedSalary ? String(data.expectedSalary) : '',
        locations: data.preferredLocations || [],
        noticePeriod: data.noticePeriod || '',
      });
    } catch (err) {
      setError(err);
      toastError({ title: 'Could not load profile', message: err.message });
    } finally {
      setLoading(false);
    }
  }, [user?.id, user?.name, user?.email, user?.phone, toastError]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const saveAll = async () => {
    setSaving(true);
    try {
      const payload = {
        name: `${personal.firstName} ${personal.lastName}`.trim(),
        email: personal.email,
        phone: personal.phone,
        dob: personal.dob,
        location: personal.address,
        address: personal.address,
        title: goals.preferredRole,
        expectedSalary: Number(goals.expectedSalary) || undefined,
        preferredLocations: goals.locations,
        noticePeriod: goals.noticePeriod,
        careerGoals: goals.text,
        skills,
        education: education.map(e => ({ ...e, college: e.institution, graduationYear: Number(e.year), cgpa: e.cgpa })),
        experience: experience.map(e => ({ ...e, title: e.role, company: e.company, startDate: e.startDate, endDate: e.endDate, description: e.description, achievements: e.achievements })),
        projects: projects.map(p => ({ ...p, name: p.title, tech: p.techStack, link: p.link, description: p.description })),
        certifications: certifications.map(c => c.name).filter(Boolean),
      };
      await updateProfile(user?.id, payload);
      setDirty(false);
      success({ title: 'Profile saved', message: 'Your profile has been updated successfully.' });
    } catch (err) {
      toastError({ title: 'Save failed', message: err.message });
    } finally {
      setSaving(false);
    }
  };

  const markDirty = () => setDirty(true);

  const addSkill = () => {
    const s = skillInput.trim();
    if (!s) return;
    if (skills.includes(s)) {
      setSkillInput('');
      return;
    }
    setSkills(prev => [...prev, s]);
    setSkillInput('');
    markDirty();
  };

  const removeSkill = (s) => {
    setSkills(prev => prev.filter(x => x !== s));
    markDirty();
  };

  const openEduModal = (entry) => {
    setEditingEdu(entry || null);
    setEduForm(entry ? { ...entry } : { id: '', degree: '', institution: '', cgpa: '', year: '' });
    setEduModal(true);
  };

  const saveEducation = () => {
    if (!eduForm.degree || !eduForm.institution) return;
    if (editingEdu) {
      setEducation(prev => prev.map(e => e.id === editingEdu.id ? { ...editingEdu, ...eduForm } : e));
    } else {
      setEducation(prev => [...prev, { ...eduForm, id: generateId() }]);
    }
    setEduModal(false);
    markDirty();
  };

  const deleteEducation = (entry) => {
    setEducation(prev => prev.filter(e => e.id !== entry.id));
    markDirty();
  };

  const openExpModal = (entry) => {
    setEditingExp(entry || null);
    setExpForm(entry ? { ...entry, achievements: entry.achievements || [] } : { id: '', company: '', role: '', startDate: '', endDate: '', description: '', achievements: [] });
    setNewAchievement('');
    setExpModal(true);
  };

  const addAchievement = () => {
    const a = newAchievement.trim();
    if (!a) return;
    setExpForm(prev => ({ ...prev, achievements: [...(prev.achievements || []), a] }));
    setNewAchievement('');
  };

  const saveExperience = () => {
    if (!expForm.company || !expForm.role) return;
    if (editingExp) {
      setExperience(prev => prev.map(e => e.id === editingExp.id ? { ...editingExp, ...expForm } : e));
    } else {
      setExperience(prev => [...prev, { ...expForm, id: generateId() }]);
    }
    setExpModal(false);
    markDirty();
  };

  const deleteExperience = (entry) => {
    setExperience(prev => prev.filter(e => e.id !== entry.id));
    markDirty();
  };

  const openProjModal = (project) => {
    setEditingProj(project || null);
    setProjForm(project ? { ...project } : { id: '', title: '', description: '', techStack: [], link: '' });
    setProjModal(true);
  };

  const saveProject = () => {
    if (!projForm.title) return;
    if (editingProj) {
      setProjects(prev => prev.map(p => p.id === editingProj.id ? { ...editingProj, ...projForm } : p));
    } else {
      setProjects(prev => [...prev, { ...projForm, id: generateId() }]);
    }
    setProjModal(false);
    markDirty();
  };

  const deleteProject = (project) => {
    setProjects(prev => prev.filter(p => p.id !== project.id));
    markDirty();
  };

  const openCertModal = (cert) => {
    setEditingCert(cert || null);
    setCertForm(cert ? { ...cert } : { id: '', name: '', issuer: '', date: '', certId: '', link: '' });
    setCertModal(true);
  };

  const saveCertification = () => {
    if (!certForm.name || !certForm.issuer) return;
    if (editingCert) {
      setCertifications(prev => prev.map(c => c.id === editingCert.id ? { ...editingCert, ...certForm } : c));
    } else {
      setCertifications(prev => [...prev, { ...certForm, id: generateId() }]);
    }
    setCertModal(false);
    markDirty();
  };

  const deleteCertification = (cert) => {
    setCertifications(prev => prev.filter(c => c.id !== cert.id));
    markDirty();
  };

  const completion = (() => {
    let filled = 0;
    let total = 7;
    if (personal.firstName && personal.email) filled++;
    if (education.length > 0) filled++;
    if (experience.length > 0) filled++;
    if (skills.length >= 5) filled++;
    if (projects.length > 0) filled++;
    if (certifications.length > 0) filled++;
    if (goals.preferredRole && goals.text) filled++;
    return Math.round((filled / total) * 100);
  })();

  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <ErrorState title="Couldn't load profile" message={error.message} onRetry={fetchProfile} fullHeight size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <div className="h-28 md:h-36 bg-gradient-to-r from-brand-600 via-violet-600 to-indigo-600 relative">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_30%_30%,white,transparent_40%),radial-gradient(circle_at_70%_70%,white,transparent_40%)]" />
        </div>
        <CardContent className="pt-0 md:pt-0 relative -mt-14 md:-mt-16 px-6 pb-6">
          {loading ? (
            <div className="flex flex-col md:flex-row md:items-end gap-4">
              <Skeleton className="h-28 w-28 md:h-32 md:w-32 rounded-2xl ring-4 ring-white dark:ring-surface-900" />
              <div className="flex-1 pb-2 space-y-3">
                <Skeleton className="h-7 w-48" />
                <Skeleton className="h-4 w-64" />
                <Skeleton className="h-4 w-40" />
              </div>
              <Skeleton className="h-10 w-40 rounded-lg mb-2" />
            </div>
          ) : (
            <div className="flex flex-col md:flex-row md:items-end gap-4 md:gap-6">
              <Avatar
                name={profile?.name || user?.name || 'Candidate'}
                size="xl"
                className="ring-4 ring-white dark:ring-surface-900 shadow-lg rounded-2xl"
                src={profile?.avatarUrl}
              />
              <div className="flex-1 pb-2">
                <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50">
                  {profile?.name || user?.name || 'Candidate Profile'}
                </h1>
                <p className="text-surface-600 dark:text-surface-400 mt-0.5">
                  {goals.preferredRole || profile?.title || 'Building my career'}
                </p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-surface-500 dark:text-surface-400">
                  <span className="flex items-center gap-1"><FiMail className="w-3.5 h-3.5" />{personal.email}</span>
                  {personal.phone && <span className="flex items-center gap-1"><FiPhone className="w-3.5 h-3.5" />{personal.phone}</span>}
                  {personal.address && <span className="flex items-center gap-1"><FiMapPin className="w-3.5 h-3.5" />{personal.address}</span>}
                </div>
              </div>
              <div className="pb-2 flex flex-col md:flex-row md:items-center gap-3 md:gap-2 w-full md:w-auto">
                <div className="flex-1 md:w-56">
                  <ProgressBar label="Profile" value={completion} size="md" color="brand" />
                </div>
                <Button variant="primary" size="md" onClick={saveAll} isLoading={saving} icon={<FiSave className="w-4 h-4" />}>
                  Save All
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {loading ? (
        <Card><CardContent className="pt-6"><SkeletonText lines={10} /></CardContent></Card>
      ) : (
        <Card>
          <CardHeader className="pb-0">
            <Tabs defaultValue="personal" value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabList className="w-full overflow-x-auto">
                <Tab value="personal" icon={<FiUser className="w-4 h-4 mr-1.5" />}>Personal Info</Tab>
                <Tab value="education" icon={<FaUserGraduate className="w-4 h-4 mr-1.5" />}>Education</Tab>
                <Tab value="experience" icon={<FiBriefcase className="w-4 h-4 mr-1.5" />}>Experience</Tab>
                <Tab value="skills" icon={<FiCode className="w-4 h-4 mr-1.5" />}>Skills</Tab>
                <Tab value="projects" icon={<FiFolder className="w-4 h-4 mr-1.5" />}>Projects</Tab>
                <Tab value="certifications" icon={<FiAward className="w-4 h-4 mr-1.5" />}>Certifications</Tab>
                <Tab value="goals" icon={<FiTarget className="w-4 h-4 mr-1.5" />}>Career Goals</Tab>
              </TabList>
            </Tabs>
          </CardHeader>
          <CardContent className="pt-4">
            <Tabs defaultValue="personal" value={activeTab} onValueChange={setActiveTab}>
              <TabPanels>
                <TabPanel value="personal">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl">
                    <Input label="First name" value={personal.firstName} onChange={e => { setPersonal(p => ({ ...p, firstName: e.target.value })); markDirty(); }} iconLeft={<FiUser className="w-4 h-4" />} />
                    <Input label="Last name" value={personal.lastName} onChange={e => { setPersonal(p => ({ ...p, lastName: e.target.value })); markDirty(); }} iconLeft={<FiUser className="w-4 h-4" />} />
                    <Input label="Email" type="email" value={personal.email} onChange={e => { setPersonal(p => ({ ...p, email: e.target.value })); markDirty(); }} iconLeft={<FiMail className="w-4 h-4" />} />
                    <Input label="Phone" value={personal.phone} onChange={e => { setPersonal(p => ({ ...p, phone: e.target.value })); markDirty(); }} iconLeft={<FiPhone className="w-4 h-4" />} />
                    <Input label="Date of birth" type="date" value={personal.dob} onChange={e => { setPersonal(p => ({ ...p, dob: e.target.value })); markDirty(); }} iconLeft={<FiCalendar className="w-4 h-4" />} />
                    <Input label="Address / Location" value={personal.address} onChange={e => { setPersonal(p => ({ ...p, address: e.target.value })); markDirty(); }} iconLeft={<FiMapPin className="w-4 h-4" />} placeholder="City, State" />
                  </div>
                </TabPanel>

                <TabPanel value="education">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm text-surface-500 dark:text-surface-400">
                      {education.length} education record{education.length === 1 ? '' : 's'}
                    </p>
                    <Button size="sm" variant="primary" icon={<FiPlus className="w-4 h-4" />} onClick={() => openEduModal()}>
                      Add Education
                    </Button>
                  </div>
                  {education.length === 0 ? (
                    <EmptyState size="sm" iconName="documents" title="No education yet" description="Add your degrees and academic qualifications." actionText="Add First" onAction={() => openEduModal()} />
                  ) : (
                    <div className="space-y-3">
                      {education.map(e => (
                        <EducationItem key={e.id} entry={e} onEdit={openEduModal} onDelete={deleteEducation} />
                      ))}
                    </div>
                  )}
                </TabPanel>

                <TabPanel value="experience">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm text-surface-500 dark:text-surface-400">
                      {experience.length} work experience record{experience.length === 1 ? '' : 's'}
                    </p>
                    <Button size="sm" variant="primary" icon={<FiPlus className="w-4 h-4" />} onClick={() => openExpModal()}>
                      Add Experience
                    </Button>
                  </div>
                  {experience.length === 0 ? (
                    <EmptyState size="sm" iconName="default" title="No experience added" description="List your internships, jobs, and freelance work." actionText="Add First" onAction={() => openExpModal()} />
                  ) : (
                    <div className="space-y-3">
                      {experience.map(e => (
                        <ExperienceItem key={e.id} entry={e} onEdit={openExpModal} onDelete={deleteExperience} />
                      ))}
                    </div>
                  )}
                </TabPanel>

                <TabPanel value="skills">
                  <div className="max-w-4xl space-y-5">
                    <div className="flex gap-2">
                      <div className="flex-1 relative">
                        <input
                          value={skillInput}
                          onChange={e => setSkillInput(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } }}
                          placeholder="Type a skill and press Enter"
                          className="w-full h-10 px-3.5 rounded-lg border border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-900 text-surface-900 dark:text-surface-100 placeholder:text-surface-400 focus:border-brand-500 dark:focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 text-sm"
                          list="skill-suggestions"
                        />
                        <datalist id="skill-suggestions">
                          {ALL_SKILLS.filter(s => !skills.includes(s)).map(s => (
                            <option key={s} value={s} />
                          ))}
                        </datalist>
                      </div>
                      <Button variant="primary" size="md" onClick={addSkill}>Add</Button>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">Your Skills ({skills.length})</p>
                      {skills.length === 0 ? (
                        <p className="text-sm text-surface-500 dark:text-surface-400 italic">No skills added yet. Add at least 5 to boost your profile.</p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {skills.map(s => (
                            <Badge key={s} variant="brand" size="md" className="pl-2.5 pr-1 py-1">
                              {s}
                              <button onClick={() => removeSkill(s)} className="ml-1.5 p-0.5 rounded hover:bg-white/30 dark:hover:bg-black/20">
                                <FiX className="w-3 h-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">Suggested Categories</p>
                      <div className="space-y-4">
                        {SKILL_CATEGORIES.map(cat => (
                          <div key={cat.category}>
                            <p className="text-xs text-surface-500 dark:text-surface-400 mb-2 font-medium uppercase tracking-wide">{cat.category}</p>
                            <div className="flex flex-wrap gap-1.5">
                              {cat.skills.map(s => {
                                const added = skills.includes(s);
                                return (
                                  <button
                                    key={s}
                                    onClick={() => added ? removeSkill(s) : (setSkills(prev => [...prev, s]), markDirty())}
                                    className={`text-xs px-2.5 py-1 rounded-lg font-medium border transition-colors ${
                                      added
                                        ? 'bg-brand-50 dark:bg-brand-900/40 border-brand-200 dark:border-brand-800 text-brand-700 dark:text-brand-300'
                                        : 'bg-white dark:bg-surface-900 border-surface-200 dark:border-surface-700 text-surface-600 dark:text-surface-400 hover:border-brand-300 dark:hover:border-brand-700'
                                    }`}
                                  >
                                    {added ? '✓ ' : '+ '}{s}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </TabPanel>

                <TabPanel value="projects">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm text-surface-500 dark:text-surface-400">
                      {projects.length} project{projects.length === 1 ? '' : 's'}
                    </p>
                    <Button size="sm" variant="primary" icon={<FiPlus className="w-4 h-4" />} onClick={() => openProjModal()}>
                      Add Project
                    </Button>
                  </div>
                  {projects.length === 0 ? (
                    <EmptyState size="sm" iconName="documents" title="No projects yet" description="Showcase your work with portfolio projects." actionText="Add First" onAction={() => openProjModal()} />
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {projects.map(p => (
                        <ProjectCard key={p.id} project={p} onEdit={openProjModal} onDelete={deleteProject} />
                      ))}
                    </div>
                  )}
                </TabPanel>

                <TabPanel value="certifications">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm text-surface-500 dark:text-surface-400">
                      {certifications.length} certification{certifications.length === 1 ? '' : 's'}
                    </p>
                    <Button size="sm" variant="primary" icon={<FiPlus className="w-4 h-4" />} onClick={() => openCertModal()}>
                      Add Certification
                    </Button>
                  </div>
                  {certifications.length === 0 ? (
                    <EmptyState size="sm" iconName="favorites" title="No certifications" description="Boost your profile with courses and credentials." actionText="Add First" onAction={() => openCertModal()} />
                  ) : (
                    <div className="space-y-3">
                      {certifications.map(c => (
                        <CertificationItem key={c.id} cert={c} onEdit={openCertModal} onDelete={deleteCertification} />
                      ))}
                    </div>
                  )}
                </TabPanel>

                <TabPanel value="goals">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl">
                    <div className="md:col-span-2">
                      <Textarea
                        label="Career Goals & Objectives"
                        rows={5}
                        value={goals.text}
                        onChange={e => { setGoals(g => ({ ...g, text: e.target.value })); markDirty(); }}
                        placeholder="Describe your short and long term career goals, what you're passionate about, and the kind of opportunities you're looking for..."
                      />
                    </div>
                    <Input
                      label="Preferred Role / Title"
                      value={goals.preferredRole}
                      onChange={e => { setGoals(g => ({ ...g, preferredRole: e.target.value })); markDirty(); }}
                      iconLeft={<FiTarget className="w-4 h-4" />}
                      placeholder="e.g. Senior Full Stack Developer"
                    />
                    <Input
                      label="Expected Salary (LPA)"
                      type="number"
                      value={goals.expectedSalary}
                      onChange={e => { setGoals(g => ({ ...g, expectedSalary: e.target.value })); markDirty(); }}
                      iconLeft={<FiDollarSign className="w-4 h-4" />}
                      placeholder="e.g. 25"
                      min={0}
                      step={1}
                    />
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
                        Preferred Locations
                      </label>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {goals.locations.map(loc => (
                          <Badge key={loc} variant="brand" size="md" className="pl-2.5 pr-1 py-1">
                            <FiMapPin className="w-3 h-3 mr-1 inline" />
                            {loc}
                            <button
                              onClick={() => { setGoals(g => ({ ...g, locations: g.locations.filter(x => x !== loc) })); markDirty(); }}
                              className="ml-1.5 p-0.5 rounded hover:bg-white/30 dark:hover:bg-black/20"
                            >
                              <FiX className="w-3 h-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Select
                          value=""
                          onChange={val => { if (val && !goals.locations.includes(val)) { setGoals(g => ({ ...g, locations: [...g.locations, val] })); markDirty(); } }}
                          options={[
                            { value: 'Bangalore', label: 'Bangalore' },
                            { value: 'Mumbai', label: 'Mumbai' },
                            { value: 'Pune', label: 'Pune' },
                            { value: 'Delhi NCR', label: 'Delhi NCR' },
                            { value: 'Hyderabad', label: 'Hyderabad' },
                            { value: 'Chennai', label: 'Chennai' },
                            { value: 'Remote', label: 'Remote' },
                            { value: 'Hybrid', label: 'Hybrid' },
                          ]}
                          placeholder="Add a location"
                          wrapperClassName="flex-1"
                        />
                      </div>
                    </div>
                    <Select
                      label="Notice Period"
                      value={goals.noticePeriod}
                      onChange={val => { setGoals(g => ({ ...g, noticePeriod: val })); markDirty(); }}
                      options={[
                        { value: 'Immediate', label: 'Immediate Join' },
                        { value: '15 days', label: '15 days' },
                        { value: '30 days', label: '30 days' },
                        { value: '60 days', label: '60 days' },
                        { value: '90 days', label: '90 days' },
                        { value: 'Serving', label: 'Currently Serving' },
                      ]}
                      placeholder="Select notice period"
                    />
                    <div className="flex items-end">
                      <Button variant="primary" size="md" onClick={saveAll} isLoading={saving} icon={<FiSave className="w-4 h-4" />} fullWidth>
                        Save Goals
                      </Button>
                    </div>
                  </div>
                </TabPanel>
              </TabPanels>
            </Tabs>
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row sm:justify-between gap-3">
            <p className={`text-xs ${dirty ? 'text-amber-600 dark:text-amber-400' : 'text-surface-500 dark:text-surface-400'}`}>
              {dirty ? 'You have unsaved changes.' : 'All changes saved.'}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="md" onClick={fetchProfile}>Reset</Button>
              <Button variant="primary" size="md" onClick={saveAll} isLoading={saving} icon={<FiSave className="w-4 h-4" />}>
                Save Changes
              </Button>
            </div>
          </CardFooter>
        </Card>
      )}

      <ModalWrapper isOpen={eduModal} onClose={() => setEduModal(false)} title={editingEdu ? 'Edit Education' : 'Add Education'}>
        <div className="space-y-4">
          <Input label="Degree / Qualification" value={eduForm.degree} onChange={e => setEduForm(f => ({ ...f, degree: e.target.value }))} placeholder="e.g. B.Tech in Computer Science" />
          <Input label="Institution / College" value={eduForm.institution} onChange={e => setEduForm(f => ({ ...f, institution: e.target.value }))} placeholder="e.g. Indian Institute of Technology, Bombay" />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Year of Passing" value={eduForm.year} onChange={e => setEduForm(f => ({ ...f, year: e.target.value }))} placeholder="e.g. 2020" />
            <Input label="CGPA / Grade (Optional)" value={eduForm.cgpa} onChange={e => setEduForm(f => ({ ...f, cgpa: e.target.value }))} placeholder="e.g. 8.7" />
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="outline" size="md" onClick={() => setEduModal(false)}>Cancel</Button>
            <Button variant="primary" size="md" onClick={saveEducation} icon={<FiSave className="w-4 h-4" />}>
              {editingEdu ? 'Update' : 'Add'}
            </Button>
          </div>
        </div>
      </ModalWrapper>

      <ModalWrapper isOpen={expModal} onClose={() => setExpModal(false)} title={editingExp ? 'Edit Experience' : 'Add Experience'}>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label="Company" value={expForm.company} onChange={e => setExpForm(f => ({ ...f, company: e.target.value }))} />
            <Input label="Role / Title" value={expForm.role} onChange={e => setExpForm(f => ({ ...f, role: e.target.value }))} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label="Start Date" type="month" value={(expForm.startDate || '').slice(0, 7)} onChange={e => setExpForm(f => ({ ...f, startDate: e.target.value ? `${e.target.value}-01` : '' }))} />
            <Input label="End Date (leave empty for current)" type="month" value={(expForm.endDate || '').slice(0, 7)} onChange={e => setExpForm(f => ({ ...f, endDate: e.target.value ? `${e.target.value}-01` : '' }))} />
          </div>
          <Textarea label="Description / Summary" rows={3} value={expForm.description} onChange={e => setExpForm(f => ({ ...f, description: e.target.value }))} placeholder="Briefly describe your role and responsibilities..." />
          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Key Achievements</label>
            {(expForm.achievements || []).length > 0 && (
              <ul className="space-y-1.5 mb-2">
                {expForm.achievements.map((a, i) => (
                  <li key={i} className="flex items-center gap-2 p-2 rounded-lg bg-surface-50 dark:bg-surface-800 text-sm">
                    <span className="text-brand-500 shrink-0">•</span>
                    <span className="flex-1 text-surface-700 dark:text-surface-300">{a}</span>
                    <button onClick={() => setExpForm(f => ({ ...f, achievements: f.achievements.filter((_, idx) => idx !== i) }))} className="text-surface-400 hover:text-red-500">
                      <FiX className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <div className="flex gap-2">
              <Input placeholder="e.g. Increased revenue by 30%" value={newAchievement} onChange={e => setNewAchievement(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addAchievement(); } }} />
              <Button variant="outline" size="md" onClick={addAchievement}>Add</Button>
            </div>
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="outline" size="md" onClick={() => setExpModal(false)}>Cancel</Button>
            <Button variant="primary" size="md" onClick={saveExperience} icon={<FiSave className="w-4 h-4" />}>
              {editingExp ? 'Update' : 'Add'}
            </Button>
          </div>
        </div>
      </ModalWrapper>

      <ModalWrapper isOpen={projModal} onClose={() => setProjModal(false)} title={editingProj ? 'Edit Project' : 'Add Project'}>
        <div className="space-y-4">
          <Input label="Project Title" value={projForm.title} onChange={e => setProjForm(f => ({ ...f, title: e.target.value }))} />
          <Textarea label="Description" rows={3} value={projForm.description} onChange={e => setProjForm(f => ({ ...f, description: e.target.value }))} placeholder="What did you build and what was your role?" />
          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Tech Stack (comma separated)</label>
            <input
              value={(projForm.techStack || []).join(', ')}
              onChange={e => setProjForm(f => ({ ...f, techStack: e.target.value.split(',').map(x => x.trim()).filter(Boolean) }))}
              placeholder="React, Node.js, MongoDB, AWS"
              className="w-full h-10 px-3.5 rounded-lg border border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-900 text-sm"
            />
          </div>
          <Input label="Live / Repo Link (Optional)" value={projForm.link || ''} onChange={e => setProjForm(f => ({ ...f, link: e.target.value }))} placeholder="https://..." />
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="outline" size="md" onClick={() => setProjModal(false)}>Cancel</Button>
            <Button variant="primary" size="md" onClick={saveProject} icon={<FiSave className="w-4 h-4" />}>
              {editingProj ? 'Update' : 'Add'}
            </Button>
          </div>
        </div>
      </ModalWrapper>

      <ModalWrapper isOpen={certModal} onClose={() => setCertModal(false)} title={editingCert ? 'Edit Certification' : 'Add Certification'}>
        <div className="space-y-4">
          <Input label="Certification Name" value={certForm.name} onChange={e => setCertForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. AWS Certified Solutions Architect" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label="Issuing Organization" value={certForm.issuer} onChange={e => setCertForm(f => ({ ...f, issuer: e.target.value }))} />
            <Input label="Date Issued" type="month" value={(certForm.date || '').slice(0, 7)} onChange={e => setCertForm(f => ({ ...f, date: e.target.value ? formatDate(`${e.target.value}-01`, 'MMM yyyy') : '' }))} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label="Credential ID (Optional)" value={certForm.certId || ''} onChange={e => setCertForm(f => ({ ...f, certId: e.target.value }))} />
            <Input label="Verify URL (Optional)" value={certForm.link || ''} onChange={e => setCertForm(f => ({ ...f, link: e.target.value }))} />
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="outline" size="md" onClick={() => setCertModal(false)}>Cancel</Button>
            <Button variant="primary" size="md" onClick={saveCertification} icon={<FiSave className="w-4 h-4" />}>
              {editingCert ? 'Update' : 'Add'}
            </Button>
          </div>
        </div>
      </ModalWrapper>
    </div>
  );
}
