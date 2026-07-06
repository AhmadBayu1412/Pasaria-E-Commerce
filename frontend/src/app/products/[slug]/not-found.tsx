import Link from 'next/link';
import { Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        <div className="text-8xl font-bold text-secondary-200 mb-4">404</div>
        <h1 className="text-2xl font-bold text-secondary-900 mb-2">
          Produk Tidak Ditemukan
        </h1>
        <p className="text-secondary-600 mb-8">
          Maaf, produk yang Anda cari tidak tersedia atau sudah tidak aktif.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link
            href="/products"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Lihat Produk Lain
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 border border-secondary-300 text-secondary-700 rounded-lg hover:bg-secondary-50 transition-colors"
          >
            <Home className="w-4 h-4" />
            Beranda
          </Link>
        </div>
      </div>
    </div>
  );
}
