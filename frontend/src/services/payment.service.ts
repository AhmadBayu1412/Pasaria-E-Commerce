// Payment Service

import apiClient from './api-client';
import type { PaymentIntent, PaymentCallback } from '@/types/api';

export const paymentService = {
  /**
   * Create payment intent
   */
  async createIntent(orderId: number): Promise<PaymentIntent> {
    const response = await apiClient.post<PaymentIntent>('/payments/intent', { orderId });
    return response.data;
  },

  /**
   * Get payment status
   */
  async getPaymentStatus(paymentId: number): Promise<PaymentIntent> {
    const response = await apiClient.get<{ payment: PaymentIntent }>(`/payments/${paymentId}`);
    return response.data.payment;
  },

  /**
   * Handle payment callback
   */
  handleCallback(params: PaymentCallback): 'SUCCESS' | 'FAILED' | 'PENDING' {
    return params.status;
  },
};
