/**
 * Login Page
 *
 * User login page with redirect support.
 */

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

  // Show success message if registered
  const params = typeof window !== 'undefined' 
    ? new URLSearchParams(window.location.search) 
    : null;
  const registered = params?.get('registered') === 'true';

  return (
    <div className="bg-white rounded-xl shadow-sm p-8">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-secondary-900">
          Masuk ke Pasaria
        </h1>
        <p className="text-secondary-600 mt-2">
          Selamat datang kembali
        </p>
      </div>

      {registered && (
        <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-lg text-sm">
          Registrasi berhasil! Silakan masuk dengan akun Anda.
        </div>
      )}

      <LoginForm />

      <p className="mt-6 text-center text-sm text-secondary-600">
        Belum punya akun?{' '}
        <Link
          href="/auth/register"
          className="text-primary-600 hover:text-primary-700 font-medium"
        >
          Daftar di sini
        </Link>
      </p>
    </div>
  );
}
