// Order Service

import apiClient from './api-client';
import type { Order, PaginatedResponse } from '@/types/api';

export const orderService = {
  /**
   * Get user's orders (paginated)
   */
  async getOrders(page: number = 1, limit: number = 10): Promise<PaginatedResponse<Order>> {
    const response = await apiClient.get<PaginatedResponse<Order>>('/orders', {
      params: { page, limit },
    });
    return response.data;
  },

  /**
   * Get order by ID
   */
  async getOrderById(orderId: number): Promise<Order> {
    const response = await apiClient.get<{ order: Order }>(`/orders/${orderId}`);
    return response.data.order;
  },
};
