'use client';

/**
 * Order Card - Shopee Style
 * Features:
 * - Shopee-like layout with seller info header
 * - Order status badge
 * - Items with images and quantities
 * - Action buttons including return/refund
 * - Total calculation
 */

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { ChevronRight, MessageCircle, Store, RotateCcw, Package, X, Check } from 'lucide-react';
import { cn } from '@/lib/cn';
import { formatCurrency } from '@/lib/utils/currency';
import { formatDate } from '@/lib/utils/date';
import type { Order } from '@/types/api';
import { OrderStatusBadge } from './order-status-badge';

interface OrderCardProps {
  order: Order;
  variant?: 'default' | 'shopee';
  onReturnItem?: (orderId: number, itemId: string) => void;
}

export function OrderCard({ order, variant = 'default', onReturnItem }: OrderCardProps) {
  if (variant === 'shopee') {
    return <ShopeeOrderCard order={order} onReturnItem={onReturnItem} />;
  }
  return <DefaultOrderCard order={order} />;
}

/**
 * Shopee-style Order Card with enhanced UI
 */
function ShopeeOrderCard({ order, onReturnItem }: { order: Order; onReturnItem?: (orderId: number, itemId: string) => void }) {
  const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const [returningItems, setReturningItems] = useState<Set<string>>(new Set());
  const [showReturnConfirm, setShowReturnConfirm] = useState(false);

  const handleReturnToggle = (itemId: string) => {
    setReturningItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const handleConfirmReturn = () => {
    if (showReturnConfirm) {
      returningItems.forEach((itemId) => {
        onReturnItem?.(order.id, itemId);
      });
      setReturningItems(new Set());
      setShowReturnConfirm(false);
    } else {
      setShowReturnConfirm(true);
    }
  };

  const canReturn = order.status === 'COMPLETED' || order.status === 'DELIVERED';

  return (
    <div className="bg-white rounded-xl border border-secondary-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      {/* Shop Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-secondary-50 border-b border-secondary-100">
        <div className="flex items-center gap-2">
          <Store className="w-4 h-4 text-secondary-400" />
          <span className="font-medium text-secondary-900">Pasaria Store</span>
        </div>
        <OrderStatusButton status={order.status} />
      </div>

      {/* Items */}
      <Link href={`/orders/${order.id}`} className="block">
        <div className="divide-y divide-secondary-100">
          {order.items.map((item, index) => (
            <div
              key={item.id || `item-${index}`}
              className="p-4 flex gap-4 hover:bg-secondary-50/50 transition-colors"
            >
              {/* Product Image */}
              <div className="w-20 h-20 rounded-lg bg-secondary-100 overflow-hidden relative flex-shrink-0">
                {item.productImage ? (
                  <Image
                    src={item.productImage}
                    alt={item.productName}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-secondary-400 text-lg font-semibold">
                    {item.productName.charAt(0)}
                  </div>
                )}
                {/* Return checkbox overlay */}
                {canReturn && returningItems.has(item.id || `item-${index}`) && (
                  <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-secondary-900 line-clamp-2">
                  {item.productName}
                </p>
                <p className="text-sm text-secondary-500 mt-1">
                  {item.quantity}x Rp {formatCurrency(item.snapshotPrice ?? item.unitPrice)}
                </p>
              </div>

              {/* Return Checkbox (only for completed orders) */}
              {canReturn && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleReturnToggle(item.id || `item-${index}`);
                  }}
                  className={cn(
                    'w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all',
                    returningItems.has(item.id || `item-${index}`)
                      ? 'border-green-500 bg-green-500 text-white'
                      : 'border-secondary-300 hover:border-secondary-400'
                  )}
                >
                  {returningItems.has(item.id || `item-${index}`) && (
                    <Check className="w-4 h-4" />
                  )}
                </button>
              )}

              {/* Subtotal */}
              <div className="text-right flex-shrink-0">
                <p className="font-semibold text-secondary-900">
                  {formatCurrency(item.subtotal)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Link>

      {/* Footer */}
      <div className="px-4 py-4 bg-secondary-50/50 border-t border-secondary-100">
        <div className="flex items-center justify-between">
          {/* Order Info */}
          <div className="text-sm text-secondary-500">
            <p>Total: <span className="font-semibold text-primary-600">{totalItems} item</span></p>
            <p className="mt-1">Tanggal: {formatDate(order.createdAt)}</p>
          </div>

          {/* Total Amount */}
          <div className="text-right">
            <p className="text-sm text-secondary-500">Total Pembayaran</p>
            <p className="text-xl font-bold text-primary-600">
              {formatCurrency(order.total)}
            </p>
          </div>
        </div>

        {/* Return Confirmation */}
        {showReturnConfirm && returningItems.size > 0 && (
          <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-800 mb-3">
              Yakin ingin mengembalikan {returningItems.size} item?
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowReturnConfirm(false);
                  setReturningItems(new Set());
                }}
                className="flex-1 px-4 py-2 border border-amber-300 text-amber-700 rounded-lg text-sm font-medium hover:bg-amber-100 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmReturn}
                className="flex-1 px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 transition-colors"
              >
                Konfirmasi
              </button>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 mt-4">
          {canReturn && returningItems.size > 0 && !showReturnConfirm && (
            <button
              onClick={handleConfirmReturn}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors flex items-center gap-1"
            >
              <RotateCcw className="w-4 h-4" />
              Ajukan Pengembalian ({returningItems.size})
            </button>
          )}
          <ActionButtons status={order.status} orderId={order.id} />
        </div>
      </div>
    </div>
  );
}

/**
 * Default Style Order Card
 */
function DefaultOrderCard({ order }: { order: Order }) {
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
          {order.items.slice(0, 2).map((item, index) => (
            <div key={item.id || `item-${index}`} className="flex items-center gap-3">
              {item.productImage ? (
                <Image
                  src={item.productImage}
                  alt={item.productName}
                  width={40}
                  height={40}
                  className="w-10 h-10 rounded object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded bg-secondary-100 flex items-center justify-center text-secondary-400 font-semibold">
                  {item.productName.charAt(0)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-secondary-900 truncate">
                  {item.productName}
                </p>
                <p className="text-xs text-secondary-500">
                  {item.quantity}x {formatCurrency(item.snapshotPrice ?? item.unitPrice)}
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

/**
 * Order Status Button
 */
function OrderStatusButton({ status }: { status: string }) {
  const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
    DRAFT: { bg: 'bg-secondary-300', text: 'text-white', label: 'Draft' },
    WAITING_PAYMENT: { bg: 'bg-amber-500', text: 'text-white', label: 'Menunggu Pembayaran' },
    PENDING: { bg: 'bg-amber-500', text: 'text-white', label: 'Menunggu Pembayaran' },
    PAID: { bg: 'bg-blue-500', text: 'text-white', label: 'Sudah Dibayar' },
    PROCESSING: { bg: 'bg-blue-500', text: 'text-white', label: 'Sedang Diproses' },
    SHIPPED: { bg: 'bg-purple-500', text: 'text-white', label: 'Sedang Dikirim' },
    DELIVERED: { bg: 'bg-green-500', text: 'text-white', label: 'Pesanan Tiba' },
    COMPLETED: { bg: 'bg-green-600', text: 'text-white', label: 'Selesai' },
    CANCELLED: { bg: 'bg-red-100', text: 'text-red-600', label: 'Dibatalkan' },
    EXPIRED: { bg: 'bg-secondary-200', text: 'text-secondary-600', label: 'Kedaluwarsa' },
  };

  const config = statusConfig[status] || { bg: 'bg-secondary-300', text: 'text-white', label: status };

  return (
    <span className={cn('px-3 py-1.5 rounded-md text-xs font-semibold', config.bg, config.text)}>
      {config.label}
    </span>
  );
}

/**
 * Action Buttons based on order status
 */
function ActionButtons({ status, orderId }: { status: string; orderId: number }) {
  switch (status) {
    case 'DRAFT':
    case 'PENDING':
    case 'WAITING_PAYMENT':
      return (
        <>
          <button className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors">
            Bayar Sekarang
          </button>
          <button className="px-4 py-2 border border-secondary-300 text-secondary-600 rounded-lg text-sm font-medium hover:bg-secondary-50 transition-colors">
            Batalkan
          </button>
        </>
      );

    case 'PROCESSING':
    case 'PAID':
      return (
        <>
          <Link
            href={`/orders/${orderId}`}
            className="px-4 py-2 border border-secondary-300 text-secondary-700 rounded-lg text-sm font-medium hover:bg-secondary-50 transition-colors flex items-center gap-1"
          >
            Lihat Detail
            <ChevronRight className="w-4 h-4" />
          </Link>
        </>
      );

    case 'SHIPPED':
      return (
        <>
          <button className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors">
            Konfirmasi Terima
          </button>
          <button className="px-4 py-2 border border-secondary-300 text-secondary-600 rounded-lg text-sm font-medium hover:bg-secondary-50 transition-colors flex items-center gap-1">
            Lacak Pengiriman
            <ChevronRight className="w-4 h-4" />
          </button>
        </>
      );

    case 'DELIVERED':
      return (
        <>
          <button className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors">
            Konfirmasi Selesai
          </button>
          <Link
            href={`/orders/${orderId}`}
            className="px-4 py-2 border border-secondary-300 text-secondary-700 rounded-lg text-sm font-medium hover:bg-secondary-50 transition-colors flex items-center gap-1"
          >
            Detail
            <ChevronRight className="w-4 h-4" />
          </Link>
        </>
      );

    case 'COMPLETED':
      return (
        <>
          <button className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors flex items-center gap-1">
            Beli Lagi
          </button>
          <button className="px-4 py-2 border border-orange-300 text-orange-600 rounded-lg text-sm font-medium hover:bg-orange-50 transition-colors flex items-center gap-1">
            <RotateCcw className="w-4 h-4" />
            Return/Refund
          </button>
        </>
      );

    case 'CANCELLED':
    case 'EXPIRED':
      return (
        <>
          <button className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors">
            Beli Lagi
          </button>
        </>
      );

    default:
      return (
        <Link
          href={`/orders/${orderId}`}
          className="px-4 py-2 border border-secondary-300 text-secondary-700 rounded-lg text-sm font-medium hover:bg-secondary-50 transition-colors flex items-center gap-1"
        >
          Lihat Detail
          <ChevronRight className="w-4 h-4" />
        </Link>
      );
  }
}
