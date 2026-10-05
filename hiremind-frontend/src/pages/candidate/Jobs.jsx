import { useEffect, useState, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FiBriefcase, FiMapPin, FiClock, FiZap, FiFilter, FiX, FiChevronDown,
  FiSearch, FiDollarSign, FiWifi, FiGrid, FiList,
} from 'react-icons/fi';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { SearchBar } from '@/components/ui/SearchBar';
import { Select } from '@/components/ui/Select';
import { Pagination } from '@/components/ui/Pagination';
import { Skeleton, SkeletonCard } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Avatar } from '@/components/ui/Avatar';
import { Input } from '@/components/ui/Input';
import {
  FilterPanel, FilterSection, FilterCheckbox,
} from '@/components/ui/FilterPanel';
import { getJobs } from '@/services/jobService';
import { MOCK_JOBS } from '@/data/mockData';
import { calculateExperience, formatDate, formatSalaryRange, truncate, debounce } from '@/lib/utils';
import { JOB_TYPES, WORK_MODES, SKILL_CATEGORIES, EXPERIENCE_LEVELS, LOCATIONS } from '@/lib/constants';

const ALL_SKILLS = SKILL_CATEGORIES.flatMap(c => c.skills);

function JobCardSkeleton() {
  return <SkeletonCard lines={4} imageHeight="h-0" showImage={false} className="min-h-[200px]" />;
}

