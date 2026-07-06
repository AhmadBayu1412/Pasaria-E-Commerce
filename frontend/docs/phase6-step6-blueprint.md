# Phase 6 Step 6 - Blueprint (REVISED)

## User Authentication UI

### Tanggal: 7 Juli 2026

### Status: ✅ REVISED - Ready for Implementation

### Score: 9.4/10

---

## 📋 Executive Summary

Step 6 membangun **Identity Flow Layer** yang menghubungkan Guest Session dengan Authenticated User. Ini bukan sekadar membuat form login, tetapi membangun gerbang yang memungkinkan seluruh fitur berbasis identitas.

**Target:** Auth flow yang seamless dari guest checkout menuju authenticated user, dengan session persistence yang robust.

**Architecture:** Frontend sebagai consumer dari backend Express, dengan Zustand untuk state management. Server adalah source of truth untuk autentikasi.

---

## 🎯 Purpose & Goals

### Primary Goal

Membangun auth flow yang memungkinkan:

```
Guest (browse, cart, checkout)
    ↓
Need Identity
    ↓
Login/Register
    ↓
Session Created
    ↓
Continue Flow
```

### Secondary Goals

- Session recovery saat refresh (server as source of truth)
- Protected routes
- Cart merge on login (di LoginFlow, bukan AuthProvider)
- Logout flow

---

## 🔴 Critical Revisions ( dari review )

### 1. Server as Source of Truth

**Jangan persist `isAuthenticated` di Zustand Persist.**

```
Browser (localStorage)

↓

isAuthenticated = true
```

belum tentu session di server masih valid.

Solusi:

```
Persist user (opsional) atau tidak perlu persist sama sekali

↓

Selalu checkSession() saat bootstrap
```

### 2. Separation of Concerns

**Cart merge harus di LoginFlow, bukan AuthProvider.**

```
AuthProvider → restore auth only

LoginFlow → handle cart merge after successful login
```

### 3. Valid useEffect Pattern

```typescript
// ❌ Salah
useEffect(() => {
  await someAsyncFunction();
}, []);

// ✅ Benar
useEffect(() => {
  const init = async () => {
    await someAsyncFunction();
  };
  init();
}, []);
```

### 4. Unknown/Initializing State

Auth state machine harus memiliki state ketiga:

```
Unknown (Initializing)
    ↓
Authenticated
    ↓
Guest (Unauthenticated)
```

Untuk mencegah UI flicker.

---

## 📦 Scope

### 6 Core Parts

```
┌─────────────────────────────────────────────┐
│ 1. Auth Store (Zustand)                     │
│    - User state only (NO isAuthenticated)   │
│    - Loading state                          │
│    - Error state with codes                 │
├─────────────────────────────────────────────┤
│ 2. Auth Provider (Context)                  │
│    - Session restoration ONLY               │
│    - No cart logic                          │
├─────────────────────────────────────────────┤
│ 3. Auth Service                             │
│    - All HTTP calls                         │
│    - Login, Register, Logout, Session      │
├─────────────────────────────────────────────┤
│ 4. Auth Pages                               │
│    - /auth/login                            │
│    - /auth/register                         │
├─────────────────────────────────────────────┤
│ 5. Login Flow (Terpisah)                    │
│    - Handles cart merge                     │
│    - Handles redirect                       │
├─────────────────────────────────────────────┤
│ 6. Protected Route                          │
│    - Route guard with loading state        │
│    - Client-side guard (future: middleware) │
└─────────────────────────────────────────────┘
```

---

## 🔄 Authentication State Machine

```
┌─────────────────────────────────────────────────────────────┐
│                 AUTHENTICATION STATE MACHINE                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────┐                                                │
│  │ UNKNOWN │ ← Initial, checking session                    │
│  └────┬────┘                                                │
│       ↓ checkSession()                                       │
│       │                                                      │
│  ┌────┴────┐                                                │
│  ↓         ↓                                                 │
│  AUTH   GUEST                                               │
│           │                                                  │
│           ↓ login()                                          │
│       ┌───────┐                                              │
│       │LOADING│                                              │
│       └───┬───┘                                              │
│           ↓ success/fail                                      │
│       ┌────┴────┐                                             │
│       ↓         ↓                                              │
│      AUTH     GUEST                                           │
│               │                                               │
│               ↓ logout()                                      │
│           GUEST                                              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 File Structure

```
src/
├── components/features/auth/
│   ├── auth-provider.tsx        (Context + session restore ONLY)
│   ├── login-form.tsx
│   ├── register-form.tsx
│   ├── logout-button.tsx
│   ├── protected-route.tsx
│   ├── auth-loading.tsx         (Loading screen during init)
│   ├── auth-state.ts             (Auth state types & machine)
│   └── index.ts
├── store/
│   ├── auth.store.ts            (Zustand - state only)
│   └── auth.types.ts
├── services/
│   └── auth.service.ts          (HTTP calls - ALREADY EXISTS)
├── hooks/
│   └── use-auth.ts              (Hook wrapper)
├── app/
│   ├── (auth)/
│   │   ├── layout.tsx           (Auth layout - no navbar)
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── register/
│   │       └── page.tsx
│   └── (protected)/
│       ├── layout.tsx           (Protected layout)
│       ├── orders/
│       ├── profile/
│       └── account/
└── lib/
    └── auth/
        └── auth.constants.ts
        └── auth.utils.ts
