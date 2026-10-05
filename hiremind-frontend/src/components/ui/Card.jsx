import { cn } from '@/lib/utils';

function Card({ className, ...props }) {
  return (
    <div
      className={cn(
        'bg-white dark:bg-surface-900',
        'border border-surface-200 dark:border-surface-800',
        'rounded-xl shadow-card',
        className
      )}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }) {
  return (
    <div
      className={cn(
        'flex flex-col space-y-1.5 p-6',
        'border-b border-surface-100 dark:border-surface-800',
        className
      )}
      {...props}
    />
  );
}

function CardTitle({ className, ...props }) {
  return (
    <h3
      className={cn(
        'text-lg font-semibold leading-none tracking-tight',
        'text-surface-900 dark:text-surface-50',
        className
      )}
      {...props}
    />
  );
}

function CardDescription({ className, ...props }) {
  return (
    <p
      className={cn(
        'text-sm text-surface-500 dark:text-surface-400',
        className
      )}
      {...props}
    />
  );
}

function CardContent({ className, ...props }) {
  return <div className={cn('p-6 pt-0', className)} {...props} />;
}

function CardFooter({ className, ...props }) {
  return (
    <div
      className={cn(
        'flex items-center p-6 pt-0',
        'border-t border-surface-100 dark:border-surface-800 mt-4 pt-4',
        className
      )}
      {...props}
    />
  );
}

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
