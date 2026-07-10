/**
 * Order Service
 * HTTP calls for order management
 * PEIA Audit: Fixed to match backend endpoints
 */

import apiClient from './api-client';
import type { Order } from '@/types/api';

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

// Backend response type (wraps data in { data: { items, pagination } })
interface BackendOrdersResponse {
  success: boolean;
  data: {
    items: Order[];
    pagination: {
      page: number;
      limit: number;
      totalItems: number;
      totalPages: number;
    };
  };
}

// Backend order detail response (wraps data in { data: { order } })
interface BackendOrderDetailResponse {
  success: boolean;
  data: {
    order: Order;
  };
}

export const orderService = {
  /**
   * Get user's orders (paginated)
   * Endpoint: GET /orders
   */
  async getOrders(
    page: number = 1,
    limit: number = 10,
  ): Promise<{ items: Order[]; pagination: { page: number; limit: number; totalItems: number; totalPages: number } }> {
    const response = await apiClient.get<BackendOrdersResponse>('/orders', {
      params: { page, limit },
    });

    // Transform to match frontend expected format
    return {
      items: response.data.data.items,
      pagination: response.data.data.pagination,
    };
  },

  /**
   * Get order by ID
   * Endpoint: GET /orders/:id
   */
  async getOrderById(orderId: number): Promise<Order> {
    const response = await apiClient.get<BackendOrderDetailResponse>(`/orders/${orderId}`);
    return response.data.data.order;
  },
};
