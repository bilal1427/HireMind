import { useEffect, useRef, useCallback, createContext, useContext } from 'react';
import { cn } from '@/lib/utils';
import { FiX } from 'react-icons/fi';

const ModalContext = createContext(null);

function useModalContext() {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('Modal components must be used within <Modal>');
  }
  return context;
}

const modalSizes = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
  '4xl': 'max-w-4xl',
  full: 'max-w-full mx-4 md:mx-6',
};

function Modal({
  children,
  isOpen,
  onClose,
  size = 'md',
  closeOnBackdropClick = true,
  closeOnEsc = true,
  className,
}) {
  const overlayRef = useRef(null);
  const contentRef = useRef(null);

  const handleKeyDown = useCallback(
    (e) => {
      if (!closeOnEsc) return;
      if (e.key === 'Escape') {
        onClose?.();
      }
    },
    [closeOnEsc, onClose]
  );

  useEffect(() => {
    if (!isOpen) return;

    document.addEventListener('keydown', handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const focusableElements = contentRef.current?.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusableElements?.length > 0) {
      setTimeout(() => focusableElements[0].focus(), 50);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, handleKeyDown]);

  const handleBackdropClick = (e) => {
    if (!closeOnBackdropClick) return;
    if (e.target === overlayRef.current) {
      onClose?.();
    }
  };

  if (!isOpen) return null;

  return (
    <ModalContext.Provider value={{ onClose }}>
      <div
        ref={overlayRef}
        onClick={handleBackdropClick}
        className={cn(
          'fixed inset-0 z-50 flex items-center justify-center p-0 md:p-4',
          'bg-black/50 backdrop-blur-sm',
          'animate-fade-in'
        )}
        role="dialog"
        aria-modal="true"
      >
        <div
          ref={contentRef}
          className={cn(
            'relative w-full',
            'bg-white dark:bg-surface-900',
            'border border-surface-200 dark:border-surface-800',
            'shadow-elevated',
            'h-full md:h-auto max-h-[100dvh] md:max-h-[90vh] md:rounded-2xl rounded-none',
            'flex flex-col overflow-hidden',
            modalSizes[size],
            'animate-slide-up',
            className
          )}
        >
          {children}
        </div>
      </div>
    </ModalContext.Provider>
  );
}

function ModalHeader({ children, className, showClose = true, title, onClose: closeOverride }) {
  const { onClose: contextOnClose } = useModalContext();
  const onClose = closeOverride || contextOnClose;

  if (title) {
    return (
      <div
        className={cn(
          'flex items-start justify-between p-5 md:p-6',
          'border-b border-surface-100 dark:border-surface-800',
          className
        )}
      >
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold text-surface-900 dark:text-surface-100">
            {title}
          </h2>
          {children && (
            <p className="text-sm text-surface-500 dark:text-surface-400">{children}</p>
          )}
        </div>
        {showClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="shrink-0 ml-4 p-2 rounded-lg text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50"
          >
            <FiX className="w-5 h-5" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex items-start justify-between p-5 md:p-6',
        'border-b border-surface-100 dark:border-surface-800',
        className
      )}
    >
      <div className="flex-1 min-w-0">{children}</div>
      {showClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Close dialog"
          className="shrink-0 ml-4 p-2 rounded-lg text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50"
        >
          <FiX className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}

function ModalTitle({ children, className }) {
  return (
    <h2
      className={cn(
        'text-lg font-semibold text-surface-900 dark:text-surface-100',
        className
      )}
    >
      {children}
    </h2>
  );
}

function ModalDescription({ children, className }) {
  return (
    <p
      className={cn(
        'mt-1 text-sm text-surface-500 dark:text-surface-400',
        className
      )}
    >
      {children}
    </p>
  );
}

function ModalContent({ children, className }) {
  return (
    <div
      className={cn(
        'flex-1 overflow-y-auto',
        'p-5 md:p-6',
        className
      )}
    >
      {children}
    </div>
  );
}

function ModalBody({ children, className }) {
  return <ModalContent className={className}>{children}</ModalContent>;
}

function ModalFooter({ children, className }) {
  return (
    <div
      className={cn(
        'flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3',
        'p-5 md:p-6',
        'border-t border-surface-100 dark:border-surface-800',
        'bg-surface-50/50 dark:bg-surface-800/30',
        className
      )}
    >
      {children}
    </div>
  );
}

export { Modal, ModalHeader, ModalTitle, ModalDescription, ModalContent, ModalBody, ModalFooter };
