import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  FiArrowLeft, FiMapPin, FiClock, FiDollarSign, FiWifi, FiBriefcase,
  FiSend, FiBookmark, FiMessageCircle, FiCheckCircle, FiAlertCircle, FiX,
  FiCalendar, FiUsers, FiEye, FiFileText, FiZap, FiChevronRight,
} from 'react-icons/fi';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Tabs, TabList, Tab, TabPanels, TabPanel } from '@/components/ui/Tabs';
import { Avatar } from '@/components/ui/Avatar';
import { Skeleton, SkeletonCard, SkeletonText } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import MatchBreakdown from '@/components/ai/MatchBreakdown';
import { ScoreRing } from '@/components/ui/ScoreRing';
import { getJobById } from '@/services/jobService';
import { getMatchScore } from '@/services/matchingService';
import { applyToJob } from '@/services/applicationService';
import { MOCK_JOBS, MOCK_CANDIDATES } from '@/data/mockData';
import { formatDate, calculateExperience, capitalize, getColorClasses } from '@/lib/utils';

function JobDetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-5 w-32" />
      <SkeletonCard lines={6} imageHeight="h-0" showImage={false} />
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
        <SkeletonCard lines={12} imageHeight="h-0" showImage={false} />
        <SkeletonCard lines={8} imageHeight="h-0" showImage={false} />
      </div>
    </div>
  );
}

