import { useState, useRef, useEffect, forwardRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { FiSearch, FiX } from 'react-icons/fi';

function useDebounce(callback, delay = 300) {
  const timeoutRef = useRef(null);

  return useCallback(
    (...args) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    },
    [callback, delay]
  );
}

const SearchBar = forwardRef(function SearchBar(
  {
    className,
    placeholder = 'Search...',
    value,
    defaultValue = '',
    onChange,
    onSearch,
    onClear,
    debounceMs = 300,
    disabled = false,
    size = 'md',
    fullWidth = true,
    showClearButton = true,
    icon,
    ...props
  },
  ref
) {
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState(defaultValue);
  const inputRef = useRef(null);
  const currentValue = isControlled ? value : internalValue;

  const debouncedSearch = useDebounce((searchValue) => {
    if (onSearch) {
      onSearch(searchValue);
    }
  }, debounceMs);

  const handleChange = (e) => {
    const newValue = e.target.value;
    if (!isControlled) {
      setInternalValue(newValue);
    }
    if (onChange) {
      onChange(e);
    }
    debouncedSearch(newValue);
  };

  const handleClear = () => {
    if (!isControlled) {
      setInternalValue('');
    }
    if (onClear) {
      onClear();
    }
    if (onChange) {
      const syntheticEvent = {
        target: { value: '' },
      };
      onChange(syntheticEvent);
    }
    if (onSearch) {
      onSearch('');
    }
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && onSearch) {
      debouncedSearch.cancel?.();
      onSearch(currentValue);
    }
    if (e.key === 'Escape' && currentValue) {
      handleClear();
    }
  };

  useEffect(() => {
    return () => {
      debouncedSearch.cancel?.();
    };
  }, [debouncedSearch]);

  const sizeClasses = {
    sm: 'h-9 px-3 pl-9 text-xs rounded-lg',
    md: 'h-11 px-4 pl-11 text-sm rounded-xl',
    lg: 'h-13 px-4 pl-12 text-base rounded-2xl',
  };

  const iconSizeClasses = {
    sm: 'left-3 w-4 h-4',
    md: 'left-3.5 w-5 h-5',
    lg: 'left-4 w-5 h-5',
  };

  const clearSizeClasses = {
    sm: 'right-2 p-1',
    md: 'right-2.5 p-1.5',
    lg: 'right-3 p-1.5',
  };

  return (
    <div className={cn('relative', fullWidth && 'w-full')}>
      <div className={cn('absolute inset-y-0 flex items-center text-surface-400 dark:text-surface-500 pointer-events-none', iconSizeClasses[size])}>
        {icon || <FiSearch className="w-full h-full" />}
      </div>
      <input
        ref={(node) => {
          inputRef.current = node;
          if (typeof ref === 'function') ref(node);
          else if (ref) ref.current = node;
        }}
        type="search"
        value={currentValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(
          'w-full transition-all duration-200 ease-in-out',
          'bg-white dark:bg-surface-900',
          'border border-surface-300 dark:border-surface-700',
          'text-surface-900 dark:text-surface-100 placeholder:text-surface-400 dark:placeholder:text-surface-500',
          'shadow-sm',
          'focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 dark:focus:border-brand-400',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          showClearButton && currentValue && 'pr-10',
          sizeClasses[size],
          className
        )}
        {...props}
      />
      {showClearButton && currentValue && !disabled && (
        <button
          type="button"
          onClick={handleClear}
          aria-label="Clear search"
          className={cn(
            'absolute inset-y-0 flex items-center justify-center',
            'text-surface-400 hover:text-surface-600 dark:hover:text-surface-300',
            'hover:bg-surface-100 dark:hover:bg-surface-800 rounded-md transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50',
            clearSizeClasses[size]
          )}
        >
          <FiX className="w-4 h-4" />
        </button>
      )}
    </div>
  );
});

export { SearchBar, useDebounce };
