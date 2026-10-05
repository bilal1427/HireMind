import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Avatar, AvatarGroup } from '@/components/ui/Avatar';
import { Skeleton, SkeletonText, SkeletonList, SkeletonTable } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import AIInsightCard from '@/components/ai/AIInsightCard';
import { getApplications } from '@/services/applicationService';
import { getJobs } from '@/services/jobService';
import { getInterviews } from '@/services/interviewService';
import { getCandidates } from '@/services/candidateService';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar, PieChart, Pie, Cell
} from 'recharts';
import {
  Briefcase, Users, UserCheck, Calendar, TrendingUp, TrendingDown, Minus,
  ChevronRight, Sparkles, Zap, Award, Building2, MapPin, Clock
} from 'lucide-react';
import { FaLinkedin, FaGoogle, FaGithub } from 'react-icons/fa';
import { MdWorkOutline } from 'react-icons/md';
import { AiOutlineBulb } from 'react-icons/ai';
import { cn, formatDate, getRelativeTime, getStatusBadgeClass, truncate } from '@/lib/utils';
import { getScoreColor } from '@/components/ui/ScoreRing';

const PIPELINE_STEPS = [
  { key: 'applied', label: 'Applied', icon: Users, color: 'blue' },
  { key: 'screening', label: 'Screening', icon: Clock, color: 'amber' },
  { key: 'shortlisted', label: 'Shortlisted', icon: UserCheck, color: 'purple' },
  { key: 'interview', label: 'Interview', icon: Calendar, color: 'indigo' },
  { key: 'selected', label: 'Selected', icon: Award, color: 'emerald' },
];

