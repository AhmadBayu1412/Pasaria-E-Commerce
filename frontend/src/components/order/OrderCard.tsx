'use client';

import React from 'react';
import Link from 'next/link';
import type { Order } from '@/types/api/order.types';
import { OrderStatusBadge } from './OrderStatusBadge';

interface OrderCardProps {
  order: Order;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateString));
}

export function OrderCard({ order }: OrderCardProps) {
  return (
    <Link
      href={`/orders/${order.id}`}
      className="block bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow border border-gray-100"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <p className="text-xs text-gray-500">Order ID</p>
          <p className="font-semibold text-gray-900">#{order.id}</p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      {/* Items Preview */}
      <div className="space-y-2 mb-4">
        <p className="text-sm text-gray-600">
          {order.totalItemCount} produk • {order.totalQuantity} item
        </p>
        <div className="flex flex-wrap gap-1">
          {order.items.slice(0, 3).map((item, index) => (
            <span
              key={item.productId || index}
              className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600"
            >
              {item.productName}
            </span>
          ))}
          {order.items.length > 3 && (
            <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-500">
              +{order.items.length - 3} lagi
            </span>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-end justify-between pt-3 border-t border-gray-100">
        <div>
          <p className="text-xs text-gray-500">{formatDate(order.createdAt)}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500">Total</p>
          <p className="font-bold text-lg text-blue-600">
            {formatCurrency(order.total)}
          </p>
        </div>
      </div>
    </Link>
  );
}

interface OrderListProps {
  orders: Order[];
  emptyMessage?: string;
}

export function OrderList({ orders, emptyMessage = 'Belum ada pesanan' }: OrderListProps) {
  if (orders.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
        <p className="text-gray-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {orders.map((order) => (
        <OrderCard key={order.id} order={order} />
      ))}
    </div>
  );
}

interface OrderSummaryCardProps {
  order: Order;
}

export function OrderSummaryCard({ order }: OrderSummaryCardProps) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 pb-4 border-b border-gray-100">
        <div>
          <p className="text-sm text-gray-500">Order ID</p>
          <p className="font-bold text-lg text-gray-900">#{order.id}</p>
        </div>
        <OrderStatusBadge status={order.status} size="lg" />
      </div>

      {/* Items */}
      <div className="py-4 space-y-3">
        {order.items.map((item, index) => (
          <div key={item.productId || index} className="flex gap-3">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">{item.productName}</p>
              <p className="text-xs text-gray-500">
                {item.quantity} × {formatCurrency(item.unitPrice)}
              </p>
            </div>
            <p className="text-sm font-medium text-gray-900">
              {formatCurrency(item.subtotal)}
            </p>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="pt-4 border-t border-gray-100 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Subtotal</span>
          <span className="text-gray-900">{formatCurrency(order.subtotal)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Ongkos Kirim</span>
          <span className="text-gray-900">{formatCurrency(order.shippingFee)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Pajak</span>
          <span className="text-gray-900">{formatCurrency(order.tax)}</span>
        </div>
        <div className="flex justify-between text-base font-bold pt-2 border-t border-gray-100">
          <span className="text-gray-900">Total</span>
          <span className="text-blue-600">{formatCurrency(order.total)}</span>
        </div>
      </div>

      {/* Shipping Info */}
      {order.shippingName && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-sm font-medium text-gray-900 mb-2">Alamat Pengiriman</p>
          <div className="text-sm text-gray-600">
            <p className="font-medium">{order.shippingName}</p>
            <p>{order.shippingPhone}</p>
            <p>{order.shippingAddress}</p>
            <p>{order.shippingCity} {order.shippingPostalCode}</p>
          </div>
        </div>
      )}
    </div>
  );
}
