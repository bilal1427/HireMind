import { useState, createContext, useContext } from 'react';
import { cn } from '@/lib/utils';
import { FiChevronDown, FiMapPin, FiBriefcase, FiDollarSign, FiClock, FiTag } from 'react-icons/fi';
import { Input } from './Input';
import { Badge } from './Badge';

const FilterContext = createContext(null);

function useFilterContext() {
  const context = useContext(FilterContext);
  if (!context) {
    throw new Error('Filter components must be used within <FilterPanel>');
  }
  return context;
}

function FilterPanel({
  children,
  className,
  filters = {},
  onFiltersChange,
  title = 'Filters',
  showClearAll = true,
}) {
  const [openSections, setOpenSections] = useState({
    location: true,
    experience: true,
    salary: true,
    jobType: true,
    skills: true,
  });

  const toggleSection = (section) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const updateFilter = (key, value) => {
    if (onFiltersChange) {
      onFiltersChange({ ...filters, [key]: value });
    }
  };

  const clearAll = () => {
    if (onFiltersChange) {
      onFiltersChange({});
    }
  };

  const activeFilterCount = Object.values(filters).filter((v) => {
    if (Array.isArray(v)) return v.length > 0;
    if (typeof v === 'string') return v.trim().length > 0;
    if (typeof v === 'number') return v > 0;
    return Boolean(v);
  }).length;

  return (
    <FilterContext.Provider
      value={{
        filters,
        updateFilter,
        openSections,
        toggleSection,
      }}
    >
      <div
        className={cn(
          'w-full bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-xl shadow-soft',
          className
        )}
      >
        <div className="flex items-center justify-between p-4 border-b border-surface-100 dark:border-surface-800">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-surface-900 dark:text-surface-100">{title}</h3>
            {activeFilterCount > 0 && (
              <Badge variant="brand" size="sm">
                {activeFilterCount}
              </Badge>
            )}
          </div>
          {showClearAll && activeFilterCount > 0 && (
            <button
              type="button"
              onClick={clearAll}
              className="text-sm font-medium text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 transition-colors"
            >
              Clear all
            </button>
          )}
        </div>
        <div className="p-2">{children}</div>
      </div>
    </FilterContext.Provider>
  );
}

function FilterSection({ id, title, icon, children, defaultOpen }) {
  const { openSections, toggleSection } = useFilterContext();
  const isOpen = defaultOpen !== undefined ? defaultOpen : openSections[id] ?? true;

  return (
    <div className="border-b border-surface-100 dark:border-surface-800 last:border-b-0">
      <button
        type="button"
        onClick={() => toggleSection(id)}
        className="w-full flex items-center justify-between gap-2 p-3 hover:bg-surface-50 dark:hover:bg-surface-800/50 rounded-lg transition-colors"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2">
          <span className="text-brand-500 dark:text-brand-400 w-4 h-4 shrink-0">{icon}</span>
          <span className="text-sm font-medium text-surface-800 dark:text-surface-200">{title}</span>
        </div>
        <FiChevronDown
          className={cn(
            'w-4 h-4 text-surface-400 transition-transform duration-200 shrink-0',
            isOpen && 'rotate-180'
          )}
        />
      </button>
      {isOpen && (
        <div className="px-3 pb-3 pt-1 space-y-2 animate-slide-down">
          {children}
        </div>
      )}
    </div>
  );
}

