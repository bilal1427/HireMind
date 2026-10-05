import { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Tabs, TabList, Tab, TabPanels, TabPanel } from '@/components/ui/Tabs';
import { Skeleton, SkeletonText, SkeletonInput } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { Modal, ModalHeader, ModalContent, ModalFooter } from '@/components/ui/Modal';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronRight,
  FileText,
  Sparkles,
  Save,
  Upload,
  Briefcase,
  MapPin,
  DollarSign,
  Users,
  Clock,
  Star,
  Plus,
  X,
  Eye,
  Zap
} from 'lucide-react';
import { FaWandMagicSparkles, FaListOl, FaClipboardCheck } from 'react-icons/fa6';
import { MdWork, MdLocationOn } from 'react-icons/md';
import { AiFillBulb } from 'react-icons/ai';
import { cn, formatSalaryRange, calculateExperience, sleep, truncate } from '@/lib/utils';
import { getJobById, createJob, updateJob } from '@/services/jobService';
import { JOB_TYPES, WORK_MODES, DEPARTMENTS, EXPERIENCE_LEVELS, LOCATIONS, ALL_SKILLS, SKILL_CATEGORIES } from '@/lib/constants';

const STEPS = [
  { id: 'basic', label: 'Basic Info', icon: Briefcase, description: 'Role details' },
  { id: 'description', label: 'Description', icon: FileText, description: 'Job summary' },
  { id: 'skills', label: 'Skills', icon: Star, description: 'Requirements' },
  { id: 'responsibilities', label: 'Responsibilities', icon: FaListOl, description: 'Expectations' },
  { id: 'review', label: 'Review', icon: Eye, description: 'Publish' },
];

const initialForm = {
  title: '',
  department: '',
  location: '',
  workMode: 'hybrid',
  type: 'full-time',
  experienceMin: 2,
  experienceMax: 5,
  salaryMin: 8,
  salaryMax: 18,
  description: '',
  requiredSkills: [],
  preferredSkills: [],
  responsibilities: [],
};

