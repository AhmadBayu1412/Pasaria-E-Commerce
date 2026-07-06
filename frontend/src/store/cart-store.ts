// Cart Store (Zustand)

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Cart } from '@/types/api';

interface CartState {
  cart: Cart | null;
  isLoading: boolean;
  isSyncing: boolean;
  
  // Computed
  itemCount: number;
  
  // Actions
  setCart: (cart: Cart | null) => void;
  setLoading: (isLoading: boolean) => void;
  setSyncing: (isSyncing: boolean) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      cart: null,
      isLoading: false,
      isSyncing: false,
      
      get itemCount() {
        return get().cart?.itemCount ?? 0;
      },
      
      setCart: (cart) => set({ cart }),
      setLoading: (isLoading) => set({ isLoading }),
      setSyncing: (isSyncing) => set({ isSyncing }),
      clearCart: () => set({ cart: null }),
    }),
    {
      name: 'cart-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

// Computed property workaround for Zustand
Object.defineProperty(useCartStore, 'itemCount', {
  get() {
    return this.getState().cart?.itemCount ?? 0;
  },
});
