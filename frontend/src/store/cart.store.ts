'use client';

/**
 * Cart Store (Zustand)
 *
 * Simplified cart state management following blueprint revision:
 * - Frontend as consumer, backend as source of truth
 * - Derived state (subtotal) NOT stored, calculated via useMemo
 * - Optimistic updates with rollback
 * - Sync on-demand (not constant polling)
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { CartItem, Cart, CheckoutPreview, ShippingOption, AddItemPayload } from './cart.types';
import { API_BASE_URL } from '@/lib/constants';

interface CartState {
  // Core state - ONLY store what backend returns
  items: CartItem[];

  // UI state
  isLoading: boolean;
  isSyncing: boolean;
  error: string | null;

  // UI state
  isDrawerOpen: boolean;
  checkoutInProgress: boolean;

  // Checkout preview (from backend)
  checkoutPreview: CheckoutPreview | null;

  // Selected shipping
  selectedShipping: ShippingOption | null;
}

interface CartActions {
  // CRUD
  addItem: (item: CartItem) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  removeItem: (itemId: string) => void;
  clearCart: () => void;

  // Sync with backend
  syncWithServer: () => Promise<void>;
  loadCart: () => Promise<void>;

  // UI
  openDrawer: () => void;
  closeDrawer: () => void;
  setCheckoutInProgress: (value: boolean) => void;
  setError: (error: string | null) => void;

  // Checkout
  setCheckoutPreview: (preview: CheckoutPreview | null) => void;
  setSelectedShipping: (shipping: ShippingOption | null) => void;

  // Internal
  _setItems: (items: CartItem[]) => void;
}

export const useCartStore = create<CartState & CartActions>()(
  persist(
    (set, get) => ({
      // Initial state
      items: [],
      isLoading: false,
      isSyncing: false,
      error: null,
      isDrawerOpen: false,
      checkoutInProgress: false,
      checkoutPreview: null,
      selectedShipping: null,

      // Add item to cart
      addItem: async (item: CartItem) => {
        const items = get().items;
        const existingIndex = items.findIndex(
          (i) => i.productId === item.productId && i.variantId === item.variantId
        );

        if (existingIndex >= 0) {
          // Update quantity if item exists
          const updatedItems = [...items];
          const newQuantity = updatedItems[existingIndex].quantity + item.quantity;
          updatedItems[existingIndex] = {
            ...updatedItems[existingIndex],
            quantity: newQuantity,
          };
          set({ items: updatedItems });

          // Sync updated quantity to backend (async, fire-and-forget)
          const productId = parseInt(item.productId) || parseInt(item.id.replace('temp-', ''));
          if (productId) {
            fetch(`${API_BASE_URL}/cart/items/${productId}`, {
              method: 'PATCH',
              credentials: 'include',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ quantity: newQuantity }),
            }).catch((e: unknown) => {
              console.warn('[Cart] Failed to sync quantity to backend:', e);
            });
          }
        } else {
          // Add new item — local state only.
          // Backend sync is handled exclusively by the checkout-preview sync effect.
          // This prevents the race condition where two POSTs to /cart/items
          // (one from sync effect, one from here) each increment the quantity.
          set({ items: [...items, item] });
        }
      },

      // Update item quantity
      updateQuantity: (itemId: string, quantity: number) => {
        if (quantity <= 0) {
          get().removeItem(itemId);
          return;
        }

        const items = get().items.map((item) =>
          item.id === itemId ? { ...item, quantity } : item
        );
        set({ items });

        // Sync to backend (async, fire-and-forget)
        const item = get().items.find((i) => i.id === itemId);
        if (item) {
          const productId = parseInt(item.productId) || parseInt(item.id.replace('temp-', ''));
          if (productId) {
            fetch(`${API_BASE_URL}/cart/items/${productId}`, {
              method: 'PATCH',
              credentials: 'include',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ quantity }),
            }).catch((e: unknown) => {
              console.warn('[Cart] Failed to sync quantity to backend:', e);
            });
          }
        }
      },

      // Remove item
      removeItem: (itemId: string) => {
        const items = get().items.filter((item) => item.id !== itemId);
        set({ items });
      },

      // Clear cart
      clearCart: () => {
        set({ items: [], checkoutPreview: null, selectedShipping: null });
      },

      // Sync with server - CRITICAL: never replace local items with empty server response
      syncWithServer: async () => {
        set({ isSyncing: true, error: null });

        try {
          const response = await fetch(`${API_BASE_URL}/cart`, {
            credentials: 'include',
          });

          if (!response.ok) {
            console.warn('Failed to sync cart with server, keeping local state');
            set({ isSyncing: false });
            return;
          }

          const data = await response.json();
          const serverItems = data.cart?.items || [];
          const localItems = get().items;

          // Only update if server has items OR if local is empty
          // This prevents local items from being lost when server returns empty
          if (serverItems.length > 0) {
            set({ items: serverItems });
          } else if (localItems.length === 0) {
            // Only clear if BOTH are empty - this is the "load from server" case
            set({ items: [] });
          }
          // If server is empty but we have local items, DO NOTHING - keep local
        } catch (error) {
          console.warn('Cart sync error:', error);
        } finally {
          set({ isSyncing: false });
        }
      },

      // Load cart on app start
      loadCart: async () => {
        set({ isLoading: true, error: null });

        try {
          const response = await fetch(`${API_BASE_URL}/cart`, {
            credentials: 'include',
          });

          if (!response.ok) {
            console.warn('Failed to load cart from server, keeping local state');
            set({ isLoading: false });
            return;
          }

          const data = await response.json();
          const serverItems = data.cart?.items || [];
          const localItems = get().items;

          // Prefer server data if available, otherwise keep local
          if (serverItems.length > 0) {
            set({ items: serverItems });
          } else if (localItems.length === 0) {
            // Only set empty if both are empty
            set({ items: [] });
          }
          // If server empty but local has items, keep local
        } catch (error) {
          console.warn('Cart load error:', error);
        } finally {
          set({ isLoading: false });
        }
      },

      // UI Actions
      openDrawer: () => set({ isDrawerOpen: true }),
      closeDrawer: () => set({ isDrawerOpen: false }),
      setCheckoutInProgress: (value: boolean) => set({ checkoutInProgress: value }),
      setError: (error: string | null) => set({ error }),

      // Checkout
      setCheckoutPreview: (preview: CheckoutPreview | null) => set({ checkoutPreview: preview }),
      setSelectedShipping: (shipping: ShippingOption | null) => set({ selectedShipping: shipping }),

      // Internal setter for optimistic updates
      _setItems: (items: CartItem[]) => set({ items }),
    }),
    {
      name: 'pasaria-cart',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        items: state.items,
      }),
    }
  )
);

// Selectors (derived state - NOT stored)
export const useCartSubtotal = () => {
  const items = useCartStore((state) => state.items);
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
};

export const useCartItemCount = () => {
  const items = useCartStore((state) => state.items);
  return items.reduce((sum, item) => sum + item.quantity, 0);
};

export const useHasUnavailableItems = () => {
  const items = useCartStore((state) => state.items);
  return items.some((item) => !item.isAvailable || item.quantity > item.stock);
};

export const useHasPriceChanges = () => {
  const items = useCartStore((state) => state.items);
  return items.some((item) => item.price !== item.currentPrice);
};

// Checkout button disabled rules
export const useIsCheckoutDisabled = () => {
  const items = useCartStore((state) => state.items);
  const isSyncing = useCartStore((state) => state.isSyncing);
  const checkoutInProgress = useCartStore((state) => state.checkoutInProgress);

  return (
    items.length === 0 ||
    items.every((item) => !item.isAvailable) ||
    items.some((item) => item.quantity > item.stock) ||
    items.some((item) => item.price !== item.currentPrice) ||
    isSyncing ||
    checkoutInProgress
  );
};
