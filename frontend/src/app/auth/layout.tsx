/**
 * Auth Layout
 *
 * Layout for authentication pages (/auth/login, /auth/register).
 * Does NOT include main navbar - minimal centered layout.
 */

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
