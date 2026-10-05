import React, { useState, useRef, useEffect, createContext, useContext, useCallback } from 'react';
import { cn } from '@/lib/utils';

const DropdownContext = createContext(null);

function useDropdownContext() {
  const context = useContext(DropdownContext);
  if (!context) {
    throw new Error('Dropdown components must be used within <Dropdown>');
  }
  return context;
}

function Dropdown({ children, defaultOpen = false, open: controlledOpen, onOpenChange, align = 'start' }) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : internalOpen;
  const triggerRef = useRef(null);
  const contentRef = useRef(null);
  const [focusIndex, setFocusIndex] = useState(-1);

  const setOpen = useCallback(
    (next) => {
      if (!isControlled) {
        setInternalOpen(next);
      }
      if (onOpenChange) {
        onOpenChange(next);
      }
    },
    [isControlled, onOpenChange]
  );

  const toggle = useCallback(() => {
    setOpen(!isOpen);
    if (!isOpen) setFocusIndex(-1);
  }, [isOpen, setOpen]);

  const close = useCallback(() => {
    setOpen(false);
    triggerRef.current?.focus();
  }, [setOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event) => {
      if (
        contentRef.current &&
        !contentRef.current.contains(event.target) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target)
      ) {
        close();
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        close();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, close]);

  const value = {
    isOpen,
    setOpen,
    toggle,
    close,
    triggerRef,
    contentRef,
    align,
    focusIndex,
    setFocusIndex,
  };

  return <DropdownContext.Provider value={value}>{children}</DropdownContext.Provider>;
}

function DropdownTrigger({ children, asChild = false, className }) {
  const { toggle, triggerRef, isOpen } = useDropdownContext();

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      ref: triggerRef,
      onClick: (e) => {
        children.props.onClick?.(e);
        toggle();
      },
      'aria-haspopup': 'menu',
      'aria-expanded': isOpen,
    });
  }

  return (
    <button
      ref={triggerRef}
      type="button"
      onClick={toggle}
      aria-haspopup="menu"
      aria-expanded={isOpen}
      className={cn(className)}
    >
      {children}
    </button>
  );
}

function DropdownMenu({ children, className, sideOffset = 8 }) {
  const { isOpen, contentRef, align, focusIndex, setFocusIndex, close } = useDropdownContext();

  const items = [];
  React.Children.forEach(children, (child) => {
    if (React.isValidElement(child)) {
      if (child.type === DropdownItem) items.push(child);
    }
  });

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusIndex((prev) => (prev + 1) % items.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusIndex((prev) => (prev - 1 + items.length) % items.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (focusIndex >= 0 && items[focusIndex]) {
        items[focusIndex].props.onClick?.();
        close();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={contentRef}
      role="menu"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      style={{ marginTop: sideOffset }}
      className={cn(
        'absolute z-50 min-w-[12rem] p-1',
        'bg-white dark:bg-surface-800',
        'border border-surface-200 dark:border-surface-700',
        'rounded-lg shadow-elevated',
        'animate-slide-down origin-top',
        align === 'end' ? 'right-0' : 'left-0',
        align === 'center' && 'left-1/2 -translate-x-1/2',
        className
      )}
    >
      {children}
    </div>
  );
}

function DropdownItem({ children, onClick, className, icon, disabled, shortcut }) {
  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      onClick={(e) => {
        if (!disabled) {
          onClick?.(e);
        }
      }}
      className={cn(
        'w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md',
        'text-surface-700 dark:text-surface-300',
        'hover:bg-surface-100 dark:hover:bg-surface-700',
        'focus:bg-surface-100 dark:focus:bg-surface-700 focus:outline-none',
        'transition-colors',
        disabled && 'opacity-50 cursor-not-allowed pointer-events-none',
        className
      )}
    >
      {icon && <span className="text-surface-400 w-4 h-4 shrink-0 flex items-center justify-center">{icon}</span>}
      <span className="flex-1 text-left">{children}</span>
      {shortcut && (
        <span className="text-xs text-surface-400 dark:text-surface-500 ml-4">{shortcut}</span>
      )}
    </button>
  );
}

function DropdownSeparator({ className }) {
  return (
    <div
      role="separator"
      className={cn('my-1 h-px bg-surface-200 dark:bg-surface-700', className)}
    />
  );
}

function DropdownDivider(props) {
  return <DropdownSeparator {...props} />;
}

function DropdownLabel({ children, className }) {
  return (
    <div
      className={cn(
        'px-3 py-2 text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider',
        className
      )}
    >
      {children}
    </div>
  );
}

export {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  DropdownSeparator,
  DropdownDivider,
  DropdownLabel,
};
