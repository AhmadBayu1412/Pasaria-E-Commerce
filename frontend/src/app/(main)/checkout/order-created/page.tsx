/**
 * Order Created Page
 */

import Link from 'next/link';

export default function OrderCreatedPage() {
  return (
    <div className="container mx-auto px-4 py-16 text-center">
      <div className="max-w-md mx-auto">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-secondary-900 mb-4">
          Pesanan Dibuat!
        </h1>
        <p className="text-secondary-600 mb-8">
          Pesanan Anda telah berhasil dibuat dan sedang menunggu pembayaran.
        </p>
        <Link
          href="/"
          className="inline-block px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          Lanjutkan Belanja
        </Link>
      </div>
    </div>
  );
}
