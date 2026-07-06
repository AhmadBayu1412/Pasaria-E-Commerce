/**
 * Modal Types
 */

import type { HTMLAttributes, ReactNode } from 'react';

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

export interface ModalProps {
  /** Whether the modal is open */
  isOpen: boolean;

  /** Callback when modal should close */
  onClose: () => void;

  /** Modal title */
  title?: string;

  /** Modal size */
  size?: ModalSize;

  /** Disable backdrop click to close */
  disableBackdropClick?: boolean;

  /** Show close button */
  showCloseButton?: boolean;

  /** Children content */
  children: ReactNode;
}

export interface ModalFooterProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}
