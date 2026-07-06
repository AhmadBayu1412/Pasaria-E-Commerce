'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import type { Order } from '@/types/api';
import {
  orderService,
  OrderError,
  handleOrderError,
} from '@/services/order.service';
import { OrderDetail, OrderError as OrderErrorComponent } from '@/components/features/orders';
import { Button } from '@/components/ui/button';

export default function OrderDetailPage() {
  const params = useParams();
  const orderId = Number(params.id);

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<OrderError | null>(null);

  useEffect(() => {
    if (!orderId) return;

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

    fetchOrder();
  }, [orderId]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-32 bg-secondary-200 rounded" />
          <div className="h-64 bg-secondary-200 rounded-lg" />
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <OrderErrorComponent
          error={error || OrderError.NOT_FOUND}
          onRetry={() => {
            setError(null);
            orderService.getOrderById(orderId).then(setOrder).catch(handleOrderError);
          }}
        />
        <div className="mt-4">
          <Link href="/orders">
            <Button variant="outline">Kembali ke Daftar Pesanan</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Link
        href="/orders"
        className="inline-flex items-center gap-2 text-secondary-600 hover:text-secondary-900 mb-6"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
        Kembali ke Daftar Pesanan
      </Link>

      <OrderDetail order={order} />
    </div>
  );
}
