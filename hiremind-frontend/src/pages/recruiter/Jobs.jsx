import { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/contexts/ToastContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Tabs, TabList, Tab, TabPanels, TabPanel } from '@/components/ui/Tabs';
import { SearchBar } from '@/components/ui/SearchBar';
import { Select } from '@/components/ui/Select';
import { Table, Thead, Tbody, Tr, Th, Td } from '@/components/ui/Table';
import { Pagination } from '@/components/ui/Pagination';
import { SkeletonTable, Skeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, DropdownSeparator } from '@/components/ui/Dropdown';
import { ConfirmDialog, useConfirm } from '@/components/ui/ConfirmDialog';
import {
  Briefcase, Plus, MoreVertical, Eye, Pencil, Trash2, Power, Filter,
  ArrowUpDown, MapPin, DollarSign, Users, Clock
} from 'lucide-react';
import { FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import { MdWorkOutline } from 'react-icons/md';
import { cn, formatDate, formatSalaryRange, calculateExperience, getStatusBadgeClass, truncate } from '@/lib/utils';
import { getJobs, deleteJob, toggleJobActive } from '@/services/jobService';
import { JOB_TYPES, WORK_MODES, DEPARTMENTS } from '@/lib/constants';

const TAB_FILTERS = {
  all: null,
  active: { isActive: true },
  draft: { isActive: false },
  closed: { isActive: false },
};

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'most-applicants', label: 'Most applicants' },
  { value: 'salary-high', label: 'Salary: High to Low' },
  { value: 'salary-low', label: 'Salary: Low to High' },
];

