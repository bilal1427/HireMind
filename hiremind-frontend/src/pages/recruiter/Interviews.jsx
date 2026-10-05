import { Fragment, useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/contexts/ToastContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Tabs, TabList, Tab, TabPanels, TabPanel } from '@/components/ui/Tabs';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Skeleton, SkeletonText, SkeletonList } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal, ModalHeader, ModalTitle, ModalBody, ModalFooter } from '@/components/ui/Modal';
import { ConfirmDialog, useConfirm } from '@/components/ui/ConfirmDialog';
import {
  Calendar, Plus, Clock, Video, Phone, MapPin, Users, ChevronLeft, ChevronRight,
  MoreVertical, VideoIcon, RefreshCw, XCircle, CalendarCheck, CalendarRange,
  CalendarDays, Building2, UserCheck, ExternalLink, Star
} from 'lucide-react';
import { FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import { cn, formatDate, formatDateTime, getRelativeTime, truncate } from '@/lib/utils';
import { getInterviews, scheduleInterview, cancelInterview, updateInterview } from '@/services/interviewService';
import { getJobs } from '@/services/jobService';
import { getCandidates } from '@/services/candidateService';
import { INTERVIEW_TYPES, INTERVIEW_STATUS } from '@/lib/constants';

const INTERVIEW_STATUS_CLASSES = {
  scheduled: {
    badge: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900/60',
    dot: 'bg-indigo-500',
  },
  completed: {
    badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/60',
    dot: 'bg-emerald-500',
  },
  cancelled: {
    badge: 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400 border border-red-200 dark:border-red-900/60',
    dot: 'bg-red-500',
  },
  no_show: {
    badge: 'bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400 border border-orange-200 dark:border-orange-900/60',
    dot: 'bg-orange-500',
  },
};

const typeIconMap = {
  phone: Phone,
  video: Video,
  onsite: MapPin,
  technical: VideoIcon,
  hr: Users,
  final: CalendarCheck,
};

export default function Interviews() {
  const navigate = useNavigate();
  const toast = useToast();
  const confirm = useConfirm();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState({ data: [], total: 0, stats: {} });
  const [viewMode, setViewMode] = useState('calendar');
  const [viewRange, setViewRange] = useState('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [rescheduleInt, setRescheduleInt] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [jobs, setJobs] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [form, setForm] = useState({
    candidateId: '',
    jobId: '',
    type: 'video',
    date: '',
    time: '',
    duration: '60',
    location: '',
    meetingLink: '',
    round: '1',
    notes: '',
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [intRes, jobsRes, candRes] = await Promise.all([
        getInterviews({ limit: 100, status: statusFilter === 'all' ? undefined : statusFilter, type: typeFilter === 'all' ? undefined : typeFilter }),
        getJobs({ limit: 30 }),
        getCandidates({ limit: 50 }),
      ]);
      setData(intRes);
      setJobs(jobsRes.data.filter(j => j.isActive));
      setCandidates(candRes.data);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, typeFilter]);

  useEffect(() => { load(); }, [load]);

  const today = new Date();
  const isSameDay = (d1, d2) =>
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();

  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const startDay = firstDay.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];
    for (let i = 0; i < startDay; i++) days.push({ date: null, key: `pad-${i}` });
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      const ints = data.data.filter(i => isSameDay(new Date(i.startTime), date));
      days.push({ date, key: `day-${d}`, interviews: ints });
    }
    while (days.length % 7 !== 0) days.push({ date: null, key: `pad-end-${days.length}` });
    return days;
  }, [currentDate, data.data]);

  const weekDays = useMemo(() => {
    const weekStart = new Date(currentDate);
    const dayOfWeek = weekStart.getDay();
    weekStart.setDate(weekStart.getDate() - dayOfWeek);
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(date.getDate() + i);
      const ints = data.data.filter(it => isSameDay(new Date(it.startTime), date));
      days.push({ date, interviews: ints });
    }
    return days;
  }, [currentDate, data.data]);

  const dayHours = useMemo(() => Array.from({ length: 12 }, (_, i) => 8 + i), []);

  const goPrev = () => {
    const d = new Date(currentDate);
    if (viewRange === 'month') d.setMonth(d.getMonth() - 1);
    else d.setDate(d.getDate() - (viewRange === 'week' ? 7 : 1));
    setCurrentDate(d);
  };
  const goNext = () => {
    const d = new Date(currentDate);
    if (viewRange === 'month') d.setMonth(d.getMonth() + 1);
    else d.setDate(d.getDate() + (viewRange === 'week' ? 7 : 1));
    setCurrentDate(d);
  };
  const goToday = () => setCurrentDate(new Date());

  const openSchedule = () => {
    setRescheduleInt(null);
    setForm({ candidateId: '', jobId: '', type: 'video', date: '', time: '', duration: '60', location: '', meetingLink: '', round: '1', notes: '' });
    setScheduleOpen(true);
  };

  const openReschedule = (int) => {
    setRescheduleInt(int);
    const d = new Date(int.startTime);
    setForm({
      candidateId: int.candidateId,
      jobId: int.jobId,
      type: int.type,
      date: d.toISOString().split('T')[0],
      time: d.toTimeString().slice(0, 5),
      duration: String(int.duration || 60),
      location: int.location || '',
      meetingLink: int.meetingLink || '',
      round: String(int.round || 1),
      notes: int.notes || '',
    });
    setScheduleOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.candidateId || !form.jobId || !form.date || !form.time) {
      toast.warning('Please fill candidate, job, date, and time');
      return;
    }
    try {
      const cand = candidates.find(c => c.id === form.candidateId);
      const job = jobs.find(j => j.id === form.jobId);
      const payload = {
        candidateId: form.candidateId,
        candidateName: cand?.name,
        candidateAvatar: cand?.avatar,
        candidateTitle: cand?.title,
        jobId: form.jobId,
        jobTitle: job?.title,
        companyName: job?.companyName,
        type: form.type,
        startTime: new Date(`${form.date}T${form.time}`).toISOString(),
        duration: parseInt(form.duration),
        location: form.type === 'onsite' ? form.location : undefined,
        meetingLink: form.type !== 'onsite' ? form.meetingLink || undefined : undefined,
        round: parseInt(form.round),
        notes: form.notes,
      };
      if (rescheduleInt) {
        await updateInterview(rescheduleInt.id, payload);
        toast.success('Interview rescheduled');
      } else {
        await scheduleInterview(payload);
        toast.success('Interview scheduled successfully');
      }
      setScheduleOpen(false);
      setRescheduleInt(null);
      load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const handleCancel = async (int) => {
    const ok = await confirm.confirm({
      title: `Cancel interview with ${int.candidateName}?`,
      description: `This interview was scheduled for ${formatDateTime(int.startTime)}.`,
      variant: 'destructive',
      confirmText: 'Cancel Interview',
    });
    if (ok) {
      try {
        await cancelInterview(int.id);
        toast.success('Interview cancelled');
        load();
      } catch (e) {
        toast.error(e.message);
      }
    }
  };

  const handleJoin = (int) => {
    if (int.meetingLink) {
      window.open(int.meetingLink, '_blank');
    } else {
      toast.info('No meeting link available for this interview');
    }
  };

  const monthLabel = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const upcoming = useMemo(() =>
    [...data.data]
      .filter(i => i.status === 'scheduled' && new Date(i.startTime) > new Date())
      .sort((a, b) => new Date(a.startTime) - new Date(b.startTime)),
    [data.data]
  );
  const past = useMemo(() =>
    [...data.data]
      .filter(i => i.status === 'completed' || new Date(i.endTime || i.startTime) < new Date())
      .sort((a, b) => new Date(b.startTime) - new Date(a.startTime)),
    [data.data]
  );

  if (error) {
    return (
      <div className="space-y-5 animate-fade-in">
        <Header onSchedule={openSchedule} stats={data.stats} loading={loading} />
        <ErrorState onRetry={load} message={error.message} />
        {confirm.ConfirmDialog}
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <Header onSchedule={openSchedule} stats={data.stats} loading={loading} />

      <Card>
        <CardContent className="p-4 sm:p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-1 rounded-lg border border-surface-200 dark:border-surface-700 p-0.5 bg-surface-50 dark:bg-surface-800 self-start">
              <button
                onClick={() => setViewMode('calendar')}
                className={cn(
                  'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all',
                  viewMode === 'calendar'
                    ? 'bg-white dark:bg-surface-900 text-brand-600 dark:text-brand-400 shadow-sm'
                    : 'text-surface-500 hover:text-surface-700 dark:hover:text-surface-300'
                )}
              >
                <CalendarDays className="w-4 h-4" /> Calendar
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all',
                  viewMode === 'list'
                    ? 'bg-white dark:bg-surface-900 text-brand-600 dark:text-brand-400 shadow-sm'
                    : 'text-surface-500 hover:text-surface-700 dark:hover:text-surface-300'
                )}
              >
                <Users className="w-4 h-4" /> List
              </button>
            </div>

            <div className="flex items-center gap-2 flex-wrap justify-end">
              <Select
                size="sm"
                value={statusFilter}
                onChange={setStatusFilter}
                options={[{ value: 'all', label: 'All Statuses' }, ...INTERVIEW_STATUS.map(s => ({ value: s.value, label: s.label }))]}
                className="w-auto min-w-[140px]"
              />
              <Select
                size="sm"
                value={typeFilter}
                onChange={setTypeFilter}
                options={[{ value: 'all', label: 'All Types' }, ...INTERVIEW_TYPES.map(t => ({ value: t.value, label: t.label }))]}
                className="w-auto min-w-[140px]"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 sm:p-5 space-y-4">
          {viewMode === 'calendar' ? (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 rounded-lg border border-surface-200 dark:border-surface-700 p-0.5 bg-surface-50 dark:bg-surface-800">
                  <button
                    onClick={() => setViewRange('month')}
                    className={cn(
                      'px-3 py-1.5 rounded-md text-xs font-semibold transition-colors',
                      viewRange === 'month' ? 'bg-white dark:bg-surface-900 text-brand-600 dark:text-brand-400 shadow-sm' : 'text-surface-500'
                    )}
                  >
                    Month
                  </button>
                  <button
                    onClick={() => setViewRange('week')}
                    className={cn(
                      'px-3 py-1.5 rounded-md text-xs font-semibold transition-colors',
                      viewRange === 'week' ? 'bg-white dark:bg-surface-900 text-brand-600 dark:text-brand-400 shadow-sm' : 'text-surface-500'
                    )}
                  >
                    Week
                  </button>
                  <button
                    onClick={() => setViewRange('day')}
                    className={cn(
                      'px-3 py-1.5 rounded-md text-xs font-semibold transition-colors',
                      viewRange === 'day' ? 'bg-white dark:bg-surface-900 text-brand-600 dark:text-brand-400 shadow-sm' : 'text-surface-500'
                    )}
                  >
                    Day
                  </button>
                </div>
                <div className="flex items-center gap-1">
                  <Button size="sm" variant="ghost" onClick={goToday} icon={<Calendar className="w-5 h-5" />}>Today</Button>
                  <Button size="sm" variant="ghost" onClick={goPrev} icon={<ChevronLeft className="w-4 h-4" />} />
                  <span className="px-3 py-1.5 text-sm font-semibold text-surface-800 dark:text-surface-200 min-w-[160px] text-center">
                    {viewRange === 'day' ? formatDate(currentDate, 'EEEE, MMMM d, yyyy') : viewRange === 'week' ? `Week of ${formatDate(weekDays[0]?.date || currentDate, 'MMM d')} - ${formatDate(weekDays[6]?.date || currentDate, 'MMM d, yyyy')}` : monthLabel}
                  </span>
                  <Button size="sm" variant="ghost" onClick={goNext} icon={<ChevronRight className="w-4 h-4" />} />
                </div>
              </div>

              {loading ? (
                <Skeleton className="h-[520px] w-full rounded-xl" />
              ) : viewRange === 'month' ? (
                <div className="border border-surface-200 dark:border-surface-800 rounded-xl overflow-hidden">
                  <div className="grid grid-cols-7 bg-surface-50/80 dark:bg-surface-800/50 border-b border-surface-200 dark:border-surface-800">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                      <div key={d} className="py-2.5 text-center text-[11px] font-bold uppercase tracking-wide text-surface-500 dark:text-surface-400">{d}</div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7">
                    {calendarDays.map((cell, i) => {
                      const isToday = cell.date && isSameDay(cell.date, today);
                      const hasInts = cell.interviews && cell.interviews.length > 0;
                      return (
                        <div
                          key={cell.key}
                          className={cn(
                            'min-h-[88px] sm:min-h-[100px] border-b border-r border-surface-100 dark:border-surface-800 p-1.5 sm:p-2',
                            !cell.date && 'bg-surface-50/40 dark:bg-surface-900/30',
                            isToday && 'bg-brand-50/50 dark:bg-brand-950/30',
                            (i + 1) % 7 === 0 && 'border-r-0'
                          )}
                        >
                          {cell.date && (
                            <>
                              <div className="flex items-center justify-between mb-1">
                                <span className={cn(
                                  'text-xs font-semibold w-6 h-6 rounded-full inline-flex items-center justify-center',
                                  isToday && 'bg-brand-500 text-white'
                                )}>{cell.date.getDate()}</span>
                                {hasInts && cell.interviews.length > 3 && (
                                  <span className="text-[10px] font-bold text-brand-600 dark:text-brand-400">+{cell.interviews.length - 3}</span>
                                )}
                              </div>
                              <div className="space-y-1">
                                {(cell.interviews || []).slice(0, 3).map(int => {
                                  const st = INTERVIEW_STATUS_CLASSES[int.status] || INTERVIEW_STATUS_CLASSES.scheduled;
                                  const TypeIcon = typeIconMap[int.type] || Calendar;
                                  const t = new Date(int.startTime);
                                  return (
                                    <button
                                      key={int.id}
                                      onClick={() => { handleJoin(int); }}
                                      className={cn(
                                        'w-full text-left px-1.5 py-1 rounded-md text-[10px] font-medium leading-tight truncate transition-colors hover:brightness-110',
                                        st.badge.replace('border', 'border-0')
                                      )}
                                      title={`${int.candidateName} — ${formatDateTime(int.startTime)}`}
                                    >
                                      <span className="inline-flex items-center gap-0.5">
                                        <span>{t.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }).replace(' ', '')}</span>
                                        <span className="hidden sm:inline truncate">• {truncate(int.candidateName, 12)}</span>
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : viewRange === 'week' ? (
                <div className="border border-surface-200 dark:border-surface-800 rounded-xl overflow-hidden">
                  <div className="grid grid-cols-8 border-b border-surface-200 dark:border-surface-800 bg-surface-50/70 dark:bg-surface-800/50">
                    <div className="py-2.5 text-center text-[11px] font-bold uppercase tracking-wide text-surface-500 dark:text-surface-400 border-r border-surface-200 dark:border-surface-800"></div>
                    {weekDays.map((w, i) => (
                      <div key={i} className={cn(
                        'py-2.5 text-center border-r border-surface-200 dark:border-surface-800 last:border-r-0',
                        isSameDay(w.date, today) && 'bg-brand-50 dark:bg-brand-950/30'
                      )}>
                        <div className="text-[11px] font-bold uppercase tracking-wide text-surface-500 dark:text-surface-400">
                          {w.date.toLocaleDateString('en-US', { weekday: 'short' })}
                        </div>
                        <div className={cn(
                          'text-lg font-bold',
                          isSameDay(w.date, today) && 'text-brand-600 dark:text-brand-400'
                        )}>{w.date.getDate()}</div>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-8">
                    {dayHours.map(hour => (
                      <Fragment key={`row-${hour}`}>
                        <div className="border-b border-r border-surface-100 dark:border-surface-800 px-2 py-2 text-right pr-3">
                          <span className="text-[10px] font-semibold text-surface-400">{(hour % 12) || 12}{hour < 12 ? 'a' : 'p'}m</span>
                        </div>
                        {weekDays.map((w, di) => {
                          const inSlot = w.interviews.filter(i => {
                            const t = new Date(i.startTime);
                            return t.getHours() === hour;
                          });
                          return (
                            <div key={`d-${di}-${hour}`} className="border-b border-r border-surface-100 dark:border-surface-800 p-1 min-h-[56px] last:border-r-0">
                              {inSlot.map(int => {
                                const st = INTERVIEW_STATUS_CLASSES[int.status] || INTERVIEW_STATUS_CLASSES.scheduled;
                                return (
                                  <button
                                    key={int.id}
                                    onClick={() => handleJoin(int)}
                                    className={cn('w-full text-left px-1.5 py-1 rounded text-[10px] font-medium leading-tight truncate hover:brightness-110', st.badge)}
                                    title={int.candidateName}
                                  >
                                    <div className="font-semibold truncate">{int.candidateName}</div>
                                    <div className="opacity-80 truncate">{truncate(int.jobTitle, 14)}</div>
                                  </button>
                                );
                              })}
                            </div>
                          );
                        })}
                      </Fragment>
                    ))}
                  </div>
                </div>
              ) : (
                <DayView date={currentDate} interviews={data.data.filter(i => isSameDay(new Date(i.startTime), currentDate))} onJoin={handleJoin} />
              )}
            </>
          ) : (
            loading ? (
              <SkeletonList count={6} />
            ) : data.data.length === 0 ? (
              <EmptyState
                iconName="calendar"
                title="No interviews scheduled"
                description="Schedule interviews with shortlisted candidates using the button above."
                actionText="Schedule Interview"
                onAction={openSchedule}
              />
            ) : (
              <Tabs defaultValue="upcoming">
                <TabList>
                  <Tab value="upcoming">
                    Upcoming <Badge size="sm" variant="brand" className="ml-1.5">{upcoming.length}</Badge>
                  </Tab>
                  <Tab value="past">
                    Past <Badge size="sm" variant="outline" className="ml-1.5">{past.length}</Badge>
                  </Tab>
                </TabList>
                <TabPanels>
                  <TabPanel value="upcoming">
                    {upcoming.length === 0 ? (
                      <EmptyState size="sm" title="No upcoming interviews" description="Your scheduled interviews will appear here." />
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {upcoming.map(int => <InterviewCard key={int.id} int={int} onJoin={handleJoin} onReschedule={openReschedule} onCancel={handleCancel} onFeedback={() => navigate('/recruiter/feedback')} />)}
                      </div>
                    )}
                  </TabPanel>
                  <TabPanel value="past">
                    {past.length === 0 ? (
                      <EmptyState size="sm" title="No past interviews" description="Completed interviews will appear here with feedback." />
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {past.map(int => <InterviewCard key={int.id} int={int} past onJoin={handleJoin} onReschedule={openReschedule} onCancel={handleCancel} onFeedback={() => navigate('/recruiter/feedback')} />)}
                      </div>
                    )}
                  </TabPanel>
                </TabPanels>
              </Tabs>
            )
          )}
        </CardContent>
      </Card>

      <Modal open={scheduleOpen} onClose={() => { setScheduleOpen(false); setRescheduleInt(null); }} size="lg">
        <ModalHeader>
          <ModalTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-brand-500" />
            {rescheduleInt ? 'Reschedule Interview' : 'Schedule Interview'}
          </ModalTitle>
        </ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-surface-500 dark:text-surface-400 mb-1.5">Candidate</label>
                <Select
                  value={form.candidateId}
                  onChange={(v) => setForm(f => ({ ...f, candidateId: v }))}
                  options={candidates.map(c => ({ value: c.id, label: truncate(c.name + ' — ' + (c.title || ''), 50) }))}
                  placeholder="Select candidate..."
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-surface-500 dark:text-surface-400 mb-1.5">Job Position</label>
                <Select
                  value={form.jobId}
                  onChange={(v) => setForm(f => ({ ...f, jobId: v }))}
                  options={jobs.map(j => ({ value: j.id, label: truncate(j.title + ' • ' + j.companyName, 50) }))}
                  placeholder="Select job..."
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-surface-500 dark:text-surface-400 mb-1.5">Interview Type</label>
                <Select
                  value={form.type}
                  onChange={(v) => setForm(f => ({ ...f, type: v }))}
                  options={INTERVIEW_TYPES.map(t => ({ value: t.value, label: t.label }))}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-surface-500 dark:text-surface-400 mb-1.5">Round</label>
                <Select
                  value={form.round}
                  onChange={(v) => setForm(f => ({ ...f, round: v }))}
                  options={[
                    { value: '1', label: 'Round 1 — Screen' },
                    { value: '2', label: 'Round 2 — Technical' },
                    { value: '3', label: 'Round 3 — HR' },
                    { value: '4', label: 'Round 4 — Final' },
                    { value: '5', label: 'On-site Day' },
                  ]}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-surface-500 dark:text-surface-400 mb-1.5">Date</label>
                <Input type="date" value={form.date} onChange={(e) => setForm(f => ({ ...f, date: e.target.value }))} min={today.toISOString().split('T')[0]} />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-surface-500 dark:text-surface-400 mb-1.5">Time</label>
                <Input type="time" value={form.time} onChange={(e) => setForm(f => ({ ...f, time: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-surface-500 dark:text-surface-400 mb-1.5">Duration</label>
                <Select
                  value={form.duration}
                  onChange={(v) => setForm(f => ({ ...f, duration: v }))}
                  options={[
                    { value: '30', label: '30 min' },
                    { value: '45', label: '45 min' },
                    { value: '60', label: '60 min' },
                    { value: '90', label: '90 min' },
                    { value: '120', label: '2 hours' },
                  ]}
                />
              </div>
            </div>
            {form.type === 'onsite' ? (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-surface-500 dark:text-surface-400 mb-1.5">Office Location / Address</label>
                <Input value={form.location} onChange={(e) => setForm(f => ({ ...f, location: e.target.value }))} placeholder="Office address or meeting room" />
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-surface-500 dark:text-surface-400 mb-1.5">Meeting Link (optional)</label>
                <Input value={form.meetingLink} onChange={(e) => setForm(f => ({ ...f, meetingLink: e.target.value }))} placeholder="https://meet.google.com/... or Zoom link" />
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-surface-500 dark:text-surface-400 mb-1.5">Interviewer Notes</label>
              <Textarea rows={3} value={form.notes} onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Topics to cover, questions, rating criteria..." />
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" onClick={() => { setScheduleOpen(false); setRescheduleInt(null); }}>Cancel</Button>
          <Button icon={rescheduleInt ? <RefreshCw className="w-4 h-4" /> : <Calendar className="w-4 h-4" />} onClick={handleSubmit}>
            {rescheduleInt ? 'Reschedule' : 'Schedule Interview'}
          </Button>
        </ModalFooter>
      </Modal>
      {confirm.ConfirmDialog}
    </div>
  );
}

function Header({ onSchedule, stats, loading }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-surface-900 dark:text-white tracking-tight flex items-center gap-2">
          <Calendar className="w-6 h-6 text-brand-500" /> Interviews
        </h1>
        <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">Schedule, manage, and join candidate interviews</p>
      </div>
      <div className="flex items-center gap-3 flex-wrap">
        {!loading && stats && (
          <div className="hidden sm:flex items-center gap-2 text-xs">
            <Badge variant="soft" className="gap-1"><CalendarCheck className="w-3 h-3" /> {stats.upcoming || 0} Upcoming</Badge>
            <Badge variant="success" size="sm" className="gap-1"><FaCheckCircle className="w-3 h-3" /> {stats.completed || 0} Done</Badge>
            {stats.avgRating > 0 && <Badge variant="outline" className="gap-1"><Star className="w-3 h-3" /> {stats.avgRating} Avg</Badge>}
          </div>
        )}
        <Button icon={<Plus className="w-4 h-4" />} onClick={onSchedule}>Schedule Interview</Button>
      </div>
    </div>
  );
}

function InterviewCard({ int, past, onJoin, onReschedule, onCancel, onFeedback }) {
  const st = INTERVIEW_STATUS_CLASSES[int.status] || INTERVIEW_STATUS_CLASSES.scheduled;
  const TypeIcon = typeIconMap[int.type] || Calendar;
  const d = new Date(int.startTime);
  return (
    <div className="rounded-xl border border-surface-200 dark:border-surface-800 overflow-hidden hover:shadow-md transition-shadow">
      <div className="flex items-stretch">
        <div className={cn(
          'w-20 sm:w-24 shrink-0 flex flex-col items-center justify-center py-4 text-center',
          st.dot && 'border-r border-surface-100 dark:border-surface-800 bg-surface-50/60 dark:bg-surface-900/40'
        )}>
          <div className={cn('w-1.5 h-1.5 rounded-full mb-1', st.dot)} />
          <div className="text-xs font-bold uppercase tracking-wide text-surface-500 dark:text-surface-400">
            {d.toLocaleString('en-US', { month: 'short' })}
          </div>
          <div className="text-2xl font-bold text-surface-900 dark:text-white leading-none mt-0.5">{d.getDate()}</div>
          <div className="text-[11px] text-surface-500 dark:text-surface-400 mt-1">
            {d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }).replace(' ', '')}
          </div>
          <div className="text-[10px] text-surface-400 mt-0.5">{int.duration || 60} min</div>
        </div>
        <div className="flex-1 p-4 space-y-3 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <Avatar name={int.candidateName} size="sm" avatarClass={int.candidateAvatar} />
                <div className="min-w-0">
                  <p className="font-semibold text-sm text-surface-900 dark:text-white truncate">{int.candidateName}</p>
                  <p className="text-xs text-surface-500 dark:text-surface-400 truncate">{int.candidateTitle || int.jobTitle}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <Badge variant="outline" size="sm" className="gap-1">
                  <TypeIcon className="w-3 h-3" /> {INTERVIEW_TYPES.find(t => t.value === int.type)?.label || int.type}
                </Badge>
                <Badge variant="outline" size="sm" className="gap-1">
                  <Building2 className="w-3 h-3" /> {truncate(int.jobTitle, 22)}
                </Badge>
                {int.round && <Badge variant="soft" size="sm">Round {int.round}</Badge>}
                {int.rating && <Badge variant="success" size="sm" className="gap-1"><Star className="w-3 h-3" /> {int.rating}/5</Badge>}
              </div>
            </div>
            <Badge className={cn('capitalize shrink-0', st.badge)}>{int.status === 'no_show' ? 'No-Show' : int.status}</Badge>
          </div>
          <div className="flex items-center gap-2 pt-2 border-t border-surface-100 dark:border-surface-800 flex-wrap">
            {!past && int.status === 'scheduled' ? (
              <>
                <Button size="sm" icon={<VideoIcon className="w-3.5 h-3.5" />} onClick={() => onJoin?.(int)}>Join</Button>
                <Button size="sm" variant="secondary" icon={<RefreshCw className="w-3.5 h-3.5" />} onClick={() => onReschedule?.(int)}>Reschedule</Button>
                <Button size="sm" variant="ghost" icon={<XCircle className="w-3.5 h-3.5" />} onClick={() => onCancel?.(int)} className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40">Cancel</Button>
              </>
            ) : (
              <>
                {int.status === 'completed' && !int.feedback && (
                  <Button size="sm" icon={<UserCheck className="w-3.5 h-3.5" />} onClick={onFeedback}>Submit Feedback</Button>
                )}
                {int.status === 'completed' && int.feedback && (
                  <Badge variant="success" size="sm" className="gap-1"><FaCheckCircle className="w-3 h-3" /> Feedback done</Badge>
                )}
                {int.meetingLink && past && (
                  <Button size="sm" variant="ghost" icon={<ExternalLink className="w-3.5 h-3.5" />} onClick={() => onJoin?.(int)}>View Link</Button>
                )}
                <Button size="sm" variant="ghost" onClick={() => onReschedule?.(int)} icon={<RefreshCw className="w-3.5 h-3.5" />}>Re-schedule</Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function DayView({ date, interviews, onJoin }) {
  const sorted = [...interviews].sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
  if (interviews.length === 0) {
    return (
      <div className="py-16">
        <EmptyState
          size="sm"
          iconName="calendar"
          title={`No interviews on ${formatDate(date, 'EEEE, MMM d')}`}
          description="Looks like a free day — schedule one or focus on reviews!"
          actionText="Schedule Now"
        />
      </div>
    );
  }
  return (
    <div className="space-y-3">
      <div className="rounded-xl bg-brand-50 dark:bg-brand-950/30 px-4 py-3 border border-brand-100 dark:border-brand-900/60 flex items-center justify-between flex-wrap gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-600 dark:text-brand-400">{formatDate(date, 'EEEE')}</p>
          <p className="text-base font-bold text-surface-900 dark:text-white">{formatDate(date)}</p>
        </div>
        <Badge variant="brand" size="lg">{interviews.length} interview{interviews.length !== 1 ? 's' : ''}</Badge>
      </div>
      {sorted.map(int => {
        const st = INTERVIEW_STATUS_CLASSES[int.status] || INTERVIEW_STATUS_CLASSES.scheduled;
        const TypeIcon = typeIconMap[int.type] || Calendar;
        const t = new Date(int.startTime);
        return (
          <div key={int.id} className="flex items-stretch rounded-xl border border-surface-200 dark:border-surface-800 overflow-hidden">
            <div className="w-24 shrink-0 border-r border-surface-100 dark:border-surface-800 bg-surface-50 dark:bg-surface-900/40 flex flex-col items-center justify-center py-4">
              <p className="text-sm font-bold text-surface-900 dark:text-white tabular-nums">
                {t.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
              </p>
              <p className="text-[11px] text-surface-500 dark:text-surface-400">{int.duration} min</p>
            </div>
            <div className="flex-1 p-4 flex items-center justify-between gap-3 flex-wrap min-w-0">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <Avatar name={int.candidateName} size="md" avatarClass={int.candidateAvatar} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-surface-900 dark:text-white truncate">{int.candidateName}</p>
                    <Badge variant="outline" size="sm" className="gap-1"><TypeIcon className="w-3 h-3" /> {INTERVIEW_TYPES.find(t => t.value === int.type)?.label}</Badge>
                    <Badge className={cn('capitalize text-[10px]', st.badge)}>{int.status}</Badge>
                  </div>
                  <p className="text-xs text-surface-500 dark:text-surface-400 truncate mt-0.5">{int.jobTitle} • Round {int.round || 1}</p>
                  {int.notes && <p className="text-[11px] text-surface-500 dark:text-surface-400 truncate mt-1">📝 {int.notes}</p>}
                </div>
              </div>
              <Button size="sm" icon={<VideoIcon className="w-3.5 h-3.5" />} onClick={() => onJoin?.(int)}>Join</Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
