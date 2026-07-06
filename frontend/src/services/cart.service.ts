// Cart Service

import apiClient from './api-client';
import type { Cart, AddToCartRequest, UpdateCartItemRequest } from '@/types/api';

export const cartService = {
  /**
   * Get current cart
   */
  async getCart(): Promise<Cart> {
    const response = await apiClient.get<{ cart: Cart }>('/cart');
    return response.data.cart;
  },

  /**
   * Add item to cart
   */
  async addToCart(data: AddToCartRequest): Promise<Cart> {
    const response = await apiClient.post<Cart>('/cart/items', data);
    return response.data;
  },

  /**
   * Update cart item quantity
   */
  async updateCartItem(itemId: number, data: UpdateCartItemRequest): Promise<Cart> {
    const response = await apiClient.patch<Cart>(`/cart/items/${itemId}`, data);
    return response.data;
  },

  /**
   * Remove item from cart
   */
  async removeFromCart(itemId: number): Promise<Cart> {
    const response = await apiClient.delete<Cart>(`/cart/items/${itemId}`);
    return response.data;
  },

  /**
   * Clear entire cart
   */
  async clearCart(): Promise<{ success: boolean }> {
    const response = await apiClient.delete<{ success: boolean }>('/cart');
    return response.data;
  },
};
