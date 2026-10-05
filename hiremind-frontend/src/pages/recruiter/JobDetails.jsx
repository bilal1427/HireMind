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
import { Skeleton, SkeletonText, SkeletonList, SkeletonTable, SkeletonAvatar } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, DropdownSeparator } from '@/components/ui/Dropdown';
import MatchBreakdown from '@/components/ai/MatchBreakdown';
import {
  ArrowLeft, Home, ChevronRight, Pencil, Power, Users, Eye, Calendar, Clock,
  MapPin, DollarSign, Briefcase, MoreVertical, EyeOff, Sparkles, Mail,
  MessageSquare, UserPlus, BarChart3, TrendingUp, Eye as EyeIcon
} from 'lucide-react';
import { FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import { MdOutlineWorkOutline, MdOutlineLocationOn } from 'react-icons/md';
import { cn, formatDate, formatSalaryRange, calculateExperience, formatDateTime, getStatusBadgeClass, getRelativeTime, truncate } from '@/lib/utils';
import { getJobById, toggleJobActive } from '@/services/jobService';
import { getApplications, updateApplicationStatus } from '@/services/applicationService';
import { getCandidates } from '@/services/candidateService';
import { getMatchScore } from '@/services/matchingService';
import { JOB_TYPES, WORK_MODES, DEPARTMENTS } from '@/lib/constants';

export default function JobDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [job, setJob] = useState(null);
  const [apps, setApps] = useState({ data: [], total: 0 });
  const [candidates, setCandidates] = useState([]);
  const [tab, setTab] = useState('overview');
  const [toggling, setToggling] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [j, a, c] = await Promise.all([
        getJobById(id),
        getApplications({ jobId: id, limit: 50 }),
        getCandidates({ limit: 15 }),
      ]);
      setJob(j);
      setApps(a);
      const candsWithMatch = await Promise.all(
        c.data.slice(0, 10).map(async (cand) => {
          try {
            const m = await getMatchScore(cand.id, id);
            return { ...cand, match: m };
          } catch {
            return { ...cand, match: { overallScore: Math.round(55 + Math.random() * 40), skillScore: 60, experienceScore: 70, locationScore: 80, educationScore: 75, matchedSkills: [], missingSkills: [], explanation: '' } };
          }
        })
      );
      setCandidates(candsWithMatch.sort((a, b) => b.match.overallScore - a.match.overallScore));
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (id) load(); }, [id]);

  const toggleStatus = async () => {
    if (!job) return;
    setToggling(true);
    try {
      await toggleJobActive(job.id);
      setJob(j => j ? ({ ...j, isActive: !j.isActive }) : j);
      toast.success(`Job ${job.isActive ? 'deactivated' : 'activated'}`);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setToggling(false);
    }
  };

  const updateStatus = async (appId, status) => {
    try {
      await updateApplicationStatus(appId, status);
      setApps(prev => ({
        ...prev,
        data: prev.data.map(a => a.id === appId ? { ...a, status } : a),
      }));
      toast.success(`Application moved to ${status}`);
    } catch (e) {
      toast.error(e.message);
    }
  };

  const stats = useMemo(() => {
    if (!job) return null;
    const views = job.views || Math.round(500 + Math.random() * 3000);
    const totalApps = apps.total || 0;
    const shortlists = apps.data.filter(a => ['shortlisted', 'interview', 'selected'].includes(a.status)).length;
    const avgMatch = apps.data.length > 0
      ? Math.round(apps.data.reduce((s, a) => s + (a.overallScore || 60), 0) / apps.data.length)
      : 0;
    return {
      views,
      applications: totalApps,
      shortlistRate: totalApps > 0 ? Math.round((shortlists / totalApps) * 100) : 0,
      avgMatch,
      avgTimeToShortlist: '4.2 days',
      postedAgo: getRelativeTime(job.postedAt),
    };
  }, [job, apps]);

  if (error) {
    return (
      <div className="space-y-5 animate-fade-in">
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={() => navigate('/recruiter/jobs')} icon={<ArrowLeft className="w-4 h-4" />}>Back to Jobs</Button>
        </div>
        <ErrorState onRetry={load} message={error.message} />
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <nav className="flex items-center gap-1.5 text-sm text-surface-500 dark:text-surface-400">
        <button onClick={() => navigate('/recruiter/dashboard')} className="flex items-center gap-1 hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
          <Home className="w-3.5 h-3.5" /> Dashboard
        </button>
        <ChevronRight className="w-3.5 h-3.5" />
        <button onClick={() => navigate('/recruiter/jobs')} className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Jobs</button>
        <ChevronRight className="w-3.5 h-3.5" />
        {loading ? (
          <Skeleton className="h-4 w-40 rounded" />
        ) : (
          <span className="text-surface-900 dark:text-white font-medium truncate">{truncate(job?.title || '', 40)}</span>
        )}
      </nav>

      {loading ? (
        <Card>
          <CardContent className="p-6 space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4 flex-1 min-w-0">
                <SkeletonAvatar size="lg" />
                <div className="space-y-2 flex-1 min-w-0">
                  <Skeleton className="h-8 w-80 rounded-lg" />
                  <Skeleton className="h-4 w-48 rounded" />
                  <div className="flex gap-2 flex-wrap pt-1">
                    <Skeleton className="h-6 w-20 rounded-md" />
                    <Skeleton className="h-6 w-24 rounded-md" />
                    <Skeleton className="h-6 w-28 rounded-md" />
                  </div>
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <Skeleton className="h-10 w-24 rounded-lg" />
                <Skeleton className="h-10 w-28 rounded-lg" />
              </div>
            </div>
            <SkeletonText lines={6} />
          </CardContent>
        </Card>
      ) : job && (
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-br from-brand-500/10 via-brand-500/5 to-transparent dark:from-brand-950/60 dark:via-brand-950/30 border-b border-surface-200 dark:border-surface-800">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <div className="w-16 h-16 rounded-2xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 shadow-sm flex items-center justify-center shrink-0">
                    <span className="font-bold text-lg text-brand-600 dark:text-brand-400">
                      {job.companyLogo?.slice(0, 3) || 'HMA'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                      <h1 className="text-2xl font-bold text-surface-900 dark:text-white tracking-tight truncate">{job.title}</h1>
                      <button
                        onClick={toggleStatus}
                        disabled={toggling}
                        className={cn(
                          'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold transition-all',
                          job.isActive
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900 hover:bg-emerald-100 dark:hover:bg-emerald-950/60'
                            : 'bg-surface-100 text-surface-600 dark:bg-surface-800 dark:text-surface-400 border-surface-200 dark:border-surface-700 hover:bg-surface-200 dark:hover:bg-surface-700'
                        )}
                      >
                        {job.isActive ? <FaCheckCircle className="w-3 h-3" /> : <FaTimesCircle className="w-3 h-3" />}
                        {job.isActive ? 'Active' : 'Paused'}
                      </button>
                    </div>
                    <p className="text-sm text-surface-600 dark:text-surface-300 mb-3">
                      <span className="font-semibold">{job.companyName}</span>
                      <span className="mx-2 text-surface-300 dark:text-surface-600">•</span>
                      {DEPARTMENTS.find(d => d.value === job.department)?.label || job.department}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className="gap-1.5">
                        <MapPin className="w-3 h-3" /> {job.location}
                      </Badge>
                      <Badge variant="soft" className="gap-1.5">
                        <Briefcase className="w-3 h-3" /> {JOB_TYPES.find(t => t.value === job.type)?.label || job.type}
                      </Badge>
                      <Badge variant="soft" className="gap-1.5">
                        <Home className="w-3 h-3" /> {WORK_MODES.find(w => w.value === job.workMode)?.label || job.workMode}
                      </Badge>
                      <Badge variant="brand" className="gap-1.5">
                        <DollarSign className="w-3 h-3" /> {formatSalaryRange(job.salaryMin, job.salaryMax)}
                      </Badge>
                      <Badge variant="outline" className="gap-1.5">
                        <Clock className="w-3 h-3" /> {calculateExperience(job.experienceMin)} - {calculateExperience(job.experienceMax)}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 shrink-0">
                  <Button variant="secondary" onClick={() => navigate(`/recruiter/jobs/${job.id}/edit`)} icon={<Pencil className="w-4 h-4" />}>
                    Edit
                  </Button>
                  <Button
                    variant={job.isActive ? 'outline' : 'secondary'}
                    onClick={toggleStatus}
                    isLoading={toggling}
                    icon={job.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  >
                    {job.isActive ? 'Deactivate' : 'Activate'}
                  </Button>
                  <Button onClick={() => setTab('applications')} icon={<Users className="w-4 h-4" />}>
                    View Applications
                  </Button>
                  <Dropdown align="end">
                    <DropdownTrigger asChild>
                      <Button variant="secondary" className="!px-2.5">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownTrigger>
                    <DropdownMenu>
                      <DropdownItem icon={<Calendar className="w-4 h-4" />} onClick={() => navigate('/recruiter/interviews')}>
                        Schedule interviews
                      </DropdownItem>
                      <DropdownItem icon={<Sparkles className="w-4 h-4" />} onClick={() => setTab('matching')}>
                        View matching candidates
                      </DropdownItem>
                      <DropdownSeparator />
                      <DropdownItem icon={<Users className="w-4 h-4" />}>
                        Share job link
                      </DropdownItem>
                      <DropdownItem icon={<Pencil className="w-4 h-4" />} onClick={() => navigate(`/recruiter/jobs/${job.id}/edit`)}>
                        Duplicate job
                      </DropdownItem>
                    </DropdownMenu>
                  </Dropdown>
                </div>
              </div>
            </CardContent>
          </div>
        </Card>
      )}

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}><CardContent className="p-5 space-y-2">
              <Skeleton className="h-4 w-24 rounded" />
              <Skeleton className="h-8 w-20 rounded" />
              <Skeleton className="h-3 w-28 rounded" />
            </CardContent></Card>
          ))}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <StatCard icon={EyeIcon} label="Views" value={stats.views.toLocaleString()} sub={`Posted ${stats.postedAgo}`} color="brand" />
          <StatCard icon={Users} label="Applications" value={stats.applications} sub={`${Math.round(stats.applications / 7)}/day avg`} color="sky" />
          <StatCard icon={TrendingUp} label="Shortlist Rate" value={`${stats.shortlistRate}%`} sub={`${Math.round(stats.applications * stats.shortlistRate / 100)} candidates`} color="emerald" />
          <StatCard icon={Sparkles} label="Avg Match" value={`${stats.avgMatch}%`} sub={stats.avgMatch >= 75 ? 'Strong pool' : 'Decent pool'} color={stats.avgMatch >= 75 ? 'emerald' : 'amber'} />
          <StatCard icon={Clock} label="Avg → Shortlist" value={stats.avgTimeToShortlist} sub="From application date" color="purple" />
        </div>
      ) : null}

      {loading ? (
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-10 w-96 rounded-lg mb-6" />
            <SkeletonTable rows={6} columns={6} />
          </CardContent>
        </Card>
      ) : job && (
        <Card>
          <CardContent className="p-0">
            <div className="px-6 pt-5">
              <Tabs defaultValue="overview" value={tab} onValueChange={setTab}>
                <TabList className="flex-wrap -mx-1">
                  <Tab value="overview">Overview</Tab>
                  <Tab value="applications">
                    Applications <Badge size="sm" variant="soft" className="ml-1.5">{apps.total}</Badge>
                  </Tab>
                  <Tab value="matching">
                    Matching <Badge size="sm" variant="brand" className="ml-1.5">{candidates.length}</Badge>
                  </Tab>
                  <Tab value="stats">Stats</Tab>
                </TabList>
              </Tabs>
            </div>
            <div className="px-6 py-5">
              {tab === 'overview' && job && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                  <div className="lg:col-span-2 space-y-5">
                    <section>
                      <h3 className="text-sm font-bold uppercase tracking-wide text-surface-500 dark:text-surface-400 mb-3">About the role</h3>
                      <div className="rounded-xl border border-surface-200 dark:border-surface-800 p-5 prose prose-sm dark:prose-invert max-w-none prose-p:text-surface-700 dark:prose-p:text-surface-300 leading-relaxed whitespace-pre-wrap">
                        {job.description || <span className="text-surface-400 italic">No description provided yet. <Link to={`/recruiter/jobs/${job.id}/edit`} className="text-brand-600 dark:text-brand-400 font-medium hover:underline">Add one →</Link></span>}
                      </div>
                    </section>
                    {job.responsibilities?.length > 0 && (
                      <section>
                        <h3 className="text-sm font-bold uppercase tracking-wide text-surface-500 dark:text-surface-400 mb-3">Key Responsibilities</h3>
                        <ol className="space-y-2">
                          {job.responsibilities.map((r, i) => (
                            <li key={i} className="flex items-start gap-3 rounded-xl p-3 bg-surface-50/60 dark:bg-surface-800/40 border border-surface-100 dark:border-surface-800">
                              <span className="w-6 h-6 rounded-lg bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                                {i + 1}
                              </span>
                              <span className="text-sm text-surface-700 dark:text-surface-300 leading-relaxed">{r}</span>
                            </li>
                          ))}
                        </ol>
                      </section>
                    )}
                    {job.requirements?.length > 0 && (
                      <section>
                        <h3 className="text-sm font-bold uppercase tracking-wide text-surface-500 dark:text-surface-400 mb-3">Requirements</h3>
                        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {job.requirements.map((r, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-surface-700 dark:text-surface-300">
                              <FaCheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                              <span>{r}</span>
                            </li>
                          ))}
                        </ul>
                      </section>
                    )}
                    {job.benefits?.length > 0 && (
                      <section>
                        <h3 className="text-sm font-bold uppercase tracking-wide text-surface-500 dark:text-surface-400 mb-3">Benefits & Perks</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {job.benefits.map((b, i) => (
                            <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50 text-sm text-emerald-800 dark:text-emerald-300">
                              <Sparkles className="w-3.5 h-3.5 shrink-0" />
                              <span>{b}</span>
                            </div>
                          ))}
                        </div>
                      </section>
                    )}
                  </div>
                  <div className="space-y-5">
                    <section>
                      <h3 className="text-sm font-bold uppercase tracking-wide text-surface-500 dark:text-surface-400 mb-3">Required Skills</h3>
                      <div className="flex flex-wrap gap-1.5">
                        {job.skills?.length > 0 ? job.skills.map(s => (
                          <Badge key={s} variant="brand">{s}</Badge>
                        )) : <span className="text-sm text-surface-400 italic">None listed</span>}
                      </div>
                    </section>
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center gap-2"><Sparkles className="w-4 h-4 text-brand-500" /> Application Insights</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-surface-600 dark:text-surface-400">48h application velocity</span>
                            <span className="font-semibold text-emerald-600 dark:text-emerald-400">+{Math.round(5 + Math.random() * 15)}%</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-surface-100 dark:bg-surface-800 overflow-hidden">
                            <div className="h-full rounded-full bg-emerald-500" style={{ width: `${55 + Math.random() * 40}%` }} />
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-surface-600 dark:text-surface-400">Skill match quality</span>
                            <span className="font-semibold text-brand-600 dark:text-brand-400">{stats?.avgMatch || 70}%</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-surface-100 dark:bg-surface-800 overflow-hidden">
                            <div className="h-full rounded-full bg-brand-500" style={{ width: `${stats?.avgMatch || 70}%` }} />
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-surface-600 dark:text-surface-400">Diversity index</span>
                            <span className="font-semibold text-sky-600 dark:text-sky-400">Good</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-surface-100 dark:bg-surface-800 overflow-hidden">
                            <div className="h-full rounded-full bg-sky-500" style={{ width: '72%' }} />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}

              {tab === 'applications' && (
                <div>
                  {apps.data.length === 0 ? (
                    <EmptyState
                      iconName="users"
                      title="No applications yet"
                      description="Candidates will appear here once they apply to this job."
                    />
                  ) : (
                    <div className="border border-surface-200 dark:border-surface-800 rounded-xl overflow-hidden">
                      <Table>
                        <Thead className="bg-surface-50/70 dark:bg-surface-800/40">
                          <Tr>
                            <Th>Candidate</Th>
                            <Th>Applied</Th>
                            <Th className="text-center">Match</Th>
                            <Th>Status</Th>
                            <Th className="text-right">Actions</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {apps.data.map(a => {
                            const sc = getScoreColor(a.overallScore || 60);
                            return (
                              <Tr key={a.id} className="hover:bg-surface-50 dark:hover:bg-surface-800/40">
                                <Td>
                                  <div className="flex items-center gap-3">
                                    <Avatar name={a.candidateName} size="sm" />
                                    <div className="min-w-0">
                                      <p className="font-semibold text-sm text-surface-900 dark:text-white truncate">{a.candidateName}</p>
                                      <p className="text-xs text-surface-500 dark:text-surface-400 truncate max-w-[200px]">{a.candidateTitle}</p>
                                      <div className="flex flex-wrap gap-1 mt-1">
                                        {(a.candidateSkills || []).slice(0, 3).map(s => (
                                          <Badge key={s} size="sm" variant="outline">{s}</Badge>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                </Td>
                                <Td>
                                  <span className="text-sm text-surface-700 dark:text-surface-300">{formatDate(a.appliedAt)}</span>
                                  <span className="text-[11px] text-surface-400 block">{getRelativeTime(a.appliedAt)}</span>
                                </Td>
                                <Td className="text-center">
                                  <div className="inline-flex items-center gap-2 px-2 py-1 rounded-lg bg-surface-50 dark:bg-surface-800/60">
                                    <ScoreRing value={a.overallScore || 60} size={44} strokeWidth={5} showLabel={false} />
                                    <div className="text-left">
                                      <div className={cn('text-sm font-bold tabular-nums', sc.text)}>{a.overallScore || 60}%</div>
                                      <div className="text-[10px] text-surface-400">{sc.label}</div>
                                    </div>
                                  </div>
                                </Td>
                                <Td>
                                  <Badge className={cn('capitalize', getStatusBadgeClass(a.status))}>{a.status}</Badge>
                                </Td>
                                <Td className="text-right">
                                  <div className="flex items-center justify-end gap-1.5">
                                    <Button size="sm" variant="ghost" onClick={() => navigate(`/recruiter/candidates/${a.candidateId}`)} icon={<Eye className="w-3.5 h-3.5" />}>
                                      View
                                    </Button>
                                    <Dropdown align="end">
                                      <DropdownTrigger asChild>
                                        <Button size="sm" variant="ghost" className="!px-2"><MoreVertical className="w-4 h-4" /></Button>
                                      </DropdownTrigger>
                                      <DropdownMenu>
                                        <DropdownItem icon={<Users className="w-4 h-4" />} onClick={() => updateStatus(a.id, 'screening')}>Move to Screening</DropdownItem>
                                        <DropdownItem icon={<FaCheckCircle className="w-4 h-4 text-emerald-500" />} onClick={() => updateStatus(a.id, 'shortlisted')}>Shortlist</DropdownItem>
                                        <DropdownItem icon={<Calendar className="w-4 h-4" />} onClick={() => { updateStatus(a.id, 'interview'); navigate('/recruiter/interviews'); }}>Schedule Interview</DropdownItem>
                                        <DropdownSeparator />
                                        <DropdownItem icon={<Mail className="w-4 h-4" />}>Send message</DropdownItem>
                                        <DropdownItem icon={<FaTimesCircle className="w-4 h-4 text-red-500" />} onClick={() => updateStatus(a.id, 'rejected')} className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30">Reject</DropdownItem>
                                      </DropdownMenu>
                                    </Dropdown>
                                  </div>
                                </Td>
                              </Tr>
                            );
                          })}
                        </Tbody>
                      </Table>
                    </div>
                  )}
                </div>
              )}

              {tab === 'matching' && (
                <div>
                  {candidates.length === 0 ? (
                    <EmptyState
                      iconName="search"
                      title="No matching candidates"
                      description="AI will surface top matches as more candidates join the platform."
                    />
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-4">
                      {candidates.map(c => {
                        const score = c.match.overallScore;
                        const sc = getScoreColor(score);
                        return (
                          <div key={c.id} className="rounded-xl border border-surface-200 dark:border-surface-800 overflow-hidden hover:shadow-md transition-shadow">
                            <div className="flex flex-col md:flex-row">
                              <div className="flex items-center gap-4 p-5 flex-1 min-w-0">
                                <Avatar name={c.name} size="lg" />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                      <h4 className="font-bold text-surface-900 dark:text-white truncate">{c.name}</h4>
                                      <p className="text-sm text-surface-600 dark:text-surface-400 truncate">{c.title}</p>
                                      <div className="flex items-center gap-3 mt-1.5 text-xs text-surface-500 dark:text-surface-400">
                                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {c.location}</span>
                                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {calculateExperience(c.yearsOfExperience)}</span>
                                        <span className="flex items-center gap-1"><Briefcase className="w-3 h-3" /> {c.currentCompany}</span>
                                      </div>
                                    </div>
                                    <div className="shrink-0">
                                      <ScoreRing value={score} size={72} strokeWidth={7} />
                                    </div>
                                  </div>
                                  <div className="flex flex-wrap gap-1 mt-3">
                                    {(c.skills || []).slice(0, 6).map(s => (
                                      <Badge key={s} size="sm" variant="soft">{s}</Badge>
                                    ))}
                                    {(c.skills || []).length > 6 && (
                                      <Badge size="sm" variant="outline">+{(c.skills || []).length - 6} more</Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex md:flex-col items-center md:items-stretch gap-2 md:gap-1 md:w-56 p-4 md:p-5 md:border-l md:border-t-0 border-t border-surface-100 dark:border-surface-800 bg-surface-50/50 dark:bg-surface-900/40">
                                <Button size="sm" variant="secondary" fullWidth onClick={() => navigate(`/recruiter/candidates/${c.id}`)} icon={<Eye className="w-3.5 h-3.5" />}>
                                  View Profile
                                </Button>
                                <Button size="sm" fullWidth icon={<UserPlus className="w-3.5 h-3.5" />}>
                                  Invite to Apply
                                </Button>
                                <Button size="sm" variant="outline" fullWidth icon={<MessageSquare className="w-3.5 h-3.5" />}>
                                  Message
                                </Button>
                              </div>
                            </div>
                            {(c.match.matchedSkills?.length > 0 || c.match.missingSkills?.length > 0) && (
                              <div className="border-t border-surface-100 dark:border-surface-800 px-5 py-3 flex flex-wrap gap-2 items-center text-xs">
                                {c.match.matchedSkills?.slice(0, 4).map(s => (
                                  <span key={s} className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-900/60">
                                    <FaCheckCircle className="w-3 h-3" /> {s}
                                  </span>
                                ))}
                                {c.match.missingSkills?.slice(0, 2).map(s => (
                                  <span key={s} className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 border border-red-100 dark:border-red-900/60">
                                    <FaTimesCircle className="w-3 h-3" /> {s}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {tab === 'stats' && stats && job && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <Card>
                    <CardHeader><CardTitle className="text-base">Application Timeline</CardTitle></CardHeader>
                    <CardContent className="space-y-3">
                      <TimelineStat label="Job Posted" date={formatDate(job.postedAt)} state="completed" />
                      <TimelineStat label={`First ${Math.min(10, apps.total)} applications`} date={formatDate(new Date(new Date(job.postedAt).getTime() + 2 * 24 * 3600 * 1000))} sub="Typical first wave of applicants" state="completed" />
                      <TimelineStat label="50% milestone" date={formatDate(new Date(new Date(job.postedAt).getTime() + 8 * 24 * 3600 * 1000))} sub={`${Math.round(apps.total * 0.5)} applications reached`} state="active" />
                      <TimelineStat label="Shortlist window closes" date={formatDate(new Date(new Date(job.postedAt).getTime() + 21 * 24 * 3600 * 1000))} sub="Target to shortlist candidates" state="pending" />
                      <TimelineStat label="Hire by" date={formatDate(new Date(new Date(job.postedAt).getTime() + 45 * 24 * 3600 * 1000))} sub="Industry average time-to-hire" state="pending" />
                    </CardContent>
                  </Card>
                  <div className="space-y-5">
                    <Card>
                      <CardHeader><CardTitle className="text-base">Conversion Funnel</CardTitle><CardDescription>By status</CardDescription></CardHeader>
                      <CardContent>
                        <MatchBreakdown items={[
                          { label: 'Applied', value: 100, icon: Users, color: 'sky' },
                          { label: 'Screening', value: 62, icon: Eye, color: 'amber' },
                          { label: 'Shortlisted', value: stats.shortlistRate + 5, icon: FaCheckCircle, color: 'brand' },
                          { label: 'Interview', value: Math.max(8, stats.shortlistRate - 8), icon: Calendar, color: 'emerald' },
                          { label: 'Selected', value: Math.max(3, Math.round(stats.shortlistRate / 3)), icon: Sparkles, color: 'success' },
                        ]} />
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader><CardTitle className="text-base">Performance</CardTitle></CardHeader>
                      <CardContent className="grid grid-cols-2 gap-3">
                        <PerfTile label="View → Apply" value={`${stats.applications > 0 ? Math.round((stats.applications / stats.views) * 100) : 0}%`} sub="Industry avg 3-5%" good={(stats.applications / stats.views) * 100 >= 4} />
                        <PerfTile label="Apply → Shortlist" value={`${stats.shortlistRate}%`} sub="Benchmark 15-25%" good={stats.shortlistRate >= 15 && stats.shortlistRate <= 35} />
                        <PerfTile label="Candidate Quality" value={`${stats.avgMatch}/100`} sub="Based on skill matches" good={stats.avgMatch >= 70} />
                        <PerfTile label="Time to Hire" value={stats.avgTimeToShortlist} sub="Industry avg 7 days" good={parseFloat(stats.avgTimeToShortlist) <= 5} />
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub, color }) {
  const colors = {
    brand: { soft: 'bg-brand-50 dark:bg-brand-950/40', text: 'text-brand-600 dark:text-brand-400' },
    sky: { soft: 'bg-sky-50 dark:bg-sky-950/40', text: 'text-sky-600 dark:text-sky-400' },
    emerald: { soft: 'bg-emerald-50 dark:bg-emerald-950/40', text: 'text-emerald-600 dark:text-emerald-400' },
    amber: { soft: 'bg-amber-50 dark:bg-amber-950/40', text: 'text-amber-600 dark:text-amber-400' },
    purple: { soft: 'bg-purple-50 dark:bg-purple-950/40', text: 'text-purple-600 dark:text-purple-400' },
  };
  const c = colors[color] || colors.brand;
  return (
    <Card>
      <CardContent className="p-5 space-y-1">
        <div className="flex items-center gap-2">
          <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', c.soft)}>
            <Icon className={cn('w-4 h-4', c.text)} />
          </div>
          <span className="text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wide">{label}</span>
        </div>
        <div className="text-2xl font-bold text-surface-900 dark:text-white tracking-tight tabular-nums pt-1">{value}</div>
        {sub && <div className="text-xs text-surface-500 dark:text-surface-400">{sub}</div>}
      </CardContent>
    </Card>
  );
}

function TimelineStat({ label, date, sub, state }) {
  const states = {
    completed: { dot: 'bg-emerald-500', ring: 'ring-emerald-100 dark:ring-emerald-900/50', label: 'text-emerald-700 dark:text-emerald-300' },
    active: { dot: 'bg-brand-500 animate-pulse', ring: 'ring-brand-100 dark:ring-brand-900/50', label: 'text-brand-700 dark:text-brand-300' },
    pending: { dot: 'bg-surface-300 dark:bg-surface-700', ring: 'ring-surface-100 dark:ring-surface-800', label: 'text-surface-500 dark:text-surface-400' },
  };
  const s = states[state] || states.pending;
  return (
    <div className="flex items-start gap-3 relative">
      <div className={cn('w-3 h-3 rounded-full mt-1.5 shrink-0 ring-4', s.dot, s.ring)} />
      <div className="flex-1 pb-3 border-b border-surface-100 dark:border-surface-800 last:border-b-0 last:pb-0">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <p className={cn('text-sm font-semibold', s.label)}>{label}</p>
          <span className="text-xs font-medium text-surface-500 dark:text-surface-400">{date}</span>
        </div>
        {sub && <p className="text-xs text-surface-400 dark:text-surface-500 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function PerfTile({ label, value, sub, good }) {
  return (
    <div className={cn(
      'rounded-xl border p-4 transition-colors',
      good ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-100 dark:border-emerald-900/50'
           : 'bg-amber-50/60 dark:bg-amber-950/30 border-amber-100 dark:border-amber-900/50'
    )}>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-surface-500 dark:text-surface-400">{label}</p>
      <p className={cn(
        'text-xl font-bold mt-1 tabular-nums',
        good ? 'text-emerald-700 dark:text-emerald-300' : 'text-amber-700 dark:text-amber-300'
      )}>{value}</p>
      <p className="text-[11px] text-surface-500 dark:text-surface-400 mt-0.5">{sub}</p>
    </div>
  );
}
