'use client';

/**
 * Order Empty State Component
 */

import Link from 'next/link';
import { Package, Clock, RefreshCw, Truck, CheckCircle, XCircle, ShoppingBag } from 'lucide-react';

interface OrderEmptyProps {
  activeTab?: string;
}

const EMPTY_MESSAGES: Record<string, { icon: React.ReactNode; title: string; description: string }> = {
  all: {
    icon: <Package className="w-12 h-12" />,
    title: 'Belum Ada Pesanan',
    description: 'Yuk mulai belanja dan buat pesanan pertamamu!',
  },
  pending: {
    icon: <Clock className="w-12 h-12" />,
    title: 'Tidak Ada Pesanan Menunggu Pembayaran',
    description: 'Pesanan yang belum dibayar akan muncul di sini.',
  },
  processing: {
    icon: <RefreshCw className="w-12 h-12" />,
    title: 'Tidak Ada Pesanan Diproses',
    description: 'Pesanan yang sedang diproses akan muncul di sini.',
  },
  shipped: {
    icon: <Truck className="w-12 h-12" />,
    title: 'Tidak Ada Pesanan Dikirim',
    description: 'Pesanan yang sedang dikirim akan muncul di sini.',
  },
  completed: {
    icon: <CheckCircle className="w-12 h-12" />,
    title: 'Belum Ada Pesanan Selesai',
    description: 'Pesanan yang sudah selesai akan muncul di sini.',
  },
  cancelled: {
    icon: <XCircle className="w-12 h-12" />,
    title: 'Tidak Ada Pesanan Dibatalkan',
    description: 'Pesanan yang dibatalkan akan muncul di sini.',
  },
};

export function OrderEmpty({ activeTab = 'all' }: OrderEmptyProps) {
  const config = EMPTY_MESSAGES[activeTab] || EMPTY_MESSAGES.all;

  return (
    <div className="bg-white rounded-xl border border-secondary-200 p-12 text-center">
      <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-secondary-100 flex items-center justify-center text-secondary-400">
        {config.icon}
      </div>
      <h3 className="text-xl font-semibold text-secondary-900 mb-2">
        {config.title}
      </h3>
      <p className="text-secondary-500 mb-8 max-w-sm mx-auto">
        {config.description}
      </p>
      {activeTab === 'all' && (
        <Link
          href="/products"
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition-colors"
        >
          <ShoppingBag className="w-5 h-5" />
          Mulai Belanja
        </Link>
      )}
    </div>
  );
}
