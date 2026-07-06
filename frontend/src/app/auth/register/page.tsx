/**
 * Register Page
 *
 * New user registration page.
 */

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
          href="/auth/login"
          className="text-primary-600 hover:text-primary-700 font-medium"
        >
          Masuk di sini
        </Link>
      </p>
    </div>
  );
}
