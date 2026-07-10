'use client';

/**
 * Login Page Redirect
 * Redirects /login to /auth/login
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/auth/login');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full" />
    </div>
  );
}
