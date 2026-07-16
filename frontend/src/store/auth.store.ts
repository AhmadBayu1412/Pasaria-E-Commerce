/**
 * Auth Store (Zustand)
 *
 * State management for authentication.
 * - Server is source of truth
 * - NO HTTP calls (handled by AuthService)
 * - NO cart merge logic (handled by LoginForm)
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  User,
  AuthStatus,
  AuthError,
  AuthErrorCode,
} from '@/components/features/auth/auth-state';
import { AUTH_ERROR_MESSAGES } from '@/components/features/auth/auth-state';
import { authService } from '@/services/auth.service';

interface AuthState {
  // Core state - server is source of truth
  user: User | null;
  status: AuthStatus;

  // Error state
  error: AuthError | null;
}

interface AuthActions {
  // State setters (called by service/hooks, not components directly)
  setUser: (user: User | null) => void;
  setStatus: (status: AuthStatus) => void;
  setError: (code: AuthErrorCode, customMessage?: string) => void;
  clearError: () => void;

  // Logout action
  logout: () => Promise<void>;

  // Reset (for logout)
  reset: () => void;
}

const initialState: AuthState = {
  user: null,
  status: 'UNKNOWN',
  error: null,
};

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set) => ({
      // Initial state
      ...initialState,

      // Setters
      setUser: (user: User | null) => set({ user }),

      setStatus: (status: AuthStatus) => set({ status }),

      setError: (code: AuthErrorCode, customMessage?: string) =>
        set({
          error: {
            code,
            message: customMessage || AUTH_ERROR_MESSAGES[code],
          },
        }),

      clearError: () => set({ error: null }),

      // Logout - call backend and reset state
      logout: async () => {
        try {
          await authService.logout();
        } catch {
          // Ignore backend errors, still reset local state
        } finally {
          // Always reset local state regardless of backend result
          set({
            user: null,
            status: 'GUEST',
            error: null,
          });
        }
      },

      reset: () => set({ ...initialState }),
    }),
    {
      name: 'pasaria-auth',
      storage: createJSONStorage(() => localStorage),
      // NOTE: We persist user for quick UI hints,
      // but status is always re-checked from server
      partialize: (state) => ({
        user: state.user,
      }),
    },
  ),
);

// Selectors
export const useUser = () => useAuthStore((state) => state.user);
export const useAuthStatus = () => useAuthStore((state) => state.status);
export const useAuthError = () => useAuthStore((state) => state.error);
export const useIsAuthenticated = () =>
  useAuthStore((state) => state.status === 'AUTHENTICATED');
export const useIsAuthLoading = () =>
  useAuthStore((state) => state.status === 'UNKNOWN');
