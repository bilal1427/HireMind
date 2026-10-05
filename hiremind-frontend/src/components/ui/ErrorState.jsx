import { cn } from '@/lib/utils';
import { FiAlertTriangle, FiAlertCircle, FiRefreshCw, FiHome } from 'react-icons/fi';

function ErrorState({
  icon,
  title = 'Something went wrong',
  message = 'An unexpected error occurred. Please try again.',
  error,
  onRetry,
  retryText = 'Try again',
  showHome = false,
  homeText = 'Go home',
  onHome,
  action,
  className,
  size = 'md',
  fullHeight = false,
  variant = 'default',
}) {
  const IconComponent = icon || (variant === 'warning' ? FiAlertTriangle : FiAlertCircle);

  const variants = {
    default: {
      bg: 'bg-red-50 dark:bg-red-900/30',
      icon: 'text-red-500',
      title: 'text-red-700 dark:text-red-300',
    },
    warning: {
      bg: 'bg-amber-50 dark:bg-amber-900/30',
      icon: 'text-amber-500',
      title: 'text-amber-700 dark:text-amber-300',
    },
    info: {
      bg: 'bg-sky-50 dark:bg-sky-900/30',
      icon: 'text-sky-500',
      title: 'text-sky-700 dark:text-sky-300',
    },
  };

  const variantConfig = variants[variant] || variants.default;

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

  const sizeConfig = sizes[size];

  const displayMessage = error?.message || message;

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        'w-full max-w-md mx-auto',
        sizeConfig.wrapper,
        fullHeight && 'min-h-[400px]',
        className
      )}
      role="alert"
      aria-live="assertive"
    >
      <div
        className={cn(
          'flex items-center justify-center rounded-2xl',
          variantConfig.bg,
          variantConfig.icon,
          sizeConfig.iconWrapper
        )}
      >
        <IconComponent className={sizeConfig.icon} />
      </div>

      <h3
        className={cn(
          'font-semibold mb-2',
          variantConfig.title,
          sizeConfig.title
        )}
      >
        {title}
      </h3>

      {displayMessage && (
        <p
          className={cn(
            'text-surface-500 dark:text-surface-400 mb-6 max-w-sm leading-relaxed',
            sizeConfig.description
          )}
        >
          {displayMessage}
        </p>
      )}

      {process.env.NODE_ENV === 'development' && error?.stack && (
        <details className="w-full mb-6 text-left">
          <summary className="cursor-pointer text-xs font-medium text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-300 mb-2">
            Error details
          </summary>
          <pre className="mt-2 p-3 bg-surface-100 dark:bg-surface-800 rounded-lg text-xs overflow-auto text-surface-600 dark:text-surface-400 max-h-40">
            {error.stack}
          </pre>
        </details>
      )}

      {(action || onRetry || showHome) && (
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {action || (onRetry || showHome) ? (
            action || (
              onRetry && (
                <button
                  type="button"
                  onClick={onRetry}
                  className={cn(
                    'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 gap-2',
                    'bg-brand-600 text-white hover:bg-brand-700 shadow-sm',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50',
                    sizeConfig.button
                  )}
                >
                  <FiRefreshCw className="w-4 h-4" />
                  {retryText}
                </button>
              )
            )
          ) : null}
          {showHome && (
            <button
              type="button"
              onClick={onHome}
              className={cn(
                'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 gap-2',
                'bg-transparent text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800',
                'border border-surface-200 dark:border-surface-700',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50',
                sizeConfig.button
              )}
            >
              <FiHome className="w-4 h-4" />
              {homeText}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export { ErrorState };
