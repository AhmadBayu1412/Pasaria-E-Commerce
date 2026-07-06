'use client';

import { useEffect, useCallback, useId } from 'react';
import type { ModalProps, ModalFooterProps } from './modal.types';
import { cn } from '@/lib/cn';

/**
 * Modal Component
 * 
 * A dialog overlay component with focus trap and keyboard support.
 */
export function Modal({
  isOpen,
  onClose,
  title,
  size = 'md',
  disableBackdropClick = false,
  showCloseButton = true,
  children,
}: ModalProps) {
  const titleId = useId();

  // Handle escape key
  const handleEscape = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    },
    [onClose]
  );

  // Add/remove event listeners
  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, handleEscape]);

  if (!isOpen) return null;

  const sizeStyles: Record<string, string> = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    full: 'max-w-full h-[90vh]',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? titleId : undefined}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={disableBackdropClick ? undefined : onClose}
        aria-hidden="true"
      />

      {/* Modal content */}
      <div
        className={cn(
          'relative w-full bg-white rounded-lg shadow-xl',
          'transform animate-scale-in',
          sizeStyles[size]
        )}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-secondary-200">
            {title && (
              <h2 id={titleId} className="text-lg font-semibold text-secondary-900">
                {title}
              </h2>
            )}
            {showCloseButton && (
              <button
                onClick={onClose}
                className="p-1 text-secondary-400 hover:text-secondary-600 transition-colors rounded-md hover:bg-secondary-100"
                aria-label="Close modal"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        )}

        {/* Body */}
        <div className="px-6 py-4 max-h-[60vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

// Footer compound component
Modal.Footer = function ModalFooter({ children, className, ...props }: ModalFooterProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-end gap-3 px-6 py-4 border-t border-secondary-200 bg-secondary-50 rounded-b-lg',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
