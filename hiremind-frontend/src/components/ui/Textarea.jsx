import { forwardRef, useState } from 'react';
import { cn } from '@/lib/utils';

const textareaVariants = {
  variant: {
    default:
      'bg-white dark:bg-surface-900 border-surface-300 dark:border-surface-700 focus:border-brand-500 dark:focus:border-brand-400',
    filled:
      'bg-surface-50 dark:bg-surface-800 border-transparent focus:bg-white dark:focus:bg-surface-900 focus:border-brand-500 dark:focus:border-brand-400',
    unstyled: 'bg-transparent border-transparent shadow-none focus:ring-0',
  },
  size: {
    sm: 'px-3 py-2 text-xs rounded-md',
    md: 'px-3.5 py-2.5 text-sm rounded-lg',
    lg: 'px-4 py-3 text-base rounded-xl',
  },
};

const Textarea = forwardRef(function Textarea(
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
    rows = 4,
    maxLength,
    showCharCount = false,
    value,
    defaultValue,
    onChange,
    ...props
  },
  ref
) {
  const inputId = id || `textarea-${Math.random().toString(36).substring(2, 9)}`;
  const hasError = Boolean(error || errorMessage);
  const showError = hasError && (errorMessage || error);

  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState(defaultValue || '');
  const currentValue = isControlled ? value : internalValue;
  const charCount = String(currentValue || '').length;

  const handleChange = (e) => {
    if (!isControlled) {
      setInternalValue(e.target.value);
    }
    if (onChange) {
      onChange(e);
    }
  };

  return (
    <div className={cn(fullWidth && 'w-full', wrapperClassName)}>
      {label && (
        <div className="flex items-center justify-between mb-1.5">
          <label
            htmlFor={inputId}
            className={cn(
              'block text-sm font-medium text-surface-700 dark:text-surface-300',
              labelClassName
            )}
          >
            {label}
          </label>
          {showCharCount && (
            <span
              className={cn(
                'text-xs',
                maxLength && charCount > maxLength
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-surface-400 dark:text-surface-500'
              )}
            >
              {charCount}
              {maxLength ? ` / ${maxLength}` : ''}
            </span>
          )}
        </div>
      )}
      <div className="relative">
        {iconLeft && (
          <div className="absolute left-3 top-3 text-surface-400 dark:text-surface-500 pointer-events-none">
            {iconLeft}
          </div>
        )}
        <textarea
          ref={ref}
          id={inputId}
          disabled={disabled}
          rows={rows}
          maxLength={maxLength}
          value={currentValue}
          onChange={handleChange}
          aria-invalid={hasError}
          aria-describedby={
            showError
              ? `${inputId}-error`
              : helperText
              ? `${inputId}-helper`
              : undefined
          }
          className={cn(
            'w-full border transition-all duration-200 ease-in-out resize-y min-h-[100px]',
            'text-surface-900 dark:text-surface-100 placeholder:text-surface-400 dark:placeholder:text-surface-500',
            'shadow-sm leading-relaxed',
            'focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:ring-offset-0',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            hasError &&
              'border-red-500 dark:border-red-500 focus:border-red-500 dark:focus:border-red-500 focus:ring-red-500/30',
            textareaVariants.variant[variant],
            textareaVariants.size[size],
            iconLeft && 'pl-10',
            iconRight && 'pr-10',
            className
          )}
          {...props}
        />
        {iconRight && (
          <div className="absolute right-3 top-3 text-surface-400 dark:text-surface-500 pointer-events-none">
            {iconRight}
          </div>
        )}
      </div>
      {!label && showCharCount && (
        <div className="flex justify-end mt-1.5">
          <span
            className={cn(
              'text-xs',
              maxLength && charCount > maxLength
                ? 'text-red-600 dark:text-red-400'
                : 'text-surface-400 dark:text-surface-500'
            )}
          >
            {charCount}
            {maxLength ? ` / ${maxLength}` : ''}
          </span>
        </div>
      )}
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

export { Textarea, textareaVariants };
