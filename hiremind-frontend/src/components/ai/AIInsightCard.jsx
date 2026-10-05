import { TrendingUp, TrendingDown, Minus, Sparkles } from 'lucide-react';
import { cn, getColorClasses } from '../../lib/utils';

export default function AIInsightCard({
  icon: Icon,
  label,
  value,
  trend,
  trendDirection = 'up',
  color = 'brand',
  className,
}) {
  const colors = getColorClasses(color);

  const TrendIcon = trendDirection === 'up' ? TrendingUp : trendDirection === 'down' ? TrendingDown : Minus;
  const trendColor = trendDirection === 'up'
    ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40'
    : trendDirection === 'down'
    ? 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40'
    : 'text-surface-500 bg-surface-100 dark:bg-surface-800';

  return (
    <div className={cn('card-base p-5 relative overflow-hidden', className)}>
      <div className="flex items-start justify-between">
        <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', colors.bgSoft)}>
          <Icon className={cn('w-5 h-5', colors.text)} />
        </div>
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-brand-50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300 border border-brand-100 dark:border-brand-900">
          <Sparkles className="w-3 h-3" />
          AI
        </span>
      </div>
      <div className="mt-4 space-y-1.5">
        <p className="text-xs font-medium text-surface-500 dark:text-surface-400">{label}</p>
        <div className="flex items-end gap-2">
          <span className="text-2xl font-bold text-surface-900 dark:text-white tracking-tight">
            {value}
          </span>
          {trend && (
            <span className={cn(
              'inline-flex items-center gap-0.5 text-xs font-medium px-1.5 py-0.5 rounded-md mb-1',
              trendColor
            )}>
              <TrendIcon className="w-3 h-3" />
              {trend}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