function JobCard({ job, onView }) {
  const matchScore = job.match || Math.round(60 + Math.random() * 40);
  const workModeLabels = { remote: 'Remote', hybrid: 'Hybrid', onsite: 'On-site' };
  const typeLabels = { 'full-time': 'Full Time', 'part-time': 'Part Time', contract: 'Contract', internship: 'Internship', freelance: 'Freelance' };

  return (
    <Card className="hover:shadow-md transition-all cursor-pointer group border border-surface-200 dark:border-surface-800" onClick={() => onView(job)}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3 gap-3">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <Avatar name={job.companyName} size="md" className="shrink-0" />
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-surface-900 dark:text-surface-50 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors truncate">
                {job.title}
              </h3>
              <p className="text-sm text-surface-500 dark:text-surface-400 truncate">{job.companyName}</p>
            </div>
          </div>
          <Badge variant={matchScore >= 80 ? 'brand' : matchScore >= 60 ? 'success' : matchScore >= 40 ? 'warning' : 'default'} size="md" className="shrink-0">
            <FiZap className="w-3 h-3 mr-1" />
            {matchScore}%
          </Badge>
        </div>
        <div className="flex flex-wrap gap-x-3 gap-y-1.5 mb-3 text-xs text-surface-600 dark:text-surface-400">
          <span className="flex items-center gap-1"><FiMapPin className="w-3 h-3" />{job.location}</span>
          <span className="flex items-center gap-1"><FiWifi className="w-3 h-3" />{workModeLabels[job.workMode] || job.workMode}</span>
          <span className="flex items-center gap-1"><FiClock className="w-3 h-3" />{calculateExperience(job.experienceMin)} - {calculateExperience(job.experienceMax)}</span>
          <span className="flex items-center gap-1"><FiDollarSign className="w-3 h-3" />₹{job.salaryMin}-{job.salaryMax} LPA</span>
        </div>
        <div className="flex flex-wrap gap-1.5 mb-4">
          {job.skills.slice(0, 4).map(s => (
            <Badge key={s} variant="soft" size="sm">{s}</Badge>
          ))}
          {job.skills.length > 4 && (
            <Badge variant="default" size="sm">+{job.skills.length - 4}</Badge>
          )}
        </div>
        <div className="flex items-center justify-between pt-3 border-t border-surface-100 dark:border-surface-800">
          <div className="flex items-center gap-2">
            <Badge variant="info" size="sm">{typeLabels[job.type] || job.type}</Badge>
            <span className="text-xs text-surface-400">{formatDate(job.postedAt, 'MMM dd')}</span>
          </div>
          <span className="text-xs text-surface-500 dark:text-surface-400">
            {job.applicants || 0} applicants
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function FilterBottomSheet({ isOpen, onClose, filters, onFiltersChange }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end md:hidden">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-h-[85vh] bg-white dark:bg-surface-900 rounded-t-3xl border border-surface-200 dark:border-surface-800 shadow-2xl overflow-hidden flex flex-col animate-slide-up">
        <div className="flex items-center justify-between p-4 border-b border-surface-100 dark:border-surface-800 shrink-0">
          <h3 className="font-semibold text-lg text-surface-900 dark:text-surface-50">Filters</h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-500">
            <FiX className="w-5 h-5" />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 p-2">
          <FilterContent filters={filters} onFiltersChange={onFiltersChange} compact />
        </div>
        <div className="p-4 border-t border-surface-100 dark:border-surface-800 shrink-0 flex gap-2">
          <Button variant="outline" size="md" fullWidth onClick={() => { onFiltersChange({}); onClose(); }}>
            Clear All
          </Button>
          <Button variant="primary" size="md" fullWidth onClick={onClose}>
            Apply Filters
          </Button>
        </div>
      </div>
    </div>
  );
}

function FilterContent({ filters, onFiltersChange, compact = false }) {
  const handleWorkModeToggle = (mode) => {
    const current = filters.workMode || [];
    const next = current.includes(mode) ? current.filter(m => m !== mode) : [...current, mode];
    onFiltersChange({ ...filters, workMode: next });
  };

  const handleTypeToggle = (type) => {
    const current = filters.types || [];
    const next = current.includes(type) ? current.filter(t => t !== type) : [...current, type];
    onFiltersChange({ ...filters, types: next });
  };

  const handleSkillToggle = (skill) => {
    const current = filters.skills || [];
    const next = current.includes(skill) ? current.filter(s => s !== skill) : [...current, skill];
    onFiltersChange({ ...filters, skills: next });
  };

  const handleLocationToggle = (loc) => {
    const current = filters.locations || [];
    const next = current.includes(loc) ? current.filter(l => l !== loc) : [...current, loc];
    onFiltersChange({ ...filters, locations: next });
  };

  return (
    <div className="space-y-0">
      <FilterSection id="location" title="Location" icon={<FiMapPin className="w-full h-full" />}>
        <div className="max-h-48 overflow-y-auto space-y-0.5">
          {LOCATIONS.map(loc => (
            <FilterCheckbox
              key={loc.value}
              label={loc.label}
              checked={(filters.locations || []).includes(loc.label.split(',')[0]) || (filters.locations || []).includes(loc.label)}
              onChange={() => handleLocationToggle(loc.label.split(',')[0])}
            />
          ))}
        </div>
      </FilterSection>

      <FilterSection id="experience" title="Experience" icon={<FiBriefcase className="w-full h-full" />}>
        <div className="space-y-0.5">
          {EXPERIENCE_LEVELS.map(level => (
            <FilterCheckbox
              key={level.value}
              label={`${level.label} (${level.min}-${level.max} yrs)`}
              checked={(filters.experienceLevels || []).includes(level.value)}
              onChange={() => {
                const current = filters.experienceLevels || [];
                const next = current.includes(level.value) ? current.filter(v => v !== level.value) : [...current, level.value];
                onFiltersChange({ ...filters, experienceLevels: next });
              }}
            />
          ))}
        </div>
      </FilterSection>

      <FilterSection id="salary" title="Salary Range (LPA)" icon={<FiDollarSign className="w-full h-full" />}>
        <div className="space-y-3 px-1 py-2">
          <div>
            <label className="block text-xs text-surface-500 dark:text-surface-400 mb-1">Min (LPA)</label>
            <Input
              size="sm"
              type="number"
              min={0}
              value={filters.salaryMin || ''}
              onChange={e => onFiltersChange({ ...filters, salaryMin: e.target.value ? Number(e.target.value) : undefined })}
              placeholder="e.g. 5"
            />
          </div>
          <div>
            <label className="block text-xs text-surface-500 dark:text-surface-400 mb-1">Max (LPA)</label>
            <Input
              size="sm"
              type="number"
              min={0}
              value={filters.salaryMax || ''}
              onChange={e => onFiltersChange({ ...filters, salaryMax: e.target.value ? Number(e.target.value) : undefined })}
              placeholder="e.g. 30"
            />
          </div>
        </div>
      </FilterSection>

      <FilterSection id="jobType" title="Job Type" icon={<FiClock className="w-full h-full" />}>
        <div className="space-y-0.5">
          {JOB_TYPES.map(t => (
            <FilterCheckbox
              key={t.value}
              label={t.label}
              checked={(filters.types || []).includes(t.value)}
              onChange={() => handleTypeToggle(t.value)}
            />
          ))}
        </div>
      </FilterSection>

      <FilterSection id="workMode" title="Work Mode" icon={<FiWifi className="w-full h-full" />}>
        <div className="space-y-0.5">
          {WORK_MODES.map(m => (
            <FilterCheckbox
              key={m.value}
              label={m.label}
              checked={(filters.workMode || []).includes(m.value)}
              onChange={() => handleWorkModeToggle(m.value)}
            />
          ))}
        </div>
      </FilterSection>

      <FilterSection id="skills" title="Skills" icon={<FiZap className="w-full h-full" />}>
        <div className="flex flex-wrap gap-1.5">
          {ALL_SKILLS.slice(0, 30).map(skill => {
            const selected = (filters.skills || []).includes(skill);
            return (
              <button
                key={skill}
                type="button"
                onClick={() => handleSkillToggle(skill)}
                className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all border ${
                  selected
                    ? 'bg-brand-600 text-white border-brand-600'
                    : 'bg-white dark:bg-surface-800 text-surface-700 dark:text-surface-300 border-surface-200 dark:border-surface-700 hover:border-brand-400 dark:hover:border-brand-500'
                }`}
              >
                {skill}
              </button>
            );
          })}
        </div>
      </FilterSection>
    </div>
  );
}

export default function Jobs() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { error: toastError } = useToast();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('newest');
  const [filters, setFilters] = useState({});
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const debouncedSearch = useMemo(() => debounce((q) => {
    setFilters(f => ({ ...f, search: q }));
    setPage(1);
  }, 400), []);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let experienceMin = undefined;
      let experienceMax = undefined;
      if (filters.experienceLevels?.length) {
        const levels = EXPERIENCE_LEVELS.filter(l => filters.experienceLevels.includes(l.value));
        experienceMin = Math.min(...levels.map(l => l.min));
        experienceMax = Math.max(...levels.map(l => l.max));
      }
      let res;
      try {
        res = await getJobs({
          search: filters.search,
          page,
          limit: 12,
          sort,
          location: filters.locations?.[0],
          type: filters.types?.length === 1 ? filters.types[0] : undefined,
          workMode: filters.workMode?.length === 1 ? filters.workMode[0] : undefined,
          skills: filters.skills,
          experienceMin,
          experienceMax,
          salaryMin: filters.salaryMin,
          salaryMax: filters.salaryMax,
          isActive: true,
        });
      } catch (innerErr) {
        let data = MOCK_JOBS.filter(j => j.isActive);
        if (filters.search) {
          const q = filters.search.toLowerCase();
          data = data.filter(j =>
            j.title.toLowerCase().includes(q) || j.companyName.toLowerCase().includes(q) ||
            j.skills.some(s => s.toLowerCase().includes(q)) || j.location.toLowerCase().includes(q)
          );
        }
        if (filters.locations?.[0]) {
          data = data.filter(j => j.location.toLowerCase().includes(filters.locations[0].toLowerCase()));
        }
        if (filters.types?.length === 1) data = data.filter(j => j.type === filters.types[0]);
        if (filters.workMode?.length === 1) data = data.filter(j => j.workMode === filters.workMode[0]);
        if (filters.skills?.length) data = data.filter(j => filters.skills.some(s => j.skills.includes(s)));
        if (experienceMin !== undefined) data = data.filter(j => j.experienceMax >= experienceMin);
        if (experienceMax !== undefined) data = data.filter(j => j.experienceMin <= experienceMax);
        if (filters.salaryMin) data = data.filter(j => j.salaryMax >= filters.salaryMin);
        if (filters.salaryMax) data = data.filter(j => j.salaryMin <= filters.salaryMax);
        if (sort === 'newest') data = [...data].sort((a, b) => new Date(b.postedAt) - new Date(a.postedAt));
        else if (sort === 'salary-high') data = [...data].sort((a, b) => b.salaryMax - a.salaryMax);
        else if (sort === 'salary-low') data = [...data].sort((a, b) => a.salaryMin - b.salaryMin);
        else if (sort === 'most-applicants') data = [...data].sort((a, b) => b.applicants - a.applicants);
        const start = (page - 1) * 12;
        res = { data: data.slice(start, start + 12), totalPages: Math.ceil(data.length / 12), total: data.length };
      }
      setJobs(res.data || []);
      setTotalPages(res.totalPages || 1);
      setTotalCount(res.total || 0);
    } catch (err) {
      setError(err);
      toastError({ title: 'Could not load jobs', message: err.message });
    } finally {
      setLoading(false);
    }
  }, [page, sort, filters, toastError]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const activeFilterCount = Object.values(filters).filter((v) => {
    if (Array.isArray(v)) return v.length > 0;
    if (typeof v === 'string') return v.trim().length > 0;
    if (typeof v === 'number') return v > 0;
    return Boolean(v);
  }).length;

  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <ErrorState title="Couldn't load jobs" message={error.message} onRetry={fetchJobs} fullHeight size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-surface-900 dark:text-surface-50">
            Browse Jobs
          </h1>
          <p className="text-surface-500 dark:text-surface-400 mt-1">
            {loading ? 'Searching opportunities...' : `${totalCount} jobs found for you`}
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <SearchBar
            placeholder="Search jobs, companies, or skills..."
            value={search}
            onChange={(val) => { setSearch(val); debouncedSearch(val); }}
            icon={<FiSearch className="w-4 h-4" />}
          />
        </div>
        <div className="flex gap-2">
          <Select
            value={sort}
            onChange={setSort}
            options={[
              { value: 'newest', label: 'Newest First' },
              { value: 'salary-high', label: 'Salary: High to Low' },
              { value: 'salary-low', label: 'Salary: Low to High' },
              { value: 'most-applicants', label: 'Most Popular' },
              { value: 'relevant', label: 'Most Relevant' },
            ]}
            placeholder="Sort by"
            wrapperClassName="w-full sm:w-44"
          />
          <Button
            variant="outline"
            size="md"
            onClick={() => setShowMobileFilters(true)}
            className="md:hidden shrink-0"
          >
            <FiFilter className="w-4 h-4 mr-1.5" />
            Filters
            {activeFilterCount > 0 && (
              <Badge variant="brand" size="sm" className="ml-1.5 !py-0 !px-1.5 text-[10px] min-w-[18px] h-[18px] flex items-center justify-center">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
        <aside className="hidden lg:block">
          <div className="sticky top-24">
            <FilterPanel filters={filters} onFiltersChange={(f) => { setFilters(f); setPage(1); }}>
              <FilterContent filters={filters} onFiltersChange={(f) => { setFilters(f); setPage(1); }} />
            </FilterPanel>
          </div>
        </aside>

        <FilterBottomSheet
          isOpen={showMobileFilters}
          onClose={() => setShowMobileFilters(false)}
          filters={filters}
          onFiltersChange={(f) => { setFilters(f); setPage(1); }}
        />

        <div className="space-y-5">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => <JobCardSkeleton key={i} />)}
            </div>
          ) : jobs.length === 0 ? (
            <EmptyState
              size="md"
              iconName="jobs"
              title="No jobs found"
              description="Try adjusting your filters or search for different keywords."
              actionText="Clear Filters"
              onAction={() => { setFilters({}); setPage(1); }}
            />
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {jobs.map(job => (
                  <JobCard key={job.id} job={job} onView={(j) => navigate(`/candidate/jobs/${j.id}`)} />
                ))}
              </div>
              {totalPages > 1 && (
                <div className="flex justify-center pt-4">
                  <Pagination
                    currentPage={page}
                    totalPages={totalPages}
                    onPageChange={setPage}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
