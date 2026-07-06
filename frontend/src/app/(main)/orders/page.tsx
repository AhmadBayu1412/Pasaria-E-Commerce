'use client';

import { useEffect } from 'react';
import { useOrderStore, orderStoreActions } from '@/store/order.store';
import {
  orderService,
  OrderError,
  handleOrderError,
} from '@/services/order.service';
import { OrderList, OrderError as OrderErrorComponent } from '@/components/features/orders';
import { Pagination } from '@/components/ui/pagination';

export default function OrdersPage() {
  const { orders, page, totalPages, isLoading, error } = useOrderStore();

  const fetchOrders = async (pageNum: number = 1) => {
    orderStoreActions.setLoading(true);
    orderStoreActions.clearError();

    try {
      const response = await orderService.getOrders(pageNum);
      orderStoreActions.setOrders(response.items, {
        page: response.page,
        totalPages: response.totalPages,
        totalItems: response.total,
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
  }, []);

  if (error) {
    return (
      <OrderErrorComponent error={error} onRetry={() => fetchOrders(1)} />
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-secondary-900 mb-6">
        Daftar Pesanan
      </h1>

      <OrderList orders={orders} isLoading={isLoading} />

      {orders.length > 0 && (
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
  );
}
