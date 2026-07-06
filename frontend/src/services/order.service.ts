/**
 * Order Service
 * HTTP calls for order management
 */

import apiClient from './api-client';
import type { Order, PaginatedResponse } from '@/types/api';

/**
 * Order Error Codes
 */
export enum OrderError {
  NETWORK = 'NETWORK',
  NOT_FOUND = 'NOT_FOUND',
  UNAUTHORIZED = 'UNAUTHORIZED',
  UNKNOWN = 'UNKNOWN',
}

/**
 * Error messages for UI
 */
export const ORDER_ERROR_MESSAGES: Record<OrderError, string> = {
  [OrderError.NETWORK]: 'Koneksi terputus. Periksa internet Anda.',
  [OrderError.NOT_FOUND]: 'Pesanan tidak ditemukan.',
  [OrderError.UNAUTHORIZED]: 'Silakan login terlebih dahulu.',
  [OrderError.UNKNOWN]: 'Terjadi kesalahan. Silakan coba lagi.',
};

/**
 * Handle error and return error code
 */
export function handleOrderError(error: unknown): OrderError {
  if (error instanceof Error) {
    if (error.message.includes('404')) return OrderError.NOT_FOUND;
    if (error.message.includes('401')) return OrderError.UNAUTHORIZED;
    if (
      error.message.includes('network') ||
      error.message.includes('fetch') ||
      error.message.includes('Failed to fetch')
    ) {
      return OrderError.NETWORK;
    }
  }
  return OrderError.UNKNOWN;
}

/**
 * Get human-readable error message
 */
export function getOrderErrorMessage(error: OrderError): string {
  return ORDER_ERROR_MESSAGES[error];
}

export const orderService = {
  /**
   * Get user's orders (paginated)
   */
  async getOrders(
    page: number = 1,
    limit: number = 10,
  ): Promise<PaginatedResponse<Order>> {
    const response = await apiClient.get<PaginatedResponse<Order>>('/orders', {
      params: { page, limit },
    });
    return response.data;
  },

  /**
   * Get order by ID
   */
  async getOrderById(orderId: number): Promise<Order> {
    const response = await apiClient.get<{ order: Order }>(
      `/orders/${orderId}`,
    );
    return response.data.order;
  },
};
