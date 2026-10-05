import { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { ImSpinner8 } from 'react-icons/im';

const buttonVariants = {
  variant: {
    primary:
      'bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800 shadow-sm border border-brand-600 hover:border-brand-700',
    secondary:
      'bg-surface-100 text-surface-900 hover:bg-surface-200 active:bg-surface-300 border border-surface-200 hover:border-surface-300 dark:bg-surface-800 dark:text-surface-100 dark:hover:bg-surface-700 dark:border-surface-700',
    outline:
      'bg-transparent text-surface-900 hover:bg-surface-50 border border-surface-300 hover:border-surface-400 dark:text-surface-100 dark:hover:bg-surface-800 dark:border-surface-600',
    ghost:
      'bg-transparent text-surface-700 hover:bg-surface-100 dark:text-surface-300 dark:hover:bg-surface-800 border-transparent',
    danger:
      'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 shadow-sm border border-red-600 hover:border-red-700',
    success:
      'bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800 shadow-sm border border-emerald-600 hover:border-emerald-700',
  },
  size: {
    sm: 'h-8 px-3 text-xs gap-1.5 rounded-md',
    md: 'h-10 px-4 text-sm gap-2 rounded-lg',
    lg: 'h-12 px-6 text-base gap-2 rounded-xl',
  },
};

const Button = forwardRef(function Button(
  {
    className,
    variant = 'primary',
    size = 'md',
    isLoading = false,
    disabled = false,
    icon,
    iconPosition = 'left',
    fullWidth = false,
    type = 'button',
    children,
    ...props
  },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || isLoading}
      className={cn(
        'inline-flex items-center justify-center font-medium transition-all duration-200 ease-in-out',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-surface-900',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
        buttonVariants.variant[variant],
        buttonVariants.size[size],
        fullWidth && 'w-full',
        className
      )}
      {...props}
    >
      {isLoading && (
        <ImSpinner8 className="w-4 h-4 animate-spin shrink-0" />
      )}
      {!isLoading && icon && iconPosition === 'left' && (
        <span className="shrink-0 inline-flex items-center justify-center">{icon}</span>
      )}
      {children && <span className="truncate">{children}</span>}
      {!isLoading && icon && iconPosition === 'right' && (
        <span className="shrink-0 inline-flex items-center justify-center">{icon}</span>
      )}
    </button>
  );
});

export { Button, buttonVariants };
