import { cn } from '@/lib/utils';

const progressColors = {
  brand: 'bg-brand-600',
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  danger: 'bg-red-500',
  info: 'bg-sky-500',
};

const trackColors = {
  brand: 'bg-brand-100 dark:bg-brand-900/40',
  success: 'bg-emerald-100 dark:bg-emerald-900/40',
  warning: 'bg-amber-100 dark:bg-amber-900/40',
  danger: 'bg-red-100 dark:bg-red-900/40',
  info: 'bg-sky-100 dark:bg-sky-900/40',
  default: 'bg-surface-200 dark:bg-surface-700',
};

const heights = {
  xs: 'h-1',
  sm: 'h-1.5',
  md: 'h-2.5',
  lg: 'h-4',
  xl: 'h-6',
};

function ProgressBar({
  value = 0,
  max = 100,
  label,
  showValue = true,
  size = 'md',
  color = 'brand',
  striped = false,
  animated = false,
  className,
}) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  const roundedPercentage = Math.round(percentage * 10) / 10;

  return (
    <div className={cn('w-full', className)}>
      {(label || showValue) && (
        <div className="flex items-center justify-between mb-1.5">
          {label && (
            <span className="text-sm font-medium text-surface-700 dark:text-surface-300">
              {label}
            </span>
          )}
          {showValue && (
            <span className="text-sm font-medium text-surface-500 dark:text-surface-400">
              {roundedPercentage}%
            </span>
          )}
        </div>
      )}
      <div
        className={cn(
          'w-full overflow-hidden rounded-full',
          trackColors[color] || trackColors.default,
          heights[size]
        )}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
      >
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500 ease-out',
            progressColors[color],
            striped &&
              'bg-[linear-gradient(45deg,rgba(255,255,255,0.15)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.15)_50%,rgba(255,255,255,0.15)_75%,transparent_75%,transparent)] bg-[length:1rem_1rem]',
            animated && striped && 'animate-[progress-stripes_1s_linear_infinite]'
          )}
          style={{
            width: `${percentage}%`,
          }}
        />
      </div>
    </div>
  );
}

export { ProgressBar };
