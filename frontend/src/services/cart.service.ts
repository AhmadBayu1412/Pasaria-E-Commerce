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

interface PaymentMethodResponse {
  id: string;
  name: string;
  type: string;
  provider: string;
  icon: string;
  description: string;
  fee: number;
  minAmount?: number;
  maxAmount?: number;
}

interface PaymentMethodsResponse {
  success: boolean;
  methods?: PaymentMethodResponse[];
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

      // Handle 401 gracefully - user not logged in
      if (response.status === 401) {
        console.warn('User not authenticated for cart');
        return { success: true, cart: undefined };
      }

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
        // Don't throw - return error response instead
        const errorText = await response.text().catch(() => '');
        console.error(`CartService.addItem failed: ${response.status}`, errorText);
        return {
          success: false,
          message: `Failed to add item: ${response.status}`,
        };
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

      // Handle 401 gracefully - user not logged in
      if (response.status === 401) {
        console.warn('User not authenticated for cart update');
        return { success: true }; // Allow local update
      }

      if (!response.ok) {
        // 404 is acceptable - item might not exist in backend yet
        if (response.status === 404) {
          console.warn(`Item ${productId} not found in backend cart for update`);
          return { success: true }; // Allow local update
        }
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

      // Handle 401 gracefully - user not logged in
      if (response.status === 401) {
        console.warn('User not authenticated for cart removal');
        return { success: true }; // Allow local removal
      }

      if (!response.ok) {
        // 404 is acceptable - item might not exist in backend
        if (response.status === 404) {
          console.warn(`Item ${productId} not found in backend cart`);
          return { success: true }; // Return success to allow local removal
        }
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

      // Handle 401 gracefully - user not logged in
      if (response.status === 401) {
        console.warn('User not authenticated for cart clear');
        return { success: true }; // Allow local clear
      }

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
   * Initiate checkout - get checkout preview
   * Endpoint: POST /checkout
   */
  async initiateCheckout(): Promise<CheckoutPreviewResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/checkout`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // Handle 401 gracefully - user not logged in
      if (response.status === 401) {
        console.warn('User not authenticated for checkout');
        return { success: false, preview: undefined };
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      // Transform backend response to frontend format
      return {
        success: true,
        preview: data.data ? {
          items: data.data.items || [],
          subtotal: data.data.summary?.subtotal || 0,
          shipping: 0,
          total: data.data.summary?.subtotal || 0,
          validUntil: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        } : undefined,
      };
    } catch (error) {
      console.error('CartService.initiateCheckout error:', error);
      return {
        success: false,
      };
    }
  }

  /**
   * Complete checkout
   * Endpoint: POST /checkout/complete
   */
  async completeCheckout(params?: {
    selectedShippingId?: string;
    selectedPaymentId?: string;
  }): Promise<{ success: boolean; orderId?: number; message?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/checkout/complete`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          selectedShippingId: params?.selectedShippingId,
          selectedPaymentId: params?.selectedPaymentId,
        }),
      });

      // Handle 401 gracefully - user not logged in
      if (response.status === 401) {
        console.warn('User not authenticated for checkout complete');
        return { success: false, message: 'Silakan login terlebih dahulu' };
      }

      // Handle cart empty error gracefully
      if (response.status === 400) {
        const errorData = await response.json().catch(() => ({}));
        console.warn('Checkout failed:', errorData.error?.message || 'Cart is empty');
        return {
          success: false,
          message: errorData.error?.message || 'Keranjang kosong atau sudah diproses'
        };
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.warn('Checkout failed:', errorData.error?.message || `HTTP error! status: ${response.status}`);
        return {
          success: false,
          message: errorData.error?.message || 'Gagal menyelesaikan checkout'
        };
      }

      const data = await response.json();
      return {
        success: true,
        orderId: data.data?.orderId,
      };
    } catch (error) {
      console.error('CartService.completeCheckout error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Gagal menyelesaikan checkout',
      };
    }
  }

  /**
   * Get shipping options
   */
  async getShippingOptions(): Promise<ShippingOptionsResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/shipping`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // Handle 401 gracefully - user not logged in
      if (response.status === 401) {
        console.warn('User not authenticated for shipping options');
        return { success: false, options: [] };
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: data.success,
        options: data.data || [],
      };
    } catch (error) {
      console.error('CartService.getShippingOptions error:', error);
      return {
        success: false,
        options: [],
      };
    }
  }

  /**
   * Get payment methods
   */
  async getPaymentMethods(): Promise<PaymentMethodsResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/payments/methods`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // Handle 401 gracefully - user not logged in
      if (response.status === 401) {
        console.warn('User not authenticated for payment methods');
        return { success: false, methods: [] };
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: data.success,
        methods: data.data || [],
      };
    } catch (error) {
      console.error('CartService.getPaymentMethods error:', error);
      return {
        success: false,
        methods: [],
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

      // Handle 401 gracefully - user not logged in
      if (response.status === 401) {
        console.warn('User not authenticated for addresses');
        return {
          success: false,
          addresses: [],
        };
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      // Backend returns { success: true, data: addresses }
      // Transform to frontend format: { success: true, addresses: [...] }
      return {
        success: data.success,
        addresses: data.data || [],
      };
    } catch (error) {
      console.error('CartService.getAddresses error:', error);
      return {
        success: false,
        addresses: [],
      };
    }
  }

  /**
   * Add new address
   */
  async addAddress(address: {
    label?: string;
    recipientName: string;
    phone: string;
    address: string;
    city: string;
    province?: string;
    postalCode?: string;
  }): Promise<{ success: boolean; address?: Address; message?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/addresses`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(address),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      // Backend returns { success: true, data: { address fields } }
      // Transform to frontend format: { success: true, address: { address fields } }
      return {
        success: data.success,
        address: data.data,
      };
    } catch (error) {
      console.error('CartService.addAddress error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to add address',
      };
    }
  }

  /**
   * Update address
   */
  async updateAddress(id: string, address: Partial<{
    label: string;
    recipientName: string;
    phone: string;
    address: string;
    city: string;
    province: string;
    postalCode: string;
    isDefault: boolean;
  }>): Promise<{ success: boolean; address?: Address; message?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/addresses/${id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(address),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      // Backend returns { success: true, data: { address fields } }
      // Transform to frontend format: { success: true, address: { address fields } }
      return {
        success: data.success,
        address: data.data,
      };
    } catch (error) {
      console.error('CartService.updateAddress error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update address',
      };
    }
  }

  /**
   * Delete address
   */
  async deleteAddress(id: string): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/addresses/${id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`);
      }

      return {
        success: true,
      };
    } catch (error) {
      console.error('CartService.deleteAddress error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to delete address',
      };
    }
  }

  /**
   * Set address as default
   */
  async setDefaultAddress(id: string): Promise<{ success: boolean; address?: Address; message?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/addresses/${id}/default`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      // Backend returns { success: true, data: { address fields } }
      // Transform to frontend format: { success: true, address: { address fields } }
      return {
        success: data.success,
        address: data.data,
      };
    } catch (error) {
      console.error('CartService.setDefaultAddress error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to set default address',
      };
    }
  }
}

// Export singleton instance
export const cartService = new CartService();

// Also export class for testing
export { CartService };