export default function JobForm({ mode = 'create' }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();
  const [activeStep, setActiveStep] = useState('basic');
  const [loading, setLoading] = useState(mode === 'edit');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiKeywords, setAiKeywords] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiPreview, setAiPreview] = useState('');
  const [newSkillText, setNewSkillText] = useState({ required: '', preferred: '' });
  const [newResponsibility, setNewResponsibility] = useState('');

  const stepIndex = STEPS.findIndex(s => s.id === activeStep);
  const canGoNext = useMemo(() => {
    switch (activeStep) {
      case 'basic':
        return form.title.trim() && form.department && form.location;
      case 'description':
        return form.description.trim().length > 50;
      case 'skills':
        return form.requiredSkills.length >= 2;
      case 'responsibilities':
        return form.responsibilities.length >= 3;
      case 'review':
        return true;
      default:
        return true;
    }
  }, [activeStep, form]);

  useEffect(() => {
    if (mode === 'edit' && id) {
      (async () => {
        try {
          setLoading(true);
          const job = await getJobById(id);
          setForm({
            title: job.title || '',
            department: job.department || '',
            location: job.location || '',
            workMode: job.workMode || 'hybrid',
            type: job.type || 'full-time',
            experienceMin: job.experienceMin ?? 2,
            experienceMax: job.experienceMax ?? 5,
            salaryMin: job.salaryMin ?? 8,
            salaryMax: job.salaryMax ?? 18,
            description: job.description || '',
            requiredSkills: job.skills ? [...job.skills] : [],
            preferredSkills: [],
            responsibilities: job.responsibilities || [],
          });
        } catch (e) {
          setError(e);
        } finally {
          setLoading(false);
        }
      })();
    }
  }, [mode, id]);

  const setField = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  const nextStep = () => {
    if (stepIndex < STEPS.length - 1) setActiveStep(STEPS[stepIndex + 1].id);
  };
  const prevStep = () => {
    if (stepIndex > 0) setActiveStep(STEPS[stepIndex - 1].id);
  };

  const addSkill = (type, skill) => {
    if (!skill.trim()) return;
    const key = type === 'required' ? 'requiredSkills' : 'preferredSkills';
    if (form[key].includes(skill.trim())) return;
    setForm(prev => ({ ...prev, [key]: [...prev[key], skill.trim()] }));
    setNewSkillText(prev => ({ ...prev, [type]: '' }));
  };
  const removeSkill = (type, skill) => {
    const key = type === 'required' ? 'requiredSkills' : 'preferredSkills';
    setForm(prev => ({ ...prev, [key]: prev[key].filter(s => s !== skill) }));
  };

  const addResponsibility = () => {
    if (!newResponsibility.trim()) return;
    setForm(prev => ({ ...prev, responsibilities: [...prev.responsibilities, newResponsibility.trim()] }));
    setNewResponsibility('');
  };
  const removeResponsibility = (idx) => {
    setForm(prev => ({ ...prev, responsibilities: prev.responsibilities.filter((_, i) => i !== idx) }));
  };
  const updateResponsibility = (idx, value) => {
    setForm(prev => ({
      ...prev,
      responsibilities: prev.responsibilities.map((r, i) => i === idx ? value : r),
    }));
  };

  const generateJD = async () => {
    if (!aiKeywords.trim()) {
      toast.warning('Please enter a few keywords first');
      return;
    }
    setAiGenerating(true);
    try {
      await sleep(1500);
      const kws = aiKeywords.split(/[,;\s]+/).filter(Boolean);
      const jd = `# ${form.title || capitalizeFirst(kws[0]) + ' Developer'}

## About the Role
We are seeking a talented ${form.title || capitalizeFirst(kws[0]) + ' Engineer'} to join our team in ${form.location || 'our growing organization'}. This is a fantastic opportunity to work on impactful projects using ${kws.slice(0, 5).join(', ')} while collaborating with top engineers.

## What You'll Do
- Design, develop, and maintain scalable applications using modern technologies
- Own features end-to-end from architecture through deployment
- Collaborate with product, design, and cross-functional teams
- Mentor junior engineers and conduct technical code reviews
- Contribute to architecture decisions and technical standards

## What We're Looking For
### Required:
${(form.requiredSkills.length ? form.requiredSkills : kws).map(s => `- Strong proficiency in ${s}`).join('\n')}
- ${calculateExperience(form.experienceMin)} to ${calculateExperience(form.experienceMax)} of relevant experience
- Excellent problem-solving and communication skills
- Bachelor's degree in Computer Science or equivalent experience

### Preferred:
${form.preferredSkills.length ? form.preferredSkills.map(s => `- Experience with ${s}`).join('\n') : '- Experience working in agile product teams\n- Open source contributions or side projects demonstrating passion'}

## What We Offer
- Competitive salary: ${formatSalaryRange(form.salaryMin, form.salaryMax)}
- ${form.workMode === 'remote' ? '100% Remote-first culture' : form.workMode === 'hybrid' ? 'Flexible hybrid work (3 days in office)' : 'On-site with modern amenities'}
- Comprehensive health insurance for you and family
- Annual learning & development budget
- 25 days paid leave + 10 public holidays
- Employee stock options for eligible roles
- Free meals, snacks, and wellness programs

Join us and build products that matter! 🚀`;
      setAiPreview(jd);
    } catch (e) {
      toast.error('Failed to generate JD. Please try again.');
    } finally {
      setAiGenerating(false);
    }
  };

  const applyJD = () => {
    if (aiPreview) {
      setField('description', aiPreview);
      if (form.requiredSkills.length === 0) {
        const kws = aiKeywords.split(/[,;\s]+/).filter(Boolean).slice(0, 6);
        if (kws.length) setForm(prev => ({ ...prev, requiredSkills: kws }));
      }
      toast.success('AI-generated description applied!');
      setAiModalOpen(false);
      setAiPreview('');
    }
  };

  const save = async (publish = false) => {
    setSaving(true);
    try {
      const payload = {
        title: form.title,
        department: form.department,
        location: form.location,
        workMode: form.workMode,
        type: form.type,
        experienceMin: Number(form.experienceMin),
        experienceMax: Number(form.experienceMax),
        salaryMin: Number(form.salaryMin),
        salaryMax: Number(form.salaryMax),
        description: form.description,
        skills: [...form.requiredSkills, ...form.preferredSkills],
        requiredSkills: form.requiredSkills,
        preferredSkills: form.preferredSkills,
        responsibilities: form.responsibilities,
        isActive: publish,
        postedBy: user?.id,
        companyName: user?.company || 'HireMind AI',
        companyLogo: user?.company?.slice(0, 3)?.toUpperCase() || 'HMA',
      };
      if (mode === 'edit' && id) {
        const job = await updateJob(id, payload);
        toast.success(publish ? 'Job updated and published!' : 'Changes saved as draft.');
        navigate(`/recruiter/jobs/${job.id}`);
      } else {
        const job = await createJob(payload);
        toast.success(publish ? 'Job published successfully!' : 'Job saved as draft.');
        navigate(publish ? `/recruiter/jobs/${job.id}` : '/recruiter/jobs');
      }
    } catch (e) {
      toast.error({ title: mode === 'edit' ? 'Failed to update job' : 'Failed to create job', message: e.message });
    } finally {
      setSaving(false);
    }
  };

  if (error) {
    return (
      <div className="space-y-5 animate-fade-in">
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={() => navigate(-1)} icon={<ArrowLeft className="w-4 h-4" />}>Back</Button>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-white">
            {mode === 'edit' ? 'Edit Job' : 'Create Job'}
          </h1>
        </div>
        <ErrorState onRetry={() => window.location.reload()} message={error.message} />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-5 animate-fade-in">
        <Skeleton className="h-9 w-48 rounded-lg" />
        <Card>
          <CardContent className="p-6 space-y-8">
            <div className="flex gap-3 overflow-x-auto pb-2">
              {STEPS.map(s => (
                <Skeleton key={s.id} className="h-20 min-w-[140px] rounded-xl" />
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <SkeletonInput />
              <SkeletonInput />
              <SkeletonInput />
              <SkeletonInput />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Button variant="ghost" onClick={() => navigate(-1)} icon={<ArrowLeft className="w-4 h-4" />} />
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-surface-900 dark:text-white truncate">
              {mode === 'edit' ? 'Edit Job' : 'Create New Job'}
            </h1>
            <p className="text-sm text-surface-500 dark:text-surface-400 mt-0.5">
              {mode === 'edit' ? 'Update your job posting details' : 'Draft a new role using our AI-assisted workflow'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="secondary" isLoading={saving} onClick={() => save(false)} icon={<Save className="w-4 h-4" />}>
            Save Draft
          </Button>
          <Button isLoading={saving} disabled={!canGoNext && mode === 'create'} onClick={() => save(true)} icon={<Upload className="w-4 h-4" />}>
            {mode === 'edit' ? 'Save & Publish' : 'Save & Publish'}
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="border-b border-surface-200 dark:border-surface-800 bg-surface-50/50 dark:bg-surface-900/40 px-4 sm:px-6 py-4 overflow-x-auto">
            <div className="flex items-center gap-1 sm:gap-3 min-w-max">
              {STEPS.map((step, i) => {
                const StepIcon = step.icon;
                const current = step.id === activeStep;
                const done = i < stepIndex;
                return (
                  <div key={step.id} className="flex items-center gap-1 sm:gap-3">
                    <button
                      onClick={() => i <= stepIndex && setActiveStep(step.id)}
                      className={cn(
                        'flex items-center gap-2.5 px-3 sm:px-4 py-2.5 rounded-xl border transition-all min-w-[130px] text-left',
                        current
                          ? 'bg-brand-50 dark:bg-brand-950/40 border-brand-300 dark:border-brand-800 shadow-sm'
                          : done
                            ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900 hover:bg-emerald-100/70 dark:hover:bg-emerald-950/50 cursor-pointer'
                            : 'bg-white dark:bg-surface-900 border-surface-200 dark:border-surface-800 opacity-60'
                      )}
                    >
                      <div className={cn(
                        'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
                        current
                          ? 'bg-brand-600 text-white'
                          : done
                            ? 'bg-emerald-500 text-white'
                            : 'bg-surface-100 dark:bg-surface-800 text-surface-400 dark:text-surface-500'
                      )}>
                        {done ? <Check className="w-4 h-4" /> : <StepIcon className="w-4 h-4" />}
                      </div>
                      <div className="min-w-0">
                        <div className={cn(
                          'text-xs font-semibold truncate',
                          current ? 'text-brand-700 dark:text-brand-300' : done ? 'text-emerald-700 dark:text-emerald-300' : 'text-surface-600 dark:text-surface-400'
                        )}>
                          {step.label}
                        </div>
                        <div className="text-[10px] text-surface-400 dark:text-surface-500 truncate hidden sm:block">
                          {step.description}
                        </div>
                      </div>
                    </button>
                    {i < STEPS.length - 1 && (
                      <ChevronRight className="w-4 h-4 text-surface-300 dark:text-surface-700 shrink-0 hidden sm:block" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-4 sm:p-6 space-y-6">
            {activeStep === 'basic' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="sm:col-span-2">
                  <Input
                    label="Job Title"
                    placeholder="e.g. Senior React Developer"
                    value={form.title}
                    onChange={(e) => setField('title', e.target.value)}
                    iconLeft={<Briefcase className="w-4 h-4" />}
                  />
                </div>
                <Select
                  label="Department"
                  placeholder="Select department"
                  value={form.department}
                  onChange={(v) => setField('department', v)}
                  options={DEPARTMENTS.map(d => ({ value: d.value, label: d.label }))}
                />
                <Select
                  label="Location"
                  placeholder="Select location"
                  value={form.location}
                  onChange={(v) => setField('location', v)}
                  options={LOCATIONS.map(l => ({ value: l.label, label: l.label }))}
                />
                <Select
                  label="Work Mode"
                  value={form.workMode}
                  onChange={(v) => setField('workMode', v)}
                  options={WORK_MODES.map(w => ({ value: w.value, label: w.label }))}
                />
                <Select
                  label="Employment Type"
                  value={form.type}
                  onChange={(v) => setField('type', v)}
                  options={JOB_TYPES.map(t => ({ value: t.value, label: t.label }))}
                />
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Min Exp (yrs)"
                    type="number"
                    min={0}
                    max={30}
                    value={form.experienceMin}
                    onChange={(e) => setField('experienceMin', Number(e.target.value))}
                    iconLeft={<Users className="w-4 h-4" />}
                  />
                  <Input
                    label="Max Exp (yrs)"
                    type="number"
                    min={0}
                    max={30}
                    value={form.experienceMax}
                    onChange={(e) => setField('experienceMax', Number(e.target.value))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Min Salary (LPA)"
                    type="number"
                    min={0}
                    value={form.salaryMin}
                    onChange={(e) => setField('salaryMin', Number(e.target.value))}
                    iconLeft={<DollarSign className="w-4 h-4" />}
                  />
                  <Input
                    label="Max Salary (LPA)"
                    type="number"
                    min={0}
                    value={form.salaryMax}
                    onChange={(e) => setField('salaryMax', Number(e.target.value))}
                  />
                </div>
              </div>
            )}

            {activeStep === 'description' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-surface-900 dark:text-white">Job Description</h3>
                    <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">
                      Write a compelling JD that attracts top talent. Or use our AI generator!
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    icon={<Sparkles className="w-4 h-4 text-brand-500" />}
                    onClick={() => {
                      setAiKeywords([form.title, form.department, ...form.requiredSkills].filter(Boolean).join(', '));
                      setAiModalOpen(true);
                    }}
                  >
                    Generate with AI
                  </Button>
                </div>
                <Textarea
                  label="Full Description"
                  placeholder="Write the job description, role overview, about the team, benefits, etc."
                  rows={16}
                  value={form.description}
                  onChange={(e) => setField('description', e.target.value)}
                  showCharCount
                  maxLength={8000}
                  helperText={`${form.description.split(/\s+/).filter(Boolean).length} words • Tip: Include keywords for better ATS compatibility`}
                />
                <div className="rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 p-4">
                  <div className="flex items-start gap-3">
                    <AiFillBulb className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <div className="text-sm text-amber-800 dark:text-amber-300 space-y-1">
                      <p className="font-semibold">Pro tips for a great JD:</p>
                      <ul className="list-disc list-inside text-xs space-y-0.5 opacity-90">
                        <li>Start with a catchy intro about your company culture & mission</li>
                        <li>Use bullet points — 75% of candidates scan instead of read</li>
                        <li>Quantify impact potential (e.g. "You'll serve 1M+ users")</li>
                        <li>Be transparent about salary — increases applications by 30%+</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeStep === 'skills' && (
              <div className="space-y-6">
                <SkillsSection
                  title="Required Skills"
                  subtitle="Candidates must have these. Minimum 2 required."
                  variant="required"
                  skills={form.requiredSkills}
                  addText={newSkillText.required}
                  onAddTextChange={(v) => setNewSkillText(p => ({ ...p, required: v }))}
                  onAdd={() => addSkill('required', newSkillText.required)}
                  onRemove={(s) => removeSkill('required', s)}
                  suggested={ALL_SKILLS.filter(s => !form.requiredSkills.includes(s) && !form.preferredSkills.includes(s)).slice(0, 15)}
                  onSuggestionClick={(s) => addSkill('required', s)}
                />
                <SkillsSection
                  title="Preferred Skills"
                  subtitle="Nice-to-haves that differentiate strong candidates."
                  variant="preferred"
                  skills={form.preferredSkills}
                  addText={newSkillText.preferred}
                  onAddTextChange={(v) => setNewSkillText(p => ({ ...p, preferred: v }))}
                  onAdd={() => addSkill('preferred', newSkillText.preferred)}
                  onRemove={(s) => removeSkill('preferred', s)}
                  suggested={ALL_SKILLS.filter(s => !form.requiredSkills.includes(s) && !form.preferredSkills.includes(s)).slice(15, 30)}
                  onSuggestionClick={(s) => addSkill('preferred', s)}
                />
              </div>
            )}

            {activeStep === 'responsibilities' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-base font-semibold text-surface-900 dark:text-white flex items-center gap-2">
                    <FaClipboardCheck className="text-brand-500" />
                    Key Responsibilities
                  </h3>
                  <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">
                    List 3-8 outcomes expected from the role. Minimum 3.
                  </p>
                </div>
                <div className="space-y-2.5">
                  {form.responsibilities.map((r, i) => (
                    <div key={i} className="flex items-start gap-2 group">
                      <div className="w-7 h-7 rounded-lg bg-brand-50 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-900 flex items-center justify-center shrink-0 mt-1.5">
                        <span className="text-xs font-bold text-brand-700 dark:text-brand-300">{i + 1}</span>
                      </div>
                      <Input
                        value={r}
                        onChange={(e) => updateResponsibility(i, e.target.value)}
                        className="flex-1"
                      />
                      <button
                        onClick={() => removeResponsibility(i)}
                        className="p-1.5 rounded-lg text-surface-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 mt-1 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-7 h-7 rounded-lg bg-surface-100 dark:bg-surface-800 border border-dashed border-surface-300 dark:border-surface-700 flex items-center justify-center shrink-0 mt-1.5">
                    <Plus className="w-4 h-4 text-surface-400" />
                  </div>
                  <div className="flex-1 flex gap-2">
                    <Input
                      placeholder="Describe a responsibility or expectation..."
                      value={newResponsibility}
                      onChange={(e) => setNewResponsibility(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addResponsibility())}
                    />
                    <Button onClick={addResponsibility} disabled={!newResponsibility.trim()}>
                      Add
                    </Button>
                  </div>
                </div>
                <div className="rounded-xl bg-brand-50/60 dark:bg-brand-950/20 border border-brand-100 dark:border-brand-900/60 p-4 text-xs text-brand-800 dark:text-brand-300 space-y-1">
                  <p className="font-semibold flex items-center gap-1.5"><Zap className="w-3.5 h-3.5" /> Suggested starter bullets:</p>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {[
                      'Lead end-to-end development of critical product features',
                      'Conduct code reviews and mentor junior team members',
                      'Collaborate with PM and design on roadmap and specs',
                      'Troubleshoot production issues and drive reliability improvements',
                      'Contribute to architecture and technical decisions',
                      'Write unit, integration and E2E tests for quality assurance',
                    ].map(s => (
                      <button
                        key={s}
                        onClick={() => {
                          if (!form.responsibilities.includes(s)) {
                            setForm(p => ({ ...p, responsibilities: [...p.responsibilities, s] }));
                          }
                        }}
                        className="px-2.5 py-1 rounded-md bg-white dark:bg-surface-900 border border-brand-200 dark:border-brand-800 hover:bg-brand-100 dark:hover:bg-brand-950/50 transition-colors truncate max-w-full"
                      >
                        + {truncate(s, 48)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeStep === 'review' && (
              <div className="space-y-5 max-w-4xl mx-auto">
                <div className="rounded-2xl overflow-hidden border border-surface-200 dark:border-surface-800 shadow-sm">
                  <div className="bg-gradient-to-br from-brand-500 to-brand-700 p-6 text-white">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-white/20 backdrop-blur text-xs font-semibold mb-3">
                          {mode === 'edit' ? 'Preview your changes' : 'Preview before publish'}
                        </div>
                        <h2 className="text-2xl font-bold tracking-tight">{form.title || 'Untitled Role'}</h2>
                        <p className="opacity-90 mt-1">
                          {DEPARTMENTS.find(d => d.value === form.department)?.label || '—'} • {user?.company || 'HireMind AI'}
                        </p>
                        <div className="flex flex-wrap gap-2 mt-3">
                          <Badge className="bg-white/20 backdrop-blur text-white border-0">{LOCATIONS.find(l => l.label === form.location)?.label || form.location || 'TBD'}</Badge>
                          <Badge className="bg-white/20 backdrop-blur text-white border-0">{WORK_MODES.find(w => w.value === form.workMode)?.label}</Badge>
                          <Badge className="bg-white/20 backdrop-blur text-white border-0">{JOB_TYPES.find(t => t.value === form.type)?.label}</Badge>
                          <Badge className="bg-white/20 backdrop-blur text-white border-0">{calculateExperience(form.experienceMin)} - {calculateExperience(form.experienceMax)}</Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs opacity-80">Salary Range</div>
                        <div className="text-lg font-bold">{formatSalaryRange(form.salaryMin, form.salaryMax)}</div>
                      </div>
                    </div>
                  </div>
                  <div className="p-6 bg-white dark:bg-surface-900 space-y-5">
                    <ReviewSection title="Required Skills" count={form.requiredSkills.length}>
                      <div className="flex flex-wrap gap-1.5">
                        {form.requiredSkills.length ? form.requiredSkills.map(s => (
                          <Badge key={s} variant="brand">{s}</Badge>
                        )) : <span className="text-sm text-surface-400">None specified</span>}
                      </div>
                    </ReviewSection>
                    {form.preferredSkills.length > 0 && (
                      <ReviewSection title="Preferred Skills" count={form.preferredSkills.length}>
                        <div className="flex flex-wrap gap-1.5">
                          {form.preferredSkills.map(s => (
                            <Badge key={s} variant="soft">{s}</Badge>
                          ))}
                        </div>
                      </ReviewSection>
                    )}
                    <ReviewSection title="Key Responsibilities" count={form.responsibilities.length}>
                      <ol className="space-y-2">
                        {form.responsibilities.map((r, i) => (
                          <li key={i} className="flex gap-3 text-sm text-surface-700 dark:text-surface-300 leading-relaxed">
                            <span className="w-5 h-5 rounded-md bg-brand-50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">{i + 1}</span>
                            <span>{r}</span>
                          </li>
                        ))}
                      </ol>
                    </ReviewSection>
                    <ReviewSection title="Full Description">
                      <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:text-surface-900 dark:prose-headings:text-white prose-p:text-surface-700 dark:prose-p:text-surface-300 text-sm whitespace-pre-wrap">
                        {form.description || <span className="text-surface-400 italic">No description provided</span>}
                      </div>
                    </ReviewSection>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="border-t border-surface-200 dark:border-surface-800 bg-surface-50/60 dark:bg-surface-900/40">
          <div className="flex w-full items-center justify-between gap-3">
            <Button
              variant="ghost"
              onClick={prevStep}
              disabled={stepIndex === 0}
              icon={<ArrowLeft className="w-4 h-4" />}
            >
              Previous
            </Button>
            <div className="flex items-center gap-2">
              {stepIndex < STEPS.length - 1 ? (
                <Button onClick={nextStep} disabled={!canGoNext} icon={<ArrowRight className="w-4 h-4" />} iconPosition="right">
                  Continue to {STEPS[stepIndex + 1].label}
                </Button>
              ) : (
                <Button onClick={() => save(true)} isLoading={saving} icon={<Upload className="w-4 h-4" />}>
                  {mode === 'edit' ? 'Update Job' : 'Publish Job'}
                </Button>
              )}
            </div>
          </div>
        </CardFooter>
      </Card>

      <Modal isOpen={aiModalOpen} onClose={() => setAiModalOpen(false)} size="lg">
        <ModalHeader title="Generate Job Description with AI" showClose>
          Enter a few keywords and we'll write a compelling JD for you.
        </ModalHeader>
        <ModalContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
              Keywords / Role Highlights
            </label>
            <Textarea
              rows={3}
              placeholder="e.g. React, TypeScript, fintech, senior, microservices, customer facing..."
              value={aiKeywords}
              onChange={(e) => setAiKeywords(e.target.value)}
              disabled={aiGenerating}
              showCharCount
              maxLength={300}
            />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              'React, Next.js, frontend',
              'Node.js, backend, API, microservices',
              'Data Science, Python, ML, SQL',
              'DevOps, AWS, Kubernetes, CI/CD',
            ].map(preset => (
              <button
                key={preset}
                onClick={() => setAiKeywords(preset)}
                className="text-left text-xs px-3 py-2 rounded-lg bg-surface-50 dark:bg-surface-800/60 border border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-300 hover:border-brand-400 dark:hover:border-brand-500 hover:text-brand-600 dark:hover:text-brand-400 transition-all"
              >
                {preset}
              </button>
            ))}
          </div>
          <Button
            fullWidth
            onClick={generateJD}
            isLoading={aiGenerating}
            icon={<FaWandMagicSparkles className="w-4 h-4" />}
            disabled={!aiKeywords.trim()}
          >
            {aiGenerating ? 'Writing your JD...' : '✨ Generate Description'}
          </Button>
          {aiPreview && (
            <div className="border border-surface-200 dark:border-surface-800 rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2.5 bg-emerald-50 dark:bg-emerald-950/40 border-b border-emerald-100 dark:border-emerald-900/60">
                <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
                  <Check className="w-3.5 h-3.5" /> AI Preview Ready
                </div>
                <span className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80">~ {aiPreview.split(/\s+/).length} words</span>
              </div>
              <div className="max-h-72 overflow-auto p-4 bg-white dark:bg-surface-900 text-sm whitespace-pre-wrap text-surface-700 dark:text-surface-300 leading-relaxed font-mono text-xs">
                {aiPreview}
              </div>
            </div>
          )}
        </ModalContent>
        <ModalFooter>
          <Button variant="ghost" onClick={() => setAiModalOpen(false)}>Cancel</Button>
          <Button
            onClick={applyJD}
            variant="success"
            disabled={!aiPreview}
            icon={<Check className="w-4 h-4" />}
          >
            Apply to Description
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}

function SkillsSection({ title, subtitle, variant, skills, addText, onAddTextChange, onAdd, onRemove, suggested, onSuggestionClick }) {
  const [search, setSearch] = useState('');
  const filteredSuggested = suggested.filter(s => s.toLowerCase().includes(search.toLowerCase())).slice(0, 12);
  const isRequired = variant === 'required';
  return (
    <div className="rounded-xl border border-surface-200 dark:border-surface-800 p-4 sm:p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-surface-900 dark:text-white flex items-center gap-2">
            {title}
            <Badge size="sm" variant={isRequired ? 'brand' : 'soft'}>{skills.length}</Badge>
          </h3>
          <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">{subtitle}</p>
        </div>
      </div>
      <div className="flex gap-2">
        <Input
          placeholder={isRequired ? 'Type a skill and press Enter...' : 'Add a nice-to-have skill...'}
          value={addText}
          onChange={(e) => onAddTextChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), onAdd())}
          iconLeft={<Star className={cn('w-4 h-4', isRequired ? 'text-brand-500' : 'text-amber-500')} />}
        />
        <Button onClick={onAdd} disabled={!addText.trim()} icon={<Plus className="w-4 h-4" />}>
          Add
        </Button>
      </div>
      <div className="min-h-[40px] flex flex-wrap gap-1.5">
        {skills.length === 0 ? (
          <p className="text-xs text-surface-400 italic">No {isRequired ? 'required' : 'preferred'} skills added yet.</p>
        ) : skills.map(s => (
          <span
            key={s}
            className={cn(
              'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border',
              isRequired
                ? 'bg-brand-50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300 border-brand-200 dark:border-brand-900'
                : 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900'
            )}
          >
            {s}
            <button
              onClick={() => onRemove(s)}
              className="hover:text-red-500 transition-colors p-0.5 -mr-0.5 rounded hover:bg-red-50 dark:hover:bg-red-950/30"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
      </div>
      <div className="border-t border-surface-100 dark:border-surface-800 pt-4 space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wide">Quick Add</p>
          <Input
            size="sm"
            placeholder="Search skills..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="!h-8 max-w-[200px]"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {filteredSuggested.map(s => (
            <button
              key={s}
              onClick={() => onSuggestionClick(s)}
              className="text-xs px-2.5 py-1 rounded-md bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-300 hover:bg-brand-50 dark:hover:bg-brand-950/40 hover:border-brand-300 dark:hover:border-brand-800 hover:text-brand-700 dark:hover:text-brand-300 transition-all"
            >
              + {s}
            </button>
          ))}
          {filteredSuggested.length === 0 && (
            <p className="text-xs text-surface-400">No matching skills. Type a custom one above.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function ReviewSection({ title, count, children }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <h4 className="text-sm font-bold text-surface-900 dark:text-white">{title}</h4>
        {typeof count === 'number' && (
          <Badge size="sm" variant="soft">{count}</Badge>
        )}
      </div>
      <div>{children}</div>
    </div>
  );
}

function capitalizeFirst(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
}
