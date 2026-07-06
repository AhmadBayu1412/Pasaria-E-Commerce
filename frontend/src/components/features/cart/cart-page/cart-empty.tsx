'use client';

/**
 * Cart Empty Component
 */

import { useRouter } from 'next/navigation';
import { ShoppingCart } from 'lucide-react';

export function CartEmpty() {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      {/* Icon */}
      <div className="w-24 h-24 rounded-full bg-secondary-100 flex items-center justify-center mb-6">
        <ShoppingCart className="w-12 h-12 text-secondary-400" aria-hidden="true" />
      </div>

      {/* Text */}
      <h2 className="text-2xl font-semibold text-secondary-900 mb-2">
        Keranjang Belanja Kosong
      </h2>
      <p className="text-secondary-500 text-center mb-8 max-w-md">
        Sepertinya Anda belum menambahkan barang apapun ke keranjang belanja. 
        Jelajahi produk kami dan temukan barang yang Anda butuhkan.
      </p>

      {/* CTA Button */}
      <button
        onClick={() => router.push('/products')}
        className="px-8 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
      >
        Mulai Belanja
      </button>
    </div>
  );
}
