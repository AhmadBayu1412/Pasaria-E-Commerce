/**
 * Order Status Definition
 * Single Source of Truth for all order status display
 */

import type { OrderStatus } from '@/types/api';

/**
 * Status Level - Semantic token
 * Tidak menggunakan Tailwind class langsung
 */
export type StatusLevel = 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';

/**
 * Status Configuration
 */
export interface StatusConfig {
  label: string;
  level: StatusLevel;
  icon: string;
  isFinal: boolean;
  showTimeline: boolean;
  order: number;
}

/**
 * Order Status Configuration
 */
export const ORDER_STATUS_CONFIG: Record<OrderStatus, StatusConfig> = {
  DRAFT: {
    label: 'Draft',
    level: 'INFO',
    icon: 'file-text',
    isFinal: false,
    showTimeline: true,
    order: 0,
  },
  PENDING: {
    label: 'Menunggu Pembayaran',
    level: 'WARNING',
    icon: 'clock',
    isFinal: false,
    showTimeline: true,
    order: 1,
  },
  PAID: {
    label: 'Sudah Dibayar',
    level: 'SUCCESS',
    icon: 'check-circle',
    isFinal: false,
    showTimeline: true,
    order: 2,
  },
  CANCELLED: {
    label: 'Dibatalkan',
    level: 'ERROR',
    icon: 'x-circle',
    isFinal: true,
    showTimeline: true,
    order: 99,
  },
  EXPIRED: {
    label: 'Kedaluwarsa',
    level: 'WARNING',
    icon: 'alert-circle',
    isFinal: true,
    showTimeline: true,
    order: 100,
  },
};

/**
 * Get status configuration
 */
export function getStatusConfig(status: OrderStatus): StatusConfig {
  return ORDER_STATUS_CONFIG[status];
}

/**
 * Get timeline steps
 */
export function getTimelineSteps(status: OrderStatus): StatusConfig[] {
  const linearSteps: OrderStatus[] = ['DRAFT', 'PENDING', 'PAID'];

  const currentIndex = linearSteps.indexOf(status);

  if (currentIndex === -1) {
    if (status === 'CANCELLED' || status === 'EXPIRED') {
      return [ORDER_STATUS_CONFIG['PENDING'], ORDER_STATUS_CONFIG[status]];
    }
    return [];
  }

  return linearSteps
    .slice(0, currentIndex + 1)
    .map((s) => ORDER_STATUS_CONFIG[s]);
}

/**
 * Action Matrix - Mendefinisikan aksi per status
 */
export interface OrderAction {
  id: string;
  label: string;
  variant: 'primary' | 'secondary' | 'danger';
  requiresAuth?: boolean;
}

export const ORDER_ACTIONS: Record<OrderStatus, OrderAction[]> = {
  DRAFT: [],
  PENDING: [
    { id: 'pay', label: 'Bayar Sekarang', variant: 'primary' },
    { id: 'cancel', label: 'Batalkan', variant: 'danger' },
  ],
  PAID: [{ id: 'invoice', label: 'Lihat Invoice', variant: 'secondary' }],
  CANCELLED: [{ id: 'reorder', label: 'Pesan Lagi', variant: 'primary' }],
  EXPIRED: [{ id: 'reorder', label: 'Pesan Lagi', variant: 'primary' }],
};

/**
 * Check if action is available for status
 */
export function hasOrderAction(status: OrderStatus, actionId: string): boolean {
  return ORDER_ACTIONS[status].some((action) => action.id === actionId);
}

/**
 * Get available actions for status
 */
export function getOrderActions(status: OrderStatus): OrderAction[] {
  return ORDER_ACTIONS[status];
}
