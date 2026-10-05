import { cn } from '@/lib/utils';

function Skeleton({ className, ...props }) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-surface-200 dark:bg-surface-700',
        'relative overflow-hidden',
        className
      )}
      {...props}
    >
      <div
        className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/40 dark:via-surface-600/40 to-transparent"
        aria-hidden="true"
      />
    </div>
  );
}

function SkeletonText({ lines = 3, className, lineClassName }) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }, (_, i) => {
        const widths = ['w-full', 'w-11/12', 'w-10/12', 'w-9/12', 'w-4/5', 'w-3/4', 'w-2/3', 'w-1/2'];
        const width = i === lines - 1 ? widths[widths.length - 1] : widths[i % (widths.length - 2)];
        return (
          <Skeleton
            key={i}
            className={cn('h-3', width, lineClassName)}
          />
        );
      })}
    </div>
  );
}

function SkeletonCard({ className, showImage = true, imageHeight = 'h-48', lines = 3 }) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-xl',
        'bg-white dark:bg-surface-900',
        'border border-surface-200 dark:border-surface-800',
        'shadow-soft',
        className
      )}
    >
      {showImage && <Skeleton className={cn('w-full rounded-none', imageHeight)} />}
      <div className="p-5 space-y-4">
        <Skeleton className="h-5 w-2/3" />
        <SkeletonText lines={lines} />
        <div className="flex gap-2 pt-2">
          <Skeleton className="h-8 w-20 rounded-lg" />
          <Skeleton className="h-8 w-24 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

function SkeletonList({ count = 5, className, itemClassName }) {
  return (
    <div className={cn('space-y-4', className)}>
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className={cn(
            'flex items-center gap-4 p-4 rounded-lg',
            'bg-white dark:bg-surface-900',
            'border border-surface-200 dark:border-surface-800',
            itemClassName
          )}
        >
          <Skeleton className="h-12 w-12 rounded-full shrink-0" />
          <div className="flex-1 space-y-2 min-w-0">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-9 w-20 rounded-md shrink-0" />
        </div>
      ))}
    </div>
  );
}

function SkeletonTable({ rows = 5, columns = 5, className, showHeader = true }) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-xl',
        'bg-white dark:bg-surface-900',
        'border border-surface-200 dark:border-surface-800',
        className
      )}
    >
      <div className="w-full overflow-auto">
        <table className="w-full">
          {showHeader && (
            <thead>
              <tr className="border-b border-surface-200 dark:border-surface-800">
                {Array.from({ length: columns }, (_, i) => (
                  <th key={i} className="p-4 text-left">
                    <Skeleton className="h-4 w-3/4" />
                  </th>
                ))}
              </tr>
            </thead>
          )}
          <tbody>
            {Array.from({ length: rows }, (_, rowIndex) => (
              <tr
                key={rowIndex}
                className="border-b border-surface-100 dark:border-surface-800 last:border-b-0"
              >
                {Array.from({ length: columns }, (_, colIndex) => (
                  <td key={colIndex} className="p-4">
                    <Skeleton
                      className={cn(
                        'h-4',
                        colIndex === 0 ? 'w-full' : colIndex % 2 === 0 ? 'w-3/4' : 'w-1/2'
                      )}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SkeletonAvatar({ size = 'md', className }) {
  const sizes = {
    xs: 'h-6 w-6',
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-14 w-14',
    xl: 'h-20 w-20',
  };
  return <Skeleton className={cn('rounded-full', sizes[size], className)} />;
}

function SkeletonButton({ variant = 'primary', size = 'md', className }) {
  const sizes = {
    sm: 'h-8 w-24',
    md: 'h-10 w-32',
    lg: 'h-12 w-40',
  };
  return <Skeleton className={cn('rounded-lg', sizes[size], className)} />;
}

function SkeletonInput({ size = 'md', className }) {
  const sizes = {
    sm: 'h-8',
    md: 'h-10',
    lg: 'h-12',
  };
  return <Skeleton className={cn('rounded-lg w-full', sizes[size], className)} />;
}

export {
  Skeleton,
  SkeletonText,
  SkeletonCard,
  SkeletonList,
  SkeletonTable,
  SkeletonAvatar,
  SkeletonButton,
  SkeletonInput,
};
