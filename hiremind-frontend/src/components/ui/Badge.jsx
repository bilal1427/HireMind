import { cn } from '@/lib/utils';

const badgeVariants = {
  variant: {
    default:
      'bg-surface-100 text-surface-800 border border-surface-200 dark:bg-surface-800 dark:text-surface-200 dark:border-surface-700',
    brand:
      'bg-brand-100 text-brand-800 border border-brand-200 dark:bg-brand-900/50 dark:text-brand-200 dark:border-brand-800',
    success:
      'bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-800',
    warning:
      'bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-800',
    danger:
      'bg-red-100 text-red-800 border border-red-200 dark:bg-red-900/40 dark:text-red-300 dark:border-red-800',
    info:
      'bg-sky-100 text-sky-800 border border-sky-200 dark:bg-sky-900/40 dark:text-sky-300 dark:border-sky-800',
    outline:
      'bg-transparent text-surface-700 dark:text-surface-300 border border-surface-300 dark:border-surface-600',
    soft: 'bg-brand-50 text-brand-700 dark:bg-brand-950/50 dark:text-brand-300 border-transparent',
  },
  size: {
    sm: 'text-[10px] px-1.5 py-0.5 rounded-md',
    md: 'text-xs px-2.5 py-1 rounded-lg',
    lg: 'text-sm px-3 py-1.5 rounded-lg',
  },
};

function Badge({ className, variant = 'default', size = 'md', ...props }) {
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center gap-1 font-medium',
        'shrink-0 transition-colors',
        badgeVariants.variant[variant],
        badgeVariants.size[size],
        className
      )}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
