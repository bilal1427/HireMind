import { useState, useRef, useEffect, forwardRef, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { FiChevronDown, FiX } from 'react-icons/fi';
import { Badge } from './Badge';

const selectVariants = {
  size: {
    sm: 'h-8 px-3 text-xs rounded-md',
    md: 'h-10 px-3.5 text-sm rounded-lg',
    lg: 'h-12 px-4 text-base rounded-xl',
  },
};

const Select = forwardRef(function Select(
  {
    className,
    size = 'md',
    label,
    helperText,
    error,
    errorMessage,
    placeholder = 'Select...',
    options = [],
    value,
    defaultValue,
    onChange,
    disabled = false,
    multiple = false,
    fullWidth = true,
    wrapperClassName,
    labelClassName,
    id,
    ...props
  },
  ref
) {
  const selectId = id || `select-${Math.random().toString(36).substring(2, 9)}`;
  const [isOpen, setIsOpen] = useState(false);
  const [internalValue, setInternalValue] = useState(
    multiple ? defaultValue || [] : defaultValue || ''
  );
  const dropdownRef = useRef(null);
  const triggerRef = useRef(null);

  const isControlled = value !== undefined;
  const currentValue = isControlled ? value : internalValue;
  const hasError = Boolean(error || errorMessage);
  const showError = hasError && (errorMessage || error);

  const selectedOptions = useMemo(() => {
    if (multiple) {
      return options.filter((opt) => (currentValue || []).includes(opt.value));
    }
    return options.find((opt) => opt.value === currentValue);
  }, [options, currentValue, multiple]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    const handleEscape = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const handleSelect = (optionValue) => {
    if (multiple) {
      const newValue = (currentValue || []).includes(optionValue)
        ? (currentValue || []).filter((v) => v !== optionValue)
        : [...(currentValue || []), optionValue];

      if (!isControlled) setInternalValue(newValue);
      if (onChange) onChange(newValue);
    } else {
      if (!isControlled) setInternalValue(optionValue);
      if (onChange) onChange(optionValue);
      setIsOpen(false);
    }
  };

  const removeChip = (optionValue, e) => {
    e.stopPropagation();
    if (multiple) {
      const newValue = (currentValue || []).filter((v) => v !== optionValue);
      if (!isControlled) setInternalValue(newValue);
      if (onChange) onChange(newValue);
    }
  };

  const clearAll = (e) => {
    e.stopPropagation();
    if (multiple) {
      if (!isControlled) setInternalValue([]);
      if (onChange) onChange([]);
    } else {
      if (!isControlled) setInternalValue('');
      if (onChange) onChange('');
    }
  };

  const hasValue = multiple
    ? (currentValue || []).length > 0
    : currentValue !== '' && currentValue !== undefined && currentValue !== null;

  return (
    <div className={cn(fullWidth && 'w-full', wrapperClassName)}>
      {label && (
        <label
          htmlFor={selectId}
          className={cn(
            'block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5',
            labelClassName
          )}
        >
          {label}
        </label>
      )}
      <div className="relative" ref={dropdownRef}>
        <button
          ref={triggerRef}
          type="button"
          id={selectId}
          disabled={disabled}
          onClick={() => !disabled && setIsOpen((prev) => !prev)}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-invalid={hasError}
          className={cn(
            'w-full flex items-center justify-between border transition-all duration-200 ease-in-out',
            'bg-white dark:bg-surface-900 text-surface-900 dark:text-surface-100',
            'shadow-sm',
            'focus:outline-none focus:ring-2 focus:ring-brand-500/30',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            hasError &&
              'border-red-500 dark:border-red-500 focus:border-red-500 focus:ring-red-500/30',
            !hasError &&
              'border-surface-300 dark:border-surface-700 focus:border-brand-500 dark:focus:border-brand-400',
            selectVariants.size[size],
            multiple && hasValue && 'h-auto min-h-10 py-1.5',
            className
          )}
        >
          <div className="flex-1 flex items-center gap-1.5 flex-wrap text-left">
            {multiple ? (
              hasValue ? (
                selectedOptions.map((opt) => (
                  <Badge
                    key={opt.value}
                    variant="soft"
                    size="sm"
                    className="flex items-center gap-1"
                  >
                    {opt.label}
                    <button
                      type="button"
                      onClick={(e) => removeChip(opt.value, e)}
                      className="hover:text-red-500 transition-colors p-0.5 -mr-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <FiX className="w-3 h-3" />
                    </button>
                  </Badge>
                ))
              ) : (
                <span className="text-surface-400 dark:text-surface-500">
                  {placeholder}
                </span>
              )
            ) : (
              <>
                {selectedOptions ? (
                  <span className="truncate">{selectedOptions.label}</span>
                ) : (
                  <span className="text-surface-400 dark:text-surface-500">
                    {placeholder}
                  </span>
                )}
              </>
            )}
          </div>
          <div className="flex items-center gap-1 ml-2 shrink-0">
            {hasValue && (
              <button
                type="button"
                onClick={clearAll}
                className="p-1 text-surface-400 hover:text-surface-600 dark:hover:text-surface-200 transition-colors rounded hover:bg-surface-100 dark:hover:bg-surface-800"
              >
                <FiX className="w-3.5 h-3.5" />
              </button>
            )}
            <FiChevronDown
              className={cn(
                'w-4 h-4 text-surface-400 transition-transform duration-200',
                isOpen && 'rotate-180'
              )}
            />
          </div>
        </button>

        {isOpen && (
          <div
            role="listbox"
            className={cn(
              'absolute z-50 w-full mt-1.5 py-1',
              'bg-white dark:bg-surface-800',
              'border border-surface-200 dark:border-surface-700',
              'rounded-lg shadow-card',
              'max-h-60 overflow-auto',
              'animate-slide-down'
            )}
          >
            {options.length === 0 ? (
              <div className="px-3 py-4 text-center text-sm text-surface-500 dark:text-surface-400">
                No options available
              </div>
            ) : (
              options.map((option) => {
                const isSelected = multiple
                  ? (currentValue || []).includes(option.value)
                  : option.value === currentValue;

                return (
                  <button
                    key={option.value}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(option.value)}
                    className={cn(
                      'w-full text-left px-3 py-2 text-sm transition-colors flex items-center gap-2',
                      'hover:bg-brand-50 dark:hover:bg-brand-950/40',
                      isSelected &&
                        'bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 font-medium',
                      !isSelected &&
                        'text-surface-700 dark:text-surface-300'
                    )}
                  >
                    {multiple && (
                      <div
                        className={cn(
                          'w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors',
                          isSelected
                            ? 'bg-brand-600 border-brand-600'
                            : 'border-surface-300 dark:border-surface-600'
                        )}
                      >
                        {isSelected && (
                          <svg
                            className="w-3 h-3 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={3}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        )}
                      </div>
                    )}
                    <span className="truncate">{option.label}</span>
                  </button>
                );
              })
            )}
          </div>
        )}
      </div>
      {showError && (
        <p
          id={`${selectId}-error`}
          className="mt-1.5 text-xs text-red-600 dark:text-red-400 flex items-center gap-1"
        >
          {errorMessage || error}
        </p>
      )}
      {!showError && helperText && (
        <p
          id={`${selectId}-helper`}
          className="mt-1.5 text-xs text-surface-500 dark:text-surface-400"
        >
          {helperText}
        </p>
      )}
    </div>
  );
});

export { Select, selectVariants };