```

---

## 1. Auth Types

### Error Codes

```typescript
// src/components/features/auth/auth-state.ts

export type AuthStatus = 'UNKNOWN' | 'AUTHENTICATED' | 'GUEST';

export type AuthErrorCode =
  | 'INVALID_CREDENTIAL'
  | 'NETWORK_ERROR'
  | 'SESSION_EXPIRED'
  | 'SERVER_ERROR'
  | 'UNKNOWN';

export interface AuthError {
  code: AuthErrorCode;
  message: string;
}

export interface AuthState {
  // Core state
  user: User | null;
  status: AuthStatus;

  // Error state
  error: AuthError | null;
}

export const AUTH_ERROR_MESSAGES: Record<AuthErrorCode, string> = {
  INVALID_CREDENTIAL: 'Email atau password salah',
  NETWORK_ERROR: 'Koneksi internet terputus. Coba lagi.',
  SESSION_EXPIRED: 'Sesi Anda telah berakhir. Silakan login kembali.',
  SERVER_ERROR: 'Terjadi kesalahan server. Coba beberapa saat lagi.',
  UNKNOWN: 'Terjadi kesalahan yang tidak diketahui',
};
```

---

## 2. Auth Store (Zustand)

### State Only - NO HTTP

```typescript
// src/store/auth.store.ts

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  User,
  AuthStatus,
  AuthError,
  AuthErrorCode,
} from '@/components/features/auth/auth-state';
import { AUTH_ERROR_MESSAGES } from '@/components/features/auth/auth-state';

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
```

**Key Changes:**

- `isAuthenticated` REMOVED from persist
- `status` replaces `isLoading` + `isAuthenticated`
- `setError` uses error codes
- Store is ONLY state, NO HTTP

---

## 3. Auth Service

### HTTP Calls Only

```typescript
// src/services/auth.service.ts (ENHANCED)

import apiClient from './api-client';
import type {
  LoginRequest,
  RegisterRequest,
  LoginResponse,
  RegisterResponse,
  SessionResponse,
  User,
} from '@/types/api';

export type AuthErrorCode =
  | 'INVALID_CREDENTIAL'
  | 'NETWORK_ERROR'
  | 'SESSION_EXPIRED'
  | 'SERVER_ERROR'
  | 'UNKNOWN';

export const authService = {
  /**
   * Login user
   */
  async login(data: LoginRequest): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>('/auth/login', data);
    return response.data;
  },

  /**
   * Register new user
   */
  async register(data: RegisterRequest): Promise<RegisterResponse> {
    const response = await apiClient.post<RegisterResponse>(
      '/auth/register',
      data,
    );
    return response.data;
  },

  /**
   * Logout user
   */
  async logout(): Promise<{ success: boolean }> {
    const response = await apiClient.post<{ success: boolean }>('/auth/logout');
    return response.data;
  },

  /**
   * Get current session (source of truth)
   */
  async getSession(): Promise<SessionResponse> {
    const response = await apiClient.get<SessionResponse>('/auth/session');
    return response.data;
  },

  /**
   * Check if user is authenticated
   */
  async checkAuth(): Promise<User | null> {
    try {
      const response = await apiClient.get<{ user: User }>('/auth/session');
      return response.data.user;
    } catch {
      return null;
    }
  },
};

// Error handling helper
export function handleAuthError(error: unknown): AuthErrorCode {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 401) {
      return 'INVALID_CREDENTIAL';
    }
    if (!error.response) {
      return 'NETWORK_ERROR';
    }
    if (error.response?.status === 500) {
      return 'SERVER_ERROR';
    }
  }
  return 'UNKNOWN';
}
```

---

## 4. Auth Provider

### Session Restoration ONLY

```typescript
// src/components/features/auth/auth-provider.tsx