export default function JobDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [job, setJob] = useState(null);
  const [match, setMatch] = useState(null);
  const [applying, setApplying] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const fetchData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const fallbackJob = MOCK_JOBS.find(j => j.id === id) || MOCK_JOBS.find(j => j.isActive) || MOCK_JOBS[0];
      const fallbackCandId = MOCK_CANDIDATES[0]?.id || 'cand_2001';
      let jobData;
      try {
        jobData = await getJobById(id);
      } catch (innerErr) {
        jobData = fallbackJob;
      }
      let matchData;
      try {
        matchData = await getMatchScore(user?.id || fallbackCandId, jobData?.id || id).catch(() => null);
      } catch (innerErr2) {
        const cand = MOCK_CANDIDATES.find(c => c.id === (user?.id || fallbackCandId)) || MOCK_CANDIDATES[0];
        const skillIntersect = (cand?.skills || []).filter(s => (jobData?.skills || []).includes(s));
        const missing = (jobData?.skills || []).filter(s => !(cand?.skills || []).includes(s));
        matchData = {
          overallScore: Math.round(55 + Math.random() * 45),
          skillScore: jobData?.skills?.length ? Math.round((skillIntersect.length / jobData.skills.length) * 100) : 70,
          experienceScore: Math.round(50 + Math.random() * 50),
          locationScore: Math.round(40 + Math.random() * 60),
          educationScore: Math.round(50 + Math.random() * 50),
          matchedSkills: skillIntersect,
          missingSkills: missing,
          extraSkills: (cand?.skills || []).filter(s => !(jobData?.skills || []).includes(s)).slice(0, 5),
        };
      }
      setJob(jobData);
      setMatch(matchData || {
        overallScore: Math.round(55 + Math.random() * 45),
        skillScore: Math.round(50 + Math.random() * 50),
        experienceScore: Math.round(50 + Math.random() * 50),
        locationScore: Math.round(40 + Math.random() * 60),
        educationScore: Math.round(50 + Math.random() * 50),
        matchedSkills: ['React', 'TypeScript', 'Node.js'],
        missingSkills: ['Kubernetes', 'Terraform'],
        extraSkills: ['Vue.js'],
      });
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [id, user?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleApply = async () => {
    if (!job) return;
    setApplying(true);
    try {
      await applyToJob(job.id, { id: user?.id || 'cand_2001', name: user?.name });
      success({ title: 'Application submitted!', message: `You've applied to ${job.title} at ${job.companyName}.` });
    } catch (err) {
      toastError({ title: 'Apply failed', message: err.message });
    } finally {
      setApplying(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await new Promise(r => setTimeout(r, 400));
      setIsSaved(prev => !prev);
      success({ title: isSaved ? 'Removed from saved' : 'Job saved!', message: isSaved ? 'Removed from your saved jobs.' : 'Added to your saved jobs.' });
    } catch (err) {
      toastError({ title: 'Failed', message: err.message });
    } finally {
      setSaving(false);
    }
  };

  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <ErrorState title="Couldn't load job details" message={error.message} onRetry={fetchData} fullHeight size="lg" />
      </div>
    );
  }

  if (loading || !job) {
    return (
      <div className="space-y-6">
        <button onClick={() => navigate('/candidate/jobs')} className="inline-flex items-center gap-2 text-sm text-surface-500 dark:text-surface-400 hover:text-brand-600 dark:hover:text-brand-400">
          <FiArrowLeft className="w-4 h-4" /> Back to jobs
        </button>
        <JobDetailSkeleton />
      </div>
    );
  }

  const workModeLabels = { remote: 'Remote', hybrid: 'Hybrid', onsite: 'On-site' };
  const typeLabels = { 'full-time': 'Full Time', 'part-time': 'Part Time', contract: 'Contract', internship: 'Internship', freelance: 'Freelance' };
  const overall = match?.overallScore || 82;

  const breakdownItems = [
    { label: 'Skill Match', value: match?.skillScore || 85, color: 'success' },
    { label: 'Experience Match', value: match?.experienceScore || 72, color: 'brand' },
    { label: 'Location Match', value: match?.locationScore || 78, color: 'info' },
    { label: 'Overall Match', value: overall, color: 'purple' },
  ];

  const matchedSkills = match?.matchedSkills || job.skills.filter((_, i) => i < Math.ceil(job.skills.length * 0.6));
  const missingSkills = match?.missingSkills || job.skills.filter((_, i) => i >= Math.ceil(job.skills.length * 0.6));
  const partialSkills = [];
  const preferred = job.requirements?.slice(Math.ceil(job.requirements.length / 2)) || [];
  const required = job.requirements?.slice(0, Math.ceil(job.requirements.length / 2)) || job.requirements || [];

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate('/candidate/jobs')}
        className="inline-flex items-center gap-2 text-sm text-surface-500 dark:text-surface-400 hover:text-brand-600 dark:hover:text-brand-400 font-medium"
      >
        <FiArrowLeft className="w-4 h-4" /> Back to jobs
      </button>

      <Card className="overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-brand-500 via-indigo-500 to-violet-500" />
        <CardContent className="p-5 md:p-7">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-5">
            <div className="flex items-start gap-4 min-w-0">
              <Avatar name={job.companyName} size="xl" className="shrink-0 rounded-2xl" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <h1 className="text-xl md:text-2xl font-bold text-surface-900 dark:text-surface-50 truncate">
                    {job.title}
                  </h1>
                  {job.isFeatured && (
                    <Badge variant="warning" size="sm" icon={<FiZap className="w-3 h-3 mr-0.5" />}>
                      Featured
                    </Badge>
                  )}
                </div>
                <Link to="#" className="text-brand-600 dark:text-brand-400 font-medium hover:underline text-sm">
                  {job.companyName}
                </Link>
                <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3 text-sm text-surface-600 dark:text-surface-400">
                  <span className="flex items-center gap-1.5"><FiMapPin className="w-4 h-4 text-surface-400" />{job.location}</span>
                  <span className="flex items-center gap-1.5"><FiWifi className="w-4 h-4 text-surface-400" />{workModeLabels[job.workMode] || job.workMode}</span>
                  <span className="flex items-center gap-1.5"><FiClock className="w-4 h-4 text-surface-400" />{calculateExperience(job.experienceMin)} - {calculateExperience(job.experienceMax)} exp</span>
                  <span className="flex items-center gap-1.5"><FiDollarSign className="w-4 h-4 text-surface-400" />₹{job.salaryMin} - {job.salaryMax} LPA</span>
                  <span className="flex items-center gap-1.5"><FiCalendar className="w-4 h-4 text-surface-400" />Posted {formatDate(job.postedAt, 'MMM dd')}</span>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-4">
                  <Badge variant="info" size="md">{typeLabels[job.type] || job.type}</Badge>
                  <Badge variant="soft" size="md">{job.companyIndustry || 'Technology'}</Badge>
                  <Badge variant="default" size="md">{job.applicants || 0} applicants</Badge>
                  <Badge variant="default" size="md"><FiEye className="w-3 h-3 mr-1" />{job.views || 0} views</Badge>
                </div>
              </div>
            </div>
            <div className="flex md:flex-col gap-3 shrink-0 md:w-auto w-full">
              <Button variant="primary" size="lg" fullWidth onClick={handleApply} isLoading={applying} icon={<FiSend className="w-4 h-4 mr-1.5" />}>
                Apply Now
              </Button>
              <div className="flex md:flex-col gap-2">
                <Button variant={isSaved ? 'brand' : 'outline'} size="md" fullWidth onClick={handleSave} isLoading={saving} icon={<FiBookmark className="w-4 h-4 mr-1.5" />}>
                  {isSaved ? 'Saved' : 'Save Job'}
                </Button>
                <Button variant="outline" size="md" fullWidth onClick={() => navigate('/candidate/ai-assistant')} icon={<FiMessageCircle className="w-4 h-4 mr-1.5" />}>
                  Ask AI
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-0 border-b border-surface-100 dark:border-surface-800">
              <Tabs defaultValue="description">
                <TabList className="w-full -mb-px border-b-0">
                  <Tab value="description">Description</Tab>
                  <Tab value="responsibilities">Responsibilities</Tab>
                  <Tab value="benefits">Benefits</Tab>
                </TabList>
              </Tabs>
            </CardHeader>
            <CardContent className="pt-5">
              <Tabs defaultValue="description">
                <TabPanels>
                  <TabPanel value="description">
                    <div className="space-y-4">
                      <p className="text-surface-700 dark:text-surface-300 leading-relaxed">
                        {job.description}
                      </p>
                      <div>
                        <h4 className="font-semibold text-surface-900 dark:text-surface-50 mb-3 flex items-center gap-2">
                          <FiFileText className="w-4 h-4 text-brand-500" /> About the Team
                        </h4>
                        <p className="text-surface-700 dark:text-surface-300 leading-relaxed text-sm">
                          Join a high-performing team of engineers building products that impact millions of users. We follow agile methodology, invest heavily in career growth, and encourage innovation.
                        </p>
                      </div>
                      <div>
                        <h4 className="font-semibold text-surface-900 dark:text-surface-50 mb-3">Required Skills</h4>
                        <div className="space-y-2">
                          {required.map((req, i) => (
                            <div key={i} className="flex gap-2.5 text-sm">
                              <FiCheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                              <span className="text-surface-700 dark:text-surface-300">{req}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      {preferred.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-surface-900 dark:text-surface-50 mb-3">Preferred / Nice to Have</h4>
                          <div className="space-y-2">
                            {preferred.map((req, i) => (
                              <div key={i} className="flex gap-2.5 text-sm">
                                <FiAlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                                <span className="text-surface-700 dark:text-surface-300">{req}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </TabPanel>
                  <TabPanel value="responsibilities">
                    <div className="space-y-2.5">
                      {job.responsibilities?.length ? (
                        job.responsibilities.map((r, i) => (
                          <div key={i} className="flex gap-3 p-3 rounded-lg bg-surface-50 dark:bg-surface-800/40">
                            <span className="w-6 h-6 rounded-full bg-brand-100 dark:bg-brand-900/40 text-brand-600 dark:text-brand-400 flex items-center justify-center text-xs font-bold shrink-0">
                              {i + 1}
                            </span>
                            <span className="text-sm text-surface-700 dark:text-surface-300 leading-relaxed">{r}</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-surface-500 dark:text-surface-400 text-sm">Responsibilities not specified.</p>
                      )}
                    </div>
                  </TabPanel>
                  <TabPanel value="benefits">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {job.benefits?.length ? (
                        job.benefits.map((b, i) => (
                          <div key={i} className="flex items-start gap-3 p-4 rounded-xl border border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-800/40">
                            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                              <FiCheckCircle className="w-4 h-4" />
                            </div>
                            <span className="text-sm text-surface-700 dark:text-surface-300 leading-relaxed pt-0.5">{b}</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-surface-500 dark:text-surface-400 text-sm">Benefits not specified.</p>
                      )}
                    </div>
                  </TabPanel>
                </TabPanels>
              </Tabs>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FiBriefcase className="w-4 h-4 text-brand-500" /> Skills Required
              </CardTitle>
              <CardDescription>{job.skills.length} skills mentioned in this job</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-5">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <FiCheckCircle className="w-4 h-4 text-emerald-500" />
                    <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">Matched ({matchedSkills.length})</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {matchedSkills.map(s => (
                      <Badge key={s} variant="success" size="md">{s}</Badge>
                    ))}
                  </div>
                </div>
                {partialSkills.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <FiAlertCircle className="w-4 h-4 text-amber-500" />
                      <span className="text-sm font-medium text-amber-700 dark:text-amber-400">Partial ({partialSkills.length})</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {partialSkills.map(s => (
                        <Badge key={s} variant="warning" size="md">{s}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {missingSkills.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <FiX className="w-4 h-4 text-red-500" />
                      <span className="text-sm font-medium text-red-700 dark:text-red-400">Missing / to Learn ({missingSkills.length})</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {missingSkills.map(s => (
                        <Badge key={s} variant="danger" size="md" outline>{s}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-brand-200 dark:border-brand-800">
            <CardHeader className="pb-4">
              <CardTitle className="text-base flex items-center gap-2">
                <FiZap className="w-4 h-4 text-brand-500" /> AI Compatibility
              </CardTitle>
              <CardDescription>How well do you fit this role?</CardDescription>
            </CardHeader>
            <CardContent className="pt-0 space-y-5">
              <div className="flex items-center justify-center py-3">
                <div className="relative">
                  <ScoreRing value={overall} size={120} strokeWidth={12} />
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold text-surface-900 dark:text-surface-50">{overall}%</span>
                    <span className="text-xs text-surface-500 dark:text-surface-400">Match</span>
                  </div>
                </div>
              </div>
              <MatchBreakdown items={breakdownItems} />
              {missingSkills.length > 0 && (
                <Button variant="outline" size="sm" fullWidth onClick={() => navigate('/candidate/skill-gap')} iconRight={<FiChevronRight className="w-4 h-4" />}>
                  View Skill Gap Analysis
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FiUsers className="w-4 h-4 text-indigo-500" /> About Company
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              <div className="flex items-center gap-3">
                <Avatar name={job.companyName} size="lg" className="rounded-xl" />
                <div>
                  <h4 className="font-semibold text-surface-900 dark:text-surface-50">{job.companyName}</h4>
                  <p className="text-xs text-surface-500 dark:text-surface-400">{job.companyIndustry || 'Technology'}</p>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-surface-600 dark:text-surface-400">
                  <FiMapPin className="w-4 h-4 text-surface-400" /> HQ: {job.location}
                </div>
                <div className="flex items-center gap-2 text-surface-600 dark:text-surface-400">
                  <FiBriefcase className="w-4 h-4 text-surface-400" /> {job.companyIndustry || 'IT Services'}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
