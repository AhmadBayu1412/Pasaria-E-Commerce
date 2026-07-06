'use client';

import type { Order } from '@/types/api';
import { OrderCard } from './order-card';
import { OrderEmpty } from './order-empty';
import { OrderLoading } from './order-loading';

interface OrderListProps {
  orders: Order[];
  isLoading?: boolean;
}

export function OrderList({ orders, isLoading }: OrderListProps) {
  if (isLoading) {
    return <OrderLoading />;
  }

  if (orders.length === 0) {
    return <OrderEmpty />;
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <OrderCard key={order.id} order={order} />
      ))}
    </div>
  );
}
