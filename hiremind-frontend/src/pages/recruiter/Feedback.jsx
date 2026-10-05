import { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/contexts/ToastContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { ScoreRing, getScoreColor } from '@/components/ui/ScoreRing';
import { Skeleton, SkeletonList } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal, ModalHeader, ModalTitle, ModalBody, ModalFooter } from '@/components/ui/Modal';
import {
  MessageSquare, Star as StarIcon, ThumbsUp, AlertTriangle, CheckCircle2,
  Award, UserCheck, Eye, ChevronDown, ChevronUp, Filter, Search, Calendar,
  Briefcase, Sparkles
} from 'lucide-react';
import { FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import { cn, formatDateTime, truncate, formatDate } from '@/lib/utils';
import { getInterviews, submitFeedback } from '@/services/interviewService';
import { INTERVIEW_TYPES, INTERVIEW_STATUS } from '@/lib/constants';

const RATING_CATEGORIES = [
  { key: 'technicalSkill', label: 'Technical Skills', icon: Briefcase, description: 'Coding, design, domain knowledge' },
  { key: 'communication', label: 'Communication', icon: MessageSquare, description: 'Clarity, listening, articulation' },
  { key: 'problemSolving', label: 'Problem Solving', icon: Sparkles, description: 'Analytical approach, reasoning' },
  { key: 'culturalFit', label: 'Culture Fit', icon: Award, description: 'Values, teamwork, attitude' },
];

const RECOMMENDATIONS = [
  { value: 'strong_yes', label: 'Strong Yes', class: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/60', weight: 100 },
  { value: 'yes', label: 'Yes', class: 'bg-brand-100 text-brand-800 dark:bg-brand-950/40 dark:text-brand-400 border-brand-200 dark:border-brand-900/60', weight: 75 },
  { value: 'maybe', label: 'Maybe', class: 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-900/60', weight: 50 },
  { value: 'no', label: 'No', class: 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-400 border-red-200 dark:border-red-900/60', weight: 20 },
];

function StarRating({ value, onChange, size = 'md', readOnly = false }) {
  const [hover, setHover] = useState(0);
  const sizePx = size === 'lg' ? 'w-7 h-7' : size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';
  return (
    <div className={cn('inline-flex items-center gap-0.5', readOnly && 'cursor-default')}>
      {[1, 2, 3, 4, 5].map(i => {
        const active = (hover || value) >= i;
        return (
          <button
            key={i}
            type="button"
            disabled={readOnly}
            onMouseEnter={() => !readOnly && setHover(i)}
            onMouseLeave={() => !readOnly && setHover(0)}
            onClick={() => !readOnly && onChange?.(i)}
            className={cn(
              'p-0.5 transition-all duration-150',
              !readOnly && 'hover:scale-110 cursor-pointer disabled:cursor-default'
            )}
          >
            <StarIcon
              className={cn(
                sizePx,
                'transition-colors',
                active
                  ? 'fill-amber-400 text-amber-400 stroke-amber-500'
                  : 'text-surface-300 dark:text-surface-600 fill-transparent'
              )}
            />
          </button>
        );
      })}
      {!readOnly && value > 0 && (
        <span className="ml-2 text-sm font-semibold text-surface-600 dark:text-surface-400">{value}/5</span>
      )}
    </div>
  );
}

export default function Feedback() {
  const navigate = useNavigate();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [interviews, setInterviews] = useState([]);
  const [statusFilter, setStatusFilter] = useState('completed');
  const [formOpen, setFormOpen] = useState(false);
  const [selectedInt, setSelectedInt] = useState(null);
  const [expanded, setExpanded] = useState(null);
  const [form, setForm] = useState({
    technicalSkill: 0,
    communication: 0,
    problemSolving: 0,
    culturalFit: 0,
    strengths: '',
    concerns: '',
    recommendation: '',
    comments: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getInterviews({ limit: 100, status: statusFilter === 'all' ? undefined : statusFilter, past: true });
      const list = res.data.map(i => {
        if (!i.feedback && i.status === 'completed' && i.rating) {
          return { ...i, feedback: { technicalSkill: i.rating, communication: i.rating, problemSolving: i.rating, culturalFit: i.rating, overall: i.rating, comments: i.notes, strengths: 'N/A', concerns: 'N/A', recommendation: 'yes' } };
        }
        return i;
      });
      setInterviews(list);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

  const openForm = (int) => {
    setSelectedInt(int);
    const existing = int.feedback;
    setForm({
      technicalSkill: existing?.technicalSkill || 0,
      communication: existing?.communication || 0,
      problemSolving: existing?.problemSolving || 0,
      culturalFit: existing?.culturalFit || 0,
      strengths: existing?.strengths || '',
      concerns: existing?.concerns || '',
      recommendation: existing?.recommendation || '',
      comments: existing?.comments || '',
    });
    setFormOpen(true);
  };

  const handleSubmit = async () => {
    if (!selectedInt) return;
    const avg = Math.round((form.technicalSkill + form.communication + form.problemSolving + form.culturalFit) / 4);
    if (avg === 0) {
      toast.warning('Please rate at least one category');
      return;
    }
    if (!form.recommendation) {
      toast.warning('Please select a recommendation');
      return;
    }
    setSubmitting(true);
    try {
      await submitFeedback(selectedInt.id, {
        ...form,
        overall: avg,
        comments: form.comments || [
          form.strengths && `Strengths: ${form.strengths}`,
          form.concerns && `Concerns: ${form.concerns}`,
        ].filter(Boolean).join('\n\n'),
      });
      toast.success('Feedback submitted successfully');
      setFormOpen(false);
      load();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const pendingFeedback = useMemo(() => interviews.filter(i => !i.feedback && i.status === 'completed').length, [interviews]);
  const feedbackStats = useMemo(() => {
    const withFb = interviews.filter(i => i.feedback);
    if (withFb.length === 0) return null;
    const scores = withFb.map(i => i.feedback?.overall || i.rating || 0);
    const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length * 10) / 10;
    const strongYes = withFb.filter(i => i.feedback?.recommendation === 'strong_yes').length;
    const yes = withFb.filter(i => i.feedback?.recommendation === 'yes').length;
    const no = withFb.filter(i => ['no', 'reject'].includes(i.feedback?.recommendation)).length;
    return { total: withFb.length, avg, strongYes, yes, no };
  }, [interviews]);

  if (error) {
    return (
      <div className="space-y-5 animate-fade-in">
        <Header pending={pendingFeedback} stats={feedbackStats} />
        <ErrorState onRetry={load} message={error.message} />
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <Header pending={pendingFeedback} stats={feedbackStats} />

      {feedbackStats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard label="Feedback Given" value={feedbackStats.total} icon={CheckCircle2} color="success" />
          <StatCard label="Avg Candidate Rating" value={`${feedbackStats.avg} ★`} icon={StarIcon} color="brand" highlight={feedbackStats.avg >= 4} />
          <StatCard label="Strong Yes + Yes" value={feedbackStats.strongYes + feedbackStats.yes} icon={ThumbsUp} color="success" highlight={feedbackStats.strongYes + feedbackStats.yes > feedbackStats.total / 2} />
          <StatCard label="Pending Review" value={pendingFeedback} icon={AlertTriangle} color={pendingFeedback > 0 ? 'warning' : 'success'} />
        </div>
      )}

      <Card>
        <CardContent className="p-4 sm:p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
<Tabs
  value={statusFilter}
  onChange={setStatusFilter}
  tabs={[
    {
      value: "completed",
      label: "Completed",
      count: interviews.filter((i) => i.status === "completed").length,
    },
    {
      value: "all",
      label: "All Interviews",
      count: interviews.length,
    },
    {
      value: "cancelled",
      label: "Cancelled",
      count: interviews.filter((i) => i.status === "cancelled").length,
    },
  ]}
/>
          </div>

          {loading ? (
            <SkeletonList count={5} />
          ) : interviews.length === 0 ? (
            <EmptyState
              iconName="calendar"
              title="No interviews to review"
              description={statusFilter === 'completed'
                ? 'Completed interviews will appear here for you to submit feedback.'
                : 'No interviews found. Adjust filters or schedule some first!'}
              actionText={statusFilter === 'completed' ? 'Back to Interviews' : undefined}
              onAction={statusFilter === 'completed' ? () => navigate('/recruiter/interviews') : undefined}
            />
          ) : (
            <div className="space-y-3">
              {interviews.map(int => {
                const fb = int.feedback;
                const overall = fb?.overall || int.rating || 0;
                const sc = getScoreColor(overall ? overall * 20 : 0);
                const rec = RECOMMENDATIONS.find(r => r.value === fb?.recommendation);
                const isExpanded = expanded === int.id;
                return (
                  <div key={int.id} className="rounded-xl border border-surface-200 dark:border-surface-800 overflow-hidden transition-all">
                    <div className="p-4 sm:p-5">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <Avatar name={int.candidateName} size="md" avatarClass={int.candidateAvatar} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-bold text-surface-900 dark:text-white truncate">{int.candidateName}</h4>
                              {!fb && int.status === 'completed' && (
                                <Badge variant="warning" size="sm" className="gap-1"><AlertTriangle className="w-3 h-3" /> Feedback Pending</Badge>
                              )}
                              {fb && rec && (
                                <Badge size="sm" className={cn('gap-1 border', rec.class)}>
                                  {rec.value === 'strong_yes' && <ThumbsUp className="w-3 h-3" />}
                                  {rec.value === 'no' && <FaTimesCircle className="w-3 h-3" />}
                                  {rec.label}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-1 flex-wrap text-xs text-surface-500 dark:text-surface-400">
                              <span className="inline-flex items-center gap-0.5"><Briefcase className="w-3 h-3" /> {truncate(int.jobTitle, 24)}</span>
                              <span className="opacity-50">•</span>
                              <span>{INTERVIEW_TYPES.find(t => t.value === int.type)?.label || int.type} — Round {int.round || 1}</span>
                              <span className="opacity-50">•</span>
                              <span className="inline-flex items-center gap-0.5"><Calendar className="w-3 h-3" /> {formatDate(int.startTime)}</span>
                            </div>
                            {overall > 0 && (
                              <div className="flex items-center gap-2 mt-2">
                                <StarRating value={Math.round(overall)} readOnly size="sm" />
                                <span className={cn('text-xs font-semibold tabular-nums', sc.text)}>
                                  {overall.toFixed(1)}/5 avg
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 sm:self-start">
                          {overall > 0 && <ScoreRing value={overall * 20} size={52} strokeWidth={5} showLabel={false} />}
                          {!fb && int.status === 'completed' ? (
                            <Button icon={<MessageSquare className="w-4 h-4" />} onClick={() => openForm(int)}>Give Feedback</Button>
                          ) : (
                            <div className="flex items-center gap-1">
                              <Button size="sm" variant="ghost" icon={isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />} onClick={() => setExpanded(isExpanded ? null : int.id)}>
                                Details
                              </Button>
                              {int.status === 'completed' && (
                                <Button size="sm" variant="ghost" icon={<Eye className="w-4 h-4" />} onClick={() => openForm(int)}>Edit</Button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    {isExpanded && fb && (
                      <div className="px-4 sm:px-5 pb-5 pt-0 space-y-4 border-t border-surface-100 dark:border-surface-800 mt-0">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
                          {RATING_CATEGORIES.map(cat => {
                            const v = fb[cat.key] || 0;
                            const CatIcon = cat.icon;
                            return (
                              <div key={cat.key} className="rounded-xl border border-surface-200 dark:border-surface-800 p-3">
                                <div className="flex items-center justify-between mb-1.5">
                                  <span className="text-[11px] font-semibold uppercase tracking-wide text-surface-500 dark:text-surface-400 inline-flex items-center gap-1">
                                    <CatIcon className="w-3 h-3" /> {cat.label}
                                  </span>
                                  <span className="text-xs font-bold tabular-nums text-surface-700 dark:text-surface-300">{v}/5</span>
                                </div>
                                <StarRating value={v} readOnly size="sm" />
                              </div>
                            );
                          })}
                        </div>

                        {(fb.strengths && fb.strengths !== 'N/A') && (
                          <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/60 p-4">
                            <div className="flex items-start gap-2">
                              <ThumbsUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                              <div className="flex-1">
                                <p className="text-xs font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-400 mb-1">Key Strengths</p>
                                <p className="text-sm text-emerald-800 dark:text-emerald-300 leading-relaxed whitespace-pre-wrap">{fb.strengths}</p>
                              </div>
                            </div>
                          </div>
                        )}

                        {(fb.concerns && fb.concerns !== 'N/A') && (
                          <div className="rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/60 p-4">
                            <div className="flex items-start gap-2">
                              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                              <div className="flex-1">
                                <p className="text-xs font-bold uppercase tracking-wide text-amber-700 dark:text-amber-400 mb-1">Areas of Concern</p>
                                <p className="text-sm text-amber-800 dark:text-amber-300 leading-relaxed whitespace-pre-wrap">{fb.concerns}</p>
                              </div>
                            </div>
                          </div>
                        )}

                        {fb.comments && (
                          <div className="rounded-xl border border-surface-200 dark:border-surface-800 p-4">
                            <p className="text-xs font-bold uppercase tracking-wide text-surface-500 dark:text-surface-400 mb-1.5">Interviewer Notes</p>
                            <p className="text-sm text-surface-700 dark:text-surface-300 leading-relaxed whitespace-pre-wrap">{fb.comments}</p>
                          </div>
                        )}

                        {rec && (
                          <div className="flex items-center justify-between rounded-xl p-4 border" style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.06), rgba(16,185,129,0.06))' }}>
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wide text-surface-500 dark:text-surface-400">Final Recommendation</p>
                              <p className="text-xl font-bold text-surface-900 dark:text-white mt-0.5">{rec.label}</p>
                            </div>
                            <div className={cn('px-4 py-2 rounded-xl border font-bold text-sm', rec.class)}>
                              {rec.value === 'strong_yes' || rec.value === 'yes' ? (
                                <span className="inline-flex items-center gap-1.5"><UserCheck className="w-4 h-4" /> Move Forward</span>
                              ) : rec.value === 'maybe' ? (
                                <span className="inline-flex items-center gap-1.5"><MessageSquare className="w-4 h-4" /> Additional Interview</span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5"><FaTimesCircle className="w-4 h-4" /> Reject</span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Modal open={formOpen} onClose={() => { setFormOpen(false); setSelectedInt(null); }} size="xl">
        <ModalHeader>
          <ModalTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-brand-500" />
            {selectedInt?.feedback ? 'Edit Interview Feedback' : 'Submit Interview Feedback'}
          </ModalTitle>
          {selectedInt && (
            <div className="mt-3 rounded-xl bg-brand-50 dark:bg-brand-950/30 p-3 flex items-center gap-3 border border-brand-100 dark:border-brand-900/60">
              <Avatar name={selectedInt.candidateName} size="sm" avatarClass={selectedInt.candidateAvatar} />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-sm text-surface-900 dark:text-white truncate">{selectedInt.candidateName}</p>
                <p className="text-xs text-surface-500 dark:text-surface-400 truncate">
                  {selectedInt.jobTitle} • {INTERVIEW_TYPES.find(t => t.value === selectedInt.type)?.label} • Round {selectedInt.round || 1} • {formatDateTime(selectedInt.startTime)}
                </p>
              </div>
            </div>
          )}
        </ModalHeader>
        <ModalBody>
          <div className="space-y-5">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wide text-surface-500 dark:text-surface-400 mb-3 flex items-center gap-1.5">
                <StarIcon className="w-3.5 h-3.5" /> Category Ratings
              </h3>
              <div className="space-y-3">
                {RATING_CATEGORIES.map(cat => {
                  const CatIcon = cat.icon;
                  return (
                    <div key={cat.key} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 rounded-xl border border-surface-200 dark:border-surface-800 p-3 sm:p-4">
                      <div className="flex items-center gap-2.5 flex-1 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-brand-50 dark:bg-brand-950/40 flex items-center justify-center shrink-0">
                          <CatIcon className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-sm text-surface-900 dark:text-white">{cat.label}</p>
                          <p className="text-[11px] text-surface-500 dark:text-surface-400">{cat.description}</p>
                        </div>
                      </div>
                      <StarRating value={form[cat.key]} onChange={(v) => setForm(f => ({ ...f, [cat.key]: v }))} size="lg" />
                    </div>
                  );
                })}
              </div>
              {(() => {
                const avg = Math.round(((form.technicalSkill + form.communication + form.problemSolving + form.culturalFit) / Math.max(1, [form.technicalSkill, form.communication, form.problemSolving, form.culturalFit].filter(v => v > 0).length)) * 10) / 10;
                return avg > 0 ? (
                  <div className="mt-4 rounded-xl bg-gradient-to-br from-brand-50 to-emerald-50 dark:from-brand-950/40 dark:to-emerald-950/20 border border-brand-100 dark:border-brand-900/60 p-4 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-surface-500 dark:text-surface-400">Overall Score</p>
                      <div className="mt-1 flex items-center gap-2">
                        <StarRating value={Math.round(avg)} readOnly />
                        <span className="text-lg font-bold tabular-nums text-surface-900 dark:text-white">{avg.toFixed(1)}/5</span>
                      </div>
                    </div>
                    <ScoreRing value={avg * 20} size={64} strokeWidth={6} />
                  </div>
                ) : null;
              })()}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-400 mb-1.5 inline-flex items-center gap-1">
                  <ThumbsUp className="w-3.5 h-3.5" /> Key Strengths
                </label>
                <Textarea
                  rows={4}
                  placeholder="What did the candidate do well? Specific examples of skills, experience, or qualities..."
                  value={form.strengths}
                  onChange={(e) => setForm(f => ({ ...f, strengths: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wide text-amber-700 dark:text-amber-400 mb-1.5 inline-flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> Areas of Concern / Development Areas
                </label>
                <Textarea
                  rows={4}
                  placeholder="Gaps, risks, or areas the candidate should work on. Be constructive and specific..."
                  value={form.concerns}
                  onChange={(e) => setForm(f => ({ ...f, concerns: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wide text-surface-500 dark:text-surface-400 mb-2">
                Final Recommendation
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {RECOMMENDATIONS.map(rec => (
                  <button
                    key={rec.value}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, recommendation: rec.value }))}
                    className={cn(
                      'px-3 py-3 rounded-xl border-2 text-sm font-semibold transition-all text-center',
                      form.recommendation === rec.value
                        ? `${rec.class} border-current shadow-sm scale-[1.02]`
                        : 'bg-white dark:bg-surface-900 border-surface-200 dark:border-surface-800 text-surface-600 dark:text-surface-400 hover:border-surface-300 dark:hover:border-surface-700'
                    )}
                  >
                    {rec.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wide text-surface-500 dark:text-surface-400 mb-1.5">
                Additional Interviewer Notes (optional)
              </label>
              <Textarea
                rows={3}
                placeholder="Anything else worth noting — specific questions, anecdotes, context for hiring team..."
                value={form.comments}
                onChange={(e) => setForm(f => ({ ...f, comments: e.target.value }))}
              />
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" onClick={() => { setFormOpen(false); setSelectedInt(null); }}>Cancel</Button>
          <Button icon={<CheckCircle2 className="w-4 h-4" />} onClick={handleSubmit} isLoading={submitting}>
            Submit Feedback
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}

function Header({ pending, stats }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-surface-900 dark:text-white tracking-tight flex items-center gap-2">
          <MessageSquare className="w-6 h-6 text-brand-500" /> Interview Feedback
        </h1>
        <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">Rate candidates, document strengths & concerns, share final recommendations</p>
      </div>
      {pending > 0 && (
        <Badge variant="warning" size="lg" className="self-start sm:self-center">
          <AlertTriangle className="w-3.5 h-3.5 mr-1" />
          {pending} Pending to Review
        </Badge>
      )}
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color, highlight }) {
  const c = {
    brand: { soft: 'bg-brand-50 dark:bg-brand-950/40', text: 'text-brand-600 dark:text-brand-400' },
    success: { soft: 'bg-emerald-50 dark:bg-emerald-950/40', text: 'text-emerald-600 dark:text-emerald-400' },
    warning: { soft: 'bg-amber-50 dark:bg-amber-950/40', text: 'text-amber-600 dark:text-amber-400' },
    danger: { soft: 'bg-red-50 dark:bg-red-950/40', text: 'text-red-600 dark:text-red-400' },
  }[color] || { soft: 'bg-brand-50 dark:bg-brand-950/40', text: 'text-brand-600 dark:text-brand-400' };
  return (
    <Card className={cn(highlight && 'ring-2 ring-brand-500/30')}>
      <CardContent className="p-4 sm:p-5 space-y-1">
        <div className="flex items-center gap-2">
          <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', c.soft)}>
            <Icon className={cn('w-4 h-4', c.text)} />
          </div>
          <span className="text-[11px] font-semibold uppercase tracking-wide text-surface-500 dark:text-surface-400">{label}</span>
        </div>
        <div className="text-2xl sm:text-3xl font-bold text-surface-900 dark:text-white tabular-nums pt-1">{value}</div>
      </CardContent>
    </Card>
  );
}

function Tabs({ value, onChange, tabs }) {
  return (
    <div className="flex items-center gap-1 rounded-xl border border-surface-200 dark:border-surface-700 p-1 bg-surface-50 dark:bg-surface-800 overflow-x-auto scrollbar-none -mx-1 sm:mx-0">
      {tabs.map((t) => (
        <button
          key={t.value}
          type="button"
          onClick={() => onChange(t.value)}
          className={cn(
            "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-all",
            value === t.value
              ? "bg-white dark:bg-surface-900 text-brand-600 dark:text-brand-400 shadow-sm"
              : "text-surface-500 dark:text-surface-400 hover:text-surface-800 dark:hover:text-surface-200"
          )}
        >
          {t.label}

          <Badge
            size="sm"
            variant={value === t.value ? "soft" : "outline"}
          >
            {t.count}
          </Badge>
        </button>
      ))}
    </div>
  );
}