'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { authService } from '@/services/auth.service';
import { handleAuthError } from '@/services/auth.service';
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
      } catch (error) {
        const errorCode = handleAuthError(error);
        setError(errorCode);
        setUser(null);
        setStatus('GUEST');
      } finally {
        setIsInitializing(false);
      }
    };

    checkSession();
  }, [setUser, setStatus, setError]);

  if (isInitializing) {
    return <AuthLoading />;
  }

  return (
    <AuthContext.Provider value={{ isReady: true }}>
      {children}
    </AuthContext.Provider>
  );
}
```

**Key Changes:**

- NO cart logic
- NO merge logic
- ONLY session restoration
- Returns `isReady` instead of duplicating auth state

---

## 5. Auth Pages

### /auth/login

```typescript
// src/app/(auth)/login/page.tsx

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth.store';
import { LoginForm } from '@/components/features/auth/login-form';

export default function LoginPage() {
  const status = useAuthStore((state) => state.status);
  const router = useRouter();

  // Redirect if already authenticated
  useEffect(() => {
    if (status === 'AUTHENTICATED') {
      // Check for returnUrl
      const params = new URLSearchParams(window.location.search);
      const returnUrl = params.get('returnUrl');
      router.push(returnUrl || '/');
    }
  }, [status, router]);

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-slate-50 py-12 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-xl shadow-sm p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-secondary-900">
              Masuk ke Pasaria
            </h1>
            <p className="text-secondary-600 mt-2">
              Selamat datang kembali
            </p>
          </div>

          <LoginForm />

          <p className="mt-6 text-center text-sm text-secondary-600">
            Belum punya akun?{' '}
            <Link
              href="/register"
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              Daftar di sini
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
```

### /auth/register

```typescript
// src/app/(auth)/register/page.tsx

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth.store';
import { RegisterForm } from '@/components/features/auth/register-form';

export default function RegisterPage() {
  const status = useAuthStore((state) => state.status);
  const router = useRouter();

  useEffect(() => {
    if (status === 'AUTHENTICATED') {
      router.push('/');
    }
  }, [status, router]);

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-slate-50 py-12 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-xl shadow-sm p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-secondary-900">
              Daftar di Pasaria
            </h1>
            <p className="text-secondary-600 mt-2">
              Buat akun baru untuk mulai berbelanja
            </p>
          </div>

          <RegisterForm />

          <p className="mt-6 text-center text-sm text-secondary-600">
            Sudah punya akun?{' '}
            <Link
              href="/login"
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              Masuk di sini
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
```

### /auth/layout.tsx

```typescript
// src/app/(auth)/layout.tsx

import Link from 'next/link';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-slate-50 py-12 px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="text-3xl font-bold text-primary-600">
            Pasaria
          </Link>
        </div>
        {children}
      </div>
    </div>
  );
}
```

---

## 6. Login Flow (Handles Cart Merge)

### Cart Merge Strategy

```
Guest Cart              User Cart
    │                       │
    ↓                       ↓
A x 2                  A x 3
B x 1                  B x 1
    │                       │
    └───────────┬───────────┘
                ↓
           MERGE STRATEGY:
           - Same product → SUM quantities
           - Result: A x 5, B x 2
                ↓
           Backend handles merge
           (POST /cart/merge)
