import { Code2, Briefcase, FolderKanban, Sparkles } from 'lucide-react';
import { cn, getColorClasses } from '../../lib/utils';

const DEFAULT_ITEMS = [
  { label: 'Skill Match', value: 92, icon: Code2, color: 'emerald' },
  { label: 'Experience Match', value: 78, icon: Briefcase, color: 'green' },
  { label: 'Project Match', value: 65, icon: FolderKanban, color: 'amber' },
  { label: 'Overall Match', value: 85, icon: Sparkles, color: 'brand' },
];

export default function MatchBreakdown({ items = DEFAULT_ITEMS }) {
  return (
    <div className="space-y-5">
      {items.map((item, idx) => {
        const Icon = item.icon;
        const colors = getColorClasses(item.color);
        return (
          <div key={idx} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', colors.bgSoft)}>
                  <Icon className={cn('w-4 h-4', colors.text)} />
                </div>
                <span className="text-sm font-medium text-surface-700 dark:text-surface-300">
                  {item.label}
                </span>
              </div>
              <span className={cn('text-sm font-bold tabular-nums', colors.text)}>
                {item.value}%
              </span>
            </div>
            <div className="w-full h-2.5 bg-surface-100 dark:bg-surface-800 rounded-full overflow-hidden">
              <div
                className={cn('h-full rounded-full transition-all duration-1000 ease-out', colors.bg)}
                style={{ width: `${item.value}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
