/**
 * Order Service
 * Handles all order-related API calls
 * Updated with complete lifecycle support
 */

import apiClient from './api-client';
import type { Order, OrderStatus } from '@/types/api/order.types';

/**
 * API Response for order creation
 */
interface CreateOrderResponse {
  success: boolean;
  data?: {
    orderId: number;
    status: OrderStatus;
    totalQuantity: number;
    totalItemCount: number;
    subtotal: number;
    shippingFee: number;
    tax: number;
    total: number;
    items: Order['items'];
    createdAt: string;
  };
  error?: {
    code: string;
    message: string;
  };
}

/**
 * API Response for orders list
 */
interface OrdersListResponse {
  success: boolean;
  data?: {
    items: Order[];
    pagination: {
      page: number;
      limit: number;
      totalItems: number;
      totalPages: number;
    };
  };
  error?: {
    code: string;
    message: string;
  };
}

/**
 * API Response for single order
 */
interface OrderResponse {
  success: boolean;
  data?: {
    order: Order;
  };
  error?: {
    code: string;
    message: string;
  };
}

export const orderService = {
  /**
   * Create order draft from checkout
   * Endpoint: POST /orders/draft
   */
  async createDraft(): Promise<Order> {
    const response = await apiClient.post<CreateOrderResponse>('/orders/draft', {});
    const { success, data, error } = response.data;

    if (!success || !data) {
      throw new Error(error?.message || 'Failed to create order');
    }

    return {
      id: data.orderId,
      userId: 0, // Will be filled by auth context
      status: data.status,
      items: data.items,
      subtotal: data.subtotal,
      shippingFee: data.shippingFee,
      tax: data.tax,
      total: data.total,
      totalQuantity: data.totalQuantity,
      totalItemCount: data.totalItemCount,
      createdAt: data.createdAt,
      updatedAt: data.createdAt,
    };
  },

  /**
   * Get all orders for current user
   * Endpoint: GET /orders
   */
  async getOrders(options?: {
    page?: number;
    limit?: number;
    status?: OrderStatus | OrderStatus[];
  }): Promise<{
    items: Order[];
    pagination: {
      page: number;
      limit: number;
      totalItems: number;
      totalPages: number;
    };
  }> {
    const params = new URLSearchParams();

    if (options?.page) params.set('page', options.page.toString());
    if (options?.limit) params.set('limit', options.limit.toString());
    if (options?.status) {
      const statusValue = Array.isArray(options.status)
        ? options.status.join(',')
        : options.status;
      params.set('status', statusValue);
    }

    const queryString = params.toString();
    const url = queryString ? `/orders?${queryString}` : '/orders';

    const response = await apiClient.get<OrdersListResponse>(url);
    const { success, data, error } = response.data;

    if (!success || !data) {
      throw new Error(error?.message || 'Failed to fetch orders');
    }

    return {
      items: data.items,
      pagination: data.pagination,
    };
  },

  /**
   * Get order by ID
   * Endpoint: GET /orders/:id
   */
  async getOrderById(orderId: number): Promise<Order> {
    const response = await apiClient.get<OrderResponse>(`/orders/${orderId}`);
    const { success, data, error } = response.data;

    if (!success || !data?.order) {
      throw new Error(error?.message || 'Failed to fetch order');
    }

    return data.order;
  },

  /**
   * Update order status
   * Endpoint: PATCH /orders/:id/status
   */
  async updateOrderStatus(orderId: number, newStatus: OrderStatus): Promise<Order> {
    const response = await apiClient.patch<{ success: boolean; data?: { order: Order }; error?: { code: string; message: string } }>(
      `/orders/${orderId}/status`,
      { status: newStatus }
    );
    const { success, data, error } = response.data;

    if (!success || !data?.order) {
      throw new Error(error?.message || 'Failed to update order status');
    }

    return data.order;
  },

  /**
   * Cancel order
   * Endpoint: POST /orders/:id/cancel
   */
  async cancelOrder(orderId: number, reason?: string): Promise<Order> {
    const response = await apiClient.post<{ success: boolean; data?: { order: Order }; error?: { code: string; message: string } }>(
      `/orders/${orderId}/cancel`,
      { reason }
    );
    const { success, data, error } = response.data;

    if (!success || !data?.order) {
      throw new Error(error?.message || 'Failed to cancel order');
    }

    return data.order;
  },
} as const;

// ============ ORDER ERROR HANDLING ============

export enum OrderError {
  NETWORK = 'NETWORK',
  NOT_FOUND = 'NOT_FOUND',
  UNAUTHORIZED = 'UNAUTHORIZED',
  UNKNOWN = 'UNKNOWN',
}

export const ORDER_ERROR_MESSAGES: Record<OrderError, string> = {
  [OrderError.NETWORK]: 'Koneksi terputus. Periksa internet Anda.',
  [OrderError.NOT_FOUND]: 'Pesanan tidak ditemukan.',
  [OrderError.UNAUTHORIZED]: 'Anda tidak memiliki akses ke pesanan ini.',
  [OrderError.UNKNOWN]: 'Terjadi kesalahan. Silakan coba lagi.',
};

export function handleOrderError(error: unknown): OrderError {
  if (error instanceof Error) {
    if (error.message.includes('404')) return OrderError.NOT_FOUND;
    if (error.message.includes('401')) return OrderError.UNAUTHORIZED;
    if (
      error.message.includes('network') ||
      error.message.includes('fetch')
    ) {
      return OrderError.NETWORK;
    }
  }
  return OrderError.UNKNOWN;
}

// ============ ORDER STATUS HELPERS ============

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  DRAFT: 'Draft',
  WAITING_PAYMENT: 'Menunggu Pembayaran',
  PAID: 'Sudah Dibayar',
  PROCESSING: 'Sedang Diproses',
  SHIPPING: 'Sedang Dikirim',
  DELIVERED: 'Telah Tiba',
  COMPLETED: 'Selesai',
  EXPIRED: 'Kadaluarsa',
  CANCELLED: 'Dibatalkan',
};

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  DRAFT: 'bg-gray-100 text-gray-800',
  WAITING_PAYMENT: 'bg-yellow-100 text-yellow-800',
  PAID: 'bg-blue-100 text-blue-800',
  PROCESSING: 'bg-purple-100 text-purple-800',
  SHIPPING: 'bg-indigo-100 text-indigo-800',
  DELIVERED: 'bg-green-100 text-green-800',
  COMPLETED: 'bg-emerald-100 text-emerald-800',
  EXPIRED: 'bg-red-100 text-red-800',
  CANCELLED: 'bg-rose-100 text-rose-800',
};

export const ACTIVE_ORDER_STATUSES: OrderStatus[] = [
  'DRAFT',
  'WAITING_PAYMENT',
  'PAID',
  'PROCESSING',
  'SHIPPING',
  'DELIVERED',
];

export const COMPLETED_ORDER_STATUSES: OrderStatus[] = [
  'COMPLETED',
  'EXPIRED',
  'CANCELLED',
];
