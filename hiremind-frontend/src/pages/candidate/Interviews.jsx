import { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiCalendar, FiVideo, FiMapPin, FiPhone, FiUsers, FiBriefcase,
  FiExternalLink, FiClock, FiStar, FiChevronLeft, FiChevronRight,
  FiMessageSquare, FiAlertCircle, FiAward, FiTarget,
} from 'react-icons/fi';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Tabs, TabList, Tab } from '@/components/ui/Tabs';
import { Avatar } from '@/components/ui/Avatar';
import { Skeleton, SkeletonCard, SkeletonList } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { getInterviews } from '@/services/interviewService';
import { MOCK_INTERVIEWS, MOCK_CANDIDATES } from '@/data/mockData';
import { formatDate, capitalize, cn } from '@/lib/utils';
import {
  Calendar,
  Plus,
  Clock,
  Video,
  Phone,
  MapPin,
  Users,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  VideoIcon,
  RefreshCw,
  XCircle,
  CalendarCheck,
  CalendarRange,
  CalendarDays,
  Building2,
  UserCheck,
  ExternalLink,
  Star
} from 'lucide-react';

const INTERVIEW_TABS = [
  { value: 'all', label: 'All' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

function InterviewSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} lines={4} imageHeight="h-0" showImage={false} />)}
    </div>
  );
}

const INTERVIEW_TYPE_CONFIG = {
  phone: { label: 'Phone Screen', icon: FiPhone, color: 'info' },
  video: { label: 'Video Call', icon: FiVideo, color: 'brand' },
  technical: { label: 'Technical Round', icon: FiBriefcase, color: 'purple' },
  hr: { label: 'HR Round', icon: FiUsers, color: 'success' },
  final: { label: 'Final Interview', icon: FiAward, color: 'warning' },
  onsite: { label: 'On-Site Visit', icon: FiMapPin, color: 'danger' },
};

