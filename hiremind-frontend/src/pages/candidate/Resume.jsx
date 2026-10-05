import { useEffect, useState, useCallback, useRef } from 'react';
import {
  FiUpload, FiDownload, FiTrash2, FiRefreshCw, FiFileText, FiCheckCircle,
  FiAlertTriangle, FiInfo, FiZap, FiStar, FiLoader, FiX, FiCalendar,
} from 'react-icons/fi';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ScoreRing } from '@/components/ui/ScoreRing';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Skeleton, SkeletonCard, SkeletonText } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { uploadResume, getResume, deleteResume, downloadResume } from '@/services/resumeService';
import { formatDate, formatFileSize, truncate } from '@/lib/utils';

function ResumeSkeleton() {
  return (
    <div className="space-y-6">
      <SkeletonCard lines={3} imageHeight="h-0" showImage={false} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <SkeletonCard lines={5} imageHeight="h-0" showImage={false} />
        <div className="lg:col-span-2 space-y-6">
          <SkeletonCard lines={4} imageHeight="h-0" showImage={false} />
          <SkeletonCard lines={4} imageHeight="h-0" showImage={false} />
        </div>
      </div>
    </div>
  );
}

export default function Resume() {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();
  const fileInputRef = useRef(null);
  const dropRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [resume, setResume] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingStep, setProcessingStep] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  const fetchResume = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getResume();
      setResume(data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchResume();
  }, [fetchResume]);

  const simulateProcessing = async () => {
    setProcessing(true);
    setProcessingProgress(0);
    const steps = [
      { label: 'Uploading file...', progress: 20 },
      { label: 'Extracting text...', progress: 45 },
      { label: 'Analyzing content...', progress: 70 },
      { label: 'Scoring resume...', progress: 90 },
      { label: 'Finalizing...', progress: 100 },
    ];
    for (const step of steps) {
      setProcessingStep(step.label);
      setProcessingProgress(step.progress);
      await new Promise(r => setTimeout(r, 500));
    }
    setProcessing(false);
    setProcessingStep('');
    setProcessingProgress(0);
  };

  const handleFileSelect = async (file) => {
    if (!file) return;
    const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!validTypes.includes(file.type) && !/\.(pdf|doc|docx)$/i.test(file.name)) {
      toastError({ title: 'Invalid file type', message: 'Please upload a PDF or Word document.' });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toastError({ title: 'File too large', message: 'Maximum file size is 10MB.' });
      return;
    }
    try {
      await simulateProcessing();
      const result = await uploadResume(file);
      setResume(result);
      success({ title: 'Resume uploaded', message: 'Your resume has been analyzed successfully.' });
    } catch (err) {
      toastError({ title: 'Upload failed', message: err.message });
    }
  };

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) handleFileSelect(file);
  }, []);

  const onDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDelete = async () => {
    if (!resume) return;
    try {
      await deleteResume(resume.id);
      setResume(null);
      success({ title: 'Resume deleted', message: 'Your resume has been removed.' });
    } catch (err) {
      toastError({ title: 'Delete failed', message: err.message });
    }
  };

  const handleDownload = async () => {
    if (!resume) return;
    try {
      await downloadResume(resume.id);
      success({ title: 'Download started', message: 'Your resume is being downloaded.' });
    } catch (err) {
      toastError({ title: 'Download failed', message: err.message });
    }
  };

  const handleReplace = () => {
    fileInputRef.current?.click();
  };

  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <ErrorState title="Couldn't load resume" message={error.message} onRetry={fetchResume} fullHeight size="lg" />
      </div>
    );
  }

  const mockScore = resume?.parseResult?.matchScore || 82;
  const mockSkills = resume?.parseResult?.skills || ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'AWS', 'Docker', 'Git', 'Redux', 'Next.js', 'Tailwind CSS'];
  const mockStrengths = resume?.parseResult?.experience?.flatMap(e => e.highlights)?.slice(0, 4) || [
    'Led migration of legacy frontend to React/TypeScript, reducing page load time by 60%',
    'Architected micro-frontend platform serving 2M+ monthly active users',
    'Mentored 5 junior engineers on best practices and code quality',
    'Implemented CI/CD pipeline reducing deployment time from 45min to 8min',
  ];
  const mockImprovements = [
    'Add 2-3 quantified achievements with specific numbers ($, %, users)',
    'Include a brief professional summary at the top (2-3 lines)',
    'Add links to LinkedIn, GitHub, and portfolio projects',
    'Use more action verbs: Architected, Optimized, Scaled, Launched',
  ];
  const mockMissing = [
    'Expected salary / notice period not mentioned',
    'Certification details incomplete (dates, IDs)',
    'Project section missing links or live demos',
    'Languages proficiency not specified',
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-surface-900 dark:text-surface-50">
            My Resume
          </h1>
          <p className="text-surface-500 dark:text-surface-400 mt-1">
            Upload, manage, and get AI-powered insights on your resume
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className="hidden"
            onChange={e => handleFileSelect(e.target.files?.[0])}
          />
          {resume && !loading && (
            <>
              <Button variant="outline" size="md" onClick={handleDownload}>
                <FiDownload className="w-4 h-4 mr-1.5" />
                Download
              </Button>
              <Button variant="outline" size="md" onClick={handleReplace}>
                <FiRefreshCw className="w-4 h-4 mr-1.5" />
                Replace
              </Button>
              <Button variant="danger" size="md" onClick={handleDelete}>
                <FiTrash2 className="w-4 h-4 mr-1.5" />
                Delete
              </Button>
            </>
          )}
        </div>
      </div>

      {loading ? (
        <ResumeSkeleton />
      ) : !resume ? (
        <Card>
          <CardContent className="p-8 md:p-12">
            {processing ? (
              <div className="max-w-md mx-auto text-center space-y-6 py-8">
                <div className="w-20 h-20 mx-auto rounded-2xl bg-brand-100 dark:bg-brand-900/40 text-brand-600 dark:text-brand-400 flex items-center justify-center relative">
                  <FiLoader className="w-10 h-10 animate-spin" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-50">
                    {processingStep}
                  </h3>
                  <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
                    Please wait while we analyze your resume
                  </p>
                </div>
                <div className="w-full max-w-sm mx-auto">
                  <ProgressBar value={processingProgress} color="brand" showValue size="md" />
                </div>
              </div>
            ) : (
              <div
                ref={dropRef}
                onDrop={onDrop}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onClick={() => fileInputRef.current?.click()}
                className={`cursor-pointer rounded-2xl border-2 border-dashed p-10 md:p-16 text-center transition-all ${
                  isDragging
                    ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/30 scale-[1.01]'
                    : 'border-surface-300 dark:border-surface-700 hover:border-brand-400 dark:hover:border-brand-500 hover:bg-surface-50 dark:hover:bg-surface-900/50'
                }`}
              >
                <div className="w-20 h-20 mx-auto rounded-2xl bg-brand-100 dark:bg-brand-900/40 text-brand-600 dark:text-brand-400 flex items-center justify-center mb-5">
                  <FiUpload className="w-10 h-10" />
                </div>
                <h3 className="text-xl font-semibold text-surface-900 dark:text-surface-50 mb-2">
                  Drag & drop your resume here
                </h3>
                <p className="text-surface-500 dark:text-surface-400 mb-6">
                  or click to browse from your computer
                </p>
                <Button variant="primary" size="lg" icon={<FiFileText className="w-5 h-5" />}>
                  Choose File
                </Button>
                <div className="mt-6 flex flex-wrap justify-center gap-2 text-xs text-surface-400 dark:text-surface-500">
                  <Badge variant="default" size="sm">PDF</Badge>
                  <Badge variant="default" size="sm">DOC</Badge>
                  <Badge variant="default" size="sm">DOCX</Badge>
                  <Badge variant="default" size="sm">Max 10MB</Badge>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          {processing && (
            <Card className="border-brand-300 dark:border-brand-700 bg-brand-50 dark:bg-brand-950/30">
              <CardContent className="p-4 flex flex-col sm:flex-row items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-brand-500 text-white flex items-center justify-center shrink-0">
                  <FiLoader className="w-5 h-5 animate-spin" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-brand-900 dark:text-brand-100">{processingStep}</p>
                  <ProgressBar value={processingProgress} color="brand" showValue size="sm" className="mt-2" />
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="overflow-hidden">
            <div className="h-28 md:h-32 bg-gradient-to-r from-brand-600 via-indigo-600 to-violet-600 relative">
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_30%_30%,white,transparent_40%),radial-gradient(circle_at_70%_70%,white,transparent_40%)]" />
            </div>
            <CardContent className="pt-0 md:pt-0 relative -mt-14 md:-mt-16 px-6 pb-6">
              <div className="flex flex-col lg:flex-row lg:items-end gap-4 lg:gap-6">
                <div className="w-28 h-28 md:w-32 md:h-32 rounded-2xl ring-4 ring-white dark:ring-surface-900 shadow-lg bg-white dark:bg-surface-900 flex items-center justify-center shrink-0">
                  <ScoreRing value={mockScore} size={112} strokeWidth={10} showLabel={true} />
                </div>
                <div className="flex-1 pt-2 lg:pb-2 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <h2 className="text-xl md:text-2xl font-bold text-surface-900 dark:text-surface-50 truncate">
                      {resume.fileName}
                    </h2>
                    {resume.primary && (
                      <Badge variant="brand" size="sm" icon={<FiStar className="w-3 h-3 mr-0.5" />}>
                        Primary
                      </Badge>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-surface-500 dark:text-surface-400">
                    <span className="flex items-center gap-1">
                      <FiFileText className="w-3.5 h-3.5" />
                      {formatFileSize(resume.fileSize)}
                    </span>
                    <span className="flex items-center gap-1">
                      <FiCalendar className="w-3.5 h-3.5" />
                      {formatDate(resume.uploadedAt, 'MMM dd, yyyy')}
                    </span>
                    <span className="flex items-center gap-1">
                      <FiZap className="w-3.5 h-3.5 text-amber-500" />
                      {resume.parseResult?.confidence || 91}% confidence
                    </span>
                  </div>
                  <p className="text-sm text-surface-600 dark:text-surface-400 mt-2 line-clamp-2">
                    {resume.parseResult?.summary || 'Experienced software developer with 5+ years building scalable web applications.'}
                  </p>
                </div>
                <div className="flex gap-2 lg:pb-2">
                  <Button variant="outline" size="sm" onClick={handleDownload}>
                    <FiDownload className="w-4 h-4 mr-1" /> Download
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleReplace}>
                    <FiRefreshCw className="w-4 h-4 mr-1" /> Replace
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <FiZap className="w-4 h-4 text-brand-500" />
                  Skills Extracted
                </CardTitle>
                <CardDescription>{mockSkills.length} skills detected</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex flex-wrap gap-1.5">
                  {mockSkills.map(s => (
                    <Badge key={s} variant="soft" size="md">{s}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FiCheckCircle className="w-4 h-4 text-emerald-500" />
                    Strengths
                  </CardTitle>
                  <CardDescription>What's working well in your resume</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <ul className="space-y-2.5">
                    {mockStrengths.map((s, i) => (
                      <li key={i} className="flex gap-3 text-sm">
                        <FiCheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span className="text-surface-700 dark:text-surface-300">{s}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FiAlertTriangle className="w-4 h-4 text-amber-500" />
                    Improvements
                  </CardTitle>
                  <CardDescription>Suggestions to boost your score</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <ul className="space-y-2.5">
                    {mockImprovements.map((s, i) => (
                      <li key={i} className="flex gap-3 text-sm">
                        <FiAlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                        <span className="text-surface-700 dark:text-surface-300">{s}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FiInfo className="w-4 h-4 text-sky-500" />
                    Missing Information
                  </CardTitle>
                  <CardDescription>Details to add for a complete profile</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <ul className="space-y-2.5">
                    {mockMissing.map((s, i) => (
                      <li key={i} className="flex gap-3 text-sm">
                        <FiX className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                        <span className="text-surface-700 dark:text-surface-300">{s}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
