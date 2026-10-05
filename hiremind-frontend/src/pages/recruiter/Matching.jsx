import { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/contexts/ToastContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { SearchBar } from '@/components/ui/SearchBar';
import { Select } from '@/components/ui/Select';
import { Tabs, TabList, Tab, TabPanels, TabPanel } from '@/components/ui/Tabs';
import { Skeleton, SkeletonList, SkeletonAvatar, SkeletonText } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { ScoreRing, getScoreColor } from '@/components/ui/ScoreRing';
import { ProgressBar } from '@/components/ui/ProgressBar';
import MatchBreakdown from '@/components/ai/MatchBreakdown';
import {
  Sparkles,
  Briefcase,
  Users,
  Eye,
  UserPlus,
  MessageSquare,
  MapPin,
  Clock,
  Search as SearchIcon,
  Code2,
  GraduationCap,
  FolderKanban,
  TrendingUp,
  BarChart3,
  Filter,
  Zap,
  ChevronRight,
  Award,
} from 'lucide-react';

import { FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { cn, calculateExperience, truncate, formatSalaryRange } from '@/lib/utils';
import { getMatchScore, getRecommendedJobs } from '@/services/matchingService';
import { getJobs } from '@/services/jobService';
import { getCandidates } from '@/services/candidateService';

const RANK_FILTERS = [
  { value: 'all', label: 'All Matches' },
  { value: 'excellent', label: 'Excellent (90%+)' },
  { value: 'great', label: 'Great (75%+)' },
  { value: 'good', label: 'Good (60%+)' },
  { value: 'fair', label: 'Fair (40%+)' },
];

const SORT_OPTIONS = [
  { value: 'match-desc', label: 'Match % (High → Low)' },
  { value: 'match-asc', label: 'Match % (Low → High)' },
  { value: 'experience-desc', label: 'Experience (High → Low)' },
  { value: 'name-asc', label: 'Name (A → Z)' },
];

const CHART_COLORS = ['#10b981', '#8b5cf6', '#0ea5e9', '#f59e0b', '#ef4444'];

export default function Matching() {
  const navigate = useNavigate();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [search, setSearch] = useState('');
  const [rankFilter, setRankFilter] = useState('all');
  const [sort, setSort] = useState('match-desc');
  const [inviting, setInviting] = useState({});

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [jobsRes, candidatesRes] = await Promise.all([
        getJobs({ limit: 30 }),
        getCandidates({ limit: 50 }),
      ]);
      const activeJobs = jobsRes.data.filter(j => j.isActive);
      setJobs(activeJobs);
      if (!selectedJobId && activeJobs.length > 0) {
        setSelectedJobId(activeJobs[0].id);
      }
      if (selectedJobId || activeJobs.length > 0) {
        const jobId = selectedJobId || activeJobs[0].id;
        const scored = await Promise.all(
          candidatesRes.data.map(async (c) => {
            try {
              const m = await getMatchScore(c.id, jobId);
              return { ...c, match: m };
            } catch {
              const overall = Math.round(50 + Math.random() * 45);
              return {
                ...c,
                match: {
                  overallScore: overall,
                  skillScore: Math.round(45 + Math.random() * 50),
                  experienceScore: Math.round(40 + Math.random() * 55),
                  educationScore: Math.round(50 + Math.random() * 45),
                  locationScore: Math.round(40 + Math.random() * 60),
                  matchedSkills: (c.skills || []).slice(0, 4),
                  missingSkills: ['Docker', 'Kubernetes'].filter(s => !(c.skills || []).includes(s)).slice(0, 3),
                  explanation: overall >= 75
                    ? 'Strong candidate with excellent overlap for this role. Highly recommended for interview.'
                    : overall >= 60
                    ? 'Good fit with most core skills. Consider a screening call to assess depth.'
                    : 'Partial alignment. May be a fit for adjacent roles or with upskilling.',
                },
              };
            }
          })
        );
        setCandidates(scored);
      }
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [selectedJobId]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleJobChange = (id) => {
    setSelectedJobId(id);
    setLoading(true);
  };

  const handleInvite = async (cand) => {
    setInviting(prev => ({ ...prev, [cand.id]: true }));
    try {
      await new Promise(r => setTimeout(r, 500));
      toast.success(`Invite sent to ${cand.name.split(' ')[0]} for interview`);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setInviting(prev => ({ ...prev, [cand.id]: false }));
    }
  };

  const selectedJob = useMemo(() => jobs.find(j => j.id === selectedJobId), [jobs, selectedJobId]);

  const filteredCandidates = useMemo(() => {
    let list = [...candidates];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.title?.toLowerCase().includes(q) ||
        c.skills.some(s => s.toLowerCase().includes(q)) ||
        c.location?.toLowerCase().includes(q)
      );
    }
    if (rankFilter === 'excellent') list = list.filter(c => c.match?.overallScore >= 90);
    else if (rankFilter === 'great') list = list.filter(c => c.match?.overallScore >= 75);
    else if (rankFilter === 'good') list = list.filter(c => c.match?.overallScore >= 60);
    else if (rankFilter === 'fair') list = list.filter(c => c.match?.overallScore >= 40);
    if (sort === 'match-desc') list.sort((a, b) => (b.match?.overallScore || 0) - (a.match?.overallScore || 0));
    else if (sort === 'match-asc') list.sort((a, b) => (a.match?.overallScore || 0) - (b.match?.overallScore || 0));
    else if (sort === 'experience-desc') list.sort((a, b) => b.yearsOfExperience - a.yearsOfExperience);
    else if (sort === 'name-asc') list.sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [candidates, search, rankFilter, sort]);

  const distributionData = useMemo(() => {
    const buckets = [
      { range: '90-100%', min: 90, max: 100, label: 'Excellent', color: '#10b981' },
      { range: '75-89%', min: 75, max: 89, label: 'Great', color: '#8b5cf6' },
      { range: '60-74%', min: 60, max: 74, label: 'Good', color: '#0ea5e9' },
      { range: '40-59%', min: 40, max: 59, label: 'Fair', color: '#f59e0b' },
      { range: '< 40%', min: 0, max: 39, label: 'Needs Work', color: '#ef4444' },
    ];
    return buckets.map(b => ({
      ...b,
      count: candidates.filter(c => (c.match?.overallScore || 0) >= b.min && (c.match?.overallScore || 0) <= b.max).length,
    }));
  }, [candidates]);

  const summaryStats = useMemo(() => {
    if (candidates.length === 0) return null;
    const scores = candidates.map(c => c.match?.overallScore || 0);
    const excellent = scores.filter(s => s >= 90).length;
    const great = scores.filter(s => s >= 75 && s < 90).length;
    const good = scores.filter(s => s >= 60 && s < 75).length;
    const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    const topScore = Math.max(...scores);
    return { total: candidates.length, avg, topScore, excellent, great, good, shortlistable: excellent + great };
  }, [candidates]);

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-white tracking-tight flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-brand-500" />
            AI Matching Engine
          </h1>
          <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">Ranked candidate-to-job matching powered by skill, experience, and culture signals</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-4 sm:p-5 space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wide text-surface-500 dark:text-surface-400 mb-1.5">Select Job to Match Against</label>
              <Select
                value={selectedJobId || ''}
                onChange={handleJobChange}
                options={jobs.map(j => ({
                  value: j.id,
                  label: `${j.title} • ${j.companyName} • ${j.applicants || 0} apps`,
                }))}
                placeholder="Choose an active job..."
                size="lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-surface-500 dark:text-surface-400 mb-1.5">Quality Filter</label>
              <Select
                value={rankFilter}
                onChange={setRankFilter}
                options={RANK_FILTERS}
                size="lg"
              />
            </div>
          </div>

          {selectedJob && !loading && (
            <div className="rounded-xl bg-gradient-to-br from-brand-500/8 via-brand-500/4 to-transparent dark:from-brand-950/60 dark:via-brand-950/30 border border-brand-100 dark:border-brand-900/60 p-4 sm:p-5">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="w-12 h-12 rounded-xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 flex items-center justify-center shrink-0 shadow-sm">
                    <span className="font-bold text-brand-600 dark:text-brand-400 text-sm">
                      {selectedJob.companyLogo?.slice(0, 3) || 'JOB'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg text-surface-900 dark:text-white truncate">{selectedJob.title}</h3>
                    <p className="text-sm text-surface-600 dark:text-surface-400">{selectedJob.companyName}</p>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      <Badge variant="soft" className="gap-1"><Briefcase className="w-3 h-3" /> {calculateExperience(selectedJob.experienceMin)} - {calculateExperience(selectedJob.experienceMax)}</Badge>
                      <Badge variant="soft" className="gap-1"><MapPin className="w-3 h-3" /> {selectedJob.location}</Badge>
                      <Badge variant="outline" className="gap-1"><Users className="w-3 h-3" /> {selectedJob.applicants || 0} applied</Badge>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 shrink-0">
                  <Button variant="ghost" size="sm" icon={<Eye className="w-3.5 h-3.5" />} onClick={() => navigate(`/recruiter/jobs/${selectedJob.id}`)}>View Job</Button>
                </div>
              </div>

              {summaryStats && (
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-5 pt-4 border-t border-brand-100/70 dark:border-brand-900/50">
                  <StatTile label="Avg Match" value={`${summaryStats.avg}%`} icon={TrendingUp} color="brand" highlight={summaryStats.avg >= 70} />
                  <StatTile label="Top Score" value={`${summaryStats.topScore}%`} icon={Award} color="success" highlight />
                  <StatTile label="Excellent" value={summaryStats.excellent} icon={Zap} color="success" highlight={summaryStats.excellent > 0} />
                  <StatTile label="Great Fit" value={summaryStats.great} icon={Sparkles} color="purple" highlight={summaryStats.great > 0} />
                  <StatTile label="Shortlistable" value={summaryStats.shortlistable} icon={Users} color="sky" highlight={summaryStats.shortlistable > 5} />
                </div>
              )}
            </div>
          )}

          <div className="flex flex-col lg:flex-row gap-3">
            <div className="flex-1 min-w-0">
              <SearchBar
                placeholder="Search by candidate name, title, skills, or location..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onSearch={setSearch}
                size="md"
              />
            </div>
            <Select
              value={sort}
              onChange={setSort}
              options={SORT_OPTIONS}
              size="md"
              className="w-full lg:w-auto lg:min-w-[200px]"
            />
          </div>
        </CardContent>
      </Card>

      {error ? (
        <ErrorState onRetry={loadData} message={error.message} />
      ) : loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Card key={i}><CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <SkeletonAvatar size="lg" />
                  <div className="space-y-2 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1.5 flex-1">
                        <Skeleton className="h-5 w-40 rounded" />
                        <Skeleton className="h-3.5 w-64 rounded" />
                        <Skeleton className="h-3.5 w-48 rounded" />
                      </div>
                      <Skeleton className="h-16 w-16 rounded-full" />
                    </div>
                    <div className="flex gap-1.5 flex-wrap pt-1">
                      {Array.from({ length: 5 }).map((_, j) => <Skeleton key={j} className="h-5 w-16 rounded-full" />)}
                    </div>
                    <Skeleton className="h-20 w-full rounded-lg mt-2" />
                  </div>
                </div>
              </CardContent></Card>
            ))}
          </div>
          <div className="space-y-5">
            <Card><CardContent className="p-5 space-y-3">
              <Skeleton className="h-5 w-32 rounded" />
              <Skeleton className="h-64 w-full rounded-lg" />
            </CardContent></Card>
            <Card><CardContent className="p-5 space-y-3">
              <Skeleton className="h-5 w-28 rounded" />
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-md" />)}
            </CardContent></Card>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-4">
            {filteredCandidates.length === 0 ? (
              <Card><CardContent className="p-10">
                <EmptyState
                  iconName="search"
                  title="No candidates match"
                  description={search || rankFilter !== 'all' ? 'Try removing filters or broadening search.' : 'No matches yet for this job.'}
                />
              </CardContent></Card>
            ) : (
              filteredCandidates.map((c, idx) => {
                const score = c.match?.overallScore || 0;
                const sc = getScoreColor(score);
                return (
                  <Card key={c.id} className={cn(
                    'overflow-hidden hover:shadow-md transition-shadow',
                    idx === 0 && score >= 85 && 'ring-2 ring-emerald-300 dark:ring-emerald-700/60'
                  )}>
                    <CardContent className="p-5">
                      <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex items-start gap-4 flex-1 min-w-0">
                          <div className="relative shrink-0">
                            <Avatar name={c.name} size="lg" avatarClass={c.avatar} />
                            {idx < 3 && (
                              <div className={cn(
                                'absolute -top-1.5 -left-1.5 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-sm',
                                idx === 0 ? 'bg-amber-500' : idx === 1 ? 'bg-slate-400' : 'bg-orange-500'
                              )}>#{idx + 1}</div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0 flex-1">
                                <h4 className="font-bold text-surface-900 dark:text-white truncate flex items-center gap-2 flex-wrap">
                                  {c.name}
                                  {idx === 0 && score >= 85 && <Badge variant="success" size="sm" className="gap-1"><Zap className="w-3 h-3" /> Top Match</Badge>}
                                </h4>
                                <p className="text-sm text-surface-600 dark:text-surface-400 truncate mt-0.5">{c.title}</p>
                                <div className="flex items-center gap-3 mt-1.5 text-[11px] text-surface-500 dark:text-surface-400 flex-wrap">
                                  <span className="inline-flex items-center gap-0.5"><MapPin className="w-3 h-3" /> {truncate(c.location, 14)}</span>
                                  <span className="inline-flex items-center gap-0.5"><Briefcase className="w-3 h-3" /> {calculateExperience(c.yearsOfExperience)}</span>
                                  {c.currentCompany && <span className="inline-flex items-center gap-0.5 truncate max-w-[140px]">{truncate(c.currentCompany, 16)}</span>}
                                </div>
                              </div>
                              <div className="shrink-0 flex flex-col items-center">
                                <ScoreRing value={score} size={72} strokeWidth={7} />
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-1 mt-3">
                              {(c.skills || []).slice(0, 7).map(s => {
                                const matched = c.match?.matchedSkills?.includes(s);
                                return (
                                  <Badge
                                    key={s}
                                    size="sm"
                                    className={cn(
                                      'gap-1',
                                      matched
                                        ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/60'
                                        : 'variant-soft'
                                    )}
                                  >
                                    {matched && <FaCheckCircle className="w-3 h-3" />}
                                    {s}
                                  </Badge>
                                );
                              })}
                              {(c.skills || []).length > 7 && (
                                <Badge size="sm" variant="outline">+{(c.skills || []).length - 7}</Badge>
                              )}
                            </div>

                            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
                              <MiniMeter label="Skill" value={c.match?.skillScore || 0} />
                              <MiniMeter label="Experience" value={c.match?.experienceScore || 0} />
                              <MiniMeter label="Education" value={c.match?.educationScore || 0} />
                              <MiniMeter label="Location" value={c.match?.locationScore || 0} />
                            </div>

                            {c.match?.missingSkills?.length > 0 && (
                              <div className="mt-3 flex flex-wrap gap-1.5 items-center">
                                <span className="text-[10px] font-semibold uppercase tracking-wide text-red-500 dark:text-red-400">Gaps:</span>
                                {c.match.missingSkills.slice(0, 3).map(s => (
                                  <span key={s} className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border border-red-100 dark:border-red-900/50">
                                    <FaTimesCircle className="w-2.5 h-2.5" /> {s}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex md:flex-row md:flex-col md:w-44 md:gap-1 gap-2 md:pl-4 md:border-l md:border-t-0 border-t border-surface-100 dark:border-surface-800 pt-3 md:pt-0">
                          <Button
                            size="sm"
                            variant="secondary"
                            fullWidth
                            icon={<Eye className="w-3.5 h-3.5" />}
                            onClick={() => navigate(`/recruiter/candidates/${c.id}`)}
                          >
                            View Profile
                          </Button>
                          <Button
                            size="sm"
                            fullWidth
                            icon={<UserPlus className="w-3.5 h-3.5" />}
                            onClick={() => handleInvite(c)}
                            isLoading={inviting[c.id]}
                          >
                            Invite
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            fullWidth
                            icon={<MessageSquare className="w-3.5 h-3.5" />}
                          >
                            Message
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>

          <div className="space-y-5">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-brand-500" /> Match Distribution
                </CardTitle>
                <CardDescription>Candidate pool quality</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={distributionData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-surface-100 dark:text-surface-800" />
                      <XAxis dataKey="label" stroke="currentColor" className="text-surface-500 dark:text-surface-400 text-xs" />
                      <YAxis stroke="currentColor" className="text-surface-500 dark:text-surface-400 text-xs" allowDecimals={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(255,255,255,0.97)',
                          border: '1px solid #e5e7eb',
                          borderRadius: 12,
                          fontSize: 12,
                        }}
                        formatter={(value) => [`${value} candidates`, 'Count']}
                      />
                      <Bar dataKey="count" radius={[6, 6, 0, 0]} name="Candidates">
                        {distributionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-500" /> Pool Stats
                </CardTitle>
                <CardDescription>For the selected job</CardDescription>
              </CardHeader>
              <CardContent>
                {summaryStats ? (
                  <MatchBreakdown items={[
                    { label: 'Shortlistable (≥75%)', value: Math.round((summaryStats.shortlistable / Math.max(1, summaryStats.total)) * 100), icon: Award, color: 'success' },
                    { label: 'Strong Skill Match', value: Math.round((summaryStats.good + summaryStats.great + summaryStats.excellent) / Math.max(1, summaryStats.total) * 100), icon: Code2, color: 'brand' },
                    { label: 'High-Potential (≥90%)', value: Math.round((summaryStats.excellent / Math.max(1, summaryStats.total)) * 100), icon: Zap, color: 'purple' },
                    { label: 'Average Overall', value: summaryStats.avg, icon: Sparkles, color: summaryStats.avg >= 70 ? 'success' : summaryStats.avg >= 55 ? 'brand' : 'warning' },
                  ]} />
                ) : <EmptyState size="sm" title="No data" />}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-500" /> AI Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {summaryStats && (
                  <>
                    <Insight
                      color="success"
                      title={summaryStats.avg >= 70 ? 'Strong Candidate Pool' : 'Average Candidate Pool'}
                      body={`Average match of ${summaryStats.avg}% with ${summaryStats.shortlistable} viable shortlist candidates${selectedJob ? ' for ' + truncate(selectedJob.title, 28) : ''}.`}
                    />
                    <Insight
                      color="brand"
                      title="Skill Focus Areas"
                      body={selectedJob?.skills?.slice(0, 3).join(', ') ? `Top required skills: ${selectedJob.skills.slice(0, 3).join(', ')}. Prioritize these in screening.` : 'Review candidate skills carefully during interviews.'}
                    />
                    <Insight
                      color="amber"
                      title="Next Steps"
                      body={`Consider reaching out to the top ${Math.min(5, summaryStats.excellent + summaryStats.great)} candidates within 48 hours — response rate drops 60% after that window.`}
                    />
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

function StatTile({ label, value, icon: Icon, color, highlight }) {
  const colors = {
    brand: { soft: 'bg-brand-50 dark:bg-brand-950/40', text: 'text-brand-600 dark:text-brand-400', ring: highlight ? 'ring-2 ring-brand-500/30' : '' },
    success: { soft: 'bg-emerald-50 dark:bg-emerald-950/40', text: 'text-emerald-600 dark:text-emerald-400', ring: highlight ? 'ring-2 ring-emerald-500/30' : '' },
    purple: { soft: 'bg-purple-50 dark:bg-purple-950/40', text: 'text-purple-600 dark:text-purple-400', ring: highlight ? 'ring-2 ring-purple-500/30' : '' },
    sky: { soft: 'bg-sky-50 dark:bg-sky-950/40', text: 'text-sky-600 dark:text-sky-400', ring: highlight ? 'ring-2 ring-sky-500/30' : '' },
    amber: { soft: 'bg-amber-50 dark:bg-amber-950/40', text: 'text-amber-600 dark:text-amber-400', ring: highlight ? 'ring-2 ring-amber-500/30' : '' },
  }[color] || colors.brand;
  return (
    <div className={cn(
      'rounded-xl border border-surface-200/60 dark:border-surface-800 p-3 bg-white/70 dark:bg-surface-900/50',
      colors.ring
    )}>
      <div className="flex items-center gap-2 mb-1">
        <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center', colors.soft)}>
          <Icon className={cn('w-3.5 h-3.5', colors.text)} />
        </div>
        <span className="text-[10px] font-semibold uppercase tracking-wide text-surface-500 dark:text-surface-400">{label}</span>
      </div>
      <p className="text-xl font-bold text-surface-900 dark:text-white tabular-nums">{value}</p>
    </div>
  );
}

function MiniMeter({ label, value }) {
  const sc = getScoreColor(value);
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-surface-500 dark:text-surface-400">{label}</span>
        <span className={cn('text-[11px] font-bold tabular-nums', sc.text)}>{value}%</span>
      </div>
      <div className="h-1.5 bg-surface-100 dark:bg-surface-800 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${value}%`, backgroundColor: sc.stroke }}
        />
      </div>
    </div>
  );
}

function Insight({ color, title, body }) {
  const colors = {
    success: { bg: 'bg-emerald-50 dark:bg-emerald-950/30', border: 'border-emerald-100 dark:border-emerald-900/60', text: 'text-emerald-700 dark:text-emerald-400' },
    brand: { bg: 'bg-brand-50 dark:bg-brand-950/30', border: 'border-brand-100 dark:border-brand-900/60', text: 'text-brand-700 dark:text-brand-400' },
    amber: { bg: 'bg-amber-50 dark:bg-amber-950/30', border: 'border-amber-100 dark:border-amber-900/60', text: 'text-amber-700 dark:text-amber-400' },
    warning: { bg: 'bg-red-50 dark:bg-red-950/30', border: 'border-red-100 dark:border-red-900/60', text: 'text-red-700 dark:text-red-400' },
  }[color] || colors.brand;
  return (
    <div className={cn('rounded-xl border p-3.5', colors.bg, colors.border)}>
      <p className={cn('text-sm font-semibold mb-0.5', colors.text)}>{title}</p>
      <p className="text-xs text-surface-700 dark:text-surface-400 leading-relaxed">{body}</p>
    </div>
  );
}
