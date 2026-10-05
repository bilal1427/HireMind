import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiTarget, FiCheckCircle, FiAlertTriangle, FiCircle, FiBookOpen,
  FiTrendingUp, FiZap, FiClock, FiAward, FiChevronRight,
  FiBriefcase, FiStar, FiCalendar,
} from 'react-icons/fi';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Select';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { ScoreRing } from '@/components/ui/ScoreRing';
import { Skeleton, SkeletonCard, SkeletonText, SkeletonList } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { getSkillGap } from '@/services/matchingService';
import { MOCK_CANDIDATES, MOCK_JOBS } from '@/data/mockData';
import { capitalize, getColorClasses, cn } from '@/lib/utils';

const TARGET_ROLES = [
  { value: 'Senior React Developer', label: 'Senior React Developer' },
  { value: 'Full Stack Developer', label: 'Full Stack Developer' },
  { value: 'Backend Engineer', label: 'Backend Engineer - Node.js' },
  { value: 'Frontend Engineer', label: 'Frontend Engineer' },
  { value: 'DevOps Engineer', label: 'DevOps Engineer' },
  { value: 'Data Scientist', label: 'Data Scientist' },
  { value: 'ML Engineer', label: 'Machine Learning Engineer' },
  { value: 'Product Manager', label: 'Product Manager' },
  { value: 'Cloud Architect', label: 'Cloud Architect - AWS' },
  { value: 'UI/UX Designer', label: 'UI/UX Designer' },
];

function SkillGapSkeleton() {
  return (
    <div className="space-y-6">
      <SkeletonCard lines={2} imageHeight="h-0" showImage={false} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <SkeletonCard lines={6} imageHeight="h-0" showImage={false} />
        <div className="lg:col-span-2 space-y-6">
          <SkeletonCard lines={5} imageHeight="h-0" showImage={false} />
          <SkeletonCard lines={5} imageHeight="h-0" showImage={false} />
          <SkeletonCard lines={5} imageHeight="h-0" showImage={false} />
        </div>
      </div>
      <SkeletonCard lines={6} imageHeight="h-0" showImage={false} />
    </div>
  );
}

function PriorityBadge({ priority }) {
  const map = {
    critical: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 border border-red-200 dark:border-red-800',
    high: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800',
    medium: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300 border border-sky-200 dark:border-sky-800',
  };
  return (
    <span className={cn('px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wide', map[priority] || map.medium)}>
      {priority}
    </span>
  );
}

