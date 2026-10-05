import React, { useState, createContext, useContext, useRef, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';

const TabsContext = createContext(null);

function useTabsContext() {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error('Tabs components must be used within <Tabs>');
  }
  return context;
}

function Tabs({ children, defaultValue, value: controlledValue, onValueChange, className, activationMode = 'automatic' }) {
  const [internalValue, setInternalValue] = useState(defaultValue || '');
  const isControlled = controlledValue !== undefined;
  const currentValue = isControlled ? controlledValue : internalValue;
  const tabListRef = useRef(null);

  const setValue = useCallback(
    (next) => {
      if (!isControlled) {
        setInternalValue(next);
      }
      if (onValueChange) {
        onValueChange(next);
      }
    },
    [isControlled, onValueChange]
  );

  const value = {
    currentValue,
    setValue,
    tabListRef,
    activationMode,
  };

  return (
    <TabsContext.Provider value={value}>
      <div className={cn('w-full', className)}>{children}</div>
    </TabsContext.Provider>
  );
}

function TabList({ children, className }) {
  const { tabListRef, activationMode, setValue, currentValue } = useTabsContext();
  const tabsRef = useRef([]);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0, opacity: 0 });

  const tabs = React.Children.toArray(children).filter(
    (child) => React.isValidElement(child) && child.type === Tab
  );

  const updateIndicator = useCallback(() => {
    if (!tabListRef.current) return;
    const activeIndex = tabs.findIndex(
      (tab) => tab.props.value === currentValue
    );

    if (activeIndex >= 0 && tabsRef.current[activeIndex]) {
      const activeTab = tabsRef.current[activeIndex];
      const containerRect = tabListRef.current.getBoundingClientRect();
      const tabRect = activeTab.getBoundingClientRect();

      setIndicatorStyle({
        left: tabRect.left - containerRect.left,
        width: tabRect.width,
        opacity: 1,
      });
    }
  }, [tabs, currentValue, tabListRef]);

  useEffect(() => {
    updateIndicator();
    window.addEventListener('resize', updateIndicator);
    const timer = setTimeout(updateIndicator, 0);

    return () => {
      window.removeEventListener('resize', updateIndicator);
      clearTimeout(timer);
    };
  }, [updateIndicator, currentValue]);

  const handleKeyDown = (e) => {
    const currentIndex = tabs.findIndex((tab) => tab.props.value === currentValue);
    let nextIndex = currentIndex;

    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      nextIndex = (currentIndex + 1) % tabs.length;
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
    } else if (e.key === 'Home') {
      e.preventDefault();
      nextIndex = 0;
    } else if (e.key === 'End') {
      e.preventDefault();
      nextIndex = tabs.length - 1;
    }

    if (nextIndex !== currentIndex) {
      const nextTab = tabs[nextIndex];
      tabsRef.current[nextIndex]?.focus();
      if (activationMode === 'automatic') {
        setValue(nextTab.props.value);
      }
    }
  };

  return (
    <div
      ref={tabListRef}
      role="tablist"
      onKeyDown={handleKeyDown}
      className={cn(
        'relative inline-flex items-center gap-0 border-b border-surface-200 dark:border-surface-800',
        className
      )}
    >
      {tabs.map((child, index) =>
        React.isValidElement(child)
          ? React.cloneElement(child, {
              ref: (el) => (tabsRef.current[index] = el),
            })
          : child
      )}
      <span
        aria-hidden="true"
        className="absolute bottom-0 h-0.5 bg-brand-600 dark:bg-brand-400 rounded-full transition-all duration-300 ease-out"
        style={indicatorStyle}
      />
    </div>
  );
}

const Tab = React.forwardRef(function Tab({ children, value, className, disabled, ...props }, ref) {
  const { currentValue, setValue, activationMode } = useTabsContext();
  const isActive = currentValue === value;

  return (
    <button
      ref={ref}
      type="button"
      role="tab"
      aria-selected={isActive}
      aria-controls={`panel-${value}`}
      id={`tab-${value}`}
      disabled={disabled}
      tabIndex={isActive ? 0 : -1}
      onClick={() => !disabled && setValue(value)}
      className={cn(
        'relative inline-flex items-center justify-center px-4 py-2.5 text-sm font-medium',
        'transition-colors duration-200',
        'whitespace-nowrap',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50 focus-visible:ring-offset-2 rounded-md',
        isActive
          ? 'text-brand-700 dark:text-brand-300'
          : 'text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-300',
        disabled && 'opacity-50 cursor-not-allowed pointer-events-none',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
});

function TabPanels({ children, className }) {
  return (
    <div className={cn('mt-4', className)}>
      {children}
    </div>
  );
}

function TabPanel({ children, value, className }) {
  const { currentValue } = useTabsContext();
  const isActive = currentValue === value;

  if (!isActive) return null;

  return (
    <div
      role="tabpanel"
      id={`panel-${value}`}
      aria-labelledby={`tab-${value}`}
      tabIndex={0}
      className={cn(
        'animate-fade-in',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50 rounded-md',
        className
      )}
    >
      {children}
    </div>
  );
}

export { Tabs, TabList, Tab, TabPanels, TabPanel };
