import React, { useState } from 'react';
import { cn } from '@/lib/utils';

const avatarSizes = {
  xs: 'h-6 w-6 text-[10px]',
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-14 w-14 text-lg',
  xl: 'h-20 w-20 text-2xl',
};

function getInitials(name = '') {
  if (!name) return '?';
  const names = name.trim().split(/\s+/);
  if (names.length === 1) return names[0].charAt(0).toUpperCase();
  return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
}

const colors = [
  'bg-brand-100 text-brand-700 dark:bg-brand-900 dark:text-brand-300',
  'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300',
  'bg-sky-100 text-sky-700 dark:bg-sky-900 dark:text-sky-300',
  'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
  'bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-300',
  'bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300',
  'bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300',
  'bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300',
];

function getColorForName(name) {
  if (!name) return colors[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

function Avatar({
  src,
  alt = '',
  name,
  size = 'md',
  className,
  fallbackClassName,
  ...props
}) {
  const [imgError, setImgError] = useState(false);
  const showFallback = !src || imgError;
  const initials = getInitials(name);
  const colorClass = getColorForName(name);

  return (
    <div
      className={cn(
        'relative inline-flex shrink-0 overflow-hidden rounded-full',
        'bg-surface-100 dark:bg-surface-800',
        'ring-2 ring-white dark:ring-surface-900',
        avatarSizes[size],
        className
      )}
      {...props}
    >
      {!showFallback ? (
        <img
          src={src}
          alt={alt || name || 'Avatar'}
          onError={() => setImgError(true)}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      ) : (
        <div
          className={cn(
            'flex h-full w-full items-center justify-center font-semibold',
            colorClass,
            fallbackClassName
          )}
        >
          {initials}
        </div>
      )}
    </div>
  );
}

function AvatarGroup({
  children,
  max = 4,
  size = 'md',
  className,
  ...props
}) {
  const childrenArray = React.Children.toArray(children);
  const total = childrenArray.length;
  const visible = total > max ? childrenArray.slice(0, max) : childrenArray;
  const remaining = total - max;

  return (
    <div
      className={cn('flex items-center -space-x-2', className)}
      {...props}
    >
      {visible.map((child, index) =>
        React.isValidElement(child)
          ? React.cloneElement(child, {
              size,
              className: cn(
                child.props.className,
                'ring-2 ring-white dark:ring-surface-900'
              ),
            })
          : child
      )}
      {remaining > 0 && (
        <div
          className={cn(
            'relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full',
            'bg-surface-200 dark:bg-surface-700 text-surface-600 dark:text-surface-300 font-semibold',
            'ring-2 ring-white dark:ring-surface-900',
            avatarSizes[size]
          )}
        >
          +{remaining}
        </div>
      )}
    </div>
  );
}

export { Avatar, AvatarGroup, avatarSizes };
