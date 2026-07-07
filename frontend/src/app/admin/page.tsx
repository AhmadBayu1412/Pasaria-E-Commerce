'use client';

import Link from 'next/link';
import { StatCard } from '@/components/ui/stat-card';
import { ActivityFeed } from '@/components/ui/activity-feed';
import { formatCurrency } from '@/lib/utils/currency';

// Static mock data
const stats = {
  pendingOrders: 12,
  todayRevenue: 2500000,
  lowStockCount: 5,
  failedPayments: 1,
};

const activities = [
  {
    id: '1',
    type: 'order' as const,
    action: 'membuat pesanan',
    actor: { id: 1, name: 'John Doe' },
    target: { id: 123, name: 'Order #123' },
    timestamp: '2026-07-07T06:00:00.000Z',
  },
  {
    id: '2',
    type: 'product' as const,
    action: 'memperbarui',
    actor: { id: 2, name: 'Admin' },
    target: { id: 1, name: 'Produk A' },
    timestamp: '2026-07-07T05:45:00.000Z',
  },
  {
    id: '3',
    type: 'user' as const,
    action: 'mendaftar',
    actor: { id: 3, name: 'Jane Doe' },
    timestamp: '2026-07-07T05:30:00.000Z',
  },
];

const lowStockProducts = [
  { id: 1, name: 'Produk A', stock: 2 },
  { id: 2, name: 'Produk B', stock: 1 },
  { id: 3, name: 'Produk C', stock: 3 },
];

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-secondary-900">Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Pesanan Pending"
          value={stats.pendingOrders}
          icon="🛒"
          variant="warning"
        />
        <StatCard
          title="Revenue Hari Ini"
          value={formatCurrency(stats.todayRevenue)}
          icon="💰"
          variant="default"
        />
        <StatCard
          title="Stok Rendah"
          value={stats.lowStockCount}
          icon="⚠️"
          variant="danger"
        />
        <StatCard
          title="Pembayaran Gagal"
          value={stats.failedPayments}
          icon="❌"
          variant="danger"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white rounded-lg border border-secondary-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Aktivitas Terbaru</h2>
            <Link href="/admin/activity" className="text-sm text-primary-600 hover:underline">
              Lihat Semua
            </Link>
          </div>
          <ActivityFeed activities={activities} />
        </div>

        {/* Low Stock Alert */}
        <div className="bg-white rounded-lg border border-secondary-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Stok Rendah</h2>
            <Link href="/admin/products?stock=low" className="text-sm text-primary-600 hover:underline">
              Lihat Semua
            </Link>
          </div>
          <div className="space-y-3">
            {lowStockProducts.map((product) => (
              <div
                key={product.id}
                className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg"
              >
                <span className="font-medium text-secondary-900">{product.name}</span>
                <span className="text-yellow-700 font-semibold">
                  {product.stock} unit
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          href="/admin/orders?status=PENDING"
          className="bg-white rounded-lg border border-secondary-200 p-6 hover:border-primary-300 hover:shadow-md transition-all"
        >
          <h3 className="font-semibold text-secondary-900 mb-2">Pesanan Pending</h3>
          <p className="text-sm text-secondary-600">
            {stats.pendingOrders} pesanan menunggu konfirmasi
          </p>
        </Link>
        <Link
          href="/admin/products/new"
          className="bg-white rounded-lg border border-secondary-200 p-6 hover:border-primary-300 hover:shadow-md transition-all"
        >
          <h3 className="font-semibold text-secondary-900 mb-2">Tambah Produk</h3>
          <p className="text-sm text-secondary-600">
            Tambahkan produk baru ke toko
          </p>
        </Link>
        <Link
          href="/admin/users"
          className="bg-white rounded-lg border border-secondary-200 p-6 hover:border-primary-300 hover:shadow-md transition-all"
        >
          <h3 className="font-semibold text-secondary-900 mb-2">Kelola Pengguna</h3>
          <p className="text-sm text-secondary-600">
            Lihat dan kelola akun pengguna
          </p>
        </Link>
      </div>
    </div>
  );
}
