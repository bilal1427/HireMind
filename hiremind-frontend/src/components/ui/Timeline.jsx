import React from 'react';
import { cn } from '@/lib/utils';
import { FiCheck, FiX, FiClock } from 'react-icons/fi';

const stepStates = {
  pending: {
    icon: <FiClock className="w-4 h-4" />,
    line: 'bg-surface-200 dark:bg-surface-700',
    dot: 'bg-surface-100 dark:bg-surface-800 border-surface-300 dark:border-surface-600',
    text: 'text-surface-500 dark:text-surface-400',
    iconColor: 'text-surface-400',
  },
  active: {
    icon: null,
    line: 'bg-brand-200 dark:bg-brand-800',
    dot: 'bg-brand-600 border-brand-600 ring-4 ring-brand-100 dark:ring-brand-900/50',
    text: 'text-brand-700 dark:text-brand-300',
    iconColor: 'text-white',
  },
  completed: {
    icon: <FiCheck className="w-4 h-4" />,
    line: 'bg-emerald-500',
    dot: 'bg-emerald-500 border-emerald-500',
    text: 'text-emerald-700 dark:text-emerald-300',
    iconColor: 'text-white',
  },
  success: {
    icon: <FiCheck className="w-4 h-4" />,
    line: 'bg-emerald-500',
    dot: 'bg-emerald-500 border-emerald-500',
    text: 'text-emerald-700 dark:text-emerald-300',
    iconColor: 'text-white',
  },
  error: {
    icon: <FiX className="w-4 h-4" />,
    line: 'bg-red-300 dark:bg-red-800',
    dot: 'bg-red-500 border-red-500',
    text: 'text-red-700 dark:text-red-300',
    iconColor: 'text-white',
  },
  failed: {
    icon: <FiX className="w-4 h-4" />,
    line: 'bg-red-300 dark:bg-red-800',
    dot: 'bg-red-500 border-red-500',
    text: 'text-red-700 dark:text-red-300',
    iconColor: 'text-white',
  },
};

function Timeline({ children, className, activeStep = 0, steps }) {
  const items = steps || React.Children.toArray(children);
  const totalSteps = items.length;

  return (
    <ol className={cn('relative w-full', className)}>
      {items.map((item, index) => {
        let state = 'pending';
        let title = '';
        let description = '';
        let icon = null;
        let date = '';

        if (steps) {
          const step = item;
          title = step.title || '';
          description = step.description || '';
          date = step.date || '';
          icon = step.icon || null;

          if (step.state) {
            state = step.state;
          } else if (index < activeStep) {
            state = 'completed';
          } else if (index === activeStep) {
            state = 'active';
          }
        } else if (React.isValidElement(item)) {
          title = item.props.title || '';
          description = item.props.description || '';
          date = item.props.date || '';
          if (item.props.state) {
            state = item.props.state;
          } else if (index < activeStep) {
            state = 'completed';
          } else if (index === activeStep) {
            state = 'active';
          }
        }

        const states = stepStates[state] || stepStates.pending;
        const isLast = index === totalSteps - 1;
        const customIcon = steps ? icon : (React.isValidElement(item) ? item.props.icon : null);

        return (
          <li key={index} className="relative pb-8 last:pb-0">
            {!isLast && (
              <div
                className={cn(
                  'absolute left-[15px] top-8 w-0.5 -ml-px h-full transition-colors duration-300',
                  states.line
                )}
                aria-hidden="true"
              />
            )}
            <div className="relative flex items-start gap-4">
              <div
                className={cn(
                  'relative z-10 flex shrink-0 items-center justify-center',
                  'w-8 h-8 rounded-full border-2 transition-all duration-300',
                  states.dot
                )}
              >
                <span className={cn('flex items-center justify-center', states.iconColor)}>
                  {customIcon || states.icon || (
                    state === 'active' && (
                      <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                    )
                  )}
                </span>
              </div>
              <div className="min-w-0 flex-1 pt-0.5">
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <h4
                    className={cn(
                      'text-sm font-semibold transition-colors duration-300',
                      states.text
                    )}
                  >
                    {title}
                  </h4>
                  {date && (
                    <span className="text-xs text-surface-400 dark:text-surface-500 whitespace-nowrap">
                      {date}
                    </span>
                  )}
                </div>
                {description && (
                  <p className="mt-1 text-sm text-surface-500 dark:text-surface-400 leading-relaxed">
                    {description}
                  </p>
                )}
                {steps && item.content && (
                  <div className="mt-3">{item.content}</div>
                )}
                {!steps && React.isValidElement(item) && item.props.children && (
                  <div className="mt-3">{item.props.children}</div>
                )}
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function TimelineItem({ title, description, date, state, icon, children }) {
  return (
    <div>
      {children}
    </div>
  );
}

export { Timeline, TimelineItem, stepStates };
