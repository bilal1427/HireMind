import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

const DEFAULT_DATA = {
  matched: ['React', 'TypeScript', 'Node.js', 'REST APIs', 'Git'],
  partial: ['GraphQL', 'AWS', 'CI/CD'],
  missing: ['Kubernetes', 'Terraform'],
  explanation:
    "This candidate is a strong technical fit with 5+ years building production React applications and deep TypeScript experience. Their background in full-stack development aligns well with the senior role requirements, showing consistent patterns of shipping scalable web apps. The project history demonstrates clear ownership of complex features, though cloud infrastructure experience with Kubernetes would benefit from onboarding. Overall a high-probability success hire for the team.",
};

const BadgeList = ({ title, icon: Icon, items, variant }) => {
  const variantStyles = {
    matched: {
      icon: 'text-emerald-500',
      badge: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
      title: 'text-emerald-700 dark:text-emerald-400',
      headerBg: 'bg-emerald-50 dark:bg-emerald-950/30',
    },
    partial: {
      icon: 'text-amber-500',
      badge: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
      title: 'text-amber-700 dark:text-amber-400',
      headerBg: 'bg-amber-50 dark:bg-amber-950/30',
    },
    missing: {
      icon: 'text-red-500',
      badge: 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800',
      title: 'text-red-700 dark:text-red-400',
      headerBg: 'bg-red-50 dark:bg-red-950/30',
    },
  };
  const styles = variantStyles[variant];

  return (
    <div className="rounded-xl border border-surface-200 dark:border-surface-800 overflow-hidden">
      <div className={cn('px-4 py-2.5 flex items-center gap-2', styles.headerBg)}>
        <Icon className={cn('w-4 h-4', styles.icon)} />
        <span className={cn('text-sm font-semibold', styles.title)}>{title}</span>
        <span className="text-xs font-medium text-surface-500 dark:text-surface-400 ml-auto">
          {items.length}
        </span>
      </div>
      <div className="p-3 flex flex-wrap gap-2">
        {items.length === 0 ? (
          <span className="text-xs text-surface-400 dark:text-surface-500">—</span>
        ) : (
          items.map((item, i) => (
            <span
              key={i}
              className={cn(
                'text-xs font-medium px-2.5 py-1 rounded-md border',
                styles.badge
              )}
            >
              {item}
            </span>
          ))
        )}
      </div>
    </div>
  );
};

export default function AIExplanation({ data = DEFAULT_DATA }) {
  return (
    <div className="card-base p-5 space-y-5">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-brand-50 dark:bg-brand-950/40 flex items-center justify-center">
          <svg className="w-4 h-4 text-brand-600 dark:text-brand-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <div>
          <h3 className="text-base font-semibold text-surface-900 dark:text-white">
            Skill Analysis
          </h3>
          <p className="text-xs text-surface-500 dark:text-surface-400">
            AI-powered breakdown of fit
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <BadgeList
          title="Matched Skills"
          icon={CheckCircle2}
          items={data.matched}
          variant="matched"
        />
        <BadgeList
          title="Partial Skills"
          icon={AlertTriangle}
          items={data.partial}
          variant="partial"
        />
        <BadgeList
          title="Missing Skills"
          icon={XCircle}
          items={data.missing}
          variant="missing"
        />
      </div>

      <div className="rounded-xl bg-surface-50 dark:bg-surface-800/50 p-4 border border-surface-200 dark:border-surface-700">
        <div className="flex items-center gap-2 mb-2">
        <svg className="w-4 h-4 text-brand-500" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
        </svg>
          <span className="text-sm font-semibold text-surface-900 dark:text-white">
            Why you match
          </span>
        </div>
        <p className="text-sm leading-relaxed text-surface-600 dark:text-surface-300">
          {data.explanation}
        </p>
      </div>
    </div>
  );
}
