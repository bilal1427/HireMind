import { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { FiAlertTriangle, FiAlertCircle, FiCheckCircle, FiInfo, FiTrash2 } from 'react-icons/fi';
import { Modal, ModalHeader, ModalContent, ModalFooter } from './Modal';
import { Button } from './Button';

const confirmIcons = {
  danger: {
    component: FiAlertTriangle,
    wrapperClass: 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400',
  },
  warning: {
    component: FiAlertTriangle,
    wrapperClass: 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400',
  },
  primary: {
    component: FiInfo,
    wrapperClass: 'bg-brand-100 dark:bg-brand-900/40 text-brand-600 dark:text-brand-400',
  },
  success: {
    component: FiCheckCircle,
    wrapperClass: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400',
  },
  info: {
    component: FiInfo,
    wrapperClass: 'bg-sky-100 dark:bg-sky-900/40 text-sky-600 dark:text-sky-400',
  },
  destructive: {
    component: FiTrash2,
    wrapperClass: 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400',
  },
};

const confirmButtonVariants = {
  danger: 'danger',
  warning: 'primary',
  primary: 'primary',
  success: 'success',
  info: 'primary',
  destructive: 'danger',
};

function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  onCancel,
  title = 'Are you sure?',
  description = 'This action cannot be undone.',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'primary',
  icon,
  size = 'md',
  confirmButtonVariant,
  cancelButtonVariant = 'ghost',
  disabled = false,
  isLoading = false,
  showCancel = true,
  closeOnConfirm = true,
  className,
}) {
  const [confirming, setConfirming] = useState(false);
  const iconConfig = confirmIcons[variant] || confirmIcons.primary;
  const IconComponent = icon || iconConfig.component;
  const buttonVariant = confirmButtonVariant || confirmButtonVariants[variant];

  const handleConfirm = useCallback(async () => {
    try {
      setConfirming(true);
      await onConfirm?.();
      if (closeOnConfirm) {
        onClose?.();
      }
    } finally {
      setConfirming(false);
    }
  }, [onConfirm, onClose, closeOnConfirm]);

  const handleCancel = useCallback(() => {
    onCancel?.();
    onClose?.();
  }, [onCancel, onClose]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCancel}
      size={size}
      closeOnBackdropClick={!disabled && !isLoading && !confirming}
      className={cn(className)}
    >
      <ModalHeader showClose={false}>
        <div className="flex flex-col sm:flex-row sm:items-start gap-4 w-full">
          <div
            className={cn(
              'flex items-center justify-center w-12 h-12 rounded-xl shrink-0',
              iconConfig.wrapperClass
            )}
          >
            <IconComponent className="w-6 h-6" />
          </div>
          <div className="flex-1 text-left">
            <h2 className="text-lg font-semibold text-surface-900 dark:text-surface-100">
              {title}
            </h2>
          </div>
        </div>
      </ModalHeader>

      <ModalContent>
        <div className="sm:pl-16">
          {description && (
            <p className="text-sm text-surface-500 dark:text-surface-400 leading-relaxed">
              {typeof description === 'string' ? (
                description.split('\n').map((line, i) => (
                  <span key={i}>
                    {line}
                    {i < description.split('\n').length - 1 && <br />}
                  </span>
                ))
              ) : (
                description
              )}
            </p>
          )}
        </div>
      </ModalContent>

      <ModalFooter>
        {showCancel && (
          <Button
            variant={cancelButtonVariant}
            onClick={handleCancel}
            disabled={disabled || isLoading || confirming}
            fullWidth
            className="sm:w-auto"
          >
            {cancelText}
          </Button>
        )}
        <Button
          variant={buttonVariant}
          onClick={handleConfirm}
          disabled={disabled}
          isLoading={isLoading || confirming}
          fullWidth
          className="sm:w-auto"
        >
          {confirmText}
        </Button>
      </ModalFooter>
    </Modal>
  );
}

function useConfirm(options = {}) {
  const [open, setOpen] = useState(false);
  const [config, setConfig] = useState(options);

  const confirm = useCallback((confirmOptions = {}) => {
    return new Promise((resolve) => {
      const mergedConfig = {
        ...options,
        ...confirmOptions,
        onConfirm: async () => {
          await options.onConfirm?.();
          await confirmOptions.onConfirm?.();
          resolve(true);
        },
        onCancel: () => {
          options.onCancel?.();
          confirmOptions.onCancel?.();
          resolve(false);
        },
        isOpen: true,
      };
      setConfig(mergedConfig);
      setOpen(true);
    });
  }, [options]);

  const handleClose = useCallback(() => {
    setOpen(false);
  }, []);

  const ConfirmDialogComponent = (
    <ConfirmDialog
      {...config}
      isOpen={open}
      onClose={handleClose}
      onCancel={handleClose}
    />
  );

  return { confirm, ConfirmDialog: ConfirmDialogComponent };
}

export { ConfirmDialog, useConfirm };
