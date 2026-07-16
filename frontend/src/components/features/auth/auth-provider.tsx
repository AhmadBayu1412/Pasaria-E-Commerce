/**
 * Auth Provider
 *
 * Wraps the app to provide authentication state.
 * - ONLY handles session restoration
 * - NO cart logic
 * - NO merge logic
 */

'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { authService, handleAuthError } from '@/services/auth.service';
import { AuthLoading } from './auth-loading';

interface AuthContextValue {
  isReady: boolean;
}

const AuthContext = createContext<AuthContextValue>({ isReady: false });

export function useAuthContext() {
  return useContext(AuthContext);
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [isInitializing, setIsInitializing] = useState(true);
  const { setUser, setStatus, setError } = useAuthStore();

  // Restore session on mount - SERVER IS SOURCE OF TRUTH
  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await authService.getSession();

        if (response.user) {
          setUser(response.user);
          setStatus('AUTHENTICATED');
        } else {
          setUser(null);
          setStatus('GUEST');
        }
      } catch {
        // Network error or session check failed - treat as guest
        setUser(null);
        setStatus('GUEST');
      } finally {
        setIsInitializing(false);
      }
    };

    checkSession();
  }, [setUser, setStatus]);

  if (isInitializing) {
    return <AuthLoading />;
  }

  return (
    <AuthContext.Provider value={{ isReady: true }}>
      {children}
    </AuthContext.Provider>
  );
}
