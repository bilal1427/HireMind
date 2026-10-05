import { cn } from '@/lib/utils';

function getScoreColor(value) {
  if (value >= 90) return { stroke: '#10b981', bg: '#10b98120', text: 'text-emerald-600 dark:text-emerald-400', label: 'Excellent' };
  if (value >= 75) return { stroke: '#8b5cf6', bg: '#8b5cf620', text: 'text-brand-600 dark:text-brand-400', label: 'Great' };
  if (value >= 60) return { stroke: '#0ea5e9', bg: '#0ea5e920', text: 'text-sky-600 dark:text-sky-400', label: 'Good' };
  if (value >= 40) return { stroke: '#f59e0b', bg: '#f59e0b20', text: 'text-amber-600 dark:text-amber-400', label: 'Fair' };
  return { stroke: '#ef4444', bg: '#ef444420', text: 'text-red-600 dark:text-red-400', label: 'Needs Work' };
}

function ScoreRing({
  value = 0,
  max = 100,
  size = 120,
  strokeWidth = 8,
  centerText,
  showLabel = true,
  showValue = true,
  color,
  className,
}) {
  const clampedValue = Math.min(Math.max(value, 0), max);
  const percentage = (clampedValue / max) * 100;
  const colors = color ? { stroke: color, bg: `${color}20` } : getScoreColor(clampedValue);
  const scoreColors = getScoreColor(clampedValue);
  const textClass = color ? '' : scoreColors.text;

  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  const displayValue = Math.round(clampedValue * 10) / 10;

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={colors.bg}
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={colors.stroke}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {centerText ? (
          <div className="text-center">{centerText}</div>
        ) : (
          <>
            {showValue && (
              <span
                className={cn(
                  'font-bold leading-none',
                  textClass,
                  size >= 120 ? 'text-3xl' : size >= 80 ? 'text-2xl' : 'text-xl'
                )}
              >
                {displayValue}
              </span>
            )}
            {showLabel && (
              <span className={cn(
                'mt-1 text-xs font-medium',
                size >= 100 ? 'text-xs' : 'text-[10px]',
                textClass
              )}>
                {scoreColors.label}
              </span>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export { ScoreRing, getScoreColor };
