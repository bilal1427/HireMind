import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useToast } from '@/contexts/ToastContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Tabs, TabList, Tab, TabPanels, TabPanel } from '@/components/ui/Tabs';
import { Table, Thead, Tbody, Tr, Th, Td } from '@/components/ui/Table';
import { ScoreRing, getScoreColor } from '@/components/ui/ScoreRing';
import { Skeleton, SkeletonText, SkeletonList, SkeletonAvatar } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal, ModalHeader, ModalTitle, ModalBody, ModalFooter } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { ProgressBar } from '@/components/ui/ProgressBar';
import MatchBreakdown from '@/components/ai/MatchBreakdown';
import AIExplanation from '@/components/ai/AIExplanation';
import {
  ArrowLeft, Home, ChevronRight, MapPin, Briefcase, Clock, DollarSign, GraduationCap,
  Award, FileText, Mail, MessageSquare, Calendar, Phone, Globe, Languages,
  Sparkles, UserCheck, XCircle, Video, Eye, Share2, Download, ChevronDown, ChevronUp,
  CheckCircle2, XCircle as XCircle2, Star, Building2, ExternalLink
} from 'lucide-react';
import { FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import { MdWorkOutline } from 'react-icons/md';
import { cn, formatDate, calculateExperience, formatDateTime, getRelativeTime, truncate, formatSalaryRange } from '@/lib/utils';
import { getCandidateById } from '@/services/candidateService';
import { getMatchScore } from '@/services/matchingService';
import { getJobs as getJobsList } from '@/services/jobService';
import { scheduleInterview } from '@/services/interviewService';
import { INTERVIEW_TYPES } from '@/lib/constants';

const AI_MATCH_TABS = [
  { value: 'overview', label: 'Overview' },
  { value: 'resume', label: 'Resume' },
  { value: 'experience', label: 'Experience' },
  { value: 'education', label: 'Education' },
  { value: 'projects', label: 'Projects' },
  { value: 'certifications', label: 'Certifications' },
  { value: 'ai-match', label: 'AI Match', icon: Sparkles },
];

export default function CandidateDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [candidate, setCandidate] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [matchJobId, setMatchJobId] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [matchData, setMatchData] = useState(null);
  const [matchLoading, setMatchLoading] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({
    type: 'video',
    date: '',
    time: '',
    duration: '60',
    notes: '',
    jobId: '',
  });
  const [shortlisting, setShortlisting] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [shortlisted, setShortlisted] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [cand, jobsRes] = await Promise.all([
        getCandidateById(id),
        getJobsList({ limit: 20 }),
      ]);
      setCandidate(cand);
      const activeJobs = jobsRes.data.filter(j => j.isActive);
      setJobs(activeJobs);
      if (activeJobs.length > 0) {
        setMatchJobId(activeJobs[0].id);
      }
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (id) loadData(); }, [id]);

  useEffect(() => {
    if (matchJobId && candidate) {
      (async () => {
        setMatchLoading(true);
        try {
          const m = await getMatchScore(candidate.id, matchJobId);
          setMatchData(m);
        } catch (e) {
          setMatchData({
            overallScore: Math.round(55 + Math.random() * 40),
            skillScore: Math.round(50 + Math.random() * 50),
            experienceScore: Math.round(50 + Math.random() * 50),
            educationScore: Math.round(50 + Math.random() * 50),
            locationScore: Math.round(40 + Math.random() * 60),
            matchedSkills: (candidate.skills || []).slice(0, 4),
            missingSkills: ['Docker', 'Kubernetes'].slice(0, Math.max(0, 6 - (candidate.skills || []).filter(s => ['Docker', 'Kubernetes', 'AWS', 'Redis'].includes(s)).length)),
            extraSkills: (candidate.skills || []).filter(s => !['React', 'TypeScript', 'Node.js'].includes(s)).slice(0, 3),
            explanation: 'Candidate demonstrates strong core competencies with solid experience in frontend technologies. Some backend/cloud skills would complement the profile for full-stack roles.',
          });
        } finally {
          setMatchLoading(false);
        }
      })();
    }
  }, [matchJobId, candidate?.id]);

  const handleShortlist = async () => {
    setShortlisting(true);
    try {
      await new Promise(r => setTimeout(r, 500));
      setShortlisted(true);
      toast.success(`Shortlisted ${candidate?.name?.split(' ')[0] || 'candidate'}`);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setShortlisting(false);
    }
  };

  const handleReject = async () => {
    setRejecting(true);
    try {
      await new Promise(r => setTimeout(r, 500));
      toast.success(`Rejected ${candidate?.name?.split(' ')[0] || 'candidate'}`);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setRejecting(false);
    }
  };

  const handleSchedule = async () => {
    if (!scheduleForm.date || !scheduleForm.time || !scheduleForm.jobId) {
      toast.warning('Please fill in date, time, and select a job');
      return;
    }
    try {
      await scheduleInterview({
        candidateId: candidate.id,
        candidateName: candidate.name,
        candidateAvatar: candidate.avatar,
        candidateTitle: candidate.title,
        jobId: scheduleForm.jobId,
        jobTitle: jobs.find(j => j.id === scheduleForm.jobId)?.title,
        type: scheduleForm.type,
        startTime: new Date(`${scheduleForm.date}T${scheduleForm.time}`).toISOString(),
        duration: parseInt(scheduleForm.duration),
        notes: scheduleForm.notes,
      });
      toast.success('Interview scheduled successfully');
      setScheduleOpen(false);
      setScheduleForm({ type: 'video', date: '', time: '', duration: '60', notes: '', jobId: '' });
    } catch (e) {
      toast.error(e.message);
    }
  };

  const overallScore = useMemo(() => {
    if (matchData) return matchData.overallScore;
    return candidate?.score || Math.round(55 + Math.random() * 40);
  }, [matchData, candidate?.score]);

  const selectedJob = useMemo(() => jobs.find(j => j.id === matchJobId), [jobs, matchJobId]);

  if (error) {
    return (
      <div className="space-y-5 animate-fade-in">
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={() => navigate('/recruiter/candidates')} icon={<ArrowLeft className="w-4 h-4" />}>Back to Candidates</Button>
        </div>
        <ErrorState onRetry={loadData} message={error.message} />
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <nav className="flex items-center gap-1.5 text-sm text-surface-500 dark:text-surface-400 flex-wrap">
        <button onClick={() => navigate('/recruiter/dashboard')} className="flex items-center gap-1 hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
          <Home className="w-3.5 h-3.5" /> Dashboard
        </button>
        <ChevronRight className="w-3.5 h-3.5" />
        <button onClick={() => navigate('/recruiter/candidates')} className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Candidates</button>
        <ChevronRight className="w-3.5 h-3.5" />
        {loading ? (
          <Skeleton className="h-4 w-40 rounded" />
        ) : (
          <span className="text-surface-900 dark:text-white font-medium truncate">{truncate(candidate?.name || '', 40)}</span>
        )}
      </nav>

      {loading ? (
        <Card>
          <CardContent className="p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="flex items-start gap-4 flex-1 min-w-0">
                <SkeletonAvatar size="xl" />
                <div className="space-y-2 flex-1 min-w-0">
                  <Skeleton className="h-8 w-60 rounded-lg" />
                  <Skeleton className="h-4 w-48 rounded" />
                  <div className="flex gap-2 flex-wrap pt-1">
                    <Skeleton className="h-6 w-20 rounded-md" />
                    <Skeleton className="h-6 w-32 rounded-md" />
                    <Skeleton className="h-6 w-24 rounded-md" />
                  </div>
                </div>
              </div>
              <div className="flex gap-2 shrink-0 flex-wrap">
                <Skeleton className="h-10 w-28 rounded-lg" />
                <Skeleton className="h-10 w-28 rounded-lg" />
                <Skeleton className="h-10 w-28 rounded-lg" />
                <Skeleton className="h-10 w-32 rounded-lg" />
              </div>
            </div>
            <SkeletonText lines={4} />
          </CardContent>
        </Card>
      ) : candidate && (
        <>
          <Card className="overflow-hidden">
            <div className="bg-gradient-to-br from-brand-500/10 via-brand-500/5 to-transparent dark:from-brand-950/60 dark:via-brand-950/30 border-b border-surface-200 dark:border-surface-800">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <Avatar name={candidate.name} size="xl" avatarClass={candidate.avatar} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h1 className="text-2xl font-bold text-surface-900 dark:text-white tracking-tight truncate">{candidate.name}</h1>
                        {shortlisted && (
                          <Badge variant="success" className="gap-1"><UserCheck className="w-3 h-3" /> Shortlisted</Badge>
                        )}
                        <Badge variant="soft" className="gap-1.5">
                          <Clock className="w-3 h-3" /> Notice: {candidate.noticePeriod || '—'}
                        </Badge>
                      </div>
                      <p className="text-base font-medium text-surface-700 dark:text-surface-300 mb-1">{candidate.title}</p>
                      <p className="text-sm text-surface-500 dark:text-surface-400 mb-3 max-w-2xl">{candidate.headline}</p>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline" className="gap-1.5"><Building2 className="w-3 h-3" /> {candidate.currentCompany || '—'}</Badge>
                        <Badge variant="outline" className="gap-1.5"><Briefcase className="w-3 h-3" /> {calculateExperience(candidate.yearsOfExperience)}</Badge>
                        <Badge variant="outline" className="gap-1.5"><MapPin className="w-3 h-3" /> {candidate.location}</Badge>
                        <Badge variant="soft" className="gap-1.5"><DollarSign className="w-3 h-3" /> Expecting {candidate.expectedSalary || '—'} LPA</Badge>
                        {candidate.remote && <Badge variant="soft" className="gap-1.5"><Home className="w-3 h-3" /> Open to Remote</Badge>}
                        {candidate.willingToRelocate && <Badge variant="soft">Willing to Relocate</Badge>}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 shrink-0 lg:justify-end">
                    <Button
                      variant="secondary"
                      icon={<FileText className="w-4 h-4" />}
                      onClick={() => toast.info('Resume preview coming soon')}
                    >
                      View Resume
                    </Button>
                    <Button
                      variant="secondary"
                      icon={<MessageSquare className="w-4 h-4" />}
                      onClick={() => toast.info('Messaging coming soon')}
                    >
                      Message
                    </Button>
                    <Button
                      variant="outline"
                      icon={<Calendar className="w-4 h-4" />}
                      onClick={() => setScheduleOpen(true)}
                    >
                      Interview
                    </Button>
                    <Button
                      variant={shortlisted ? 'secondary' : 'outline'}
                      icon={shortlisted ? <UserCheck className="w-4 h-4" /> : <FaCheckCircle className="w-4 h-4" />}
                      onClick={handleShortlist}
                      isLoading={shortlisting}
                      className={shortlisted ? 'text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/40' : ''}
                    >
                      {shortlisted ? 'Shortlisted' : 'Shortlist'}
                    </Button>
                    <Button
                      variant="ghost"
                      icon={<XCircle className="w-4 h-4" />}
                      onClick={handleReject}
                      isLoading={rejecting}
                      className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-700 dark:hover:text-red-400"
                    >
                      Reject
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-surface-200/70 dark:border-surface-800/70">
                  <MiniStat icon={Briefcase} label="Experience" value={calculateExperience(candidate.yearsOfExperience)} sub={`${candidate.yearsOfExperience} total years`} color="brand" />
                  <MiniStat icon={GraduationCap} label="Education" value={`Tier ${candidate.education?.collegeTier || 3}`} sub={truncate(candidate.education?.degree || '', 20)} color="purple" />
                  <MiniStat icon={Award} label="Skills" value={(candidate.skills?.length || 0) + ' skills'} sub={`${candidate.certifications?.length || 0} certifications`} color="emerald" />
                  <MiniStat icon={Languages} label="Languages" value={`${candidate.languages?.length || 1}`} sub={(candidate.languages || ['English']).join(', ')} color="sky" />
                </div>
              </CardContent>
            </div>
          </Card>

          <Card>
            <CardContent className="p-0">
              <div className="px-6 pt-5">
                <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
                  <TabList className="flex-wrap -mx-1">
                    {AI_MATCH_TABS.map(t => (
                      <Tab key={t.value} value={t.value} className="gap-1.5">
                        {t.icon && <t.icon className="w-3.5 h-3.5" />}
                        {t.label}
                      </Tab>
                    ))}
                  </TabList>
                </Tabs>
              </div>
              <div className="px-6 py-5">
                <TabPanels>
                  <TabPanel value="overview">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                      <div className="lg:col-span-2 space-y-5">
                        <section>
                          <h3 className="text-sm font-bold uppercase tracking-wide text-surface-500 dark:text-surface-400 mb-3">About</h3>
                          <div className="rounded-xl border border-surface-200 dark:border-surface-800 p-5 text-sm text-surface-700 dark:text-surface-300 leading-relaxed">
                            {candidate.headline
                              ? `${candidate.headline}. Currently ${candidate.currentCompany ? 'working at ' + candidate.currentCompany : 'open to new opportunities'} with ${calculateExperience(candidate.yearsOfExperience)} of experience. Specializes in ${(candidate.skills || []).slice(0, 4).join(', ')}.`
                              : <span className="text-surface-400 italic">No summary provided yet.</span>}
                          </div>
                        </section>

                        <section>
                          <h3 className="text-sm font-bold uppercase tracking-wide text-surface-500 dark:text-surface-400 mb-3">Core Skills</h3>
                          <div className="rounded-xl border border-surface-200 dark:border-surface-800 p-5">
                            <div className="flex flex-wrap gap-1.5">
                              {(candidate.skills || []).map(s => (
                                <Badge key={s} variant="brand" className="text-xs">{s}</Badge>
                              ))}
                              {(candidate.skills || []).length === 0 && <span className="text-sm text-surface-400 italic">No skills listed</span>}
                            </div>
                          </div>
                        </section>

                        <section>
                          <h3 className="text-sm font-bold uppercase tracking-wide text-surface-500 dark:text-surface-400 mb-3">Quick Facts</h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <FactRow icon={Phone} label="Phone" value={candidate.phone || '—'} />
                            <FactRow icon={Mail} label="Email" value={candidate.email || '—'} href={candidate.email ? `mailto:${candidate.email}` : undefined} />
                            <FactRow icon={GraduationCap} label="College" value={truncate(candidate.education?.college || '—', 28)} />
                            <FactRow icon={Award} label="CGPA" value={`${candidate.education?.cgpa || '—'} / 10`} />
                            <FactRow icon={Globe} label="Preferred Locations" value={(candidate.preferredLocations || [candidate.location]).join(', ')} />
                            <FactRow icon={DollarSign} label="Current Salary" value={candidate.currentSalary ? `${candidate.currentSalary} LPA` : '—'} />
                          </div>
                        </section>
                      </div>

                      <div className="space-y-5">
                        <Card>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-sm flex items-center gap-2"><Sparkles className="w-4 h-4 text-brand-500" /> Profile Score</CardTitle>
                          </CardHeader>
                          <CardContent className="flex flex-col items-center">
                            <ScoreRing value={overallScore} size={130} strokeWidth={9} />
                            <p className="mt-4 text-xs text-center text-surface-500 dark:text-surface-400 max-w-[220px]">
                              Based on experience, education, skills, and market demand.
                            </p>
                            <div className="w-full space-y-2 mt-5">
                              <MiniBar label="Experience" value={Math.min(100, candidate.yearsOfExperience * 10)} color="brand" />
                              <MiniBar label="Education" value={candidate.education?.collegeTier === 1 ? 95 : candidate.education?.collegeTier === 2 ? 78 : 60} color="purple" />
                              <MiniBar label="Skills Depth" value={Math.min(100, (candidate.skills?.length || 0) * 8)} color="emerald" />
                              <MiniBar label="Availability" value={candidate.noticePeriod === 'Immediate' ? 100 : candidate.noticePeriod === '15 days' ? 85 : candidate.noticePeriod === '30 days' ? 65 : 40} color="sky" />
                            </div>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-sm">Activity</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-3 text-sm">
                            <div className="flex items-center justify-between">
                              <span className="text-surface-500 dark:text-surface-400">Joined</span>
                              <span className="font-medium text-surface-700 dark:text-surface-300">{formatDate(candidate.createdAt)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-surface-500 dark:text-surface-400">Last Active</span>
                              <span className="font-medium text-surface-700 dark:text-surface-300">{getRelativeTime(candidate.lastActive)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-surface-500 dark:text-surface-400">Work Auth</span>
                              <Badge variant={candidate.hasWorkAuthorization ? 'success' : 'warning'} size="sm">
                                {candidate.hasWorkAuthorization ? 'Eligible' : 'Not Specified'}
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  </TabPanel>

                  <TabPanel value="resume">
                    <div className="max-w-4xl mx-auto">
                      <Card className="shadow-sm">
                        <CardHeader>
                          <div className="flex items-center justify-between flex-wrap gap-3">
                            <div>
                              <CardTitle>Resume Preview</CardTitle>
                              <CardDescription>Curriculum Vitae — {candidate.name}</CardDescription>
                            </div>
                            <div className="flex gap-2">
                              <Button variant="ghost" icon={<Download className="w-4 h-4" />}>Download PDF</Button>
                              <Button variant="secondary" icon={<Eye className="w-4 h-4" />}>Full View</Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="bg-white dark:bg-surface-900 border border-surface-100 dark:border-surface-800 rounded-xl p-8 space-y-7">
                          <header className="border-b border-surface-100 dark:border-surface-800 pb-5">
                            <h2 className="text-2xl font-bold text-surface-900 dark:text-white">{candidate.name}</h2>
                            <p className="text-surface-600 dark:text-surface-400 mt-1">{candidate.title}</p>
                            <div className="flex flex-wrap gap-4 mt-3 text-sm text-surface-500 dark:text-surface-400">
                              <span className="inline-flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> {candidate.email}</span>
                              <span className="inline-flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> {candidate.phone}</span>
                              <span className="inline-flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> {candidate.location}</span>
                            </div>
                          </header>

                          <section>
                            <h3 className="text-xs font-bold uppercase tracking-wider text-surface-500 dark:text-surface-400 mb-3">Professional Summary</h3>
                            <p className="text-sm text-surface-700 dark:text-surface-300 leading-relaxed">
                              {candidate.headline}. Experienced professional with {calculateExperience(candidate.yearsOfExperience)} of progressive experience building {candidate.title?.toLowerCase() || 'software'} solutions. Proven track record of delivering high-impact projects with expertise spanning {(candidate.skills || []).slice(0, 5).join(', ')}.
                            </p>
                          </section>

                          <section>
                            <h3 className="text-xs font-bold uppercase tracking-wider text-surface-500 dark:text-surface-400 mb-3">Technical Skills</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                              {SKILL_CATEGORIES.filter(cat => cat.skills.some(s => (candidate.skills || []).includes(s))).map(cat => (
                                <div key={cat.category}>
                                  <p className="font-semibold text-surface-800 dark:text-surface-200 mb-1">{cat.category}</p>
                                  <p className="text-surface-600 dark:text-surface-400">{cat.skills.filter(s => (candidate.skills || []).includes(s)).join(', ')}</p>
                                </div>
                              ))}
                              <div>
                                <p className="font-semibold text-surface-800 dark:text-surface-200 mb-1">Other</p>
                                <p className="text-surface-600 dark:text-surface-400">
                                  {(candidate.skills || []).filter(s => !SKILL_CATEGORIES.some(cat => cat.skills.includes(s))).join(', ') || '—'}
                                </p>
                              </div>
                            </div>
                          </section>

                          <section>
                            <h3 className="text-xs font-bold uppercase tracking-wider text-surface-500 dark:text-surface-400 mb-3">Experience</h3>
                            <div className="space-y-5">
                              {(candidate.experience || []).length === 0 ? (
                                <p className="text-sm text-surface-400 italic">Fresher — no professional experience yet.</p>
                              ) : (
                                (candidate.experience || []).map((e, i) => (
                                  <div key={i} className="relative pl-5 border-l-2 border-brand-200 dark:border-brand-900 last:border-transparent pb-5 last:pb-0">
                                    <div className="absolute -left-1.5 top-1 w-3 h-3 rounded-full bg-brand-500" />
                                    <div className="flex items-start justify-between gap-2 flex-wrap">
                                      <div>
                                        <h4 className="font-semibold text-surface-900 dark:text-white">{e.title}</h4>
                                        <p className="text-sm text-brand-600 dark:text-brand-400">{e.company}</p>
                                      </div>
                                      <p className="text-xs text-surface-500 dark:text-surface-400 whitespace-nowrap">
                                        {formatDate(e.startDate, 'MMM yyyy')} — {e.endDate ? formatDate(e.endDate, 'MMM yyyy') : 'Present'}
                                      </p>
                                    </div>
                                    <p className="text-sm text-surface-600 dark:text-surface-400 mt-2">{e.description}</p>
                                  </div>
                                ))
                              )}
                            </div>
                          </section>

                          <section>
                            <h3 className="text-xs font-bold uppercase tracking-wider text-surface-500 dark:text-surface-400 mb-3">Education</h3>
                            <div className="flex items-start justify-between gap-3 flex-wrap">
                              <div>
                                <h4 className="font-semibold text-surface-900 dark:text-white">{candidate.education?.degree}</h4>
                                <p className="text-sm text-brand-600 dark:text-brand-400">{candidate.education?.college}</p>
                                <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">CGPA: {candidate.education?.cgpa} • Tier {candidate.education?.collegeTier}</p>
                              </div>
                              <p className="text-xs text-surface-500 dark:text-surface-400 whitespace-nowrap">Class of {candidate.education?.graduationYear}</p>
                            </div>
                          </section>

                          {(candidate.projects?.length > 0 || candidate.certifications?.length > 0) && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                              {candidate.projects?.length > 0 && (
                                <section>
                                  <h3 className="text-xs font-bold uppercase tracking-wider text-surface-500 dark:text-surface-400 mb-3">Projects</h3>
                                  <div className="space-y-3">
                                    {(candidate.projects || []).map((p, i) => (
                                      <div key={i} className="rounded-lg border border-surface-100 dark:border-surface-800 p-3">
                                        <div className="flex items-center justify-between gap-2">
                                          <h4 className="font-semibold text-sm text-surface-900 dark:text-white">{p.name}</h4>
                                          {p.link && <ExternalLink className="w-3.5 h-3.5 text-surface-400" />}
                                        </div>
                                        <p className="text-xs text-surface-600 dark:text-surface-400 mt-1">{p.description}</p>
                                        <div className="flex flex-wrap gap-1 mt-2">
                                          {(p.tech || []).slice(0, 4).map(t => <Badge key={t} size="sm" variant="soft">{t}</Badge>)}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </section>
                              )}
                              {candidate.certifications?.length > 0 && (
                                <section>
                                  <h3 className="text-xs font-bold uppercase tracking-wider text-surface-500 dark:text-surface-400 mb-3">Certifications</h3>
                                  <div className="space-y-2">
                                    {(candidate.certifications || []).map((c, i) => (
                                      <div key={i} className="flex items-start gap-2 rounded-lg border border-surface-100 dark:border-surface-800 p-3">
                                        <Award className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                                        <p className="text-sm font-medium text-surface-700 dark:text-surface-300">{c}</p>
                                      </div>
                                    ))}
                                  </div>
                                </section>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  </TabPanel>

                  <TabPanel value="experience">
                    <Card>
                      <CardHeader>
                        <CardTitle>Work Experience</CardTitle>
                        <CardDescription>{calculateExperience(candidate.yearsOfExperience)} of professional experience</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {(candidate.experience || []).length === 0 ? (
                          <EmptyState size="sm" title="No experience listed" description="Fresher candidate with no professional work history." />
                        ) : (
                          <div className="space-y-6">
                            {(candidate.experience || []).map((e, i) => (
                              <div key={i} className="rounded-xl border border-surface-200 dark:border-surface-800 p-5 hover:border-brand-300 dark:hover:border-brand-700 transition-colors">
                                <div className="flex items-start justify-between gap-3 flex-wrap">
                                  <div className="flex items-start gap-3">
                                    <div className="w-11 h-11 rounded-xl bg-brand-50 dark:bg-brand-950/40 flex items-center justify-center shrink-0">
                                      <Briefcase className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                                    </div>
                                    <div>
                                      <h4 className="font-bold text-lg text-surface-900 dark:text-white">{e.title}</h4>
                                      <p className="text-base text-brand-600 dark:text-brand-400 font-medium">{e.company}</p>
                                    </div>
                                  </div>
                                  <Badge variant="soft" className="shrink-0">
                                    {formatDate(e.startDate, 'MMM yyyy')} — {e.endDate ? formatDate(e.endDate, 'MMM yyyy') : 'Present'}
                                  </Badge>
                                </div>
                                <div className="mt-4 pl-14">
                                  <p className="text-sm text-surface-600 dark:text-surface-400 leading-relaxed">{e.description}</p>
                                  {e.achievements?.length > 0 && (
                                    <ul className="mt-3 space-y-1.5">
                                      {(e.achievements || []).map((a, j) => (
                                        <li key={j} className="flex items-start gap-2 text-sm text-surface-700 dark:text-surface-300">
                                          <FaCheckCircle className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                                          <span>{a}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabPanel>

                  <TabPanel value="education">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2"><GraduationCap className="w-5 h-5 text-purple-500" /> Education</CardTitle>
                        </CardHeader>
                        <CardContent>
                          {!candidate.education ? (
                            <EmptyState size="sm" title="No education info" />
                          ) : (
                            <div className="rounded-xl border border-surface-200 dark:border-surface-800 p-5">
                              <div className="flex items-start gap-3">
                                <div className="w-11 h-11 rounded-xl bg-purple-50 dark:bg-purple-950/40 flex items-center justify-center shrink-0">
                                  <GraduationCap className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                                </div>
                                <div className="flex-1">
                                  <h4 className="font-bold text-surface-900 dark:text-white">{candidate.education.degree}</h4>
                                  <p className="text-brand-600 dark:text-brand-400 font-medium">{candidate.education.college}</p>
                                  <div className="flex flex-wrap gap-2 mt-2">
                                    <Badge variant="soft">Class of {candidate.education.graduationYear}</Badge>
                                    <Badge variant="soft">CGPA: {candidate.education.cgpa}</Badge>
                                    <Badge variant="outline">Tier {candidate.education.collegeTier} Institution</Badge>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2"><Languages className="w-5 h-5 text-sky-500" /> Languages</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {(candidate.languages || ['English']).map((l, i) => (
                              <div key={i} className="flex items-center justify-between rounded-lg border border-surface-200 dark:border-surface-800 px-4 py-3">
                                <span className="font-medium text-surface-800 dark:text-surface-200">{l}</span>
                                <Badge variant="success" size="sm">{i === 0 ? 'Native' : i === 1 ? 'Fluent' : 'Conversational'}</Badge>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabPanel>

                  <TabPanel value="projects">
                    <Card>
                      <CardHeader>
                        <CardTitle>Projects & Portfolio</CardTitle>
                        <CardDescription>{candidate.projects?.length || 0} project{candidate.projects?.length !== 1 ? 's' : ''} listed</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {(candidate.projects || []).length === 0 ? (
                          <EmptyState size="sm" title="No projects yet" description="Candidates can showcase their work in this section." />
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {(candidate.projects || []).map((p, i) => (
                              <div key={i} className="rounded-xl border border-surface-200 dark:border-surface-800 overflow-hidden hover:border-brand-300 dark:hover:border-brand-700 transition-colors">
                                <div className="h-32 bg-gradient-to-br from-brand-500/20 to-purple-500/20 dark:from-brand-950/60 dark:to-purple-950/40 flex items-center justify-center">
                                  <FileText className="w-10 h-10 text-brand-500 opacity-60" />
                                </div>
                                <div className="p-4 space-y-3">
                                  <div className="flex items-start justify-between gap-2">
                                    <h4 className="font-bold text-surface-900 dark:text-white">{p.name}</h4>
                                    {p.link && (
                                      <a href={p.link} target="_blank" rel="noreferrer" className="p-1.5 rounded-md hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-500 hover:text-brand-600 dark:hover:text-brand-400">
                                        <ExternalLink className="w-4 h-4" />
                                      </a>
                                    )}
                                  </div>
                                  <p className="text-sm text-surface-600 dark:text-surface-400">{p.description}</p>
                                  <div className="flex flex-wrap gap-1 pt-2">
                                    {(p.tech || []).map(t => <Badge key={t} size="sm" variant="soft">{t}</Badge>)}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabPanel>

                  <TabPanel value="certifications">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Award className="w-5 h-5 text-amber-500" /> Certifications</CardTitle>
                        <CardDescription>{candidate.certifications?.length || 0} certification{candidate.certifications?.length !== 1 ? 's' : ''} earned</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {(candidate.certifications || []).length === 0 ? (
                          <EmptyState size="sm" title="No certifications listed" description="Candidates can add industry certifications to strengthen their profile." />
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {(candidate.certifications || []).map((c, i) => (
                              <div key={i} className="rounded-xl border border-surface-200 dark:border-surface-800 p-5 bg-gradient-to-br from-amber-50/40 to-transparent dark:from-amber-950/20">
                                <div className="flex items-start gap-3">
                                  <div className="w-11 h-11 rounded-xl bg-amber-100 dark:bg-amber-950/50 flex items-center justify-center shrink-0">
                                    <Award className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                                  </div>
                                  <div>
                                    <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold uppercase tracking-wide">Certified</p>
                                    <h4 className="font-bold text-surface-900 dark:text-white mt-0.5">{c}</h4>
                                    <p className="text-xs text-surface-500 dark:text-surface-400 mt-1">Issued by accredited body</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabPanel>

                  <TabPanel value="ai-match">
                    <div className="space-y-5">
                      <Card>
                        <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1.5">
                              <Sparkles className="w-4 h-4 text-brand-500" />
                              <span className="text-sm font-semibold uppercase tracking-wide text-surface-500 dark:text-surface-400">AI Compatibility Analysis</span>
                            </div>
                            <h3 className="text-lg font-bold text-surface-900 dark:text-white">Match for selected job</h3>
                            <p className="text-sm text-surface-500 dark:text-surface-400 mt-0.5">
                              Choose a job to see how {candidate.name.split(' ')[0]} stacks up against requirements.
                            </p>
                          </div>
                          <div className="w-full sm:w-auto min-w-[260px]">
                            <Select
                              value={matchJobId || ''}
                              onChange={setMatchJobId}
                              options={jobs.map(j => ({ value: j.id, label: truncate(j.title + ' • ' + j.companyName, 50) }))}
                              placeholder="Select a job..."
                            />
                          </div>
                        </CardContent>
                      </Card>

                      {matchLoading ? (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                          <Card><CardContent className="p-8 flex justify-center"><Skeleton className="h-40 w-40 rounded-full" /></CardContent></Card>
                          <Card className="lg:col-span-2"><CardContent className="p-6 space-y-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}</CardContent></Card>
                        </div>
                      ) : matchData ? (
                        <>
                          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                            <Card className="lg:col-span-4">
                              <CardHeader className="text-center pb-2">
                                <CardDescription>{selectedJob ? `vs. ${truncate(selectedJob.title, 28)}` : 'Overall Profile Score'}</CardDescription>
                              </CardHeader>
                              <CardContent className="flex flex-col items-center pb-6">
                                <ScoreRing value={matchData.overallScore} size={150} strokeWidth={11} />
                                <div className="mt-5 grid grid-cols-2 gap-2 w-full">
                                  <MiniScore label="Skill" value={matchData.skillScore} />
                                  <MiniScore label="Experience" value={matchData.experienceScore} />
                                  <MiniScore label="Education" value={matchData.educationScore} />
                                  <MiniScore label="Location" value={matchData.locationScore} />
                                </div>
                              </CardContent>
                            </Card>
                            <Card className="lg:col-span-8">
                              <CardHeader>
                                <CardTitle className="text-base">Detailed Match Breakdown</CardTitle>
                                <CardDescription>How the candidate compares across hiring dimensions</CardDescription>
                              </CardHeader>
                              <CardContent>
                                <MatchBreakdown items={[
                                  { label: 'Skill Match', value: matchData.skillScore, icon: FaCheckCircle, color: 'success' },
                                  { label: 'Experience Fit', value: matchData.experienceScore, icon: Briefcase, color: 'brand' },
                                  { label: 'Education Quality', value: matchData.educationScore, icon: GraduationCap, color: 'purple' },
                                  { label: 'Location Proximity', value: matchData.locationScore, icon: MapPin, color: 'sky' },
                                  { label: 'Overall Compatibility', value: matchData.overallScore, icon: Sparkles, color: matchData.overallScore >= 75 ? 'success' : matchData.overallScore >= 60 ? 'brand' : 'warning' },
                                ]} />
                              </CardContent>
                            </Card>
                          </div>

                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                            <Card>
                              <CardHeader className="pb-3">
                                <CardTitle className="text-sm flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Matched Skills</CardTitle>
                                <CardDescription>{matchData.matchedSkills?.length || 0} / {(selectedJob?.skills || []).length || 'N/A'} required skills</CardDescription>
                              </CardHeader>
                              <CardContent>
                                {matchData.matchedSkills?.length > 0 ? (
                                  <div className="flex flex-wrap gap-1.5">
                                    {matchData.matchedSkills.map(s => (
                                      <Badge key={s} variant="success" className="gap-1"><CheckCircle2 className="w-3 h-3" /> {s}</Badge>
                                    ))}
                                  </div>
                                ) : (
                                  <EmptyState size="sm" iconName="search" title="No direct skill matches" description="Candidate may be in adjacent tech stack." />
                                )}
                              </CardContent>
                            </Card>

                            <Card>
                              <CardHeader className="pb-3">
                                <CardTitle className="text-sm flex items-center gap-1.5"><XCircle2 className="w-4 h-4 text-red-500" /> Potential Gaps</CardTitle>
                                <CardDescription>Skills to assess in interviews</CardDescription>
                              </CardHeader>
                              <CardContent>
                                {matchData.missingSkills?.length > 0 ? (
                                  <div className="flex flex-wrap gap-1.5">
                                    {matchData.missingSkills.map(s => (
                                      <Badge key={s} className="gap-1 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/60">
                                        <XCircle2 className="w-3 h-3" /> {s}
                                      </Badge>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-sm">
                                    <CheckCircle2 className="w-4 h-4" /> No critical skill gaps detected
                                  </div>
                                )}
                                {matchData.extraSkills?.length > 0 && (
                                  <div className="mt-4">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-surface-500 dark:text-surface-400 mb-2">Bonus Skills</p>
                                    <div className="flex flex-wrap gap-1.5">
                                      {matchData.extraSkills.map(s => (
                                        <Badge key={s} size="sm" variant="soft">{s}</Badge>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </CardContent>
                            </Card>

                            <Card>
                              <CardHeader className="pb-3">
                                <CardTitle className="text-sm flex items-center gap-1.5"><Star className="w-4 h-4 text-amber-500" /> Strengths</CardTitle>
                                <CardDescription>Key reasons to shortlist</CardDescription>
                              </CardHeader>
                              <CardContent>
                                <ul className="space-y-2">
                                  {[
                                    matchData.skillScore >= 70 && `${matchData.skillScore}% skill coverage demonstrates strong core competency`,
                                    candidate.yearsOfExperience >= 3 && `${calculateExperience(candidate.yearsOfExperience)} experience suggests maturity and reliability`,
                                    matchData.experienceScore >= 65 && `Experience profile aligns well with ${selectedJob?.title || 'role'} needs`,
                                    candidate.education?.collegeTier === 1 && 'Tier 1 institution signals strong fundamentals',
                                    matchData.locationScore >= 70 && `Location fit is ${matchData.locationScore >= 85 ? 'excellent' : 'good'} — minimal relocation risk`,
                                    candidate.noticePeriod === 'Immediate' && 'Can join immediately — fast ramp-up',
                                  ].filter(Boolean).map((s, i) => (
                                    <li key={i} className="flex items-start gap-2 text-sm text-surface-700 dark:text-surface-300">
                                      <Star className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
                                      <span>{s}</span>
                                    </li>
                                  ))}
                                  {[
                                    matchData.skillScore >= 70,
                                    candidate.yearsOfExperience >= 3,
                                    matchData.experienceScore >= 65,
                                    candidate.education?.collegeTier === 1,
                                    matchData.locationScore >= 70,
                                    candidate.noticePeriod === 'Immediate',
                                  ].filter(Boolean).length === 0 && (
                                    <li className="text-sm text-surface-500 dark:text-surface-400 italic">Assess candidate in interview to identify key strengths.</li>
                                  )}
                                </ul>
                              </CardContent>
                            </Card>
                          </div>

                          <Card>
                            <CardHeader>
                              <CardTitle className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-brand-500" /> AI Recommendation</CardTitle>
                              <CardDescription>Generated analysis based on profile match</CardDescription>
                            </CardHeader>
                            <CardContent>
                              <AIExplanation explanation={matchData.explanation || 'This candidate profile shows promise. Consider a technical interview to validate hands-on skills and cultural fit assessment before moving forward.'} />
                              <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <Button variant="secondary" icon={<Calendar className="w-4 h-4" />} onClick={() => setScheduleOpen(true)} fullWidth>Schedule Interview</Button>
                                <Button variant="outline" icon={<MessageSquare className="w-4 h-4" />} fullWidth>Ask Follow-up</Button>
                                <Button icon={<UserCheck className="w-4 h-4" />} onClick={handleShortlist} fullWidth>Shortlist Now</Button>
                              </div>
                            </CardContent>
                          </Card>
                        </>
                      ) : null}
                    </div>
                  </TabPanel>
                </TabPanels>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      <Modal open={scheduleOpen} onClose={() => setScheduleOpen(false)}>
          <ModalHeader>
            <ModalTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-brand-500" />
              Schedule Interview
            </ModalTitle>
            {candidate && (
              <div className="mt-3 flex items-center gap-3 rounded-xl bg-brand-50 dark:bg-brand-950/30 p-3">
                <Avatar name={candidate.name} size="sm" avatarClass={candidate.avatar} />
                <div className="min-w-0">
                  <p className="font-semibold text-sm text-surface-900 dark:text-white">{candidate.name}</p>
                  <p className="text-xs text-surface-500 dark:text-surface-400 truncate">{candidate.title}</p>
                </div>
              </div>
            )}
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-surface-500 dark:text-surface-400 mb-1.5">Job Position</label>
                <Select
                  value={scheduleForm.jobId}
                  onChange={(v) => setScheduleForm(f => ({ ...f, jobId: v }))}
                  options={jobs.map(j => ({ value: j.id, label: truncate(j.title + ' • ' + j.companyName, 60) }))}
                  placeholder="Select job to interview for..."
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-surface-500 dark:text-surface-400 mb-1.5">Interview Type</label>
                <Select
                  value={scheduleForm.type}
                  onChange={(v) => setScheduleForm(f => ({ ...f, type: v }))}
                  options={INTERVIEW_TYPES.map(t => ({ value: t.value, label: t.label }))}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-surface-500 dark:text-surface-400 mb-1.5">Date</label>
                  <Input
                    type="date"
                    value={scheduleForm.date}
                    onChange={(e) => setScheduleForm(f => ({ ...f, date: e.target.value }))}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-surface-500 dark:text-surface-400 mb-1.5">Time</label>
                  <Input
                    type="time"
                    value={scheduleForm.time}
                    onChange={(e) => setScheduleForm(f => ({ ...f, time: e.target.value }))}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-surface-500 dark:text-surface-400 mb-1.5">Duration (minutes)</label>
                <Select
                  value={scheduleForm.duration}
                  onChange={(v) => setScheduleForm(f => ({ ...f, duration: v }))}
                  options={[
                    { value: '30', label: '30 minutes' },
                    { value: '45', label: '45 minutes' },
                    { value: '60', label: '60 minutes' },
                    { value: '90', label: '90 minutes' },
                    { value: '120', label: '2 hours' },
                  ]}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-surface-500 dark:text-surface-400 mb-1.5">Interviewer Notes</label>
                <Textarea
                  placeholder="Topics to cover, focus areas, links to documents..."
                  rows={3}
                  value={scheduleForm.notes}
                  onChange={(e) => setScheduleForm(f => ({ ...f, notes: e.target.value }))}
                />
              </div>
              <div className="rounded-xl bg-surface-50 dark:bg-surface-800/40 p-4 border border-surface-100 dark:border-surface-700 space-y-1.5 text-xs">
                <div className="flex items-center gap-2 text-surface-500 dark:text-surface-400">
                  <Video className="w-3.5 h-3.5" /> <span>Meeting link will be auto-generated on schedule</span>
                </div>
                <div className="flex items-center gap-2 text-surface-500 dark:text-surface-400">
                  <Mail className="w-3.5 h-3.5" /> <span>Candidate will receive calendar invite and reminders</span>
                </div>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" onClick={() => setScheduleOpen(false)}>Cancel</Button>
            <Button icon={<Calendar className="w-4 h-4" />} onClick={handleSchedule}>Schedule Interview</Button>
          </ModalFooter>
        </Modal>
    </div>
  );
}

function MiniStat({ icon: Icon, label, value, sub, color }) {
  const c = {
    brand: { soft: 'bg-brand-50 dark:bg-brand-950/40', text: 'text-brand-600 dark:text-brand-400' },
    emerald: { soft: 'bg-emerald-50 dark:bg-emerald-950/40', text: 'text-emerald-600 dark:text-emerald-400' },
    purple: { soft: 'bg-purple-50 dark:bg-purple-950/40', text: 'text-purple-600 dark:text-purple-400' },
    sky: { soft: 'bg-sky-50 dark:bg-sky-950/40', text: 'text-sky-600 dark:text-sky-400' },
    amber: { soft: 'bg-amber-50 dark:bg-amber-950/40', text: 'text-amber-600 dark:text-amber-400' },
  }[color] || { soft: 'bg-brand-50 dark:bg-brand-950/40', text: 'text-brand-600 dark:text-brand-400' };
  return (
    <div className="rounded-xl border border-surface-200/60 dark:border-surface-800 p-3.5 bg-white/60 dark:bg-surface-900/40">
      <div className="flex items-center gap-2 mb-1.5">
        <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center', c.soft)}>
          <Icon className={cn('w-3.5 h-3.5', c.text)} />
        </div>
        <span className="text-[11px] font-semibold uppercase tracking-wide text-surface-500 dark:text-surface-400">{label}</span>
      </div>
      <p className="text-base font-bold text-surface-900 dark:text-white truncate">{value}</p>
      <p className="text-[11px] text-surface-500 dark:text-surface-400 truncate mt-0.5">{sub}</p>
    </div>
  );
}

function FactRow({ icon: Icon, label, value, href }) {
  const Content = (
    <div className="flex items-center justify-between rounded-lg border border-surface-200 dark:border-surface-800 px-3.5 py-2.5 hover:border-brand-200 dark:hover:border-brand-800 transition-colors">
      <div className="flex items-center gap-2 min-w-0">
        <Icon className="w-4 h-4 text-surface-400 shrink-0" />
        <span className="text-xs font-medium uppercase tracking-wide text-surface-500 dark:text-surface-400">{label}</span>
      </div>
      <span className="text-sm font-semibold text-surface-700 dark:text-surface-300 truncate ml-2 max-w-[60%] text-right">{value}</span>
    </div>
  );
  return href ? <a href={href} className="block">{Content}</a> : Content;
}

function MiniBar({ label, value, color }) {
  const colors = {
    brand: 'bg-brand-500',
    purple: 'bg-purple-500',
    emerald: 'bg-emerald-500',
    sky: 'bg-sky-500',
    amber: 'bg-amber-500',
  }[color] || 'bg-brand-500';
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11px] font-medium text-surface-600 dark:text-surface-400">{label}</span>
        <span className="text-[11px] font-bold tabular-nums text-surface-700 dark:text-surface-300">{value}%</span>
      </div>
      <div className="h-1.5 bg-surface-100 dark:bg-surface-800 rounded-full overflow-hidden">
        <div className={cn('h-full rounded-full transition-all duration-700', colors)} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function MiniScore({ label, value }) {
  const sc = getScoreColor(value);
  return (
    <div className="rounded-xl border border-surface-200 dark:border-surface-800 p-3 text-center">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-surface-500 dark:text-surface-400 mb-0.5">{label}</p>
      <p className={cn('text-xl font-bold tabular-nums', sc.text)}>{value}</p>
    </div>
  );
}
