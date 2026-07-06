/**
 * Register Form Component
 *
 * Handles new user registration.
 */

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

  const { setError, clearError, status, error } = useAuthStore();
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
      router.push('/auth/login?registered=true');
    } catch (err) {
      const errorCode = handleAuthError(err);
      setError(errorCode);
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
        autoComplete="new-password"
        disabled={isLoading}
      />

      <p className="text-sm text-secondary-500 -mt-2">Minimal 6 karakter</p>

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
        className="w-full"
        isLoading={isLoading}
        disabled={isLoading}
      >
        Daftar
      </Button>
    </form>
  );
}
