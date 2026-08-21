/**
 * Protected Route Component
 *
 * Guards routes that require authentication.
 * - Shows loading during initialization
 * - Redirects to login if not authenticated
 * - Renders children only when authenticated
 */

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
      const returnUrl = encodeURIComponent(pathname || '/');
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
