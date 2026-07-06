import { Metadata } from 'next';
import Link from 'next/link';
import { CheckCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Order Created - Pasaria',
  description: 'Your order has been created successfully',
};

interface PageProps {
  searchParams: Promise<{ order_id?: string }>;
}

export default async function OrderCreatedRoute({ searchParams }: PageProps) {
  const params = await searchParams;
  const orderId = params.order_id || 'Unknown';

  return (
    <main className="min-h-screen bg-secondary-50">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-lg mx-auto text-center">
          {/* Success Icon */}
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-secondary-900 mb-2">
            Pesanan Dibuat!
          </h1>
          <p className="text-secondary-600 mb-6">
            Pesanan Anda telah dibuat dan menunggu pembayaran. Silakan selesaikan pembayaran sesuai instruksi.
          </p>

          {/* Order ID */}
          <div className="bg-white rounded-xl border border-secondary-200 p-4 mb-8">
            <p className="text-sm text-secondary-500">Nomor Pesanan</p>
            <p className="text-lg font-semibold text-secondary-900">
              #{orderId}
            </p>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Link
              href={`/orders/${orderId}`}
              className="block w-full py-3 px-4 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
            >
              Lihat Detail Pesanan
            </Link>
            <Link
              href="/products"
              className="block w-full py-3 px-4 bg-white border border-secondary-200 text-secondary-700 font-medium rounded-lg hover:bg-secondary-50 transition-colors"
            >
              Lanjutkan Belanja
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
