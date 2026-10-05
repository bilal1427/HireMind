import { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/contexts/ToastContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { SearchBar } from '@/components/ui/SearchBar';
import { Select } from '@/components/ui/Select';
import { Table, Thead, Tbody, Tr, Th, Td } from '@/components/ui/Table';
import { Pagination } from '@/components/ui/Pagination';
import { SkeletonTable, Skeleton, SkeletonList, SkeletonAvatar } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal, ModalHeader, ModalTitle, ModalBody, ModalFooter } from '@/components/ui/Modal';
import { Tabs, TabList, Tab, TabPanels, TabPanel } from '@/components/ui/Tabs';
import { ScoreRing, getScoreColor } from '@/components/ui/ScoreRing';
import {
  Search, Filter, Users, Eye, LayoutGrid, Table as TableIcon, Check, X, GitCompare,
  MapPin, Briefcase, Clock, GraduationCap, Sparkles, ChevronDown, ChevronUp,
  Star, StarOff, Building2, Award
} from 'lucide-react';
import { FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import { cn, calculateExperience, truncate, formatDate, getRelativeTime } from '@/lib/utils';
import { getCandidates } from '@/services/candidateService';
import { compareCandidates } from '@/services/matchingService';
import { SKILL_CATEGORIES, EXPERIENCE_LEVELS, LOCATIONS } from '@/lib/constants';

const EXPERIENCE_FILTERS = [
  { value: 'all', label: 'All Experience' },
  { value: '0-2', label: '0-2 yrs (Entry)' },
  { value: '2-5', label: '2-5 yrs (Mid)' },
  { value: '5-8', label: '5-8 yrs (Senior)' },
  { value: '8-12', label: '8-12 yrs (Lead)' },
  { value: '12+', label: '12+ yrs (Exec)' },
];

const MATCH_FILTERS = [
  { value: 'all', label: 'Any Match %' },
  { value: '90', label: '90%+ (Excellent)' },
  { value: '75', label: '75%+ (Great)' },
  { value: '60', label: '60%+ (Good)' },
  { value: '40', label: '40%+ (Fair)' },
];

const AVAILABILITY_FILTERS = [
  { value: 'all', label: 'Any Availability' },
  { value: 'immediate', label: 'Immediate / 15 days' },
  { value: '30days', label: 'Within 30 days' },
  { value: '60days', label: 'Within 60 days' },
];

const EDUCATION_FILTERS = [
  { value: 'all', label: 'All Education' },
  { value: '1', label: 'Tier 1 Colleges' },
  { value: '2', label: 'Tier 1-2 Colleges' },
  { value: '3', label: 'Any Tier' },
];

const SORT_OPTIONS = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'score-high', label: 'Match Score (High → Low)' },
  { value: 'experience-high', label: 'Experience (High → Low)' },
  { value: 'recent', label: 'Recently Active' },
];

