/**
 * Toast Component Types
 */

import type { ToastType } from '@/store/toast/toast.types';

export type ToastPosition = 'top-right' | 'top-left' | 'top-center' | 'bottom-right' | 'bottom-left' | 'bottom-center';

export interface ToastItemProps {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  onClose: (id: string) => void;
}

export interface ToastContainerProps {
  position?: ToastPosition;
}