function FilterCheckbox({ label, checked, onChange, id }) {
  const inputId = id || `filter-${Math.random().toString(36).substring(2, 9)}`;
  return (
    <label
      htmlFor={inputId}
      className="flex items-center gap-2.5 cursor-pointer group py-1"
    >
      <div className="relative">
        <input
          id={inputId}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange?.(e.target.checked)}
          className="peer sr-only"
        />
        <div
          className={cn(
            'w-4 h-4 rounded border transition-all duration-200 flex items-center justify-center',
            checked
              ? 'bg-brand-600 border-brand-600'
              : 'bg-white dark:bg-surface-800 border-surface-300 dark:border-surface-600 group-hover:border-brand-400 dark:group-hover:border-brand-500'
          )}
        >
          {checked && (
            <svg
              className="w-3 h-3 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={3}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
      </div>
      <span className="text-sm text-surface-700 dark:text-surface-300 group-hover:text-surface-900 dark:group-hover:text-surface-100 transition-colors select-none">
        {label}
      </span>
    </label>
  );
}

function LocationFilter({
  locations = ['Remote', 'New York, NY', 'San Francisco, CA', 'London, UK', 'Berlin, Germany'],
}) {
  const { filters, updateFilter } = useFilterContext();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLocations = locations.filter((loc) =>
    loc.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedLocations = filters.location || [];

  const toggleLocation = (loc) => {
    const newValue = selectedLocations.includes(loc)
      ? selectedLocations.filter((l) => l !== loc)
      : [...selectedLocations, loc];
    updateFilter('location', newValue);
  };

  return (
    <FilterSection id="location" title="Location" icon={<FiMapPin className="w-full h-full" />}>
      <Input
        size="sm"
        placeholder="Search locations..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="mb-2"
      />
      <div className="max-h-48 overflow-y-auto space-y-0.5 -mx-1 px-1">
        {filteredLocations.map((loc) => (
          <FilterCheckbox
            key={loc}
            label={loc}
            checked={selectedLocations.includes(loc)}
            onChange={() => toggleLocation(loc)}
          />
        ))}
        {filteredLocations.length === 0 && (
          <p className="text-sm text-surface-500 dark:text-surface-400 py-2 text-center">
            No locations found
          </p>
        )}
      </div>
    </FilterSection>
  );
}

function ExperienceFilter({
  levels = [
    { label: 'Internship', value: 'internship' },
    { label: 'Entry Level', value: 'entry' },
    { label: 'Mid Level', value: 'mid' },
    { label: 'Senior Level', value: 'senior' },
    { label: 'Lead / Manager', value: 'lead' },
    { label: 'Executive', value: 'executive' },
  ],
}) {
  const { filters, updateFilter } = useFilterContext();
  const selected = filters.experience || [];

  const toggleLevel = (value) => {
    const newValue = selected.includes(value)
      ? selected.filter((v) => v !== value)
      : [...selected, value];
    updateFilter('experience', newValue);
  };

  return (
    <FilterSection id="experience" title="Experience Level" icon={<FiBriefcase className="w-full h-full" />}>
      <div className="space-y-0.5 -mx-1 px-1">
        {levels.map((level) => (
          <FilterCheckbox
            key={level.value}
            label={level.label}
            checked={selected.includes(level.value)}
            onChange={() => toggleLevel(level.value)}
          />
        ))}
      </div>
    </FilterSection>
  );
}

function SalaryFilter() {
  const { filters, updateFilter } = useFilterContext();
  const minSalary = filters.salaryMin || 0;
  const maxSalary = filters.salaryMax || 200000;

  const formatSalary = (val) => {
    if (val >= 1000) return `$${(val / 1000).toFixed(0)}k`;
    return `$${val}`;
  };

  return (
    <FilterSection id="salary" title="Salary Range" icon={<FiDollarSign className="w-full h-full" />}>
      <div className="space-y-4 px-1 py-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-surface-500 dark:text-surface-400 font-medium">
            {formatSalary(minSalary)}
          </span>
          <span className="text-surface-400">—</span>
          <span className="text-surface-500 dark:text-surface-400 font-medium">
            {formatSalary(maxSalary)}
          </span>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-surface-500 dark:text-surface-400 mb-1">Minimum</label>
            <input
              type="range"
              min={0}
              max={200000}
              step={5000}
              value={minSalary}
              onChange={(e) => updateFilter('salaryMin', Number(e.target.value))}
              className="w-full h-2 bg-surface-200 dark:bg-surface-700 rounded-lg appearance-none cursor-pointer accent-brand-600"
            />
          </div>
          <div>
            <label className="block text-xs text-surface-500 dark:text-surface-400 mb-1">Maximum</label>
            <input
              type="range"
              min={0}
              max={200000}
              step={5000}
              value={maxSalary}
              onChange={(e) => updateFilter('salaryMax', Number(e.target.value))}
              className="w-full h-2 bg-surface-200 dark:bg-surface-700 rounded-lg appearance-none cursor-pointer accent-brand-600"
            />
          </div>
        </div>
      </div>
    </FilterSection>
  );
}

function JobTypeFilter({
  types = [
    { label: 'Full-time', value: 'fulltime' },
    { label: 'Part-time', value: 'parttime' },
    { label: 'Contract', value: 'contract' },
    { label: 'Freelance', value: 'freelance' },
    { label: 'Temporary', value: 'temporary' },
  ],
}) {
  const { filters, updateFilter } = useFilterContext();
  const selected = filters.jobType || [];

  const toggleType = (value) => {
    const newValue = selected.includes(value)
      ? selected.filter((v) => v !== value)
      : [...selected, value];
    updateFilter('jobType', newValue);
  };

  return (
    <FilterSection id="jobType" title="Job Type" icon={<FiClock className="w-full h-full" />}>
      <div className="space-y-0.5 -mx-1 px-1">
        {types.map((type) => (
          <FilterCheckbox
            key={type.value}
            label={type.label}
            checked={selected.includes(type.value)}
            onChange={() => toggleType(type.value)}
          />
        ))}
      </div>
    </FilterSection>
  );
}

function SkillsFilter({
  availableSkills = [
    'JavaScript',
    'TypeScript',
    'React',
    'Node.js',
    'Python',
    'AWS',
    'Docker',
    'Kubernetes',
    'PostgreSQL',
    'MongoDB',
    'GraphQL',
    'REST API',
    'CI/CD',
    'Git',
  ],
}) {
  const { filters, updateFilter } = useFilterContext();
  const [searchTerm, setSearchTerm] = useState('');
  const selectedSkills = filters.skills || [];

  const filteredSkills = availableSkills.filter((skill) =>
    skill.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleSkill = (skill) => {
    const newValue = selectedSkills.includes(skill)
      ? selectedSkills.filter((s) => s !== skill)
      : [...selectedSkills, skill];
    updateFilter('skills', newValue);
  };

  return (
    <FilterSection id="skills" title="Skills" icon={<FiTag className="w-full h-full" />}>
      <Input
        size="sm"
        placeholder="Search skills..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="mb-2"
      />
      <div className="flex flex-wrap gap-1.5">
        {filteredSkills.map((skill) => {
          const isSelected = selectedSkills.includes(skill);
          return (
            <button
              key={skill}
              type="button"
              onClick={() => toggleSkill(skill)}
              className={cn(
                'px-2.5 py-1 text-xs rounded-lg font-medium transition-all duration-200',
                'border',
                isSelected
                  ? 'bg-brand-600 text-white border-brand-600 hover:bg-brand-700'
                  : 'bg-white dark:bg-surface-800 text-surface-700 dark:text-surface-300 border-surface-200 dark:border-surface-700 hover:border-brand-400 dark:hover:border-brand-500 hover:text-brand-600 dark:hover:text-brand-400'
              )}
            >
              {skill}
            </button>
          );
        })}
        {filteredSkills.length === 0 && (
          <p className="text-sm text-surface-500 dark:text-surface-400 py-2 w-full text-center">
            No skills found
          </p>
        )}
      </div>
    </FilterSection>
  );
}

export {
  FilterPanel,
  FilterSection,
  FilterCheckbox,
  LocationFilter,
  ExperienceFilter,
  SalaryFilter,
  JobTypeFilter,
  SkillsFilter,
};
