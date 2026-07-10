/**
 * Cart Service
 * 
 * Direct consumer of Express API (no Next.js API Routes).
 * Following blueprint: Frontend as consumer, backend as source of truth.
 */

import type { Cart, CartItem, AddItemPayload, CheckoutPreview, ShippingOption, Address } from '@/store/cart.types';

import { API_BASE_URL } from '@/lib/constants';

interface CartApiResponse {
  success: boolean;
  cart?: Cart;
  message?: string;
}

interface CheckoutPreviewResponse {
  success: boolean;
  preview?: CheckoutPreview;
}

interface ShippingOptionsResponse {
  success: boolean;
  options?: ShippingOption[];
}

interface AddressesResponse {
  success: boolean;
  addresses?: Address[];
}

class CartService {
  /**
   * Get cart from backend
   */
  async getCart(): Promise<CartApiResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/cart`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('CartService.getCart error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch cart',
      };
    }
  }

  /**
   * Add item to cart
   * Endpoint: POST /cart/items
   */
  async addItem(payload: AddItemPayload): Promise<CartApiResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/cart/items`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('CartService.addItem error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to add item',
      };
    }
  }

  /**
   * Update item quantity
   * Endpoint: PATCH /cart/items/:productId
   */
  async updateQuantity(productId: string, quantity: number): Promise<CartApiResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/cart/items/${productId}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ quantity }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('CartService.updateQuantity error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update quantity',
      };
    }
  }

  /**
   * Remove item from cart
   * Endpoint: DELETE /cart/items/:productId
   */
  async removeItem(productId: string): Promise<CartApiResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/cart/items/${productId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('CartService.removeItem error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to remove item',
      };
    }
  }

  /**
   * Clear entire cart
   */
  async clearCart(): Promise<CartApiResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/cart`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('CartService.clearCart error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to clear cart',
      };
    }
  }

  /**
   * Get checkout preview (from backend as source of truth)
   */
  async getCheckoutPreview(addressId?: string): Promise<CheckoutPreviewResponse> {
    try {
      const url = addressId
        ? `${API_BASE_URL}/checkout/preview?address_id=${addressId}`
        : `${API_BASE_URL}/checkout/preview`;

      const response = await fetch(url, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('CartService.getCheckoutPreview error:', error);
      return {
        success: false,
      };
    }
  }

  /**
   * Get shipping options
   */
  async getShippingOptions(addressId: string): Promise<ShippingOptionsResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/shipping?address_id=${addressId}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('CartService.getShippingOptions error:', error);
      return {
        success: false,
      };
    }
  }

  /**
   * Get user addresses
   */
  async getAddresses(): Promise<AddressesResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/addresses`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('CartService.getAddresses error:', error);
      return {
        success: false,
      };
    }
  }

  /**
   * Merge guest cart on login
   */
  async mergeCart(guestId: string): Promise<CartApiResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/cart/merge`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ guest_id: guestId }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('CartService.mergeCart error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to merge cart',
      };
    }
  }

  /**
   * Create order
   */
  async createOrder(payload: {
    addressId: string;
    shippingMethodId: string;
    notes?: string;
  }): Promise<{ success: boolean; orderId?: string; message?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/orders`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('CartService.createOrder error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create order',
      };
    }
  }
}

// Export singleton instance
export const cartService = new CartService();

// Also export class for testing
export { CartService };
