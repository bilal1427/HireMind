import { cn } from '@/lib/utils';
import { ImSpinner8 } from 'react-icons/im';

const loaderSizes = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-12 h-12',
  '2xl': 'w-16 h-16',
};

const textSizes = {
  xs: 'text-xs',
  sm: 'text-sm',
  md: 'text-sm',
  lg: 'text-base',
  xl: 'text-lg',
  '2xl': 'text-xl',
};

const colorClasses = {
  default: 'text-brand-600 dark:text-brand-400',
  white: 'text-white',
  muted: 'text-surface-400 dark:text-surface-500',
  success: 'text-emerald-500',
  warning: 'text-amber-500',
  danger: 'text-red-500',
};

function Loader({
  size = 'md',
  color = 'default',
  text,
  textPosition = 'right',
  className,
  fullScreen = false,
  overlayClassName,
}) {
  const Spinner = (
    <div
      role="status"
      aria-live="polite"
      aria-label={text || 'Loading'}
      className={cn('flex items-center gap-3', textPosition === 'bottom' && 'flex-col', className)}
    >
      <ImSpinner8
        className={cn(
          'animate-spin shrink-0',
          loaderSizes[size],
          colorClasses[color]
        )}
      />
      {text && (
        <span className={cn('font-medium text-surface-600 dark:text-surface-300', textSizes[size])}>
          {text}
        </span>
      )}
      <span className="sr-only">Loading...</span>
    </div>
  );

  if (fullScreen) {
    return (
      <div
        className={cn(
          'fixed inset-0 z-50 flex items-center justify-center',
          'bg-white/80 dark:bg-surface-900/80 backdrop-blur-sm',
          overlayClassName
        )}
      >
        {Spinner}
      </div>
    );
  }

  return Spinner;
}

function SpinnerLoader(props) {
  return <Loader {...props} />;
}

export { Loader, SpinnerLoader, loaderSizes, colorClasses };
