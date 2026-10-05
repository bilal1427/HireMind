import { useEffect, useState } from 'react';
import { cn, getScoreTier, getColorClasses } from '../../lib/utils';

export default function MatchScore({ score = 87, subtitle, size = 'lg' }) {
  const [animated, setAnimated] = useState(0);
  const { color } = getScoreTier(score);
  const colors = getColorClasses(color);
  const tier = getScoreTier(score);

  const circumference = 2 * Math.PI * 90;
  const offset = circumference - (animated / 100) * circumference;

  const dimensions = size === 'lg' ? 'w-56 h-56' : size === 'md' ? 'w-44 h-44' : 'w-32 h-32';
  const textSize = size === 'lg' ? 'text-6xl' : size === 'md' ? 'text-5xl' : 'text-3xl';
  const subtitleSize = size === 'lg' ? 'text-base' : size === 'md' ? 'text-sm' : 'text-xs';

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(score), 100);
    return () => clearTimeout(timer);
  }, [score]);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className={cn('relative', dimensions)}>
        <svg
          className="w-full h-full -rotate-90"
          viewBox="0 0 200 200"
        >
          <circle
            cx="100"
            cy="100"
            r="90"
            fill="none"
            stroke="currentColor"
            className="text-surface-100 dark:text-surface-800"
            strokeWidth="12"
          />
          <defs>
            <linearGradient id={`scoreGrad-${score}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" className={cn('[stop-color:currentColor', colors.text)} />
              <stop offset="100%" className={cn('[stop-color:currentColor]', colors.text)} />
            </linearGradient>
          </defs>
          <circle
            cx="100"
            cy="100"
            r="90"
            fill="none"
            stroke={`url(#scoreGrad-${score})`}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn('font-bold', textSize, colors.text)}>{animated}%</span>
          <span className={cn('font-medium mt-1 text-surface-500 dark:text-surface-400', subtitleSize)}>
            Match
          </span>
        </div>
      </div>
      <div className="flex flex-col items-center gap-1">
        <span className={cn('text-sm font-semibold px-3 py-1 rounded-full', colors.bgSoft, colors.text, colors.border, 'border')}>
          {tier.label}
        </span>
        {subtitle && (
          <p className="text-sm text-surface-500 dark:text-surface-400 text-center max-w-xs">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}
