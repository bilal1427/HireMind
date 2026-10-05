import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  FiFileText,
  FiBriefcase,
  FiCalendar,
  FiZap,
  FiTarget,
  FiTrendingUp,
  FiTrendingDown,
  FiChevronRight,
  FiMessageCircle,
  FiMapPin,
  FiClock,
  FiStar,
} from 'react-icons/fi';

import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';

import {
  Button,
} from '@/components/ui/Button';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/Card';

import { Badge } from '@/components/ui/Badge';
import { ScoreRing } from '@/components/ui/ScoreRing';
import { ProgressBar } from '@/components/ui/ProgressBar';

import {
  Skeleton,
  SkeletonCard,
  SkeletonList,
} from '@/components/ui/Skeleton';

import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Avatar } from '@/components/ui/Avatar';

import AIRecommendation from '@/components/ai/AIRecommendation';

import { getProfile } from '@/services/candidateService';
import { getRecommendedJobs } from '@/services/matchingService';
import { getApplications } from '@/services/applicationService';
import { getInterviews } from '@/services/interviewService';
import { getSkillGap } from '@/services/matchingService';

import {
  formatDate,
  calculateExperience,
} from '@/lib/utils';


/* =========================================================
   STAT CARD SKELETON
========================================================= */

function StatCardSkeleton() {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <Skeleton className="h-10 w-10 rounded-lg" />
        <Skeleton className="h-5 w-12 rounded-md" />
      </div>

      <div className="mt-4 space-y-2">
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-3 w-2/3" />
      </div>
    </Card>
  );
}


/* =========================================================
   RECOMMENDED JOB CARD
========================================================= */

function RecommendedJobCard({
  job,
  onView,
  onApply,
}) {
  const skills = Array.isArray(job?.skills)
    ? job.skills
    : [];

  return (
    <Card className="min-w-[300px] md:min-w-[340px] flex-shrink-0 hover:shadow-md transition-shadow">
      <CardContent className="p-5">

        {/* Header */}
        <div className="flex items-start justify-between mb-3">

          <div className="flex items-center gap-3 min-w-0">
            <Avatar
              name={job?.companyName || 'Company'}
              size="md"
            />

            <div className="min-w-0">
              <h4 className="font-semibold text-sm truncate max-w-[160px]">
                {job?.title || 'Untitled Job'}
              </h4>

              <p className="text-xs text-surface-500 dark:text-surface-400 truncate">
                {job?.companyName || 'Company'}
              </p>
            </div>
          </div>

          <Badge
            variant="brand"
            size="md"
          >
            <FiZap className="w-3 h-3 mr-1" />
            {job?.match ?? 0}% Match
          </Badge>

        </div>


        {/* Job Info */}
        <div className="flex flex-wrap gap-2 mb-3 text-xs text-surface-600 dark:text-surface-400">

          <span className="flex items-center gap-1">
            <FiMapPin className="w-3 h-3" />
            {job?.location || 'Remote'}
          </span>

          <span className="flex items-center gap-1">
            <FiClock className="w-3 h-3" />
            {calculateExperience(
              job?.experienceMin || 0
            )}+
          </span>

          <span>
            ₹{job?.salaryMin || 0}-{job?.salaryMax || 0} LPA
          </span>

        </div>


        {/* Skills */}
        <div className="flex flex-wrap gap-1 mb-4">

          {skills.slice(0, 3).map((skill) => (
            <Badge
              key={skill}
              variant="soft"
              size="sm"
            >
              {skill}
            </Badge>
          ))}

          {skills.length > 3 && (
            <Badge
              variant="default"
              size="sm"
            >
              +{skills.length - 3}
            </Badge>
          )}

        </div>


        {/* Buttons */}
        <div className="flex gap-2">

          <Button
            variant="outline"
            size="sm"
            onClick={() => onView(job)}
            fullWidth
          >
            View
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => onApply(job)}
            fullWidth
          >
            Apply
          </Button>

        </div>

      </CardContent>
    </Card>
  );
}


/* =========================================================
   DASHBOARD
========================================================= */

