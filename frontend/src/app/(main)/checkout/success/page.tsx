/**
 * Checkout Success Page
 */

'use client';

import Link from 'next/link';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams?.get('order_id');

  return (
    <div className="container mx-auto px-4 py-16 text-center">
      <div className="max-w-md mx-auto">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg
            className="w-8 h-8 text-green-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-secondary-900 mb-4">
          Pesanan Berhasil!
        </h1>
        <p className="text-secondary-600 mb-8">
          Terima kasih atas pesanan Anda. Pesanan Anda sedang diproses.
        </p>

        {orderId && (
          <Link
            href={`/orders/${orderId}`}
            className="inline-block px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors mb-4"
          >
            Lihat Pesanan
          </Link>
        )}

        <div>
          <Link href="/orders" className="text-primary-600 hover:text-primary-700">
            Lihat Semua Pesanan
          </Link>
        </div>

        <div className="mt-8">
          <Link
            href="/"
            className="text-secondary-600 hover:text-secondary-900"
          >
            Lanjutkan Belanja
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-16 text-center">Memuat...</div>}>
      <SuccessContent />
    </Suspense>
  );
}
