import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

const inputVariants = {
  variant: {
    default:
      'bg-white dark:bg-surface-900 border-surface-300 dark:border-surface-700 focus:border-brand-500 dark:focus:border-brand-400',
    filled:
      'bg-surface-50 dark:bg-surface-800 border-transparent focus:bg-white dark:focus:bg-surface-900 focus:border-brand-500 dark:focus:border-brand-400',
    unstyled: 'bg-transparent border-transparent shadow-none focus:ring-0',
  },
  size: {
    sm: 'h-8 px-3 text-xs rounded-md',
    md: 'h-10 px-3.5 text-sm rounded-lg',
    lg: 'h-12 px-4 text-base rounded-xl',
  },
};

const Input = forwardRef(function Input(
  {
    className,
    variant = 'default',
    size = 'md',
    label,
    helperText,
    error,
    errorMessage,
    iconLeft,
    iconRight,
    id,
    disabled = false,
    fullWidth = true,
    wrapperClassName,
    labelClassName,
    ...props
  },
  ref
) {
  const inputId = id || `input-${Math.random().toString(36).substring(2, 9)}`;
  const hasError = Boolean(error || errorMessage);
  const showError = hasError && (errorMessage || error);

  return (
    <div className={cn(fullWidth && 'w-full', wrapperClassName)}>
      {label && (
        <label
          htmlFor={inputId}
          className={cn(
            'block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5',
            labelClassName
          )}
        >
          {label}
        </label>
      )}
      <div className="relative">
        {iconLeft && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400 dark:text-surface-500 pointer-events-none">
            {iconLeft}
          </div>
        )}
        <input
          ref={ref}
          id={inputId}
          disabled={disabled}
          aria-invalid={hasError}
          aria-describedby={
            showError
              ? `${inputId}-error`
              : helperText
              ? `${inputId}-helper`
              : undefined
          }
          className={cn(
            'w-full border transition-all duration-200 ease-in-out',
            'text-surface-900 dark:text-surface-100 placeholder:text-surface-400 dark:placeholder:text-surface-500',
            'shadow-sm',
            'focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:ring-offset-0',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            hasError &&
              'border-red-500 dark:border-red-500 focus:border-red-500 dark:focus:border-red-500 focus:ring-red-500/30',
            inputVariants.variant[variant],
            inputVariants.size[size],
            iconLeft && 'pl-10',
            iconRight && 'pr-10',
            className
          )}
          {...props}
        />
        {iconRight && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 dark:text-surface-500 pointer-events-none">
            {iconRight}
          </div>
        )}
      </div>
      {showError && (
        <p
          id={`${inputId}-error`}
          className="mt-1.5 text-xs text-red-600 dark:text-red-400 flex items-center gap-1"
        >
          {errorMessage || error}
        </p>
      )}
      {!showError && helperText && (
        <p
          id={`${inputId}-helper`}
          className="mt-1.5 text-xs text-surface-500 dark:text-surface-400"
        >
          {helperText}
        </p>
      )}
    </div>
  );
});

export { Input, inputVariants };