function SkillRow({ skill, level, icon, proficiency, demand, hours, priority, resources }) {
  const colors = getColorClasses(level);
  return (
    <div className="p-3.5 rounded-xl border border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-800/40 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors">
      <div className="flex items-start justify-between gap-3 mb-2.5">
        <div className="flex items-center gap-3 min-w-0">
          <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center shrink-0',
            level === 'success' ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400' :
            level === 'warning' ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400' :
            'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
          )}>
            {icon}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-sm text-surface-900 dark:text-surface-50">{skill}</h4>
              {priority && <PriorityBadge priority={priority} />}
            </div>
            <div className="flex items-center gap-3 mt-0.5 text-xs text-surface-500 dark:text-surface-400">
              {hours && (
                <span className="flex items-center gap-1"><FiClock className="w-3 h-3" />~{hours} hrs</span>
              )}
              {demand !== undefined && (
                <span className="flex items-center gap-1"><FiTrendingUp className="w-3 h-3" />Demand {demand}%</span>
              )}
              {proficiency !== undefined && (
                <span className="flex items-center gap-1"><FiStar className="w-3 h-3" />Proficiency {proficiency}%</span>
              )}
            </div>
          </div>
        </div>
      </div>
      {(proficiency !== undefined || demand !== undefined) && (
        <ProgressBar
          value={proficiency ?? demand}
          color={level === 'success' ? 'success' : level === 'warning' ? 'warning' : 'danger'}
          size="sm"
          showValue={false}
        />
      )}
      {resources && (
        <div className="mt-3 pt-3 border-t border-surface-200 dark:border-surface-700/50">
          <p className="text-[11px] font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wide mb-1.5">Suggested Courses</p>
          <div className="space-y-1">
            {resources.courses?.slice(0, 2).map((c, i) => (
              <a key={i} href="#" className="flex items-center gap-2 text-xs text-brand-600 dark:text-brand-400 hover:underline">
                <FiBookOpen className="w-3 h-3 shrink-0" />
                <span className="truncate">{c}</span>
                <FiChevronRight className="w-3 h-3 shrink-0 opacity-60" />
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function SkillGap() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { error: toastError } = useToast();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [targetRole, setTargetRole] = useState('Senior React Developer');
  const [gapAnalysis, setGapAnalysis] = useState(null);

  const fetchGap = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const primaryCandId = user?.id || 'cand_2001';
      const fallbackCandId = MOCK_CANDIDATES[0]?.id || primaryCandId;
      let data;
      try {
        data = await getSkillGap(primaryCandId, null, targetRole);
        if (!data || !data.gaps || data.gaps.length === 0) {
          data = await getSkillGap(fallbackCandId, null, targetRole);
        }
      } catch (innerErr) {
        const cand = MOCK_CANDIDATES.find(c => c.id === (user?.id || fallbackCandId)) || MOCK_CANDIDATES[0];
        const relatedJobs = MOCK_JOBS.filter(j => j.title.toLowerCase().includes(targetRole.toLowerCase()));
        const targetSkills = relatedJobs.length > 0
          ? [...new Set(relatedJobs.slice(0, 10).flatMap(j => j.skills))]
          : ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'AWS', 'Docker', 'Kubernetes', 'Redux', 'Next.js'];
        const candSkills = cand?.skills || [];
        const strongSkills = targetSkills.filter(s => candSkills.includes(s)).slice(0, 5);
        const weakSkills = candSkills.length ? [...candSkills].reverse().filter(s => !strongSkills.includes(s) && targetSkills.includes(s)).slice(0, 3) : [];
        const missingSkills = targetSkills.filter(s => !candSkills.includes(s));
        const strengths = strongSkills.map(s => ({ skill: s, proficiency: 75 + Math.round(Math.random() * 20), demand: 70 + Math.round(Math.random() * 25) }));
        weakSkills.forEach(s => strengths.push({ skill: s, proficiency: 50 + Math.round(Math.random() * 25), demand: 65 + Math.round(Math.random() * 25) }));
        const priMap = ['critical', 'high', 'high', 'medium', 'medium'];
        const gaps = missingSkills.slice(0, 5).map((s, i) => ({
          skill: s, priority: priMap[i] || 'medium',
          demand: 68 + Math.round(Math.random() * 25),
          estimatedHours: [80, 60, 40, 30, 20][i] || 40,
          resources: {
            courses: [`${s} Complete Course (Udemy)`, `${s} Hands-On Learning (Pluralsight)`],
            docs: `https://example.com/docs/${s.toLowerCase()}`,
          }
        }));
        data = {
          targetTitle: targetRole,
          overallReadiness: Math.min(95, Math.max(35, 50 + strongSkills.length * 6 - gaps.length * 3)),
          strengths,
          gaps,
          suggestions: [
            gaps.length > 0 ? `Focus on ${gaps[0].skill} first — highest demand for ${targetRole} roles.` : 'Keep building on your strong skills!',
            'Get at least one certification in your top missing skill to stand out.',
            'Build 2-3 portfolio projects demonstrating the target skillset on GitHub.',
          ],
        };
      }
      setGapAnalysis(data || {
        targetTitle: targetRole,
        overallReadiness: 68,
        strengths: [
          { skill: 'React', proficiency: 88, demand: 92 },
          { skill: 'JavaScript', proficiency: 90, demand: 88 },
          { skill: 'TypeScript', proficiency: 78, demand: 85 },
          { skill: 'Tailwind CSS', proficiency: 82, demand: 75 },
          { skill: 'Next.js', proficiency: 72, demand: 80 },
        ],
        gaps: [
          { skill: 'Kubernetes', priority: 'critical', demand: 87, estimatedHours: 80, resources: { courses: ['Certified Kubernetes Administrator (CKA) - Udemy', 'Kubernetes for Developers (Pluralsight)'], docs: 'https://kubernetes.io/docs' } },
          { skill: 'AWS', priority: 'critical', demand: 90, estimatedHours: 60, resources: { courses: ['AWS Certified Solutions Architect - Associate', 'AWS Hands-On (A Cloud Guru)'], docs: 'https://aws.amazon.com/docs' } },
          { skill: 'Terraform', priority: 'high', demand: 74, estimatedHours: 40, resources: { courses: ['Terraform for DevOps Engineers'], docs: 'https://developer.hashicorp.com/terraform/docs' } },
          { skill: 'Docker Advanced', priority: 'high', demand: 82, estimatedHours: 30, resources: { courses: ['Docker Mastery: Complete Toolset'], docs: 'https://docs.docker.com' } },
          { skill: 'Redis', priority: 'medium', demand: 68, estimatedHours: 20, resources: { courses: ['Redis Complete Developer Course'], docs: 'https://redis.io/docs' } },
        ],
        suggestions: [
          `Focus on Kubernetes first — highest demand for ${targetRole} roles (87%).`,
          'Next, prioritize AWS Solutions Architect certification to unlock senior roles.',
          'Build 1-2 DevOps projects demonstrating end-to-end CI/CD pipelines.',
        ],
      });
    } catch (err) {
      setError(err);
      toastError({ title: 'Could not analyze skill gaps', message: err.message });
    } finally {
      setLoading(false);
    }
  }, [user?.id, targetRole, toastError]);

  useEffect(() => {
    fetchGap();
  }, [fetchGap]);

  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <ErrorState title="Couldn't analyze skill gaps" message={error.message} onRetry={fetchGap} fullHeight size="lg" />
      </div>
    );
  }

  const strengths = gapAnalysis?.strengths || [];
  const gaps = gapAnalysis?.gaps || [];
  const needsImprovement = strengths.filter((s) => (s.proficiency || 0) < 80);
  const trulyStrong = strengths.filter((s) => (s.proficiency || 0) >= 80);
  const missing = gaps;
  const readiness = gapAnalysis?.overallReadiness || 68;

  const roadmap = [
    {
      step: 1,
      title: 'Master Critical Gaps',
      duration: 'Weeks 1-8',
      icon: <FiZap className="w-5 h-5" />,
      color: 'danger',
      description: 'Focus on highest-priority missing skills. Dedicate 15-20 hrs/week.',
      skills: gaps.filter((g) => g.priority === 'critical').map((g) => g.skill),
    },
    {
      step: 2,
      title: 'Strengthen High Priority',
      duration: 'Weeks 9-14',
      icon: <FiTrendingUp className="w-5 h-5" />,
      color: 'warning',
      description: 'Build proficiency in high-priority areas. Start portfolio projects.',
      skills: gaps.filter((g) => g.priority === 'high').map((g) => g.skill),
    },
    {
      step: 3,
      title: 'Build Showcase Projects',
      duration: 'Weeks 15-18',
      icon: <FiAward className="w-5 h-5" />,
      color: 'brand',
      description: 'Apply learned skills to 2-3 production-level portfolio projects with GitHub + README.',
      skills: ['CI/CD', 'Monitoring', 'Architecture'],
    },
    {
      step: 4,
      title: 'Certify & Apply',
      duration: 'Week 19+',
      icon: <FiBriefcase className="w-5 h-5" />,
      color: 'success',
      description: 'Get certified, update resume & LinkedIn, start actively applying to target roles.',
      skills: ['Interview Prep', 'Networking', 'Negotiation'],
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-surface-900 dark:text-surface-50">
            Skill Gap Analysis
          </h1>
          <p className="text-surface-500 dark:text-surface-400 mt-1">
            AI-powered analysis to help you reach your target role
          </p>
        </div>
        <div className="w-full md:w-80">
          <label className="block text-xs font-medium text-surface-500 dark:text-surface-400 mb-1.5 flex items-center gap-1.5">
            <FiTarget className="w-3.5 h-3.5" /> Target Role
          </label>
          <Select
            value={targetRole}
            onChange={setTargetRole}
            options={TARGET_ROLES}
            placeholder="Select target role"
          />
        </div>
      </div>

      {loading ? (
        <SkillGapSkeleton />
      ) : !gapAnalysis ? (
        <EmptyState size="lg" iconName="default" title="No analysis yet" description="Select a target role to see your skill gap analysis." />
      ) : (
        <>
          <Card className="bg-gradient-to-br from-indigo-600 via-brand-600 to-violet-600 text-white border-0 overflow-hidden relative">
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_20%_20%,white,transparent_40%),radial-gradient(circle_at_80%_80%,white,transparent_40%)]" />
            <CardContent className="p-6 md:p-8 relative">
              <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8">
                <div className="w-32 h-32 md:w-40 md:h-40 shrink-0 relative">
                  <ScoreRing value={readiness} size={160} strokeWidth={14} showLabel={false} />
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl md:text-4xl font-bold">{readiness}%</span>
                    <span className="text-xs md:text-sm text-white/80 mt-0.5">Readiness</span>
                  </div>
                </div>
                <div className="flex-1 min-w-0 text-center md:text-left">
                  <Badge variant="default" size="md" className="bg-white/20 border-white/30 text-white mb-3">
                    <FiTarget className="w-3 h-3 mr-1" />
                    {gapAnalysis.targetTitle}
                  </Badge>
                  <h2 className="text-xl md:text-2xl font-bold mb-2">
                    {readiness >= 80 ? 'You are almost there!' : readiness >= 60 ? 'Good foundation, keep going!' : 'Focused training needed'}
                  </h2>
                  <p className="text-white/80 text-sm md:text-base mb-4 max-w-xl">
                    {readiness >= 80
                      ? 'You have most of the required skills. Polish the remaining gaps and start applying confidently!'
                      : readiness >= 60
                        ? `${trulyStrong.length} strong skills • ${needsImprovement.length} need improvement • ${missing.length} critical gaps to close.`
                        : `You're about ${readiness}% ready. Build a strong foundation in the critical gaps first to accelerate your progress.`}
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                    <div className="px-3 py-1.5 rounded-lg bg-white/20 backdrop-blur text-xs font-medium flex items-center gap-1.5">
                      <FiCheckCircle className="w-3.5 h-3.5" /> {trulyStrong.length} Strong
                    </div>
                    <div className="px-3 py-1.5 rounded-lg bg-white/20 backdrop-blur text-xs font-medium flex items-center gap-1.5">
                      <FiAlertTriangle className="w-3.5 h-3.5" /> {needsImprovement.length} Improve
                    </div>
                    <div className="px-3 py-1.5 rounded-lg bg-white/20 backdrop-blur text-xs font-medium flex items-center gap-1.5">
                      <FiCircle className="w-3.5 h-3.5" /> {missing.length} Missing
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <FiCheckCircle className="w-4 h-4" />
                  </div>
                  Strong Skills
                </CardTitle>
                <CardDescription>Your competitive advantages</CardDescription>
              </CardHeader>
              <CardContent className="pt-0 space-y-2.5">
                {trulyStrong.length === 0 ? (
                  <p className="text-sm text-surface-500 dark:text-surface-400 italic py-4 text-center">Keep building your strong skills!</p>
                ) : (
                  trulyStrong.map((s) => (
                    <SkillRow
                      key={s.skill}
                      skill={s.skill}
                      level="success"
                      icon={<FiCheckCircle className="w-4 h-4" />}
                      proficiency={s.proficiency}
                      demand={s.demand}
                    />
                  ))
                )}
                {needsImprovement.length > 0 && (
                  <>
                    <h4 className="text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wide pt-3 pb-1 flex items-center gap-1.5">
                      <FiAlertTriangle className="w-3.5 h-3.5 text-amber-500" /> Needs Improvement
                    </h4>
                    {needsImprovement.map((s) => (
                      <SkillRow
                        key={s.skill}
                        skill={s.skill}
                        level="warning"
                        icon={<FiAlertTriangle className="w-4 h-4" />}
                        proficiency={s.proficiency}
                        demand={s.demand}
                      />
                    ))}
                  </>
                )}
              </CardContent>
            </Card>

            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 flex items-center justify-center">
                      <FiCircle className="w-4 h-4" />
                    </div>
                    Missing Skills
                  </CardTitle>
                  <CardDescription>Highest ROI skills to learn for this role</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  {missing.length === 0 ? (
                    <div className="py-8">
                      <EmptyState size="sm" title="No gaps detected!" description="You have all the key skills for your target role!" iconName="default" />
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                      {missing.map((g) => (
                        <SkillRow
                          key={g.skill}
                          skill={g.skill}
                          level="danger"
                          icon={<FiCircle className="w-4 h-4" />}
                          hours={g.estimatedHours}
                          demand={g.demand}
                          priority={g.priority}
                          resources={g.resources}
                        />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {gapAnalysis.suggestions?.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-brand-100 dark:bg-brand-900/40 text-brand-600 dark:text-brand-400 flex items-center justify-center">
                        <FiZap className="w-4 h-4" />
                      </div>
                      AI Recommendations
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-2">
                    {gapAnalysis.suggestions.map((s, i) => (
                      <div key={i} className="flex gap-3 p-3 rounded-xl bg-brand-50 dark:bg-brand-950/30 border border-brand-100 dark:border-brand-900/50">
                        <span className="w-6 h-6 rounded-full bg-brand-500 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        <p className="text-sm text-brand-900 dark:text-brand-100 leading-relaxed">{s}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <FiCalendar className="w-4 h-4 text-violet-500" />
                    Learning Roadmap
                  </CardTitle>
                  <CardDescription>4-phase plan to close your gaps in ~5 months</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => navigate('/candidate/ai-assistant')} iconRight={<FiChevronRight className="w-4 h-4" />}>
                  Customize with AI
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                {roadmap.map((phase, i) => {
                  const colors = getColorClasses(phase.color);
                  return (
                    <div
                      key={phase.step}
                      className="relative rounded-2xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 p-5 overflow-hidden"
                    >
                      <div className={cn('absolute top-0 right-0 w-24 h-24 rounded-full opacity-20 blur-2xl -mr-10 -mt-10', colors.bg)} />
                      <div className="relative">
                        <div className="flex items-start justify-between mb-3">
                          <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center text-white shadow', colors.bg)}>
                            {phase.icon}
                          </div>
                          <span className="text-[11px] font-mono font-bold text-surface-400 px-2 py-0.5 rounded-md bg-surface-100 dark:bg-surface-800">
                            Phase {phase.step}/4
                          </span>
                        </div>
                        <h4 className="font-semibold text-surface-900 dark:text-surface-50 mb-1">{phase.title}</h4>
                        <p className="text-xs text-surface-500 dark:text-surface-400 mb-3 flex items-center gap-1">
                          <FiClock className="w-3 h-3" /> {phase.duration}
                        </p>
                        <p className="text-xs text-surface-600 dark:text-surface-400 mb-3 leading-relaxed">{phase.description}</p>
                        <div className="flex flex-wrap gap-1">
                          {phase.skills.map(s => (
                            <Badge key={s} variant="soft" size="sm">{s}</Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