export default function Dashboard() {
  const navigate = useNavigate();

  const { user } = useAuth();

  const {
    error: toastError,
  } = useToast();


  /* =======================================================
     STATE
  ======================================================= */

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState(null);

  const [profile, setProfile] = useState(null);

  const [recommendedJobs, setRecommendedJobs] = useState([]);

  const [applications, setApplications] = useState([]);

  const [interviews, setInterviews] = useState([]);

  const [skillGap, setSkillGap] = useState(null);

  const [profileCompletion, setProfileCompletion] =
    useState(72);

  const [resumeScore, setResumeScore] =
    useState(82);


  /* =======================================================
     FETCH DASHBOARD DATA
  ======================================================= */

  const fetchData = useCallback(
    async () => {
      setLoading(true);
      setError(null);

      try {
        const [
          profileData,
          jobsData,
          appsData,
          interviewsData,
          gapData,
        ] = await Promise.all([

          getProfile(user?.id)
            .catch(() => null),

          getRecommendedJobs(
            user?.id,
            { limit: 6 }
          ).catch(() => ({
            data: [],
          })),

          getApplications({
            candidateId: user?.id,
            limit: 20,
          }).catch(() => ({
            data: [],
            aggregations: {
              byStatus: [],
            },
          })),

          getInterviews({
            candidateId: user?.id,
            upcoming: true,
            limit: 5,
          }).catch(() => ({
            data: [],
          })),

          getSkillGap(user?.id)
            .catch(() => null),

        ]);


        setProfile(profileData);

        setRecommendedJobs(
          jobsData?.data || []
        );

        setApplications(
          appsData?.data || []
        );

        setInterviews(
          interviewsData?.data || []
        );

        setSkillGap(gapData);


        /* Profile completion */
        if (profileData) {
          const skillsCount =
            profileData.skills?.length || 0;

          setProfileCompletion(
            Math.min(
              100,
              Math.round(
                (skillsCount / 12) * 100
              )
            )
          );

          setResumeScore(
            profileData.score || 82
          );
        }

      } catch (err) {
        setError(err);

        toastError({
          title: 'Could not load dashboard',
          message:
            err?.message ||
            'Something went wrong.',
        });

      } finally {
        setLoading(false);
      }
    },
    [
      user?.id,
      toastError,
    ]
  );


  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {
    fetchData();
  }, [fetchData]);


  /* =======================================================
     HANDLERS
  ======================================================= */

  const handleViewJob = (job) => {
    if (!job?.id) return;

    navigate(
      `/candidate/jobs/${job.id}`
    );
  };


  const handleApplyJob = (job) => {
    if (!job?.id) return;

    navigate(
      `/candidate/jobs/${job.id}`
    );
  };


  /* =======================================================
     STATS
  ======================================================= */

  const applicationsThisWeek =
    applications.filter(
      (application) => {
        if (!application?.appliedAt) {
          return false;
        }

        return (
          new Date(
            application.appliedAt
          ) >
          new Date(
            Date.now() -
              7 * 86400000
          )
        );
      }
    ).length;


  const interviewsThisWeek =
    interviews.filter(
      (interview) => {
        if (!interview?.startTime) {
          return false;
        }

        const interviewDate =
          new Date(
            interview.startTime
          );

        return (
          interviewDate >= new Date() &&
          interviewDate <=
            new Date(
              Date.now() +
                7 * 86400000
            )
        );
      }
    ).length;


  const stats = [

    {
      title: 'Profile Completion',
      value: `${profileCompletion}%`,
      delta: '+5%',
      deltaUp: true,
      icon: FiTarget,
      color: 'brand',
      iconBg:
        'bg-brand-100 dark:bg-brand-900/40 text-brand-600 dark:text-brand-400',
      progress: profileCompletion,
    },

    {
      title: 'Resume Score',
      value: resumeScore,
      delta: 'Great',
      deltaUp: true,
      icon: FiFileText,
      color: 'success',
      iconBg:
        'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400',
      ring: true,
    },

    {
      title: 'Recommended Jobs',
      value:
        recommendedJobs.length > 0
          ? Math.min(
              recommendedJobs.length,
              50
            )
          : 12,
      delta: '+3 new',
      deltaUp: true,
      icon: FiBriefcase,
      color: 'info',
      iconBg:
        'bg-sky-100 dark:bg-sky-900/40 text-sky-600 dark:text-sky-400',
    },

    {
      title: 'Applications',
      value: applications.length,
      delta: `+${applicationsThisWeek} this wk`,
      deltaUp: true,
      icon: FiStar,
      color: 'purple',
      iconBg:
        'bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400',
    },

    {
      title: 'Interviews',
      value: interviews.length,
      delta:
        interviews.length > 0
          ? `${interviewsThisWeek} this wk`
          : 'None scheduled',
      deltaUp: interviews.length > 0,
      icon: FiCalendar,
      color: 'warning',
      iconBg:
        'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400',
    },

    {
      title: 'Skill Gaps',
      value:
        skillGap?.gaps?.length || 3,
      delta:
        skillGap?.gaps?.length
          ? `Focus: ${
              skillGap.gaps[0]?.skill ||
              'Kubernetes'
            }`
          : 'All set!',
      deltaUp:
        !skillGap?.gaps?.length,
      icon: FiZap,
      color: 'danger',
      iconBg:
        'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400',
    },

  ];


  /* =======================================================
     AI RECOMMENDATIONS
  ======================================================= */

  const recommendations = [

    {
      icon: FiFileText,
      title: 'Boost your resume score',
      description:
        'Add 2-3 quantified achievements to your experience section to increase score by 15%.',
      color: 'brand',
      cta: 'Edit Resume',
      onClick: () =>
        navigate(
          '/candidate/resume'
        ),
    },

    {
      icon: FiTarget,
      title: '3 roles match your profile',
      description:
        'Senior React, Full Stack Engineer, and Frontend Lead roles have 85%+ match score.',
      color: 'success',
      cta: 'View Jobs',
      onClick: () =>
        navigate(
          '/candidate/jobs'
        ),
    },

    {
      icon: FiTrendingUp,
      title: 'Upskill recommendation',
      description:
        'Learning Next.js & TypeScript advanced patterns will unlock 27% higher salary offers.',
      color: 'warning',
      cta: 'See Skill Gap',
      onClick: () =>
        navigate(
          '/candidate/skill-gap'
        ),
    },

  ];


  /* =======================================================
     ERROR STATE
  ======================================================= */

  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">

        <ErrorState
          title="Couldn't load dashboard"
          message={
            error?.message ||
            'Something went wrong.'
          }
          onRetry={fetchData}
          fullHeight
          size="lg"
        />

      </div>
    );
  }


  /* =======================================================
     PAGE
  ======================================================= */

  return (
    <div className="space-y-6">


      {/* ===================================================
          HEADER
      =================================================== */}

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

        <div>

          <h1 className="text-2xl md:text-3xl font-bold text-surface-900 dark:text-surface-50">
            Hi{' '}
            {user?.name?.split(' ')[0] ||
              'Rahul'}{' '}
            👋
          </h1>

          <p className="text-surface-500 dark:text-surface-400 mt-1">
            {loading
              ? 'Loading your dashboard...'
              : "Let's find your dream job today."}
          </p>

        </div>


        <div className="flex items-center gap-2">

          <Button
            variant="outline"
            size="md"
            onClick={() =>
              navigate(
                '/candidate/jobs'
              )
            }
          >
            <FiBriefcase className="w-4 h-4 mr-1.5" />
            Browse Jobs
          </Button>


          <Button
            variant="primary"
            size="md"
            onClick={() =>
              navigate(
                '/candidate/profile'
              )
            }
          >
            <FiTarget className="w-4 h-4 mr-1.5" />
            Complete Profile
          </Button>

        </div>

      </div>


      {/* ===================================================
          STATISTICS
      =================================================== */}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">

        {loading ? (

          Array.from({
            length: 6,
          }).map((_, index) => (
            <StatCardSkeleton
              key={index}
            />
          ))

        ) : (

          stats.map(
            (stat, index) => {

              const Icon =
                stat.icon;

              return (
                <Card
                  key={index}
                  className="p-5"
                >

                  <div className="flex items-start justify-between mb-4">

                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.iconBg}`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>


                    {stat.delta && (
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-medium ${
                          stat.deltaUp
                            ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-md'
                            : 'text-surface-500 dark:text-surface-400 bg-surface-100 dark:bg-surface-800 px-2 py-0.5 rounded-md'
                        }`}
                      >

                        {stat.deltaUp ? (
                          <FiTrendingUp className="w-3 h-3" />
                        ) : (
                          <FiTrendingDown className="w-3 h-3" />
                        )}

                        {stat.delta}

                      </span>
                    )}

                  </div>


                  {stat.ring ? (

                    <div className="flex items-center gap-3">

                      <ScoreRing
                        value={stat.value}
                        size={56}
                        strokeWidth={6}
                        showLabel={false}
                      />

                      <div>

                        <p className="text-2xl font-bold text-surface-900 dark:text-surface-50">
                          {stat.value}
                        </p>

                        <p className="text-xs text-surface-500 dark:text-surface-400">
                          {stat.title}
                        </p>

                      </div>

                    </div>

                  ) : stat.progress !==
                    undefined ? (

                    <div>

                      <p className="text-2xl font-bold text-surface-900 dark:text-surface-50 mb-1">
                        {stat.value}
                      </p>

                      <p className="text-xs text-surface-500 dark:text-surface-400 mb-2">
                        {stat.title}
                      </p>

                      <ProgressBar
                        value={stat.progress}
                        size="sm"
                        color={stat.color}
                        showValue={false}
                      />

                    </div>

                  ) : (

                    <div>

                      <p className="text-2xl font-bold text-surface-900 dark:text-surface-50">
                        {stat.value}
                      </p>

                      <p className="text-xs text-surface-500 dark:text-surface-400">
                        {stat.title}
                      </p>

                    </div>

                  )}

                </Card>
              );
            }
          )

        )}

      </div>


      {/* ===================================================
          RECOMMENDED JOBS
      =================================================== */}

      <div className="space-y-4">

        <div className="flex items-center justify-between">

          <div>

            <h2 className="text-lg font-semibold text-surface-900 dark:text-surface-50">
              Recommended Jobs
            </h2>

            <p className="text-sm text-surface-500 dark:text-surface-400">
              AI-matched opportunities based on your profile
            </p>

          </div>


          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              navigate(
                '/candidate/jobs'
              )
            }
          >
            View all
            <FiChevronRight className="w-4 h-4 ml-1" />
          </Button>

        </div>


        {loading ? (

          <div className="flex gap-4 overflow-x-auto pb-2">

            {Array.from({
              length: 3,
            }).map((_, index) => (

              <div
                key={index}
                className="min-w-[300px] md:min-w-[340px] flex-shrink-0"
              >
                <SkeletonCard
                  lines={3}
                  imageHeight="h-0"
                  showImage={false}
                />
              </div>

            ))}

          </div>

        ) : recommendedJobs.length ===
          0 ? (

          <EmptyState
            iconName="jobs"
            size="sm"
            title="No recommendations yet"
            description="Complete your profile to unlock personalized job matches."
            actionText="Complete Profile"
            onAction={() =>
              navigate(
                '/candidate/profile'
              )
            }
          />

        ) : (

          <div className="flex gap-4 overflow-x-auto pb-2 scroll-smooth">

            {recommendedJobs.map(
              (job) => (

                <RecommendedJobCard
                  key={job.id}
                  job={job}
                  onView={handleViewJob}
                  onApply={handleApplyJob}
                />

              )
            )}

          </div>

        )}

      </div>


      {/* ===================================================
          INTERVIEWS + AI RECOMMENDATIONS
      =================================================== */}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">


        {/* Upcoming Interviews */}

        <Card className="lg:col-span-1">

          <CardHeader className="pb-3">

            <div className="flex items-center justify-between">

              <div>

                <CardTitle className="text-base">
                  Upcoming Interviews
                </CardTitle>

                <CardDescription>
                  Your scheduled interviews
                </CardDescription>

              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  navigate(
                    '/candidate/interviews'
                  )
                }
              >
                View all
              </Button>

            </div>

          </CardHeader>


          <CardContent className="pt-0">

            {loading ? (

              <SkeletonList
                count={3}
              />

            ) : interviews.length ===
              0 ? (

              <EmptyState
                size="sm"
                title="No interviews yet"
                description="Apply to jobs to get interview invites."
                iconName="default"
              />

            ) : (

              <div className="space-y-3">

                {interviews
                  .slice(0, 4)
                  .map((interview) => (

                    <div
                      key={interview.id}
                      className="flex items-start gap-3 p-3 rounded-lg bg-surface-50 dark:bg-surface-800/50 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors cursor-pointer"
                      onClick={() =>
                        navigate(
                          '/candidate/interviews'
                        )
                      }
                    >

                      <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">

                        <FiCalendar className="w-5 h-5" />

                      </div>


                      <div className="min-w-0 flex-1">

                        <h4 className="text-sm font-semibold text-surface-900 dark:text-surface-50 truncate">
                          {interview.jobTitle ||
                            'Interview'}
                        </h4>

                        <p className="text-xs text-surface-500 dark:text-surface-400 truncate">
                          {interview.companyName ||
                            'Company'}
                        </p>

                        <p className="text-xs mt-1 text-brand-600 dark:text-brand-400 font-medium">

                          {interview.startTime
                            ? formatDate(
                                interview.startTime,
                                'EEE, MMM dd • hh:mm a'
                              )
                            : 'Date not available'}

                        </p>

                      </div>


                      {interview.type && (
                        <Badge
                          variant="info"
                          size="sm"
                        >
                          {interview.type}
                        </Badge>
                      )}

                    </div>

                  ))}

              </div>

            )}

          </CardContent>

        </Card>


        {/* AI Recommendations */}

        <div className="lg:col-span-2 space-y-4">

          <div>

            <h2 className="text-lg font-semibold text-surface-900 dark:text-surface-50">
              AI Recommendations
            </h2>

            <p className="text-sm text-surface-500 dark:text-surface-400">
              Personalized insights to accelerate your search
            </p>

          </div>


          {loading ? (

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

              {Array.from({
                length: 3,
              }).map((_, index) => (

                <SkeletonCard
                  key={index}
                  imageHeight="h-0"
                  showImage={false}
                  lines={3}
                />

              ))}

            </div>

          ) : (

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

              {recommendations.map(
                (recommendation, index) => (

                  <AIRecommendation
                    key={index}
                    {...recommendation}
                  />

                )
              )}

            </div>

          )}

        </div>

      </div>


      {/* ===================================================
          AI ASSISTANT CTA
      =================================================== */}

      <Card className="overflow-hidden relative bg-gradient-to-br from-brand-600 via-brand-500 to-violet-600 text-white border-0">

        <div className="absolute inset-0 opacity-20">

          <div className="absolute -top-10 -left-10 w-40 h-40 rounded-full bg-white blur-3xl" />

          <div className="absolute -bottom-16 -right-16 w-56 h-56 rounded-full bg-violet-300 blur-3xl" />

        </div>


        <CardContent className="relative p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">

          <div className="flex items-center gap-4 flex-1 min-w-0">

            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center shrink-0">

              <FiMessageCircle className="w-7 h-7" />

            </div>


            <div className="min-w-0">

              <h3 className="text-lg md:text-xl font-bold">
                Ask HireMind AI
              </h3>

              <p className="text-white/80 text-sm mt-0.5 truncate">
                Resume tips, salary negotiation, interview prep — your AI career coach is here.
              </p>

            </div>

          </div>


          <Button
            size="lg"
            variant="secondary"
            className="bg-white text-brand-700 hover:bg-white/90 border-white/30 shrink-0"
            onClick={() =>
              navigate(
                '/candidate/ai-assistant'
              )
            }
            icon={
              <FiZap className="w-5 h-5" />
            }
          >
            Start Chatting
          </Button>

        </CardContent>

      </Card>

    </div>
  );
}