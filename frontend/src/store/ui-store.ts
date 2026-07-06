// UI Store (Zustand)

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { generateId } from '@/lib/utils';
import { TOAST_DURATION, MAX_TOASTS } from '@/lib/constants';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message?: string;
  duration?: number;
}

interface UIState {
  toasts: Toast[];
  isCartOpen: boolean;
  
  // Actions
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      toasts: [],
      isCartOpen: false,
      
      addToast: (toast) => {
        const id = generateId();
        const newToast: Toast = { ...toast, id };
        
        set((state) => {
          // Limit max toasts
          const updatedToasts = [newToast, ...state.toasts].slice(0, MAX_TOASTS);
          return { toasts: updatedToasts };
        });
        
        // Auto-remove after duration
        const duration = toast.duration ?? TOAST_DURATION;
        setTimeout(() => {
          get().removeToast(id);
        }, duration);
      },
      
      removeToast: (id) => set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      })),
      
      openCart: () => set({ isCartOpen: true }),
      closeCart: () => set({ isCartOpen: false }),
      toggleCart: () => set((state) => ({ isCartOpen: !state.isCartOpen })),
    }),
    {
      name: 'ui-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        isCartOpen: state.isCartOpen,
      }),
    }
  )
);