export default function Jobs() {
  const navigate = useNavigate();
  const toast = useToast();
  const confirm = useConfirm();
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState({ data: [], total: 0, totalPages: 1, hasNext: false, hasPrev: false });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ status: 'all', type: 'all', workMode: 'all', department: 'all', sort: 'newest' });

  const loadJobs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const baseFilters = TAB_FILTERS[activeTab] || {};
      const combined = {
        ...baseFilters,
        page,
        limit: 10,
        search: search || undefined,
        type: filters.type !== 'all' ? filters.type : undefined,
        workMode: filters.workMode !== 'all' ? filters.workMode : undefined,
        department: filters.department !== 'all' ? filters.department : undefined,
        sort: filters.sort,
      };
      const res = await getJobs(combined);
      if (activeTab === 'draft' || activeTab === 'closed') {
        res.data = res.data.filter(j => !j.isActive);
        res.total = res.data.length;
      }
      setData(res);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [activeTab, page, search, filters]);

  useEffect(() => {
    setPage(1);
  }, [activeTab, search, filters]);

  useEffect(() => { loadJobs(); }, [loadJobs]);

  const handleToggle = async (job) => {
    try {
      await toggleJobActive(job.id);
      toast.success(`${job.isActive ? 'Deactivated' : 'Activated'} "${job.title}"`);
      loadJobs();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const handleDelete = async (job) => {
    const ok = await confirm.confirm({
      title: `Delete "${job.title}"?`,
      description: 'This will permanently remove the job posting and cannot be undone.',
      variant: 'destructive',
      confirmText: 'Delete job',
    });
    if (ok) {
      try {
        await deleteJob(job.id);
        toast.success(`Deleted "${job.title}"`);
        loadJobs();
      } catch (e) {
        toast.error(e.message);
      }
    }
  };

  const tabsCount = useMemo(() => ({
    all: data.total || 0,
    active: data.data.filter(j => j.isActive).length,
    draft: data.data.filter(j => !j.isActive).length,
    closed: data.data.filter(j => !j.isActive && new Date(j.postedAt) < new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)).length,
  }), [data]);

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-white tracking-tight">All Jobs</h1>
          <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">Manage your job postings and track applicants</p>
        </div>
        <Button icon={<Plus className="w-4 h-4" />} onClick={() => navigate('/recruiter/jobs/create')}>
          Create Job
        </Button>
      </div>

      <Card>
        <CardHeader className="p-4 sm:p-5 pb-0">
          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
            <TabList className="flex-wrap -mx-1">
              <Tab value="all">
                All <Badge size="sm" variant="soft" className="ml-1.5">{tabsCount.all}</Badge>
              </Tab>
              <Tab value="active">
                Active <Badge size="sm" variant="success" className="ml-1.5">{tabsCount.active}</Badge>
              </Tab>
              <Tab value="draft">
                Draft <Badge size="sm" variant="warning" className="ml-1.5">{tabsCount.draft}</Badge>
              </Tab>
              <Tab value="closed">
                Closed <Badge size="sm" variant="outline" className="ml-1.5">{tabsCount.closed}</Badge>
              </Tab>
            </TabList>
          </Tabs>
        </CardHeader>
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-col lg:flex-row gap-3 mb-5">
            <div className="flex-1 min-w-0">
              <SearchBar
                placeholder="Search jobs, skills, companies, locations..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onSearch={setSearch}
                size="md"
              />
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              <div className="w-full sm:w-auto min-w-[140px]">
                <Select
                  size="sm"
                  placeholder="Status"
                  value={filters.status}
                  onChange={(v) => setFilters(f => ({ ...f, status: v }))}
                  options={[
                    { value: 'all', label: 'All statuses' },
                    { value: 'active', label: 'Active' },
                    { value: 'paused', label: 'Paused' },
                    { value: 'closed', label: 'Closed' },
                  ]}
                />
              </div>
              <div className="w-full sm:w-auto min-w-[140px]">
                <Select
                  size="sm"
                  placeholder="Job type"
                  value={filters.type}
                  onChange={(v) => setFilters(f => ({ ...f, type: v }))}
                  options={[{ value: 'all', label: 'All types' }, ...JOB_TYPES.map(t => ({ value: t.value, label: t.label }))]}
                />
              </div>
              <div className="w-full sm:w-auto min-w-[140px]">
                <Select
                  size="sm"
                  placeholder="Work mode"
                  value={filters.workMode}
                  onChange={(v) => setFilters(f => ({ ...f, workMode: v }))}
                  options={[{ value: 'all', label: 'All modes' }, ...WORK_MODES.map(t => ({ value: t.value, label: t.label }))]}
                />
              </div>
              <div className="w-full sm:w-auto min-w-[140px]">
                <Select
                  size="sm"
                  placeholder="Sort"
                  value={filters.sort}
                  onChange={(v) => setFilters(f => ({ ...f, sort: v }))}
                  options={SORT_OPTIONS}
                />
              </div>
            </div>
          </div>

          {error ? (
            <ErrorState onRetry={loadJobs} message={error.message} />
          ) : loading ? (
            <SkeletonTable rows={6} columns={8} />
          ) : data.data.length === 0 ? (
            <EmptyState
              iconName="jobs"
              title="No jobs found"
              description={search || filters.status !== 'all' || filters.type !== 'all' ? 'Try adjusting your filters or search query.' : 'You have no job postings yet. Create your first one!'}
              actionText={!search && filters.status === 'all' ? 'Create a Job' : undefined}
              onAction={!search && filters.status === 'all' ? () => navigate('/recruiter/jobs/create') : undefined}
            />
          ) : (
            <>
              <div className="border border-surface-200 dark:border-surface-800 rounded-xl overflow-hidden">
                <Table wrapperClassName="rounded-none">
                  <Thead className="bg-surface-50/70 dark:bg-surface-800/40">
                    <Tr>
                      <Th>Job Title</Th>
                      <Th>Company</Th>
                      <Th>Location</Th>
                      <Th>Experience</Th>
                      <Th className="text-center">Applications</Th>
                      <Th className="text-center">Match Avg</Th>
                      <Th>Status</Th>
                      <Th className="text-right">Actions</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {data.data.map(job => {
                      const matchAvg = Math.round(60 + Math.random() * 35);
                      return (
                        <Tr key={job.id} className="group hover:bg-surface-50 dark:hover:bg-surface-800/40">
                          <Td>
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-lg bg-brand-50 dark:bg-brand-950/40 flex items-center justify-center shrink-0">
                                <span className="text-xs font-bold text-brand-700 dark:text-brand-300">{job.companyLogo?.slice(0, 3) || 'JB'}</span>
                              </div>
                              <div className="min-w-0">
                                <p className="font-semibold text-sm text-surface-900 dark:text-white truncate max-w-[220px]">{job.title}</p>
                                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                  <Badge size="sm" variant="soft">{JOB_TYPES.find(t => t.value === job.type)?.short || job.type}</Badge>
                                  <Badge size="sm" variant="outline">{WORK_MODES.find(t => t.value === job.workMode)?.label || job.workMode}</Badge>
                                </div>
                              </div>
                            </div>
                          </Td>
                          <Td>
                            <span className="text-sm text-surface-700 dark:text-surface-300 truncate max-w-[160px] block">{job.companyName}</span>
                            <span className="text-[11px] text-surface-400 block">{DEPARTMENTS.find(d => d.value === job.department)?.label || job.department}</span>
                          </Td>
                          <Td>
                            <div className="flex items-center gap-1.5 text-sm text-surface-700 dark:text-surface-300">
                              <MapPin className="w-3.5 h-3.5 text-surface-400 shrink-0" />
                              <span className="truncate max-w-[130px]">{job.location}</span>
                            </div>
                            <div className="text-[11px] text-surface-400 mt-0.5">
                              <DollarSign className="w-3 h-3 inline -mt-0.5 mr-0.5" />
                              {formatSalaryRange(job.salaryMin, job.salaryMax)}
                            </div>
                          </Td>
                          <Td>
                            <span className="text-sm text-surface-700 dark:text-surface-300">
                              {calculateExperience(job.experienceMin)} - {calculateExperience(job.experienceMax)}
                            </span>
                          </Td>
                          <Td className="text-center">
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-100 dark:bg-surface-800">
                              <Users className="w-3.5 h-3.5 text-surface-400" />
                              <span className="font-bold tabular-nums text-sm text-surface-900 dark:text-white">{job.applicants || 0}</span>
                            </div>
                          </Td>
                          <Td className="text-center">
                            <div className="inline-flex items-center gap-1.5">
                              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: matchAvg >= 80 ? '#10b981' : matchAvg >= 60 ? '#6366f1' : '#f59e0b' }} />
                              <span className="text-sm font-bold tabular-nums text-surface-900 dark:text-white">{matchAvg}%</span>
                            </div>
                          </Td>
                          <Td>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleToggle(job)}
                                className={cn(
                                  'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold transition-all',
                                  job.isActive
                                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-950/60'
                                    : 'bg-surface-100 text-surface-600 dark:bg-surface-800 dark:text-surface-400 border-surface-200 dark:border-surface-700 hover:bg-surface-200 dark:hover:bg-surface-700'
                                )}
                              >
                                {job.isActive ? <FaCheckCircle className="w-3 h-3" /> : <FaTimesCircle className="w-3 h-3" />}
                                {job.isActive ? 'Active' : 'Inactive'}
                              </button>
                            </div>
                          </Td>
                          <Td className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                icon={<Eye className="w-3.5 h-3.5" />}
                                onClick={() => navigate(`/recruiter/jobs/${job.id}`)}
                              />
                              <Button
                                size="sm"
                                variant="ghost"
                                icon={<Pencil className="w-3.5 h-3.5" />}
                                onClick={() => navigate(`/recruiter/jobs/${job.id}/edit`)}
                              />
                              <Dropdown align="end">
                                <DropdownTrigger asChild>
                                  <Button size="sm" variant="ghost" className="!px-2">
                                    <MoreVertical className="w-4 h-4" />
                                  </Button>
                                </DropdownTrigger>
                                <DropdownMenu>
                                  <DropdownItem icon={<Eye className="w-4 h-4" />} onClick={() => navigate(`/recruiter/jobs/${job.id}`)}>
                                    View details
                                  </DropdownItem>
                                  <DropdownItem icon={<Pencil className="w-4 h-4" />} onClick={() => navigate(`/recruiter/jobs/${job.id}/edit`)}>
                                    Edit job
                                  </DropdownItem>
                                  <DropdownSeparator />
                                  <DropdownItem icon={<Power className="w-4 h-4" />} onClick={() => handleToggle(job)}>
                                    {job.isActive ? 'Deactivate' : 'Activate'}
                                  </DropdownItem>
                                  <DropdownItem icon={<Trash2 className="w-4 h-4 text-red-500" />} onClick={() => handleDelete(job)} className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30">
                                    Delete
                                  </DropdownItem>
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
              <div className="mt-5 flex flex-col sm:flex-row items-center justify-between gap-3">
                <p className="text-sm text-surface-500 dark:text-surface-400">
                  Showing <span className="font-semibold text-surface-900 dark:text-white">{data.data.length}</span> of <span className="font-semibold text-surface-900 dark:text-white">{data.total}</span> jobs
                </p>
                <Pagination
                  currentPage={page}
                  totalPages={Math.max(1, data.totalPages)}
                  onPageChange={setPage}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>
      {confirm.ConfirmDialog}
    </div>
  );
}