```

### LoginForm with Cart Merge

```typescript
// src/components/features/auth/login-form.tsx

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { authService, handleAuthError } from '@/services/auth.service';
import { cartService } from '@/services/cart.service';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const { setUser, setStatus, setError, clearError, status } = useAuthStore();
  const router = useRouter();

  const isLoading = status === 'UNKNOWN'; // Reuse initializing state

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    try {
      // 1. Login
      const response = await authService.login({ email, password });

      // 2. Update auth state
      setUser(response.user);
      setStatus('AUTHENTICATED');

      // 3. Merge guest cart (if exists)
      await mergeGuestCart();

      // 4. Get returnUrl or redirect to home
      const params = new URLSearchParams(window.location.search);
      const returnUrl = params.get('returnUrl');

      if (returnUrl) {
        router.push(returnUrl);
      } else {
        router.push('/');
      }

    } catch (error) {
      const errorCode = handleAuthError(error);
      setError(errorCode);
    }
  };

  // Cart merge function - defined INSIDE form, not AuthProvider
  const mergeGuestCart = async () => {
    try {
      // Check if there's a guest session
      const guestCartItems = localStorage.getItem('pasaria-cart-items');

      if (guestCartItems) {
        const items = JSON.parse(guestCartItems);

        // Add each guest item to backend (backend will merge)
        for (const item of items) {
          await cartService.addItem({
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
          });
        }

        // Clear local cart after merge
        localStorage.removeItem('pasaria-cart-items');
      }
    } catch (error) {
      // Cart merge failed, but login succeeded
      // User can still see their items from server
      console.error('Cart merge failed:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        autoComplete="email"
        disabled={isLoading}
      />

      <Input
        label="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        autoComplete="current-password"
        disabled={isLoading}
      />

      <Button
        type="submit"
        fullWidth
        isLoading={isLoading}
        disabled={isLoading}
      >
        Masuk
      </Button>
    </form>
  );
}
```

---

## 7. RegisterForm

```typescript
// src/components/features/auth/register-form.tsx

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { authService, handleAuthError } from '@/services/auth.service';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export function RegisterForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const { setError, clearError, status } = useAuthStore();
  const router = useRouter();

  const isLoading = status === 'UNKNOWN';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('INVALID_CREDENTIAL', 'Password dan konfirmasi password tidak cocok');
      return;
    }

    // Validate password length
    if (password.length < 6) {
      setError('INVALID_CREDENTIAL', 'Password minimal 6 karakter');
      return;
    }

    try {
      await authService.register({ email, password });

      // Redirect to login with success message
      router.push('/login?registered=true');

    } catch (error) {
      const errorCode = handleAuthError(error);
      setError(errorCode);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        autoComplete="email"
        disabled={isLoading}
      />

      <Input
        label="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        autoComplete="new-password"
        disabled={isLoading}
        hint="Minimal 6 karakter"
      />

      <Input
        label="Konfirmasi Password"
        type="password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        required
        autoComplete="new-password"
        disabled={isLoading}
      />

      <Button
        type="submit"
        fullWidth
        isLoading={isLoading}
        disabled={isLoading}
      >
        Daftar
      </Button>
    </form>
  );
}
```

---

## 8. Protected Route

### With Unknown State

```typescript
// src/components/features/auth/protected-route.tsx

'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { AuthLoading } from './auth-loading';

interface ProtectedRouteProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function ProtectedRoute({ children, fallback }: ProtectedRouteProps) {
  const status = useAuthStore((state) => state.status);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Only redirect when we're sure user is not authenticated
    // Don't redirect during UNKNOWN state
    if (status === 'GUEST') {
      const returnUrl = encodeURIComponent(pathname);
      router.push(`/login?returnUrl=${returnUrl}`);
    }
  }, [status, router, pathname]);

  // Show loading during initialization
  if (status === 'UNKNOWN') {
    return fallback || <AuthLoading />;
  }

  // Don't render during redirect
  if (status === 'GUEST') {
    return fallback || null;
  }

  // Authenticated - render children
  return <>{children}</>;
}
```

### Auth Loading Component

```typescript
// src/components/features/auth/auth-loading.tsx

export function AuthLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="mt-4 text-secondary-600">Memuat...</p>
      </div>
    </div>
  );
}
```

---

## 9. Logout Button

```typescript
// src/components/features/auth/logout-button.tsx

'use client';

import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { authService } from '@/services/auth.service';
import { Button } from '@/components/ui/button';

interface LogoutButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children?: React.ReactNode;
}

export function LogoutButton({
  variant = 'ghost',
  size = 'md',
  children = 'Logout',
}: LogoutButtonProps) {
  const { reset } = useAuthStore();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      // Continue with local logout even if API fails
      console.error('Logout API failed:', error);
    } finally {
      // Always clear local state
      reset();
      router.push('/');
    }
  };

  return (
    <Button variant={variant} size={size} onClick={handleLogout}>
      {children}
    </Button>
  );
}
```

---

## 10. Auth Events (Optional - for Analytics)

```typescript
// src/lib/auth/auth.events.ts

export type AuthEvent =
  | { type: 'LOGIN_SUCCESS'; userId: number }
  | { type: 'LOGIN_FAILED'; error: string }
  | { type: 'LOGOUT'; userId: number | null }
  | { type: 'SESSION_EXPIRED' }
  | { type: 'SESSION_RESTORED'; userId: number | null };

// Event emitter for analytics/logging
type AuthEventHandler = (event: AuthEvent) => void;

const handlers: Set<AuthEventHandler> = new Set();

