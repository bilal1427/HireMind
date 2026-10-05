import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  FiCalendar,
  FiMapPin,
  FiClock,
  FiEye,
  FiZap,
  FiChevronRight,
} from 'react-icons/fi';

import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';

import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Tabs, TabList, Tab } from '@/components/ui/Tabs';
import { Timeline } from '@/components/ui/Timeline';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Avatar } from '@/components/ui/Avatar';
import { ScoreRing } from '@/components/ui/ScoreRing';

import { getApplications } from '@/services/applicationService';
import {
  MOCK_APPLICATIONS,
  MOCK_CANDIDATES,
} from '@/data/mockData';

import {
  formatDate,
  getStatusBadgeClass,
  getScoreTier,
  capitalize,
} from '@/lib/utils';

/* =========================================================
   APPLICATION TABS
========================================================= */

const APPLICATION_TABS = [
  {
    value: 'all',
    label: 'All',
    statuses: null,
  },
  {
    value: 'active',
    label: 'Active',
    statuses: [
      'applied',
      'screening',
      'shortlisted',
      'interview',
    ],
  },
  {
    value: 'shortlisted',
    label: 'Shortlisted',
    statuses: ['shortlisted'],
  },
  {
    value: 'interview',
    label: 'Interview',
    statuses: ['interview'],
  },
  {
    value: 'selected',
    label: 'Selected',
    statuses: ['selected'],
  },
  {
    value: 'rejected',
    label: 'Rejected',
    statuses: ['rejected'],
  },
];

/* =========================================================
   APPLICATION CARD SKELETON
========================================================= */

function ApplicationCardSkeleton() {
  return (
    <SkeletonCard
      lines={4}
      imageHeight="h-0"
      showImage={false}
      className="min-h-[160px]"
    />
  );
}

/* =========================================================
   STATUS TIMELINE
========================================================= */

function StatusTimeline({ application }) {
  const statusOrder = [
    'applied',
    'screening',
    'shortlisted',
    'interview',
    'selected',
  ];

  const currentIdx = statusOrder.indexOf(application.status);
  const rejected = application.status === 'rejected';

  const steps = [
    {
      key: 'applied',
      title: 'Applied',
      date: application.appliedAt,
      state: 'completed',
    },
    {
      key: 'screening',
      title: 'Screening',
      date: application.screeningAt,
      state: currentIdx >= 1 ? 'completed' : 'pending',
    },
    {
      key: 'shortlisted',
      title: 'Shortlisted',
      date: application.shortlistedAt,
      state: currentIdx >= 2 ? 'completed' : 'pending',
    },
    {
      key: 'interview',
      title: 'Interview Scheduled',
      date: application.interviewAt,
      state: currentIdx >= 3 ? 'completed' : 'pending',
    },
    {
      key: 'selected',
      title: 'Offer / Selected',
      date: application.selectedAt,
      state:
        currentIdx >= 4
          ? 'success'
          : rejected
            ? 'error'
            : 'pending',
    },
  ];

  if (rejected) {
    steps[4] = {
      key: 'rejected',
      title: 'Rejected',
      date: application.rejectedAt,
      state: 'error',
    };
  }

  return (
    <Timeline
      steps={steps.map((step) => ({
        ...step,
        date: step.date
          ? formatDate(step.date, 'MMM dd')
          : '',
      }))}
    />
  );
}

/* =========================================================
   APPLICATION CARD
========================================================= */

