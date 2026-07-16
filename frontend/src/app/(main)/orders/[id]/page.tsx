'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Order } from '@/types/api';
import {
  orderService,
  OrderError,
  handleOrderError,
} from '@/services/order.service';
import { OrderDetail, OrderError as OrderErrorComponent } from '@/components/features/orders';
import { Button } from '@/components/ui/button';
import { useUIStore } from '@/store/ui-store';

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = Number(params.id);
  const addToast = useUIStore((state) => state.addToast);

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<OrderError | null>(null);

  const fetchOrder = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await orderService.getOrderById(orderId);
      setOrder(data);
    } catch (err) {
      setError(handleOrderError(err));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!orderId) return;
    fetchOrder();
  }, [orderId]);

  // Handle return item
  const handleReturnItem = (orderId: number, itemId: string) => {
    // For now, just show a toast notification
    // In a real implementation, this would call an API
    addToast({
      type: 'success',
      title: 'Pengajuan Return',
      message: 'Item berhasil ditandai untuk pengembalian.',
    });

    // Refresh the order data
    fetchOrder();
  };

  if (isLoading) {
    return (
      <div className="bg-secondary-50 min-h-screen">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-32 bg-secondary-200 rounded" />
            <div className="h-64 bg-secondary-200 rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="bg-secondary-50 min-h-screen">
        <div className="max-w-4xl mx-auto px-4 py-8 text-center">
          <OrderErrorComponent
            error={error || OrderError.NOT_FOUND}
            onRetry={() => {
              setError(null);
              fetchOrder();
            }}
          />
          <div className="mt-4">
            <Link href="/orders">
              <Button variant="outline">Kembali ke Daftar Pesanan</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-secondary-50 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <OrderDetail order={order} onReturnItem={handleReturnItem} />
      </div>
    </div>
  );
}
