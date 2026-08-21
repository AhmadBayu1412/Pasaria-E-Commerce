'use client';

/**
 * Orders Page - Shopee-style design
 * Route: /orders
 */

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, Package, Clock, Truck, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useOrderStore, orderStoreActions } from '@/store/order.store';
import { orderService, handleOrderError } from '@/services/order.service';
import { OrderCard } from '@/components/features/orders/order-card';
import { OrderEmpty } from '@/components/features/orders/order-empty';
import { OrderLoading } from '@/components/features/orders/order-loading';
import { Pagination } from '@/components/ui/pagination';
import type { OrderStatus } from '@/types/api';

type OrderTab = 'all' | 'pending' | 'processing' | 'shipped' | 'completed' | 'cancelled';

const TABS: { id: OrderTab; label: string; icon: React.ReactNode }[] = [
  { id: 'all', label: 'Semua', icon: <Package className="w-4 h-4" /> },
  { id: 'pending', label: 'Belum Bayar', icon: <Clock className="w-4 h-4" /> },
  { id: 'processing', label: 'Diproses', icon: <RefreshCw className="w-4 h-4" /> },
  { id: 'shipped', label: 'Dikirim', icon: <Truck className="w-4 h-4" /> },
  { id: 'completed', label: 'Selesai', icon: <CheckCircle className="w-4 h-4" /> },
  { id: 'cancelled', label: 'Dibatalkan', icon: <XCircle className="w-4 h-4" /> },
];

function OrdersPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = (searchParams?.get('tab') as OrderTab) || null;

  const { orders, page, totalPages, isLoading, error } = useOrderStore();
  const [activeTab, setActiveTab] = useState<OrderTab>(tabParam || 'all');
  const [searchQuery, setSearchQuery] = useState('');

  // Map tab to backend status filter
  const getStatusFilter = (tab: OrderTab): string | string[] | undefined => {
    switch (tab) {
      case 'pending': return 'WAITING_PAYMENT';
      case 'processing': return 'PROCESSING'; // Only PROCESSING, not SHIPPING
      case 'shipped': return 'DELIVERED';
      case 'completed': return 'COMPLETED';
      case 'cancelled': return 'CANCELLED';
      default: return undefined;
    }
  };

  const fetchOrders = async (pageNum: number = 1) => {
    orderStoreActions.setLoading(true);
    orderStoreActions.clearError();

    try {
      // Get status filter based on active tab
      const status = getStatusFilter(activeTab);

      // Get orders with status filter from backend
      const response = await orderService.getOrders({
        page: pageNum,
        status: status as OrderStatus | undefined,
      });

      orderStoreActions.setOrders(response.items, {
        page: response.pagination.page,
        totalPages: response.pagination.totalPages,
        totalItems: response.pagination.totalItems,
      });
    } catch (err) {
      orderStoreActions.setError(handleOrderError(err));
    } finally {
      orderStoreActions.setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // Update URL when tab changes
  const handleTabChange = (tab: OrderTab) => {
    setActiveTab(tab);
    const url = tab === 'all' ? '/orders' : `/orders?tab=${tab}`;
    router.push(url, { scroll: false });
  };

  // Handle status update from OrderCard
  const handleStatusUpdate = (orderId: number, newStatus: OrderStatus) => {
    // Update local state
    orderStoreActions.updateOrderStatus(orderId, newStatus);
  };

  // Filter orders locally for search
  const filteredOrders = orders.filter(order => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      order.id.toString().includes(query) ||
      order.items.some(item =>
        item.productName.toLowerCase().includes(query)
      )
    );
  });

  if (error) {
    return (
      <div className="min-h-screen bg-secondary-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white rounded-xl border border-secondary-200 p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-xl font-semibold text-secondary-900 mb-2">
              Gagal Memuat Pesanan
            </h2>
            <p className="text-secondary-500 mb-6">{error}</p>
            <button
              onClick={() => fetchOrders(1)}
              className="px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
            >
              Coba Lagi
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary-50">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-secondary-900">Pesanan Saya</h1>
          <p className="text-secondary-500 text-sm mt-1">
            Lihat dan kelola pesanan Anda
          </p>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-xl border border-secondary-200 p-3 mb-6">
          <div className="flex items-center gap-3">
            <Search className="w-5 h-5 text-secondary-400" />
            <input
              type="text"
              placeholder="Cari berdasarkan Nama Produk, No. Pesanan"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 outline-none text-secondary-900 placeholder:text-secondary-400"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl border border-secondary-200 overflow-hidden mb-6">
          <div className="flex overflow-x-auto scrollbar-hide">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-5 py-4 font-medium whitespace-nowrap transition-colors border-b-2',
                  activeTab === tab.id
                    ? 'text-primary-600 border-primary-600'
                    : 'text-secondary-500 border-transparent hover:text-secondary-900 hover:bg-secondary-50'
                )}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Orders List */}
        {isLoading ? (
          <OrderLoading />
        ) : (
          <>
            {filteredOrders.length === 0 ? (
              <OrderEmpty activeTab={activeTab} />
            ) : (
              <div className="space-y-4">
                {filteredOrders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    variant="shopee"
                    onStatusUpdate={handleStatusUpdate}
                    onRefresh={() => fetchOrders(1)}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* Pagination */}
        {filteredOrders.length > 0 && (
          <div className="mt-6">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              totalItems={0}
              onPageChange={(newPage) => fetchOrders(newPage)}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default function OrdersPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-secondary-50">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-secondary-200 rounded w-48" />
            <div className="h-12 bg-secondary-200 rounded" />
            <div className="h-14 bg-secondary-200 rounded" />
            <div className="h-64 bg-secondary-200 rounded-xl" />
          </div>
        </div>
      </div>
    }>
      <OrdersPageContent />
    </Suspense>
  );
}