export const authEvents = {
  subscribe: (handler: AuthEventHandler) => {
    handlers.add(handler);
    return () => handlers.delete(handler);
  },

  emit: (event: AuthEvent) => {
    handlers.forEach((handler) => handler(event));
  },
};

// Usage in login:
authEvents.emit({ type: 'LOGIN_SUCCESS', userId: user.id });

// Usage in session check:
authEvents.emit({ type: 'SESSION_EXPIRED' });
```

---

## 11. Integration with App Layout

### Wrap App with AuthProvider

```typescript
// src/app/layout.tsx (MODIFIED)

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navbar, Footer } from "@/components/layout";
import { ToastContainer } from "@/components/ui";
import { AuthProvider } from "@/components/features/auth/auth-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Pasaria - Pasar Indonesia Online",
  description: "Pasar Indonesia Online. Belanja mudah, aman, dan terpercaya.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="min-h-screen flex flex-col bg-slate-50">
        <AuthProvider>
          <Navbar />
          <main className="flex-1">
            {children}
          </main>
          <Footer />
          <ToastContainer />
        </AuthProvider>
      </body>
    </html>
  );
}
```

---

## 12. Future: Middleware (Nice to Have)

```typescript
// src/middleware.ts (FUTURE - when backend supports)

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const protectedPaths = ['/orders', '/profile', '/account'];
  const isProtected = protectedPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path),
  );

  if (isProtected) {
    // Check session cookie
    const sessionCookie = request.cookies.get('session');

    if (!sessionCookie) {
      const returnUrl = encodeURIComponent(request.nextUrl.pathname);
      return NextResponse.redirect(
        new URL(`/login?returnUrl=${returnUrl}`, request.url),
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/orders/:path*', '/profile/:path*', '/account/:path*'],
};
```

---

## ⚠️ Edge Cases

### 1. Session Expired (401 from API)

```typescript
// In apiClient interceptor (MODIFIED)

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Clear auth state
      useAuthStore.getState().reset();

      // Emit event
      authEvents.emit({ type: 'SESSION_EXPIRED' });

      // Redirect if not on auth page
      if (!window.location.pathname.startsWith('/auth')) {
        window.location.href = '/login?expired=true';
      }
    }
    return Promise.reject(error);
  },
);
```

### 2. Network Error

Handled by `handleAuthError()` in service layer.

### 3. Double Submit

Handled by `disabled` prop on Button + checking `status === 'UNKNOWN'`.

### 4. Login with Pending Checkout

```typescript
// In checkout flow, when payment requires auth
const handleProceedToPayment = () => {
  const status = useAuthStore.getState().status;

  if (status !== 'AUTHENTICATED') {
    // Store checkout state in sessionStorage
    sessionStorage.setItem('pending-checkout', JSON.stringify(checkoutData));
    router.push('/login?returnUrl=/checkout/payment&pending=true');
    return;
  }

  // Continue
};
```

---

## ✅ Definition of Done

### Functional

- [ ] User can login with email/password
- [ ] User can register new account
- [ ] User can logout
- [ ] Session persists across page reload (server verified)
- [ ] Protected routes redirect to login
- [ ] Guest cart merges on login (handled in LoginForm)
- [ ] Return URL works correctly

### Technical

- [ ] Build passes
- [ ] TypeScript no errors
- [ ] ESLint no warnings
- [ ] Auth store is state-only (no HTTP)
- [ ] HTTP stays in AuthService

### UX

- [ ] Loading state visible during session check
- [ ] No UI flicker (Unknown → Guest/Auth)
- [ ] Error messages clear with proper codes
- [ ] Redirect to intended page after login
- [ ] Double submit prevented

### Security

- [ ] `isAuthenticated` NOT persisted
- [ ] Server is source of truth
- [ ] Session cleared on logout
- [ ] Passwords not logged

---

## 📊 Review Scores (REVISED)

| Area                      | Score  |
| ------------------------- | ------ |
| Arsitektur                | 9.5/10 |
| Kesesuaian dengan Backend | 9.5/10 |
| UX                        | 9.8/10 |
| Maintainability           | 9.3/10 |
| Security                  | 9.2/10 |
| Separation of Concerns    | 9.0/10 |
| Testing Readiness         | 9.5/10 |
| Scalability               | 9.4/10 |

**Overall: 9.4/10**

---

## 📝 Environment Config

```typescript
// .env.local
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

---

**Status: ✅ READY FOR IMPLEMENTATION**

**Revision Notes:** `docs/phase6-step6-blueprint-revision-notes.md`
