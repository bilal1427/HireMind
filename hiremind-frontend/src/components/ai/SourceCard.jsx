import { FileText, ClipboardList, FolderKanban, ExternalLink } from 'lucide-react';
import { cn } from '../../lib/utils';

const SOURCE_ICONS = {
  resume: { icon: FileText, label: 'Resume' },
  job: { icon: ClipboardList, label: 'Job Description' },
  project: { icon: FolderKanban, label: 'Project Portfolio' },
};

const DEFAULT_SOURCES = [
  { type: 'resume', text: '5+ years React experience at TechCorp' },
  { type: 'job', text: 'Senior React requirement: 4+ years React required' },
  { type: 'project', text: 'Led e-commerce platform migration to React 18' },
];

export default function SourceCard({ sources = DEFAULT_SOURCES, className }) {
  return (
    <div className={cn(
      'rounded-lg border border-dashed border-surface-300 dark:border-surface-700 bg-surface-50 dark:bg-surface-800/40 p-3',
      className
    )}>
      <div className="flex items-center gap-1.5 mb-2.5">
      <svg className="w-3.5 h-3.5 text-surface-500 dark:text-surface-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-6l-2-2H5a2 2 0 0 0-2 2z" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      <span className="text-xs font-semibold text-surface-600 dark:text-surface-400">
        Sources / Evidence
      </span>
    </div>
      <ul className="space-y-1.5">
        {sources.map((src, i) => {
          const meta = SOURCE_ICONS[src.type] || SOURCE_ICONS.resume;
          const Icon = meta.icon;
          return (
            <li key={i} className="flex items-start gap-2">
              <Icon className="w-3.5 h-3.5 mt-0.5 text-brand-500 flex-shrink-0" />
              <p className="text-xs leading-relaxed text-surface-600 dark:text-surface-300 flex-1">
                <span className="font-medium text-surface-700 dark:text-surface-200">
                  {meta.label}:
                </span>{' '}
                {src.text}
              </p>
              <button className="flex-shrink-0 text-surface-400 hover:text-brand-500 transition-colors">
                <ExternalLink className="w-3 h-3" />
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
