import { cn } from '@/lib/utils';
import {
  FiFolder,
  FiFileText,
  FiSearch,
  FiUsers,
  FiBriefcase,
  FiStar,
} from 'react-icons/fi';

const icons = {
  default: FiFolder,
  search: FiSearch,
  documents: FiFileText,
  users: FiUsers,
  jobs: FiBriefcase,
  favorites: FiStar,
};

function EmptyState({
  icon,
  iconName = 'default',
  title = 'No results found',
  description,
  action,
  actionText,
  onAction,
  secondaryAction,
  secondaryActionText,
  onSecondaryAction,
  className,
  size = 'md',
  fullHeight = false,
}) {
  const IconComponent =
    icon || icons[iconName] || icons.default;

  const sizes = {
    sm: {
      wrapper: 'py-6',
      iconWrapper: 'w-12 h-12 mb-3',
      icon: 'w-6 h-6',
      title: 'text-base',
      description: 'text-xs',
      button: 'px-3 h-8 text-xs',
    },

    md: {
      wrapper: 'py-12',
      iconWrapper: 'w-20 h-20 mb-4',
      icon: 'w-10 h-10',
      title: 'text-lg',
      description: 'text-sm',
      button: 'px-4 h-10 text-sm',
    },

    lg: {
      wrapper: 'py-16',
      iconWrapper: 'w-28 h-28 mb-6',
      icon: 'w-14 h-14',
      title: 'text-xl',
      description: 'text-base',
      button: 'px-5 h-11 text-sm',
    },
  };

  const sizeConfig = sizes[size] || sizes.md;

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        'w-full max-w-md mx-auto',
        sizeConfig.wrapper,
        fullHeight && 'min-h-[400px]',
        className
      )}
      role="status"
      aria-live="polite"
    >
      {/* Icon */}
      <div
        className={cn(
          'flex items-center justify-center rounded-2xl',
          'bg-brand-50 dark:bg-brand-900/30',
          'text-brand-500 dark:text-brand-400',
          sizeConfig.iconWrapper
        )}
      >
        <IconComponent className={sizeConfig.icon} />
      </div>

      {/* Title */}
      <h3
        className={cn(
          'font-semibold',
          'text-surface-900 dark:text-surface-100',
          'mb-2',
          sizeConfig.title
        )}
      >
        {title}
      </h3>

      {/* Description */}
      {description && (
        <p
          className={cn(
            'text-surface-500 dark:text-surface-400',
            'mb-6 max-w-sm leading-relaxed',
            sizeConfig.description
          )}
        >
          {description}
        </p>
      )}

      {/* Actions */}
      {(action ||
        (actionText && onAction) ||
        secondaryAction ||
        (secondaryActionText && onSecondaryAction)) && (
        <div className="flex flex-col sm:flex-row items-center gap-3">

          {/* Primary Action */}
          {action || (actionText && onAction) ? (
            action || (
              <button
                type="button"
                onClick={onAction}
                className={cn(
                  'inline-flex items-center justify-center',
                  'font-medium rounded-lg',
                  'transition-all duration-200',
                  'bg-brand-600 text-white',
                  'hover:bg-brand-700 shadow-sm',
                  'focus-visible:outline-none',
                  'focus-visible:ring-2',
                  'focus-visible:ring-brand-500/50',
                  sizeConfig.button
                )}
              >
                {actionText}
              </button>
            )
          ) : null}

          {/* Secondary Action */}
          {secondaryAction ||
          (secondaryActionText && onSecondaryAction) ? (
            secondaryAction || (
              <button
                type="button"
                onClick={onSecondaryAction}
                className={cn(
                  'inline-flex items-center justify-center',
                  'font-medium rounded-lg',
                  'transition-all duration-200',
                  'bg-transparent',
                  'text-surface-700 dark:text-surface-300',
                  'hover:bg-surface-100 dark:hover:bg-surface-800',
                  'border border-surface-200 dark:border-surface-700',
                  'focus-visible:outline-none',
                  'focus-visible:ring-2',
                  'focus-visible:ring-brand-500/50',
                  sizeConfig.button
                )}
              >
                {secondaryActionText}
              </button>
            )
          ) : null}

        </div>
      )}
    </div>
  );
}

export { EmptyState };