function ApplicationCard({
  application,
  onView,
  expanded = false,
  onToggle,
}) {
  const navigate = useNavigate();

  const tier = getScoreTier(
    application.overallScore ||
      application.candidateScore ||
      70
  );

  const statusLabel = capitalize(application.status);
  const interviewDate = application.interviewAt;

  const matchScore =
    application.overallScore ||
    application.resumeMatchScore ||
    70;

  return (
    <Card className="hover:shadow-md transition-all border border-surface-200 dark:border-surface-800">
      <CardContent className="p-5">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-4">

          <div className="flex items-start gap-3 min-w-0 flex-1">

            <Avatar
              name={application.companyName}
              size="md"
              className="shrink-0"
            />

            <div className="min-w-0 flex-1">

              <div className="flex flex-wrap items-center gap-2 mb-1">

                <h3
                  className="font-semibold text-surface-900 dark:text-surface-50 truncate cursor-pointer hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
                  onClick={() =>
                    navigate(
                      `/candidate/jobs/${application.jobId}`
                    )
                  }
                >
                  {application.jobTitle}
                </h3>

                <Badge
                  className={getStatusBadgeClass(
                    application.status
                  )}
                  size="sm"
                >
                  {statusLabel}
                </Badge>

              </div>

              <p className="text-sm text-surface-500 dark:text-surface-400 truncate mb-2">
                {application.companyName}
              </p>

              <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-surface-500 dark:text-surface-400">

                <span className="flex items-center gap-1">
                  <FiMapPin className="w-3 h-3" />
                  {application.jobLocation}
                </span>

                <span className="flex items-center gap-1">
                  <FiCalendar className="w-3 h-3" />
                  Applied{' '}
                  {formatDate(
                    application.appliedAt,
                    'MMM dd'
                  )}
                </span>

                {interviewDate &&
                  application.status === 'interview' && (
                    <span className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-medium">
                      <FiClock className="w-3 h-3" />
                      Interview:{' '}
                      {formatDate(
                        interviewDate,
                        'MMM dd, hh:mm a'
                      )}
                    </span>
                  )}

              </div>
            </div>
          </div>

          {/* Match Score */}
          <div className="flex flex-col items-end gap-2 shrink-0">

            <div className="flex items-center gap-2">

              <ScoreRing
                value={matchScore}
                size={48}
                strokeWidth={5}
                showLabel={false}
              />

              <div className="text-right">
                <p className="text-sm font-bold text-surface-900 dark:text-surface-50">
                  {matchScore}%
                </p>

                <p className="text-[10px] text-surface-400 uppercase tracking-wide">
                  Match
                </p>
              </div>

            </div>

            <Badge variant="default" size="sm">
              {capitalize(
                application.jobType || 'Full Time'
              )}
            </Badge>

          </div>
        </div>

        {/* Skills */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {(application.candidateSkills || [])
            .slice(0, 5)
            .map((skill) => (
              <Badge
                key={skill}
                variant="soft"
                size="sm"
              >
                {skill}
              </Badge>
            ))}
        </div>

        {/* Expanded Timeline */}
        {expanded && (
          <div className="border-t border-surface-100 dark:border-surface-800 pt-4 mb-4">

            <h4 className="text-sm font-semibold text-surface-800 dark:text-surface-200 mb-3 flex items-center gap-2">
              <FiZap className="w-4 h-4 text-brand-500" />
              Application Timeline
            </h4>

            <StatusTimeline
              application={application}
            />

          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-surface-100 dark:border-surface-800">

          <div className="flex items-center gap-2">

            <Badge
              variant={tier.color}
              size="sm"
              outline
            >
              {tier.label}
            </Badge>

            {application.bookmarked && (
              <Badge
                variant="warning"
                size="sm"
              >
                Bookmarked
              </Badge>
            )}

          </div>

          <div className="flex items-center gap-1.5">

            <Button
              variant="ghost"
              size="sm"
              onClick={onToggle}
            >
              {expanded
                ? 'Hide details'
                : 'Show details'}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                navigate(
                  `/candidate/jobs/${application.jobId}`
                )
              }
            >
              <FiEye className="w-3.5 h-3.5 mr-1" />
              View Job
            </Button>

          </div>

        </div>

      </CardContent>
    </Card>
  );
}

/* =========================================================
   MAIN APPLICATIONS PAGE
========================================================= */

export default function Applications() {
  const navigate = useNavigate();

  const { user } = useAuth();
  const { error: toastError } = useToast();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [applications, setApplications] = useState([]);

  const [aggregations, setAggregations] = useState({
    byStatus: [],
  });

  const [activeTab, setActiveTab] = useState('all');

  const [expanded, setExpanded] = useState(null);

  /* =======================================================
     FETCH APPLICATIONS
  ======================================================= */

  const fetchApplications = useCallback(
    async () => {
      setLoading(true);
      setError(null);

      try {
        const tabConfig =
          APPLICATION_TABS.find(
            (tab) => tab.value === activeTab
          );

        const primaryId =
          user?.id || 'cand_2001';

        const fallbackId =
          MOCK_CANDIDATES[0]?.id || primaryId;

        let res;

        try {
          /* ------------------------------------------------
             Try API with logged-in candidate
          ------------------------------------------------ */

          res = await getApplications({
            candidateId: primaryId,

            status:
              tabConfig?.statuses?.length === 1
                ? tabConfig.statuses[0]
                : undefined,

            limit: 30,
          });

          /* ------------------------------------------------
             If no data, try fallback candidate
          ------------------------------------------------ */

          if ((res?.data?.length || 0) === 0) {
            res = await getApplications({
              candidateId: fallbackId,

              status:
                tabConfig?.statuses?.length === 1
                  ? tabConfig.statuses[0]
                  : undefined,

              limit: 30,
            });
          }
        } catch (innerErr) {
          /* ----------------------------------------------
             API failed → use mock data
          ---------------------------------------------- */

          const candidateApps =
            MOCK_APPLICATIONS.filter(
              (application) =>
                application.candidateId ===
                fallbackId
            );

          res = {
            data: candidateApps,

            aggregations: {
              byStatus: [
                {
                  status: 'applied',
                  count: candidateApps.filter(
                    (a) =>
                      a.status === 'applied'
                  ).length,
                },

                {
                  status: 'screening',
                  count: candidateApps.filter(
                    (a) =>
                      a.status === 'screening'
                  ).length,
                },

                {
                  status: 'shortlisted',
                  count: candidateApps.filter(
                    (a) =>
                      a.status === 'shortlisted'
                  ).length,
                },

                {
                  status: 'interview',
                  count: candidateApps.filter(
                    (a) =>
                      a.status === 'interview'
                  ).length,
                },

                {
                  status: 'selected',
                  count: candidateApps.filter(
                    (a) =>
                      a.status === 'selected'
                  ).length,
                },

                {
                  status: 'rejected',
                  count: candidateApps.filter(
                    (a) =>
                      a.status === 'rejected'
                  ).length,
                },
              ],
            },
          };

          /* ----------------------------------------------
             Filter mock data for single status
          ---------------------------------------------- */

          if (
            tabConfig?.statuses?.length === 1
          ) {
            res.data = res.data.filter(
              (application) =>
                application.status ===
                tabConfig.statuses[0]
            );
          }
        }

        /* =================================================
           FILTER DATA
        ================================================= */

        let data = res?.data || [];

        if (
          tabConfig?.statuses &&
          tabConfig.statuses.length > 1
        ) {
          data = data.filter((application) =>
            tabConfig.statuses.includes(
              application.status
            )
          );
        }

        /* =================================================
           UPDATE STATE
        ================================================= */

        setApplications(data);

        setAggregations(
          res?.aggregations || {
            byStatus: [],
          }
        );
      } catch (err) {
        setError(err);

        toastError({
          title: 'Could not load applications',
          message:
            err?.message ||
            'Something went wrong while loading applications.',
        });
      } finally {
        setLoading(false);
      }
    },
    [user?.id, activeTab, toastError]
  );

  /* =======================================================
     LOAD APPLICATIONS
  ======================================================= */

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  /* =======================================================
     TAB COUNT
  ======================================================= */

  const getTabCount = (tabValue) => {
    const tab =
      APPLICATION_TABS.find(
        (item) => item.value === tabValue
      );

    if (!tab) {
      return 0;
    }

    /* All */
    if (!tab.statuses) {
      return (
        aggregations.byStatus?.reduce(
          (sum, item) =>
            sum + (item.count || 0),
          0
        ) || 0
      );
    }

    /* Specific status */
    return (
      aggregations.byStatus
        ?.filter((item) =>
          tab.statuses.includes(
            item.status
          )
        )
        .reduce(
          (sum, item) =>
            sum + (item.count || 0),
          0
        ) || 0
    );
  };

  /* =======================================================
     ERROR STATE
  ======================================================= */

  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">

        <ErrorState
          title="Couldn't load applications"
          message={
            error?.message ||
            'Something went wrong.'
          }
          onRetry={fetchApplications}
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
          PAGE HEADER
      =================================================== */}

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

        <div>

          <h1 className="text-2xl md:text-3xl font-bold text-surface-900 dark:text-surface-50">
            My Applications
          </h1>

          <p className="text-surface-500 dark:text-surface-400 mt-1">
            Track and manage all your job applications
          </p>

        </div>

        <div className="flex items-center gap-2">

          <Button
            variant="primary"
            size="md"
            onClick={() =>
              navigate('/candidate/jobs')
            }
            iconRight={
              <FiChevronRight className="w-4 h-4" />
            }
          >
            Browse More Jobs
          </Button>

        </div>

      </div>

      {/* ===================================================
          APPLICATION TABS
      =================================================== */}

      <Card>
        <CardContent className="p-4">

          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
          >

            <TabList className="w-full overflow-x-auto flex-nowrap">

              {APPLICATION_TABS.map(
                (tab) => (
                  <Tab
                    key={tab.value}
                    value={tab.value}
                  >

                    {tab.label}

                    <Badge
                      variant="default"
                      size="sm"
                      className="ml-1.5 !py-0 !px-1.5 text-[10px] min-w-[18px] h-[18px] flex items-center justify-center"
                    >
                      {getTabCount(
                        tab.value
                      )}
                    </Badge>

                  </Tab>
                )
              )}

            </TabList>

          </Tabs>

        </CardContent>
      </Card>

      {/* ===================================================
          CONTENT
      =================================================== */}

      {loading ? (

        /* Loading */
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">

          {Array.from({
            length: 4,
          }).map((_, index) => (
            <ApplicationCardSkeleton
              key={index}
            />
          ))}

        </div>

      ) : applications.length === 0 ? (

        /* Empty */
        <EmptyState
          size="lg"
          iconName="documents"
          title="No applications found"
          description={
            activeTab === 'all'
              ? "You haven't applied to any jobs yet. Start browsing and apply to roles that match your profile."
              : `No applications in "${
                  APPLICATION_TABS.find(
                    (tab) =>
                      tab.value === activeTab
                  )?.label
                }" status.`
          }
          actionText="Browse Jobs"
          onAction={() =>
            navigate('/candidate/jobs')
          }
        />

      ) : (

        /* Application Cards */
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">

          {applications.map(
            (application) => (
              <ApplicationCard
                key={application.id}
                application={application}
                expanded={
                  expanded === application.id
                }
                onToggle={() =>
                  setExpanded(
                    (previous) =>
                      previous ===
                      application.id
                        ? null
                        : application.id
                  )
                }
                onView={() =>
                  navigate(
                    `/candidate/jobs/${application.jobId}`
                  )
                }
              />
            )
          )}

        </div>

      )}

    </div>
  );
}