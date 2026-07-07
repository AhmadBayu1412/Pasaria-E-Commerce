'use client';

import Link from 'next/link';
import { AlertCircle, RefreshCw } from 'lucide-react';

/**
 * Global Error Boundary
 * Shown when an unexpected error occurs
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full mx-4 text-center">
        <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Terjadi Kesalahan
        </h1>
        <p className="text-gray-500 mb-6">
          Kami mohon maaf, terjadi kesalahan yang tidak terduga.
          Silakan coba lagi atau hubungi tim kami.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700
                       rounded-lg font-medium hover:bg-gray-200 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Coba Lagi
          </button>
          <Link
            href="/"
            className="px-6 py-3 bg-primary-600 text-white rounded-lg font-medium
                       hover:bg-primary-700 transition-colors"
          >
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    </div>
  );
}