function InterviewCard({ interview, onView, onJoin }) {
  const navigate = useNavigate();
  const config = INTERVIEW_TYPE_CONFIG[interview.type] || INTERVIEW_TYPE_CONFIG.video;
  const typeIcon = config.icon;
  const statusLabels = {
    scheduled: 'Scheduled',
    completed: 'Completed',
    cancelled: 'Cancelled',
    no_show: 'No Show',
  };
  const statusColors = {
    scheduled: 'info',
    completed: 'success',
    cancelled: 'danger',
    no_show: 'warning',
  };

  const startTime = new Date(interview.startTime);
  const endTime = new Date(interview.endTime);
  const isPast = endTime < new Date();
  const isSoon = !isPast && (startTime.getTime() - Date.now()) < 24 * 60 * 60 * 1000;

  return (
    <Card className={cn(
      'overflow-hidden border transition-all hover:shadow-md',
      isSoon && interview.status === 'scheduled' && 'ring-2 ring-brand-500/30 border-brand-300 dark:border-brand-700'
    )}>
      <div className={cn('h-1.5',
        config.color === 'info' ? 'bg-sky-500' :
        config.color === 'brand' ? 'bg-brand-500' :
        config.color === 'purple' ? 'bg-violet-500' :
        config.color === 'success' ? 'bg-emerald-500' :
        config.color === 'warning' ? 'bg-amber-500' :
        'bg-red-500'
      )} />
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <Avatar name={interview.companyName} size="md" className="shrink-0 rounded-xl" />
            <div className="min-w-0 flex-1">
              <h3
                className="font-semibold text-surface-900 dark:text-surface-50 truncate cursor-pointer hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
                onClick={() => navigate(`/candidate/jobs/${interview.jobId}`)}
              >
                {interview.jobTitle}
              </h3>
              <p className="text-sm text-surface-500 dark:text-surface-400 truncate">{interview.companyName}</p>
            </div>
          </div>
          <Badge variant={statusColors[interview.status] || 'default'} size="sm">
            {statusLabels[interview.status] || capitalize(interview.status)}
          </Badge>
        </div>

        <div className="space-y-2.5 mb-4">
          <div className="flex items-center gap-2.5 text-sm">
            <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center shrink-0',
              config.color === 'info' ? 'bg-sky-100 dark:bg-sky-900/40 text-sky-600 dark:text-sky-400' :
              config.color === 'brand' ? 'bg-brand-100 dark:bg-brand-900/40 text-brand-600 dark:text-brand-400' :
              config.color === 'purple' ? 'bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400' :
              config.color === 'success' ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400' :
              config.color === 'warning' ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400' :
              'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400'
            )}>
              <typeIcon className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-surface-800 dark:text-surface-200 text-sm">{config.label}</p>
              <p className="text-xs text-surface-400">Round {interview.round || 1} • {interview.duration || 60} min</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 text-sm">
            <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <FiCalendar className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-surface-800 dark:text-surface-200 text-sm">
                {formatDate(interview.startTime, 'EEEE, MMMM dd')}
              </p>
              <p className="text-xs text-surface-400 flex items-center gap-1">
                <FiClock className="w-3 h-3 inline" />
                {formatDate(interview.startTime, 'hh:mm a')} - {formatDate(interview.endTime, 'hh:mm a')}
              </p>
            </div>
            {isSoon && interview.status === 'scheduled' && (
              <Badge variant="warning" size="sm">Soon</Badge>
            )}
          </div>
          {interview.location ? (
            <div className="flex items-center gap-2.5 text-sm">
              <div className="w-7 h-7 rounded-lg bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                <FiMapPin className="w-3.5 h-3.5" />
              </div>
              <p className="text-surface-700 dark:text-surface-300 truncate">{interview.location}</p>
            </div>
          ) : interview.meetingLink ? (
            <div className="flex items-center gap-2.5 text-sm">
              <div className="w-7 h-7 rounded-lg bg-teal-100 dark:bg-teal-900/40 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                <FiVideo className="w-3.5 h-3.5" />
              </div>
              <a
                href={interview.meetingLink}
                target="_blank"
                rel="noreferrer"
                className="text-brand-600 dark:text-brand-400 hover:underline truncate flex items-center gap-1"
              >
                Meeting Link <FiExternalLink className="w-3 h-3 shrink-0" />
              </a>
            </div>
          ) : null}
          {interview.interviewer && (
            <div className="flex items-center gap-2.5 text-sm">
              <Avatar name={interview.interviewer.name} size="xs" />
              <div className="min-w-0 flex-1">
                <p className="font-medium text-surface-800 dark:text-surface-200 text-sm truncate">{interview.interviewer.name}</p>
                <p className="text-xs text-surface-400 truncate">{interview.interviewer.role}</p>
              </div>
            </div>
          )}
        </div>

        {interview.status === 'completed' && interview.rating && (
          <div className="mb-4 p-3 rounded-xl bg-surface-50 dark:bg-surface-800/40 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-surface-500 dark:text-surface-400 font-medium uppercase tracking-wide">Rating</span>
              <span className="flex items-center gap-1 text-amber-500 text-sm font-bold">
                {interview.rating}
                <FiStar className="w-3.5 h-3.5 fill-current" />
                <span className="text-surface-400 text-xs font-normal">/ 5</span>
              </span>
            </div>
            {interview.feedback?.comments && (
              <p className="text-xs text-surface-600 dark:text-surface-400 italic line-clamp-2">
                "{interview.feedback.comments}"
              </p>
            )}
          </div>
        )}

        <div className="flex items-center gap-2 pt-3 border-t border-surface-100 dark:border-surface-800">
          {interview.status === 'scheduled' && !isPast && interview.meetingLink ? (
            <Button
              variant="primary"
              size="sm"
              fullWidth
              onClick={() => window.open(interview.meetingLink, '_blank')}
              iconRight={<FiExternalLink className="w-3.5 h-3.5" />}
            >
              Join Meeting
            </Button>
          ) : (
            <Button variant="outline" size="sm" fullWidth onClick={() => navigate(`/candidate/jobs/${interview.jobId}`)}>
              View Job
            </Button>
          )}
          {interview.status === 'scheduled' && !isPast && (
            <Button variant="outline" size="sm" onClick={() => navigate('/candidate/ai-assistant')} title="Get interview prep">
              <FiMessageSquare className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function CalendarGrid({ interviews, selectedDate, onSelectDate }) {
  const [viewMonth, setViewMonth] = useState(selectedDate ? new Date(selectedDate) : new Date());

  const firstOfMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1);
  const startDay = firstOfMonth.getDay();
  const daysInMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0).getDate();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const days = [];
  for (let i = 0; i < startDay; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(new Date(viewMonth.getFullYear(), viewMonth.getMonth(), d));

  const interviewCounts = useMemo(() => {
    const counts = {};
    interviews.forEach((iv) => {
      const key = formatDate(iv.startTime, 'yyyy-MM-dd');
      counts[key] = (counts[key] || 0) + 1;
    });
    return counts;
  }, [interviews]);

  const prevMonth = () => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1));
  const nextMonth = () => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1));

  const isSameDay = (a, b) =>
    a.getDate() === b.getDate() && a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <FiCalendar className="w-4 h-4 text-brand-500" />
            Interview Calendar
          </CardTitle>
          <div className="flex items-center gap-1">
            <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-500">
              <FiChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-semibold text-surface-800 dark:text-surface-200 px-2 min-w-[120px] text-center">
              {formatDate(firstOfMonth, 'MMMM yyyy')}
            </span>
            <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-500">
              <FiChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-7 gap-1 mb-1">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} className="text-[10px] font-semibold uppercase tracking-wide text-center py-2 text-surface-400">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days.map((date, i) => {
            if (!date) return <div key={'e-' + i} className="aspect-square" />;
            const key = formatDate(date, 'yyyy-MM-dd');
            const count = interviewCounts[key] || 0;
            const isToday = isSameDay(date, today);
            const isSelected = selectedDate && isSameDay(date, new Date(selectedDate));
            return (
              <button
                key={i}
                onClick={() => onSelectDate?.(count > 0 ? date : null)}
                className={cn(
                  'aspect-square rounded-xl flex flex-col items-center justify-center text-xs font-medium transition-all relative',
                  isSelected ? 'bg-brand-600 text-white shadow' :
                  isToday ? 'bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 ring-2 ring-brand-300 dark:ring-brand-700' :
                  count > 0 ? 'bg-surface-100 dark:bg-surface-800 text-surface-800 dark:text-surface-200 hover:bg-surface-200 dark:hover:bg-surface-700' :
                  'text-surface-500 hover:bg-surface-50 dark:hover:bg-surface-800/50'
                )}
              >
                {date.getDate()}
                {count > 0 && (
                  <span className={cn(
                    'absolute bottom-1.5 flex gap-0.5',
                    isSelected ? 'text-white/90' : 'text-brand-500'
                  )}>
                    {Array.from({ length: Math.min(count, 3) }).map((_, j) => (
                      <span key={j} className={cn(
                        'w-1 h-1 rounded-full',
                        isSelected ? 'bg-white' : 'bg-brand-500'
                      )} />
                    ))}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

const PREP_TIPS = [
  { icon: FiTarget, title: 'Review the JD', desc: 'Reread the job description carefully; prepare 2-3 STAR stories for each requirement.' },
  { icon: FiBriefcase, title: 'Research the company', desc: 'Recent news, funding, products, culture, leadership. Know their mission by heart.' },
  { icon: FiUsers, title: 'Know your interviewer', desc: 'Check LinkedIn for mutual connections, recent posts, and their technical background.' },
  { icon: FiAlertCircle, title: 'Prepare questions', desc: 'Never say "no questions". Ask 3+ thoughtful ones: team, challenges, roadmap.' },
  { icon: FiStar, title: 'Mock & practice', desc: 'Do 2+ mocks before technical rounds. Record yourself for behavioral interviews.' },
  { icon: FiAward, title: 'Logistics check', desc: 'Test link/camera/mic 10 min early. Be in a quiet, well-lit room. Water nearby.' },
];

export default function Interviews() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { error: toastError } = useToast();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [interviews, setInterviews] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [stats, setStats] = useState<any>({});
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const fetchInterviews = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const primaryId = user?.id || 'cand_2001';
      const fallbackId = MOCK_CANDIDATES[0]?.id || primaryId;
      let res;
      try {
        res = await getInterviews({
          candidateId: primaryId,
          limit: 50,
        });
        if ((res?.data?.length || 0) === 0) {
          res = await getInterviews({
            candidateId: fallbackId,
            limit: 50,
          });
        }
      } catch (innerErr) {
        const ivs = MOCK_INTERVIEWS.filter(i => i.candidateId === fallbackId);
        const now = new Date();
        res = {
          data: ivs,
          stats: {
            upcoming: ivs.filter(i => new Date(i.startTime) > now && i.status === 'scheduled').length,
            completed: ivs.filter(i => i.status === 'completed').length,
            cancelled: ivs.filter(i => i.status === 'cancelled').length,
            avgRating: ivs.filter(i => i.rating).reduce((s, i) => s + i.rating, 0) / (ivs.filter(i => i.rating).length || 1),
          },
        };
      }
      setInterviews(res.data || []);
      setStats(res.stats || {});
    } catch (err) {
      setError(err);
      toastError({ title: 'Could not load interviews', message: err.message });
    } finally {
      setLoading(false);
    }
  }, [user?.id, toastError]);

  useEffect(() => {
    fetchInterviews();
  }, [fetchInterviews]);

  const filteredInterviews = useMemo(() => {
    let list = interviews;
    if (activeTab === 'upcoming') {
      const now = new Date();
      list = list.filter(i => new Date(i.startTime) > now && i.status === 'scheduled');
    } else if (activeTab === 'completed') {
      list = list.filter(i => i.status === 'completed');
    } else if (activeTab === 'cancelled') {
      list = list.filter(i => ['cancelled', 'no_show'].includes(i.status));
    }
    if (selectedDate) {
      const sd = new Date(selectedDate);
      sd.setHours(0, 0, 0, 0);
      const ed = new Date(selectedDate);
      ed.setHours(23, 59, 59, 999);
      list = list.filter(i => {
        const t = new Date(i.startTime);
        return t >= sd && t <= ed;
      });
    }
    return list.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  }, [interviews, activeTab, selectedDate]);

  const upcomingCount = interviews.filter(i => new Date(i.startTime) > new Date() && i.status === 'scheduled').length;

  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <ErrorState title="Couldn't load interviews" message={error.message} onRetry={fetchInterviews} fullHeight size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-surface-900 dark:text-surface-50">
            My Interviews
          </h1>
          <p className="text-surface-500 dark:text-surface-400 mt-1">
            {loading ? 'Loading schedule...' : `${upcomingCount} upcoming • ${stats.completed || 0} completed • ${stats.cancelled || 0} cancelled`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="primary" size="md" onClick={() => navigate('/candidate/ai-assistant')} iconRight={<FiChevronRight />}>
            Interview Prep with AI
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Upcoming', value: upcomingCount, color: 'brand', icon: FiCalendar, delta: 'Next 30 days' },
          { label: 'Completed', value: stats.completed || 0, color: 'success', icon: FiAward, delta: stats.avgRating ? `Avg ${stats.avgRating}/5` : '-' },
          { label: 'Scheduled', value: stats.upcoming || 0, color: 'info', icon: FiClock, delta: 'Confirmed' },
          { label: 'Cancelled', value: stats.cancelled || 0, color: 'danger', icon: FiAlertCircle, delta: 'Past 3 months' },
        ].map((stat, i) => (
          <Card key={i} className="p-5">
            <div className="flex items-start justify-between mb-3">
              <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center',
                stat.color === 'brand' ? 'bg-brand-100 dark:bg-brand-900/40 text-brand-600 dark:text-brand-400' :
                stat.color === 'success' ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400' :
                stat.color === 'info' ? 'bg-sky-100 dark:bg-sky-900/40 text-sky-600 dark:text-sky-400' :
                'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400'
              )}>
                <stat.icon className="w-5 h-5" />
              </div>
            </div>
            <p className="text-2xl font-bold text-surface-900 dark:text-surface-50">{stat.value}</p>
            <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">{stat.label}</p>
            <p className="text-[11px] text-surface-400 mt-1">{stat.delta}</p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[380px_1fr] gap-6">
        <CalendarGrid
          interviews={interviews}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
        />
        <div className="space-y-5">
          <Card>
            <CardContent className="p-2">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabList className="w-full overflow-x-auto flex-nowrap">
                  {INTERVIEW_TABS.map(tab => (
                    <Tab key={tab.value} value={tab.value}>{tab.label}</Tab>
                  ))}
                </TabList>
              </Tabs>
              {selectedDate && (
                <div className="px-4 pb-2 flex items-center justify-between text-sm">
                  <span className="text-surface-500 dark:text-surface-400">
                    Showing interviews on <span className="font-semibold text-brand-600 dark:text-brand-400">{formatDate(selectedDate, 'EEEE, MMM dd, yyyy')}</span>
                  </span>
                  <button onClick={() => setSelectedDate(null)} className="text-brand-600 dark:text-brand-400 text-xs font-medium hover:underline">
                    Clear filter
                  </button>
                </div>
              )}
            </CardContent>
          </Card>

          {loading ? (
            <InterviewSkeleton />
          ) : filteredInterviews.length === 0 ? (
            <EmptyState
              size="md"
              iconName="default"
              title={selectedDate ? 'No interviews on this day' : 'No interviews found'}
              description={
                selectedDate
                  ? 'Select another date or clear the filter.'
                  : activeTab === 'upcoming'
                    ? "You don't have any upcoming interviews. Apply to jobs to get scheduled!"
                    : activeTab === 'completed'
                      ? 'No completed interviews yet.'
                      : activeTab === 'cancelled'
                        ? 'Good news — no cancelled interviews!'
                        : "You haven't scheduled any interviews yet."
              }
              actionText={activeTab === 'upcoming' && !selectedDate ? 'Browse Jobs' : undefined}
              onAction={activeTab === 'upcoming' && !selectedDate ? () => navigate('/candidate/jobs') : undefined}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredInterviews.map(iv => (
                <InterviewCard key={iv.id} interview={iv} />
              ))}
            </div>
          )}
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FiAward className="w-4 h-4 text-amber-500" />
            Interview Prep Tips
          </CardTitle>
          <CardDescription>Proven framework from 500+ successful candidates</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {PREP_TIPS.map((tip, i) => (
              <div key={i} className="p-4 rounded-xl border border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-800/40 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-brand-500 to-violet-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                    <tip.icon className="w-4.5 h-4.5" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-semibold text-sm text-surface-900 dark:text-surface-50">{tip.title}</h4>
                    <p className="text-xs text-surface-500 dark:text-surface-400 mt-1 leading-relaxed">{tip.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
