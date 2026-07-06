'use client';

import Link from 'next/link';
import Image from 'next/image';
import type { Order } from '@/types/api';
import { OrderStatusBadge } from './order-status-badge';
import { formatCurrency } from '@/lib/utils/currency';
import { formatDate } from '@/lib/utils/date';

interface OrderCardProps {
  order: Order;
}

export function OrderCard({ order }: OrderCardProps) {
  return (
    <Link href={`/orders/${order.id}`}>
      <article className="bg-white rounded-lg border border-secondary-200 p-4 hover:border-primary-300 hover:shadow-md transition-all">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="font-semibold text-secondary-900">
              Pesanan #{order.id}
            </p>
            <p className="text-sm text-secondary-500">
              {formatDate(order.createdAt)}
            </p>
          </div>
          <OrderStatusBadge status={order.status} />
        </div>

        {/* Items preview */}
        <div className="space-y-2 mb-4">
          {order.items.slice(0, 2).map((item) => (
            <div key={item.id} className="flex items-center gap-3">
              {item.productImage && (
                <Image
                  src={item.productImage}
                  alt={item.productName}
                  width={40}
                  height={40}
                  className="w-10 h-10 rounded object-cover"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-secondary-900 truncate">
                  {item.productName}
                </p>
                <p className="text-xs text-secondary-500">
                  {item.quantity}x {formatCurrency(item.snapshotPrice)}
                </p>
              </div>
            </div>
          ))}
          {order.items.length > 2 && (
            <p className="text-sm text-secondary-500">
              +{order.items.length - 2} produk lainnya
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-secondary-100">
          <p className="text-sm text-secondary-600">
            {order.totalQuantity} item
          </p>
          <p className="font-semibold text-secondary-900">
            {formatCurrency(order.total)}
          </p>
        </div>
      </article>
    </Link>
  );
}
