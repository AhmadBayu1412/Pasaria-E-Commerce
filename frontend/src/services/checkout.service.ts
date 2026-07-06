// Checkout Service

import apiClient from './api-client';
import type { CheckoutPreview, InitiateCheckoutResponse } from '@/types/api';

export const checkoutService = {
  /**
   * Get checkout preview
   */
  async getPreview(): Promise<CheckoutPreview> {
    const response = await apiClient.get<CheckoutPreview>('/checkout/preview');
    return response.data;
  },

  /**
   * Initiate checkout (create draft order)
   */
  async initiate(): Promise<InitiateCheckoutResponse> {
    const response = await apiClient.post<InitiateCheckoutResponse>('/checkout');
    return response.data;
  },
};
