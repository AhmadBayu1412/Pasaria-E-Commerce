/**
 * Login Form Component
 *
 * Handles user login with email/password.
 * - Updates auth state on success
 * - Merges guest cart after login
 * - Handles redirect with returnUrl
 */

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

  const { setUser, setStatus, setError, clearError, status, error } = useAuthStore();
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
    } catch (err) {
      const errorCode = handleAuthError(err);
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
    } catch (mergeError) {
      // Cart merge failed, but login succeeded
      // User can still see their items from server
      console.error('Cart merge failed:', mergeError);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error.message}</p>
        </div>
      )}

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
        className="w-full"
        isLoading={isLoading}
        disabled={isLoading}
      >
        Masuk
      </Button>
    </form>
  );
}