export default function Candidates() {
  const navigate = useNavigate();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState({ data: [], total: 0, totalPages: 1, hasNext: false, hasPrev: false });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('table');
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [compareMode, setCompareMode] = useState(false);
  const [compareSelected, setCompareSelected] = useState([]);
  const [compareModalOpen, setCompareModalOpen] = useState(false);
  const [compareLoading, setCompareLoading] = useState(false);
  const [compareData, setCompareData] = useState([]);
  const [filters, setFilters] = useState({
    experience: 'all',
    education: 'all',
    location: 'all',
    match: 'all',
    availability: 'all',
    sort: 'relevance',
  });

  const allSkills = useMemo(() => {
    const set = new Set();
    SKILL_CATEGORIES.forEach(cat => cat.skills.forEach(s => set.add(s)));
    return Array.from(set).sort();
  }, []);

  const loadCandidates = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page,
        limit: viewMode === 'table' ? 10 : 12,
        search: search || undefined,
        sort: filters.sort,
      };
      if (filters.location !== 'all') params.location = filters.location;
      if (filters.experience !== 'all') {
        const [min, max] = filters.experience.split('-').map(v => v === '+' ? undefined : parseInt(v));
        if (min !== undefined) params.experienceMin = isNaN(min) ? 12 : min;
        if (max !== undefined && !isNaN(max)) params.experienceMax = max;
      }
      if (filters.education !== 'all' && filters.education !== '3') {
        params.educationTier = parseInt(filters.education);
      }
      if (filters.availability !== 'all') params.available = filters.availability;
      if (filters.match !== 'all') params.minScore = parseInt(filters.match);
      if (selectedSkills.length > 0) params.skills = selectedSkills;
      const res = await getCandidates(params);
      res.data = res.data.map(c => ({
        ...c,
        matchScore: c.score || Math.round(50 + Math.random() * 45),
        status: Math.random() > 0.7 ? 'shortlisted' : Math.random() > 0.5 ? 'interview' : Math.random() > 0.5 ? 'screening' : 'applied',
      }));
      setData(res);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [page, search, filters, selectedSkills, viewMode]);

  useEffect(() => { setPage(1); }, [search, filters, selectedSkills, viewMode]);
  useEffect(() => { loadCandidates(); }, [loadCandidates]);

  const toggleSkill = (skill) => {
    setSelectedSkills(prev => prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]);
  };

  const toggleCompareSelect = (candId) => {
    setCompareSelected(prev => {
      if (prev.includes(candId)) return prev.filter(id => id !== candId);
      if (prev.length >= 4) {
        toast.warning('You can compare up to 4 candidates at a time');
        return prev;
      }
      return [...prev, candId];
    });
  };

  const openCompare = async () => {
    if (compareSelected.length < 2) {
      toast.warning('Select at least 2 candidates to compare');
      return;
    }
    setCompareLoading(true);
    setCompareModalOpen(true);
    try {
      const result = await compareCandidates(compareSelected);
      setCompareData(result);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setCompareLoading(false);
    }
  };

  const getCandidateById = (id) => data.data.find(c => c.id === id);

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-white tracking-tight">Candidates</h1>
          <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">Search, filter, and compare candidates in your talent pool</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={compareMode ? 'primary' : 'outline'}
            icon={<GitCompare className="w-4 h-4" />}
            onClick={() => {
              setCompareMode(!compareMode);
              if (compareMode) { setCompareSelected([]); }
            }}
          >
            {compareMode ? `Compare (${compareSelected.length}/4)` : 'Compare Mode'}
          </Button>
          {compareMode && compareSelected.length >= 2 && (
            <Button icon={<Sparkles className="w-4 h-4" />} onClick={openCompare}>
              Compare Selected
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardContent className="p-4 sm:p-5 space-y-4">
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="flex-1 min-w-0">
              <SearchBar
                placeholder="Search by name, title, skills, or company..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onSearch={setSearch}
                size="md"
              />
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-1 rounded-lg border border-surface-200 dark:border-surface-700 p-0.5 bg-surface-50 dark:bg-surface-800">
                <button
                  onClick={() => setViewMode('table')}
                  className={cn(
                    'p-1.5 rounded-md transition-colors',
                    viewMode === 'table'
                      ? 'bg-white dark:bg-surface-900 text-brand-600 dark:text-brand-400 shadow-sm'
                      : 'text-surface-500 hover:text-surface-700 dark:hover:text-surface-300'
                  )}
                  title="Table view"
                >
                  <TableIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('card')}
                  className={cn(
                    'p-1.5 rounded-md transition-colors',
                    viewMode === 'card'
                      ? 'bg-white dark:bg-surface-900 text-brand-600 dark:text-brand-400 shadow-sm'
                      : 'text-surface-500 hover:text-surface-700 dark:hover:text-surface-300'
                  )}
                  title="Card view"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <Filter className="w-3.5 h-3.5 text-surface-500" />
              <span className="text-xs font-semibold uppercase tracking-wide text-surface-500 dark:text-surface-400">Quick Skills</span>
              {selectedSkills.length > 0 && (
                <button
                  onClick={() => setSelectedSkills([])}
                  className="ml-auto text-xs text-brand-600 dark:text-brand-400 font-medium hover:underline"
                >
                  Clear ({selectedSkills.length})
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {['React', 'TypeScript', 'Node.js', 'Python', 'AWS', 'Next.js', 'PostgreSQL', 'Kubernetes', 'Docker', 'Machine Learning', 'SQL', 'Figma'].map(skill => (
                <button
                  key={skill}
                  onClick={() => toggleSkill(skill)}
                  className={cn(
                    'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all border',
                    selectedSkills.includes(skill)
                      ? 'bg-brand-500 text-white border-brand-500 shadow-sm'
                      : 'bg-surface-50 dark:bg-surface-800 text-surface-600 dark:text-surface-400 border-surface-200 dark:border-surface-700 hover:border-brand-300 dark:hover:border-brand-700 hover:text-brand-600 dark:hover:text-brand-400'
                  )}
                >
                  {selectedSkills.includes(skill) && <Check className="w-3 h-3" />}
                  {skill}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
            <Select
              size="sm"
              placeholder="Experience"
              value={filters.experience}
              onChange={(v) => setFilters(f => ({ ...f, experience: v }))}
              options={EXPERIENCE_FILTERS}
            />
            <Select
              size="sm"
              placeholder="Education"
              value={filters.education}
              onChange={(v) => setFilters(f => ({ ...f, education: v }))}
              options={EDUCATION_FILTERS}
            />
            <Select
              size="sm"
              placeholder="Location"
              value={filters.location}
              onChange={(v) => setFilters(f => ({ ...f, location: v }))}
              options={[{ value: 'all', label: 'All Locations' }, ...LOCATIONS.map(l => ({ value: l.value, label: l.label }))]}
            />
            <Select
              size="sm"
              placeholder="Match %"
              value={filters.match}
              onChange={(v) => setFilters(f => ({ ...f, match: v }))}
              options={MATCH_FILTERS}
            />
            <Select
              size="sm"
              placeholder="Availability"
              value={filters.availability}
              onChange={(v) => setFilters(f => ({ ...f, availability: v }))}
              options={AVAILABILITY_FILTERS}
            />
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-surface-100 dark:border-surface-800">
            <p className="text-xs text-surface-500 dark:text-surface-400">
              {loading ? (
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-3 h-3 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                  Loading candidates...
                </span>
              ) : (
                <>Showing <span className="font-semibold text-surface-700 dark:text-surface-300">{data.data.length}</span> of <span className="font-semibold text-surface-700 dark:text-surface-300">{data.total}</span> candidates</>
              )}
            </p>
            <Select
              size="sm"
              value={filters.sort}
              onChange={(v) => setFilters(f => ({ ...f, sort: v }))}
              options={SORT_OPTIONS}
              className="w-auto min-w-[160px]"
            />
          </div>
        </CardContent>
      </Card>

      {error ? (
        <ErrorState onRetry={loadCandidates} message={error.message} />
      ) : loading ? (
        viewMode === 'table' ? (
          <Card><CardContent className="p-0"><SkeletonTable rows={8} columns={8} /></CardContent></Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}><CardContent className="p-5 space-y-3">
                <div className="flex items-start gap-3">
                  <SkeletonAvatar size="lg" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-5 w-3/4 rounded" />
                    <Skeleton className="h-3.5 w-1/2 rounded" />
                    <Skeleton className="h-3.5 w-2/3 rounded" />
                  </div>
                </div>
                <Skeleton className="h-5 w-full rounded" />
                <div className="flex gap-1.5 flex-wrap">
                  {Array.from({ length: 4 }).map((_, j) => <Skeleton key={j} className="h-5 w-16 rounded-full" />)}
                </div>
              </CardContent></Card>
            ))}
          </div>
        )
      ) : data.data.length === 0 ? (
        <EmptyState
          iconName="search"
          title="No candidates match your filters"
          description={search || selectedSkills.length > 0 || Object.values(filters).some(v => v !== 'all')
            ? 'Try removing some filters or broadening your search.'
            : 'Candidates will appear here as they join the platform and apply to your jobs.'}
        />
      ) : viewMode === 'table' ? (
        <Card>
          <CardContent className="p-0">
            <div className="border border-surface-200 dark:border-surface-800 rounded-xl overflow-hidden">
              <Table wrapperClassName="rounded-none">
                <Thead className="bg-surface-50/70 dark:bg-surface-800/40">
                  <Tr>
                    {compareMode && <Th className="w-10"><span className="sr-only">Compare</span></Th>}
                    <Th>Candidate</Th>
                    <Th>Experience</Th>
                    <Th>Skills</Th>
                    <Th className="text-center">Match %</Th>
                    <Th>Status</Th>
                    <Th className="text-right">Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {data.data.map(c => {
                    const sc = getScoreColor(c.matchScore);
                    return (
                      <Tr key={c.id} className="group hover:bg-surface-50 dark:hover:bg-surface-800/40">
                        {compareMode && (
                          <Td>
                            <label className="inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={compareSelected.includes(c.id)}
                                onChange={() => toggleCompareSelect(c.id)}
                                className="w-4 h-4 rounded border-surface-300 dark:border-surface-600 text-brand-600 focus:ring-brand-500"
                              />
                            </label>
                          </Td>
                        )}
                        <Td>
                          <div className="flex items-center gap-3">
                            <Avatar name={c.name} size="sm" avatarClass={c.avatar} />
                            <div className="min-w-0">
                              <p className="font-semibold text-sm text-surface-900 dark:text-white truncate max-w-[200px]">{c.name}</p>
                              <p className="text-xs text-surface-500 dark:text-surface-400 truncate max-w-[200px]">{c.title}</p>
                              <div className="flex items-center gap-2 mt-0.5 text-[11px] text-surface-400">
                                <span className="inline-flex items-center gap-0.5"><Building2 className="w-3 h-3" /> {truncate(c.currentCompany || '—', 18)}</span>
                              </div>
                            </div>
                          </div>
                        </Td>
                        <Td>
                          <div className="text-sm text-surface-700 dark:text-surface-300">
                            {calculateExperience(c.yearsOfExperience)}
                          </div>
                          <div className="flex items-center gap-1 mt-0.5 text-[11px] text-surface-400">
                            <GraduationCap className="w-3 h-3" /> Tier {c.education?.collegeTier || 3}
                          </div>
                        </Td>
                        <Td>
                          <div className="flex flex-wrap gap-1 max-w-[240px]">
                            {(c.skills || []).slice(0, 4).map(s => (
                              <Badge key={s} size="sm" variant="soft">{s}</Badge>
                            ))}
                            {(c.skills || []).length > 4 && (
                              <Badge size="sm" variant="outline">+{(c.skills || []).length - 4}</Badge>
                            )}
                          </div>
                        </Td>
                        <Td className="text-center">
                          <div className="inline-flex items-center gap-2">
                            <ScoreRing value={c.matchScore} size={40} strokeWidth={4} showLabel={false} />
                            <div className="text-left">
                              <div className={cn('text-sm font-bold tabular-nums', sc.text)}>{c.matchScore}%</div>
                              <div className="text-[10px] text-surface-400">{sc.label}</div>
                            </div>
                          </div>
                        </Td>
                        <Td>
                          <Badge className={cn(
                            'capitalize text-[11px]',
                            c.status === 'shortlisted' ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400' :
                            c.status === 'interview' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400' :
                            c.status === 'screening' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400' :
                            'bg-surface-100 text-surface-700 dark:bg-surface-800 dark:text-surface-400'
                          )}>
                            {c.status}
                          </Badge>
                          <div className="flex items-center gap-1 mt-1 text-[10px] text-surface-400">
                            <Clock className="w-2.5 h-2.5" /> Notice: {c.noticePeriod || '—'}
                          </div>
                        </Td>
                        <Td className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              icon={<Eye className="w-3.5 h-3.5" />}
                              onClick={() => navigate(`/recruiter/candidates/${c.id}`)}
                            >
                              View
                            </Button>
                          </div>
                        </Td>
                      </Tr>
                    );
                  })}
                </Tbody>
              </Table>
            </div>
            <div className="mt-5 px-5 pb-5 flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-sm text-surface-500 dark:text-surface-400">
                Showing page <span className="font-semibold text-surface-900 dark:text-white">{page}</span> of <span className="font-semibold text-surface-900 dark:text-white">{Math.max(1, data.totalPages)}</span>
              </p>
              <Pagination
                currentPage={page}
                totalPages={Math.max(1, data.totalPages)}
                onPageChange={setPage}
              />
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.data.map(c => {
              const sc = getScoreColor(c.matchScore);
              return (
                <Card key={c.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-5 space-y-3.5">
                    <div className="flex items-start gap-3">
                      {compareMode && (
                        <label className="mt-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={compareSelected.includes(c.id)}
                            onChange={() => toggleCompareSelect(c.id)}
                            className="w-4 h-4 rounded border-surface-300 dark:border-surface-600 text-brand-600 focus:ring-brand-500"
                          />
                        </label>
                      )}
                      <Avatar name={c.name} size="lg" avatarClass={c.avatar} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-bold text-surface-900 dark:text-white truncate">{c.name}</p>
                            <p className="text-xs text-surface-500 dark:text-surface-400 truncate">{c.title}</p>
                          </div>
                          <ScoreRing value={c.matchScore} size={50} strokeWidth={5} showLabel={false} />
                        </div>
                        <div className="flex items-center gap-3 mt-1.5 text-[11px] text-surface-500 dark:text-surface-400 flex-wrap">
                          <span className="inline-flex items-center gap-0.5"><Briefcase className="w-3 h-3" /> {calculateExperience(c.yearsOfExperience)}</span>
                          <span className="inline-flex items-center gap-0.5"><MapPin className="w-3 h-3" /> {truncate(c.location, 14)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {(c.skills || []).slice(0, 5).map(s => (
                        <Badge key={s} size="sm" variant="soft">{s}</Badge>
                      ))}
                      {(c.skills || []).length > 5 && (
                        <Badge size="sm" variant="outline">+{(c.skills || []).length - 5}</Badge>
                      )}
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-surface-100 dark:border-surface-800">
                      <Badge className={cn(
                        'capitalize text-[10px]',
                        c.status === 'shortlisted' ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400' :
                        c.status === 'interview' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400' :
                        c.status === 'screening' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400' :
                        'bg-surface-100 text-surface-700 dark:bg-surface-800 dark:text-surface-400'
                      )}>
                        {c.status}
                      </Badge>
                      <Button size="sm" variant="ghost" icon={<Eye className="w-3.5 h-3.5" />} onClick={() => navigate(`/recruiter/candidates/${c.id}`)}>
                        View
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-sm text-surface-500 dark:text-surface-400">
              Showing page <span className="font-semibold text-surface-900 dark:text-white">{page}</span> of <span className="font-semibold text-surface-900 dark:text-white">{Math.max(1, data.totalPages)}</span>
            </p>
            <Pagination
              currentPage={page}
              totalPages={Math.max(1, data.totalPages)}
              onPageChange={setPage}
            />
          </div>
        </>
      )}

      <Modal open={compareModalOpen} onClose={() => setCompareModalOpen(false)} size="xl">
        <ModalHeader>
          <ModalTitle className="flex items-center gap-2">
            <GitCompare className="w-5 h-5 text-brand-500" />
            Candidate Comparison
            <Badge size="sm" variant="soft" className="ml-2">{compareData.length} candidates</Badge>
          </ModalTitle>
        </ModalHeader>
        <ModalBody>
          {compareLoading ? (
            <div className="space-y-4 py-4">
              <Skeleton className="h-12 w-full rounded-lg" />
              {Array.from({ length: 10 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full rounded-md" />
              ))}
            </div>
          ) : compareData.length === 0 ? (
            <EmptyState size="sm" title="Nothing to compare" description="Select candidates to start." />
          ) : (
            <div className="overflow-x-auto">
              <Table wrapperClassName="border-none">
                <Thead className="sticky top-0 bg-white dark:bg-surface-900 z-10">
                  <Tr>
                    <Th className="bg-transparent w-48 text-xs uppercase tracking-wide">Attribute</Th>
                    {compareData.map(c => (
                      <Th key={c.id} className="bg-transparent text-center">
                        <div className="flex flex-col items-center gap-1.5 py-1">
                          <Avatar name={c.name} size="md" avatarClass={c.avatar} />
                          <div>
                            <p className="text-sm font-bold text-surface-900 dark:text-white">{c.name}</p>
                            <p className="text-[10px] text-surface-500 dark:text-surface-400">Rank #{c.overallRank}</p>
                          </div>
                        </div>
                      </Th>
                    ))}
                  </Tr>
                </Thead>
                <Tbody>
                  {[
                    { label: 'Overall Match', key: 'matchScore', type: 'score', suffix: '%' },
                    { label: 'Title', key: 'title', type: 'text' },
                    { label: 'Location', key: 'location', type: 'text' },
                    { label: 'Experience', key: 'experience', type: 'text', format: (v) => calculateExperience(v) },
                    { label: 'Current Company', key: 'currentCompany', type: 'text', fallback: '—' },
                    { label: 'College Tier', key: 'collegeTier', type: 'rank', prefix: 'Tier ' },
                    { label: 'CGPA', key: 'cgpa', type: 'text', suffix: '/10' },
                    { label: 'Skills Count', key: 'skillsCount', type: 'rank', suffix: ' skills' },
                    { label: 'Expected Salary', key: 'expectedSalary', type: 'rank', suffix: ' LPA' },
                    { label: 'Notice Period', key: 'noticePeriod', type: 'text' },
                    { label: 'Languages', key: 'languages', type: 'rank', suffix: ' langs' },
                    { label: 'Certifications', key: 'certificationsCount', type: 'rank', suffix: ' certs' },
                    { label: 'Projects', key: 'projectsCount', type: 'rank', suffix: ' projects' },
                  ].map(row => {
                    const values = compareData.map(c => {
                      const v = row.format ? row.format(c[row.key]) : c[row.key];
                      return { value: v, raw: c[row.key] };
                    });
                    const numericVals = values.map(v => typeof v.raw === 'number' ? v.raw : null).filter(v => v !== null);
                    const maxVal = numericVals.length > 0 ? Math.max(...numericVals) : null;
                    const minVal = numericVals.length > 0 && row.type === 'rank' ? Math.min(...numericVals) : null;
                    return (
                      <Tr key={row.key}>
                        <Td className="font-semibold text-xs uppercase tracking-wide text-surface-500 dark:text-surface-400 bg-surface-50/50 dark:bg-surface-800/30">
                          {row.label}
                        </Td>
                        {values.map((v, i) => {
                          const raw = v.raw;
                          const isMax = row.type === 'score' && maxVal !== null && raw === maxVal;
                          const isMinRank = row.type === 'rank' && minVal !== null && (row.key === 'expectedSalary' ? raw === minVal : row.key === 'noticePeriod' ? false : raw === maxVal);
                          const highlight = isMax || isMinRank;
                          const display = (v.value ?? row.fallback ?? '—') + (row.suffix && v.value !== undefined && v.value !== null ? row.suffix : '') + (row.prefix && v.value !== undefined && v.value !== null ? '' : '');
                          return (
                            <Td key={i} className={cn(
                              'text-center transition-colors',
                              highlight && 'bg-emerald-50 dark:bg-emerald-950/30'
                            )}>
                              {row.type === 'score' ? (
                                <div className="inline-flex items-center gap-2">
                                  <ScoreRing value={raw || 0} size={36} strokeWidth={4} showLabel={false} />
                                  <span className={cn('font-bold tabular-nums text-sm', getScoreColor(raw || 0).text)}>
                                    {raw || 0}%
                                  </span>
                                  {highlight && <FaCheckCircle className="w-3.5 h-3.5 text-emerald-500" />}
                                </div>
                              ) : (
                                <div className="inline-flex items-center gap-1.5">
                                  <span className={cn(
                                    'text-sm',
                                    highlight ? 'font-bold text-emerald-700 dark:text-emerald-400' : 'text-surface-700 dark:text-surface-300'
                                  )}>
                                    {row.prefix && v.value !== undefined && v.value !== null ? row.prefix : ''}{display}
                                  </span>
                                  {highlight && <FaCheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}
                                </div>
                              )}
                            </Td>
                          );
                        })}
                      </Tr>
                    );
                  })}
                  <Tr>
                    <Td className="font-semibold text-xs uppercase tracking-wide text-surface-500 dark:text-surface-400 bg-surface-50/50 dark:bg-surface-800/30">
                      Top Skills
                    </Td>
                    {compareData.map(c => (
                      <Td key={c.id} className="py-3">
                        <div className="flex flex-wrap justify-center gap-1">
                          {(c.skills || []).slice(0, 5).map(s => (
                            <Badge key={s} size="sm" variant="soft">{s}</Badge>
                          ))}
                        </div>
                      </Td>
                    ))}
                  </Tr>
                </Tbody>
              </Table>
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" onClick={() => setCompareModalOpen(false)}>Close</Button>
          <Button onClick={() => { setCompareModalOpen(false); setCompareMode(false); setCompareSelected([]); }}>
            Done Comparing
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
