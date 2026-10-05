import { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { cn, generateId } from '../lib/utils';

const ToastContext = createContext(null);

const VARIANTS = {
  success: {
    icon: CheckCircle2,
    iconClass: 'text-green-500',
    bgClass: 'bg-white dark:bg-gray-800 border-green-200 dark:border-green-900',
    progressClass: 'bg-green-500',
  },
  error: {
    icon: XCircle,
    iconClass: 'text-red-500',
    bgClass: 'bg-white dark:bg-gray-800 border-red-200 dark:border-red-900',
    progressClass: 'bg-red-500',
  },
  warning: {
    icon: AlertTriangle,
    iconClass: 'text-yellow-500',
    bgClass: 'bg-white dark:bg-gray-800 border-yellow-200 dark:border-yellow-900',
    progressClass: 'bg-yellow-500',
  },
  info: {
    icon: Info,
    iconClass: 'text-blue-500',
    bgClass: 'bg-white dark:bg-gray-800 border-blue-200 dark:border-blue-900',
    progressClass: 'bg-blue-500',
  },
};

const DEFAULT_DURATION = 4000;

function ToastItem({ toast, onRemove }) {
  const variant = VARIANTS[toast.variant] || VARIANTS.info;
  const Icon = variant.icon;
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (toast.duration === Infinity) return;
    const duration = toast.duration || DEFAULT_DURATION;
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
        onRemove(toast.id);
      }
    }, 50);
    return () => clearInterval(interval);
  }, [toast.id, toast.duration, onRemove]);

  return (
    <div
      className={cn(
        'relative shadow-lg rounded-xl border overflow-hidden min-w-[320px] max-w-sm animate-[slideIn_0.3s_ease-out]',
        variant.bgClass
      )}
      role="alert"
    >
      <div className="flex items-start gap-3 p-4">
        <Icon className={cn('w-5 h-5 flex-shrink-0 mt-0.5', variant.iconClass)} />
        <div className="flex-1 min-w-0">
          {toast.title && (
            <p className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-0.5">
              {toast.title}
            </p>
          )}
          {toast.message && (
            <p className="text-sm text-gray-600 dark:text-gray-300 leading-snug">
              {toast.message}
            </p>
          )}
        </div>
        <button
          onClick={() => onRemove(toast.id)}
          className="flex-shrink-0 p-1 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          aria-label="Close notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      {toast.duration !== Infinity && (
        <div className="h-1 bg-gray-100 dark:bg-gray-700">
          <div
            className={cn('h-full transition-all duration-100 ease-linear', variant.progressClass)}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((options) => {
    const {
      variant = 'info',
      title,
      message,
      duration = DEFAULT_DURATION,
    } = typeof options === 'string' ? { message: options } : options;

    const id = generateId();
    const toast = { id, variant, title, message, duration };
    setToasts(prev => [...prev, toast]);
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const clearAll = useCallback(() => setToasts([]), []);

  const helpers = useMemo(() => ({
    success: (opts) => addToast(typeof opts === 'string' ? { variant: 'success', message: opts } : { ...opts, variant: 'success' }),
    error: (opts) => addToast(typeof opts === 'string' ? { variant: 'error', message: opts } : { ...opts, variant: 'error' }),
    warning: (opts) => addToast(typeof opts === 'string' ? { variant: 'warning', message: opts } : { ...opts, variant: 'warning' }),
    info: (opts) => addToast(typeof opts === 'string' ? { variant: 'info', message: opts } : { ...opts, variant: 'info' }),
  }), [addToast]);

  const value = useMemo(() => ({
    toasts,
    addToast,
    removeToast,
    clearAll,
    ...helpers,
  }), [toasts, addToast, removeToast, clearAll, helpers]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

function ToastContainer({ toasts, onRemove }) {
  if (toasts.length === 0) return null;
  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
      <div className="flex flex-col gap-3 pointer-events-auto">
        {toasts.map(toast => (
          <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
        ))}
      </div>
    </div>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