const colorMap = {
  blue: { bg: 'bg-blue-500', bgSoft: 'bg-blue-50 dark:bg-blue-950/40', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-800', light: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
  amber: { bg: 'bg-amber-500', bgSoft: 'bg-amber-50 dark:bg-amber-950/40', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-800', light: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
  purple: { bg: 'bg-purple-500', bgSoft: 'bg-purple-50 dark:bg-purple-950/40', text: 'text-purple-600 dark:text-purple-400', border: 'border-purple-200 dark:border-purple-800', light: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300' },
  indigo: { bg: 'bg-indigo-500', bgSoft: 'bg-indigo-50 dark:bg-indigo-950/40', text: 'text-indigo-600 dark:text-indigo-400', border: 'border-indigo-200 dark:border-indigo-800', light: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300' },
  emerald: { bg: 'bg-emerald-500', bgSoft: 'bg-emerald-50 dark:bg-emerald-950/40', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-800', light: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' },
};

const CHART_COLORS = ['#6366f1', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#0ea5e9'];

export default function Dashboard() {
  const { user } = useAuth();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({ openPositions: 0, applications: 0, shortlisted: 0, upcomingInterviews: 0 });
  const [deltas, setDeltas] = useState({ openPositions: 12, applications: 23, shortlisted: 8, upcomingInterviews: -5 });
  const [pipeline, setPipeline] = useState({ applied: 0, screening: 0, shortlisted: 0, interview: 0, selected: 0 });
  const [applicationsOverTime, setApplicationsOverTime] = useState([]);
  const [funnelData, setFunnelData] = useState([]);
  const [jobPerformance, setJobPerformance] = useState([]);
  const [candidateSources, setCandidateSources] = useState([]);
  const [recentApps, setRecentApps] = useState([]);
  const [upcomingInts, setUpcomingInts] = useState([]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [appsRes, jobsRes, intsRes, candsRes] = await Promise.all([
        getApplications({ limit: 100 }),
        getJobs({ limit: 50 }),
        getInterviews({ limit: 50 }),
        getCandidates({ limit: 200 }),
      ]);

      const activeJobs = jobsRes.data.filter(j => j.isActive);
      const apps = appsRes.data;
      const byStatus = appsRes.aggregations?.byStatus || [];
      const pipelineCounts = { applied: 0, screening: 0, shortlisted: 0, interview: 0, selected: 0 };
      byStatus.forEach(s => { if (pipelineCounts[s.status] !== undefined) pipelineCounts[s.status] = s.count; });

      const shortlistedCount = pipelineCounts.shortlisted + pipelineCounts.interview + pipelineCounts.selected;
      const upcoming = intsRes.data.filter(i => i.status === 'scheduled' && new Date(i.startTime) > new Date());

      setStats({
        openPositions: activeJobs.length,
        applications: appsRes.total,
        shortlisted: shortlistedCount,
        upcomingInterviews: upcoming.length,
      });
      setPipeline(pipelineCounts);

      const weeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6'];
      setApplicationsOverTime(weeks.map((w, i) => ({
        name: w,
        Applications: Math.round(15 + Math.random() * 35 + i * 3),
        Shortlisted: Math.round(3 + Math.random() * 10 + i * 1.5),
      })));

      const funnel = [
        { name: 'Viewed', value: Math.round(appsRes.total * 4.5) },
        { name: 'Applied', value: appsRes.total },
        { name: 'Screening', value: pipelineCounts.screening },
        { name: 'Shortlisted', value: pipelineCounts.shortlisted },
        { name: 'Interview', value: pipelineCounts.interview },
        { name: 'Selected', value: pipelineCounts.selected },
      ];
      setFunnelData(funnel);

      const topJobs = [...activeJobs]
        .sort((a, b) => b.applicants - a.applicants)
        .slice(0, 5)
        .map(j => ({
          name: truncate(j.title, 22),
          Applicants: j.applicants,
          Shortlisted: Math.round(j.applicants * 0.15),
        }));
      setJobPerformance(topJobs);

      setCandidateSources([
        { name: 'LinkedIn', value: Math.round(appsRes.total * 0.38), icon: FaLinkedin },
        { name: 'Referral', value: Math.round(appsRes.total * 0.22), icon: Users },
        { name: 'Company Site', value: Math.round(appsRes.total * 0.18), icon: Building2 },
        { name: 'Google', value: Math.round(appsRes.total * 0.12), icon: FaGoogle },
        { name: 'GitHub', value: Math.round(appsRes.total * 0.10), icon: FaGithub },
      ]);

      const recent = apps.slice(0, 6).map(a => ({
        id: a.id,
        name: a.candidateName,
        avatar: a.candidateAvatar,
        title: a.candidateTitle,
        job: a.jobTitle,
        score: a.overallScore || Math.round(55 + Math.random() * 40),
        appliedAt: a.appliedAt,
        status: a.status,
      }));
      setRecentApps(recent);

      const upcomingSorted = upcoming
        .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
        .slice(0, 6);
      setUpcomingInts(upcomingSorted);

    } catch (e) {
      setError(e);
      toast.error({ title: 'Failed to load dashboard', message: e.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const pipelineTotal = useMemo(() => Object.values(pipeline).reduce((a, b) => a + b, 0), [pipeline]);

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-white tracking-tight">Dashboard</h1>
          <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">Overview of your hiring activity</p>
        </div>
        <ErrorState onRetry={loadData} message={error.message} />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-white tracking-tight">
            Welcome back, {user?.name?.split(' ')[0] || 'there'} 👋
          </h1>
          <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
            Here's what's happening with your hiring pipeline today
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="soft" size="lg" className="gap-2">
            <Building2 className="w-3.5 h-3.5" />
            {user?.company || 'HireMind AI'}
          </Badge>
          <Button variant="primary" icon={<MdWorkOutline className="w-4 h-4" />}
            onClick={() => window.location.hash = '#/recruiter/jobs/create'}>
            Post New Job
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}><CardContent className="p-6 space-y-3">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <SkeletonText lines={2} />
            </CardContent></Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            icon={Briefcase} color="brand" label="Open Positions"
            value={stats.openPositions} delta={deltas.openPositions}
          />
          <KpiCard
            icon={Users} color="sky" label="Applications"
            value={stats.applications} delta={deltas.applications}
          />
          <KpiCard
            icon={UserCheck} color="emerald" label="Shortlisted"
            value={stats.shortlisted} delta={deltas.shortlisted}
          />
          <KpiCard
            icon={Calendar} color="amber" label="Upcoming Interviews"
            value={stats.upcomingInterviews} delta={deltas.upcomingInterviews}
          />
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Hiring Pipeline</CardTitle>
              <CardDescription>Track candidates through each stage</CardDescription>
            </div>
            <Badge variant="outline">{pipelineTotal} total</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-28 w-full rounded-xl" />
          ) : pipelineTotal === 0 ? (
            <EmptyState size="sm" title="No pipeline activity" description="Candidates will appear here once they apply." />
          ) : (
            <div className="relative">
              <div className="grid grid-cols-5 gap-2 sm:gap-4">
                {PIPELINE_STEPS.map((step, idx) => {
                  const count = pipeline[step.key] || 0;
                  const pct = pipelineTotal > 0 ? (count / pipelineTotal) * 100 : 0;
                  const colors = colorMap[step.color];
                  const StepIcon = step.icon;
                  return (
                    <div key={step.key} className="relative flex flex-col items-center text-center">
                      {idx < PIPELINE_STEPS.length - 1 && (
                        <div className="hidden sm:block absolute top-6 left-[calc(50%+18px)] w-[calc(100%-36px)] h-1 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden">
                          <div
                            className={cn('h-full rounded-full transition-all duration-700', colors.bg)}
                            style={{ width: `${Math.min(100, pct * 1.5)}%` }}
                          />
                        </div>
                      )}
                      <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center z-10', colors.bgSoft)}>
                        <StepIcon className={cn('w-5 h-5', colors.text)} />
                      </div>
                      <div className="mt-3 w-full">
                        <div className="flex items-center justify-center gap-1.5">
                          <span className={cn('text-2xl font-bold tabular-nums', colors.text)}>{count}</span>
                          <span className="text-[10px] font-medium text-surface-400">
                            {Math.round(pct)}%
                          </span>
                        </div>
                        <div className="mt-0.5 text-xs font-medium text-surface-600 dark:text-surface-400">
                          {step.label}
                        </div>
                        <div className="mt-2 h-1.5 bg-surface-100 dark:bg-surface-800 rounded-full overflow-hidden w-full max-w-[120px] mx-auto">
                          <div
                            className={cn('h-full rounded-full transition-all duration-1000 ease-out', colors.bg)}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <Card className="lg:col-span-8">
          <CardHeader>
            <CardTitle>Applications Over Time</CardTitle>
            <CardDescription>Weekly application and shortlist trends</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-64 w-full rounded-lg" />
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={applicationsOverTime} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-surface-200 dark:text-surface-700" />
                    <XAxis dataKey="name" stroke="currentColor" className="text-surface-500 dark:text-surface-400 text-xs" />
                    <YAxis stroke="currentColor" className="text-surface-500 dark:text-surface-400 text-xs" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(255,255,255,0.95)',
                        border: '1px solid #e5e7eb',
                        borderRadius: 12,
                        fontSize: 12,
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Line type="monotone" dataKey="Applications" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    <Line type="monotone" dataKey="Shortlisted" stroke="#10b981" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Candidate Sources</CardTitle>
            <CardDescription>Where applicants come from</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-64 w-full rounded-lg" />
            ) : (
              <div className="space-y-4">
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={candidateSources}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={75}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {candidateSources.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12, border: '1px solid #e5e7eb' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2">
                  {candidateSources.map((s, i) => {
                    const total = candidateSources.reduce((a, b) => a + b.value, 0);
                    const pct = Math.round((s.value / total) * 100);
                    const Icon = s.icon;
                    return (
                      <div key={s.name} className="flex items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: CHART_COLORS[i] }} />
                          <Icon className="w-3 h-3 text-surface-500 shrink-0" />
                          <span className="text-surface-700 dark:text-surface-300 truncate">{s.name}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-surface-500">{pct}%</span>
                          <span className="font-semibold tabular-nums text-surface-700 dark:text-surface-300">{s.value}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-5">
          <CardHeader>
            <CardTitle>Hiring Funnel</CardTitle>
            <CardDescription>Conversion through each stage</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-64 w-full rounded-lg" />
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={funnelData} layout="vertical" margin={{ top: 5, right: 20, left: 80, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-surface-200 dark:text-surface-700" />
                    <XAxis type="number" stroke="currentColor" className="text-surface-500 dark:text-surface-400 text-xs" />
                    <YAxis type="category" dataKey="name" stroke="currentColor" className="text-surface-500 dark:text-surface-400 text-xs" width={75} />
                    <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12, border: '1px solid #e5e7eb' }} />
                    <Bar dataKey="value" radius={[0, 6, 6, 0]} fill="#6366f1">
                      {funnelData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-7">
          <CardHeader>
            <CardTitle>Top Job Performance</CardTitle>
            <CardDescription>Positions with most applicants</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-64 w-full rounded-lg" />
            ) : jobPerformance.length === 0 ? (
              <EmptyState size="sm" title="No jobs yet" description="Post a job to see performance metrics." />
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={jobPerformance} layout="vertical" margin={{ top: 5, right: 20, left: 120, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-surface-200 dark:text-surface-700" />
                    <XAxis type="number" stroke="currentColor" className="text-surface-500 dark:text-surface-400 text-xs" />
                    <YAxis type="category" dataKey="name" stroke="currentColor" className="text-surface-500 dark:text-surface-400 text-xs" width={110} />
                    <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12, border: '1px solid #e5e7eb' }} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="Applicants" radius={[0, 6, 6, 0]} fill="#6366f1" stackId="a" />
                    <Bar dataKey="Shortlisted" radius={[0, 6, 6, 0]} fill="#10b981" stackId="a" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <AIInsightCard
          icon={Zap}
          label="Top Skill in Demand"
          value="React + TypeScript"
          trend="+28%"
          trendDirection="up"
          color="brand"
        />
        <AIInsightCard
          icon={FaLinkedin}
          label="Best Candidate Source"
          value="LinkedIn"
          trend="+34% conv."
          trendDirection="up"
          color="emerald"
        />
        <AIInsightCard
          icon={AiOutlineBulb}
          label="Avg Time to Hire"
          value="18 days"
          trend="-3d"
          trendDirection="down"
          color="amber"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Upcoming Interviews</CardTitle>
                <CardDescription>Scheduled for the next days</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => window.location.hash = '#/recruiter/interviews'}>
                View all <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <SkeletonList count={4} />
            ) : upcomingInts.length === 0 ? (
              <EmptyState size="sm" iconName="search" title="No upcoming interviews" description="Schedule interviews from candidate profiles." />
            ) : (
              <div className="space-y-3">
                {upcomingInts.map(int => {
                  const d = new Date(int.startTime);
                  const typeLabels = { phone: 'Phone', video: 'Video', technical: 'Technical', hr: 'HR', onsite: 'On-site', final: 'Final' };
                  return (
                    <div key={int.id} className="flex items-center gap-3 p-3 rounded-xl border border-surface-200 dark:border-surface-800 hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors">
                      <div className="w-14 shrink-0 text-center rounded-xl bg-brand-50 dark:bg-brand-950/40 p-2">
                        <div className="text-xs font-semibold text-brand-600 dark:text-brand-400 uppercase">
                          {d.toLocaleString('en-US', { month: 'short' })}
                        </div>
                        <div className="text-xl font-bold text-brand-700 dark:text-brand-300 leading-none mt-0.5">
                          {d.getDate()}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-surface-900 dark:text-white truncate">
                            {int.candidateName}
                          </p>
                          <Badge variant="outline" size="sm">
                            {typeLabels[int.type] || int.type}
                          </Badge>
                        </div>
                        <p className="text-xs text-surface-500 dark:text-surface-400 truncate mt-0.5">
                          {int.jobTitle}
                        </p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-surface-500 dark:text-surface-400">
                          <Clock className="w-3 h-3" />
                          {d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} • {int.duration || 60} min
                        </div>
                      </div>
                      <Button size="sm" variant="secondary">Join</Button>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Applications</CardTitle>
                <CardDescription>Latest submissions</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => window.location.hash = '#/recruiter/candidates'}>
                All candidates <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <SkeletonList count={4} />
            ) : recentApps.length === 0 ? (
              <EmptyState size="sm" iconName="documents" title="No applications yet" description="Candidates will appear here when they apply." />
            ) : (
              <div className="space-y-3">
                {recentApps.map(app => {
                  const sc = getScoreColor(app.score);
                  return (
                    <div key={app.id} className="flex items-center gap-3 p-3 rounded-xl border border-surface-200 dark:border-surface-800 hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors">
                      <Avatar name={app.name} size="md" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-surface-900 dark:text-white truncate">{app.name}</p>
                          <span className={cn('text-[10px] font-bold tabular-nums px-1.5 py-0.5 rounded-md', sc.text, sc.bg.replace('20', '10'))}>
                            {app.score}%
                          </span>
                        </div>
                        <p className="text-xs text-surface-500 dark:text-surface-400 truncate">{app.title}</p>
                        <div className="flex items-center gap-2 mt-1 text-[11px] text-surface-500 dark:text-surface-400">
                          <Briefcase className="w-3 h-3" />
                          <span className="truncate">{app.job}</span>
                          <span className="opacity-50">•</span>
                          <span>{getRelativeTime(app.appliedAt)}</span>
                        </div>
                      </div>
                      <Badge className={cn('capitalize text-[10px]', getStatusBadgeClass(app.status))}>
                        {app.status}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function KpiCard({ icon: Icon, color, label, value, delta }) {
  const colorClasses = {
    brand: { bgSoft: 'bg-brand-50 dark:bg-brand-950/40', text: 'text-brand-600 dark:text-brand-400', ring: 'ring-brand-500/20' },
    sky: { bgSoft: 'bg-sky-50 dark:bg-sky-950/40', text: 'text-sky-600 dark:text-sky-400', ring: 'ring-sky-500/20' },
    emerald: { bgSoft: 'bg-emerald-50 dark:bg-emerald-950/40', text: 'text-emerald-600 dark:text-emerald-400', ring: 'ring-emerald-500/20' },
    amber: { bgSoft: 'bg-amber-50 dark:bg-amber-950/40', text: 'text-amber-600 dark:text-amber-400', ring: 'ring-amber-500/20' },
    rose: { bgSoft: 'bg-rose-50 dark:bg-rose-950/40', text: 'text-rose-600 dark:text-rose-400', ring: 'ring-rose-500/20' },
  };
  const c = colorClasses[color] || colorClasses.brand;
  const trendDir = delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat';
  const TrendIcon = trendDir === 'up' ? TrendingUp : trendDir === 'down' ? TrendingDown : Minus;
  const trendClass = trendDir === 'up'
    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
    : trendDir === 'down'
    ? 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400'
    : 'bg-surface-100 text-surface-600 dark:bg-surface-800 dark:text-surface-400';

  return (
    <Card className="overflow-hidden relative">
      <div className={cn('absolute top-0 right-0 w-32 h-32 -mr-16 -mt-16 rounded-full opacity-40 blur-2xl', c.bgSoft)} />
      <CardContent className="p-6 relative">
        <div className="flex items-start justify-between">
          <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center ring-4', c.bgSoft, c.text, c.ring)}>
            <Icon className="w-5 h-5" />
          </div>
          <span className={cn('inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-md', trendClass)}>
            <TrendIcon className="w-3 h-3" />
            {Math.abs(delta)}%
          </span>
        </div>
        <div className="mt-5">
          <div className="text-3xl font-bold text-surface-900 dark:text-white tracking-tight tabular-nums">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </div>
          <div className="mt-1 text-sm font-medium text-surface-500 dark:text-surface-400">{label}</div>
        </div>
      </CardContent>
    </Card>
  );
}
