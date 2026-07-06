'use client';

import Image from 'next/image';
import type { Order } from '@/types/api';
import { OrderStatusBadge } from './order-status-badge';
import { OrderTimeline } from './order-timeline';
import { formatCurrency } from '@/lib/utils/currency';
import { formatDate } from '@/lib/utils/date';

interface OrderDetailProps {
  order: Order;
}

export function OrderDetail({ order }: OrderDetailProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg border border-secondary-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-secondary-900">
            Pesanan #{order.id}
          </h2>
          <OrderStatusBadge status={order.status} size="lg" />
        </div>
        <p className="text-secondary-600">
          Dibuat pada {formatDate(order.createdAt)}
        </p>
      </div>

      {/* Timeline */}
      <div className="bg-white rounded-lg border border-secondary-200 p-6">
        <OrderTimeline currentStatus={order.status} />
      </div>

      {/* Items */}
      <div className="bg-white rounded-lg border border-secondary-200 p-6">
        <h3 className="font-semibold text-secondary-900 mb-4">Item Pesanan</h3>
        <div className="space-y-4">
          {order.items.map((item) => (
            <div key={item.id} className="flex items-center gap-4">
              {item.productImage && (
                <Image
                  src={item.productImage}
                  alt={item.productName}
                  width={64}
                  height={64}
                  className="w-16 h-16 rounded-lg object-cover"
                />
              )}
              <div className="flex-1">
                <p className="font-medium text-secondary-900">
                  {item.productName}
                </p>
                <p className="text-sm text-secondary-600">
                  {item.quantity}x {formatCurrency(item.snapshotPrice)}
                </p>
              </div>
              <p className="font-medium text-secondary-900">
                {formatCurrency(item.subtotal)}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="bg-white rounded-lg border border-secondary-200 p-6">
        <h3 className="font-semibold text-secondary-900 mb-4">
          Ringkasan Pembayaran
        </h3>
          <div className="space-y-2">
            <div className="flex justify-between text-secondary-600">
              <span>Subtotal</span>
              <span>{formatCurrency(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-secondary-600">
              <span>Ongkos Kirim</span>
              <span>{formatCurrency(order.shippingFee)}</span>
            </div>
            <div className="flex justify-between text-secondary-600">
              <span>Pajak</span>
              <span>{formatCurrency(order.tax)}</span>
            </div>
            <div className="flex justify-between font-semibold text-secondary-900 pt-2 border-t border-secondary-200">
              <span>Total</span>
              <span>{formatCurrency(order.total)}</span>
            </div>
          </div>
      </div>

      {/* Payment Info */}
      {order.payment && (
        <div className="bg-white rounded-lg border border-secondary-200 p-6">
          <h3 className="font-semibold text-secondary-900 mb-4">
            Informasi Pembayaran
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-secondary-600">Metode</span>
              <span className="font-medium">{order.payment.method}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-secondary-600">Status</span>
              <span className="font-medium">{order.payment.status}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-secondary-600">Jumlah</span>
              <span className="font-medium">
                {formatCurrency(order.payment.amount)}
              </span>
            </div>
            {order.payment.paidAt && (
              <div className="flex justify-between">
                <span className="text-secondary-600">Dibayar pada</span>
                <span className="font-medium">
                  {formatDate(order.payment.paidAt)}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
