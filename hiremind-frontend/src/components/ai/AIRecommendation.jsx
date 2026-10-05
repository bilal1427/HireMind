import { ArrowRight } from 'lucide-react';
import { cn, getColorClasses } from '../../lib/utils';

export default function AIRecommendation({
  icon: Icon, title, description, cta = 'View details', onClick, color = 'brand' }) {
  const colors = getColorClasses(color);
  return (
    <div className="card-base p-5 relative overflow-hidden group">
      <div className={cn(
        'absolute -top-16 -right-16 w-40 h-40 rounded-full opacity-10 blur-2xl',
        colors.bg
      )} />
      <div className="relative flex flex-col gap-3">
        <div className={cn(
          'w-11 h-11 rounded-xl flex items-center justify-center',
          colors.bgSoft
        )}>
          <Icon className={cn('w-5 h-5', colors.text)} />
        </div>
        <div>
          <h4 className="font-semibold text-surface-900 dark:text-white mb-1">
            {title}
          </h4>
          <p className="text-sm text-surface-600 dark:text-surface-400 leading-relaxed">
            {description}
          </p>
        </div>
        <button
          onClick={onClick}
          className={cn(
            'inline-flex items-center gap-1.5 text-sm font-medium mt-1',
            colors.text,
            'hover:gap-2 transition-all'
          )}
        >
          {cta}
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
