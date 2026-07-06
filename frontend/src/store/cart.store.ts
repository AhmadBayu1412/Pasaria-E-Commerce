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

// API Base URL - in production, this should come from env
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

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
      addItem: (item: CartItem) => {
        const items = get().items;
        const existingIndex = items.findIndex(
          (i) => i.productId === item.productId && i.variantId === item.variantId
        );

        if (existingIndex >= 0) {
          // Update quantity if item exists
          const updatedItems = [...items];
          updatedItems[existingIndex] = {
            ...updatedItems[existingIndex],
            quantity: updatedItems[existingIndex].quantity + item.quantity,
          };
          set({ items: updatedItems });
        } else {
          // Add new item
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

      // Sync with server (replace local with server state)
      syncWithServer: async () => {
        set({ isSyncing: true, error: null });

        try {
          const response = await fetch(`${API_BASE_URL}/cart`, {
            credentials: 'include',
          });

          if (!response.ok) {
            throw new Error('Failed to fetch cart');
          }

          const data = await response.json();
          set({ items: data.cart?.items || [] });
        } catch (error) {
          console.error('Cart sync error:', error);
          set({ error: 'Gagal sinkronisasi keranjang' });
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
            throw new Error('Failed to load cart');
          }

          const data = await response.json();
          set({ items: data.cart?.items || [] });
        } catch (error) {
          console.error('Cart load error:', error);
          set({ error: 'Gagal memuat keranjang' });
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
