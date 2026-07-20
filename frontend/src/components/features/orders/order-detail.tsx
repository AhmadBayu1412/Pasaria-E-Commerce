'use client';

/**
 * Order Detail Component - Enhanced UI
 * Features:
 * - Modern card layout with status timeline
 * - Product images in items list
 * - Return/refund action for completed orders
 * - Enhanced payment summary
 */

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import {
  ArrowLeft, Truck, CreditCard, Package,
  Check, Clock, RotateCcw, X, AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { formatCurrency } from '@/lib/utils/currency';
import { formatDate } from '@/lib/utils/date';
import type { Order } from '@/types/api';

interface OrderDetailProps {
  readonly order: Order;
  readonly onReturnItem?: (orderId: number, itemId: string) => void;
}

export function OrderDetail({ order, onReturnItem }: Readonly<OrderDetailProps>) {
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

  // Helper function for status banner class
  const getStatusBannerClass = (status: string): string => {
    if (status === 'COMPLETED') return 'bg-green-500 text-white';
    if (status === 'CANCELLED') return 'bg-red-500 text-white';
    if (status === 'DRAFT') return 'bg-secondary-400 text-white';
    return 'bg-primary-500 text-white';
  };

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link
        href="/orders"
        className="inline-flex items-center gap-2 text-secondary-600 hover:text-secondary-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Kembali ke Pesanan</span>
      </Link>

      {/* Header Card */}
      <div className="bg-white rounded-2xl border border-secondary-200 overflow-hidden shadow-sm">
        {/* Status Banner */}
        <div className={cn(
          'px-6 py-4 flex items-center justify-between',
          getStatusBannerClass(order.status)
        )}>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
              <StatusIcon status={order.status} />
            </div>
            <div>
              <p className="font-semibold text-lg">{getStatusLabel(order.status)}</p>
              <p className="text-sm opacity-80">Pesanan #{order.id}</p>
            </div>
          </div>
          <p className="text-sm opacity-80">
            {formatDate(order.createdAt)}
          </p>
        </div>

        {/* Timeline */}
        <OrderTimeline status={order.status} />
      </div>

      {/* Items Card */}
      <div className="bg-white rounded-2xl border border-secondary-200 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-secondary-100">
          <h2 className="font-semibold text-secondary-900 flex items-center gap-2">
            <Package className="w-5 h-5 text-secondary-400" />
            Item Pesanan ({order.items.length})
          </h2>
        </div>

        <div className="divide-y divide-secondary-100">
          {order.items.map((item, index) => (
            <div key={item.id || `item-${index}`} className="p-6 flex gap-4 hover:bg-secondary-50/50 transition-colors">
              {/* Product Image */}
              <div className="w-24 h-24 rounded-xl bg-secondary-100 overflow-hidden relative flex-shrink-0">
                {item.productImage ? (
                  <Image
                    src={item.productImage}
                    alt={item.productName}
                    fill
                    className="object-cover"
                    sizes="96px"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-secondary-400 text-2xl font-bold">
                    {item.productName.charAt(0)}
                  </div>
                )}
                {/* Return checkbox overlay */}
                {canReturn && returningItems.has(item.id ? String(item.id) : `item-${index}`) && (
                  <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                      <Check className="w-5 h-5 text-white" />
                    </div>
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-secondary-900 mb-1">
                  {item.productName}
                </h3>
                <p className="text-sm text-secondary-500">
                  {item.quantity}x @ {formatCurrency(item.snapshotPrice ?? item.unitPrice)}
                </p>
                {item.productImage && (
                  <p className="text-xs text-secondary-400 mt-1 truncate">
                    Image: {item.productImage.substring(0, 40)}...
                  </p>
                )}
              </div>

              {/* Return Checkbox (only for completed orders) */}
              {canReturn && (
                <button
                  onClick={() => handleReturnToggle(item.id ? String(item.id) : `item-${index}`)}
                  className={cn(
                    'w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all self-center',
                    returningItems.has(item.id ? String(item.id) : `item-${index}`)
                      ? 'border-green-500 bg-green-500 text-white'
                      : 'border-secondary-300 hover:border-secondary-400'
                  )}
                >
                  {returningItems.has(item.id ? String(item.id) : `item-${index}`) ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <RotateCcw className="w-4 h-4 text-secondary-400" />
                  )}
                </button>
              )}

              {/* Subtotal */}
              <div className="text-right flex-shrink-0 self-center">
                <p className="font-semibold text-secondary-900">
                  {formatCurrency(item.subtotal)}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Return Action */}
        {canReturn && returningItems.size > 0 && (
          <div className="p-6 bg-amber-50 border-t border-amber-200">
            {showReturnConfirm ? (
              <div className="flex items-center gap-4">
                <AlertCircle className="w-5 h-5 text-amber-600" />
                <p className="flex-1 text-sm text-amber-800">
                  Yakin ingin mengembalikan {returningItems.size} item?
                </p>
                <button
                  onClick={() => {
                    setShowReturnConfirm(false);
                    setReturningItems(new Set());
                  }}
                  className="px-4 py-2 border border-amber-300 text-amber-700 rounded-lg text-sm font-medium hover:bg-amber-100 transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handleConfirmReturn}
                  className="px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 transition-colors"
                >
                  Konfirmasi
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <p className="text-sm text-amber-800">
                  {returningItems.size} item dipilih untuk dikembalikan
                </p>
                <button
                  onClick={handleConfirmReturn}
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors flex items-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  Ajukan Pengembalian
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Two Column Layout: Shipping & Payment */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Shipping Info */}
        {(order.shippingName || order.shippingAddress) && (
          <div className="bg-white rounded-2xl border border-secondary-200 overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-secondary-100">
              <h2 className="font-semibold text-secondary-900 flex items-center gap-2">
                <Truck className="w-5 h-5 text-secondary-400" />
                Informasi Pengiriman
              </h2>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                {order.shippingName && (
                  <div>
                    <p className="text-sm text-secondary-500">Penerima</p>
                    <p className="font-medium text-secondary-900">{order.shippingName}</p>
                  </div>
                )}
                {order.shippingPhone && (
                  <div>
                    <p className="text-sm text-secondary-500">Telepon</p>
                    <p className="font-medium text-secondary-900">{order.shippingPhone}</p>
                  </div>
                )}
                {order.shippingAddress && (
                  <div>
                    <p className="text-sm text-secondary-500">Alamat</p>
                    <p className="font-medium text-secondary-900">
                      {order.shippingAddress}
                      {order.shippingCity && `, ${order.shippingCity}`}
                      {order.shippingPostalCode && ` ${order.shippingPostalCode}`}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Payment Summary */}
        <div className="bg-white rounded-2xl border border-secondary-200 overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-secondary-100">
            <h2 className="font-semibold text-secondary-900 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-secondary-400" />
              Ringkasan Pembayaran
            </h2>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-secondary-600">Subtotal</span>
                <span className="font-medium text-secondary-900">{formatCurrency(order.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary-600">Ongkos Kirim</span>
                <span className="font-medium text-secondary-900">
                  {order.shippingFee > 0 ? formatCurrency(order.shippingFee) : 'Gratis'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary-600">Biaya Admin</span>
                <span className="font-medium text-secondary-900">
                  {order.adminFee > 0 ? formatCurrency(order.adminFee) : '-'}
                </span>
              </div>
              <div className="flex justify-between pt-3 border-t border-secondary-100">
                <span className="font-semibold text-secondary-900">Total</span>
                <span className="text-xl font-bold text-primary-600">{formatCurrency(order.total)}</span>
              </div>
            </div>

            {/* Payment Info */}
            {order.payment && (
              <div className="mt-6 pt-4 border-t border-secondary-100">
                <p className="text-sm text-secondary-500 mb-2">Metode Pembayaran</p>
                <div className="flex items-center gap-3 p-3 bg-secondary-50 rounded-lg">
                  <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <p className="font-medium text-secondary-900">{order.payment.method}</p>
                    <p className="text-xs text-secondary-500 capitalize">{order.payment.status.toLowerCase()}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Order Timeline Component
 */
function OrderTimeline({ status }: Readonly<{ status: string }>) {
  const steps = [
    { key: 'DRAFT', label: 'Draft', icon: Package },
    { key: 'WAITING_PAYMENT', label: 'Menunggu Bayar', icon: Clock },
    { key: 'PAID', label: 'Dibayar', icon: Check },
    { key: 'PROCESSING', label: 'Diproses', icon: Package },
    { key: 'SHIPPING', label: 'Dikirim', icon: Truck },
    { key: 'DELIVERED', label: 'Tiba', icon: Package },
    { key: 'COMPLETED', label: 'Selesai', icon: Check },
  ];

  const currentIndex = steps.findIndex(s => s.key === status);
  const isCancelled = status === 'CANCELLED' || status === 'EXPIRED';

  // Helper functions to avoid nested ternary
  const getStepIconClass = (isCancelledStep: boolean, isPast: boolean, isCurrent: boolean): string => {
    if (isCancelledStep) return 'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors bg-red-100 text-red-500';
    if (isPast || isCurrent) return 'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors bg-primary-500 text-white';
    return 'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors bg-secondary-200 text-secondary-400';
  };

  const getStepLabelClass = (isCancelledStep: boolean, isPast: boolean, isCurrent: boolean): string => {
    if (isCancelledStep) return 'text-xs mt-1 whitespace-nowrap text-red-500';
    if (isPast || isCurrent) return 'text-xs mt-1 whitespace-nowrap text-secondary-900 font-medium';
    return 'text-xs mt-1 whitespace-nowrap text-secondary-400';
  };

  return (
    <div className="px-6 py-4 bg-secondary-50/50">
      <div className="flex items-center justify-between overflow-x-auto">
        {steps.map((step, index) => {
          const isPast = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isCancelledStep = isCancelled && !isPast;

          return (
            <div key={step.key} className="flex items-center">
              {/* Step */}
              <div className="flex flex-col items-center">
                <div className={getStepIconClass(isCancelledStep, isPast, isCurrent)}>
                  <step.icon className="w-4 h-4" />
                </div>
                <span className={getStepLabelClass(isCancelledStep, isPast, isCurrent)}>
                  {step.label}
                </span>
              </div>

              {/* Connector */}
              {index < steps.length - 1 && (
                <div className={cn(
                  'w-8 md:w-12 h-0.5 mx-1',
                  index < currentIndex ? 'bg-primary-500' : 'bg-secondary-200'
                )} />
              )}
            </div>
          );
        })}
      </div>

      {/* Cancelled Banner */}
      {isCancelled && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
          <X className="w-5 h-5 text-red-500" />
          <span className="text-sm text-red-700 font-medium">
            Pesanan ini telah {status === 'CANCELLED' ? 'dibatalkan' : 'kedaluwarsa'}
          </span>
        </div>
      )}
    </div>
  );
}

/**
 * Status Icon Component
 */
function StatusIcon({ status }: Readonly<{ status: string }>) {
  switch (status) {
    case 'COMPLETED':
      return <Check className="w-6 h-6" />;
    case 'CANCELLED':
    case 'EXPIRED':
      return <X className="w-6 h-6" />;
    case 'SHIPPING':
      return <Truck className="w-6 h-6" />;
    case 'WAITING_PAYMENT':
    case 'PENDING':
      return <Clock className="w-6 h-6" />;
    default:
      return <Package className="w-6 h-6" />;
  }
}

/**
 * Get Status Label
 */
function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    DRAFT: 'Pesanan Draft',
    WAITING_PAYMENT: 'Menunggu Pembayaran',
    PENDING: 'Menunggu Pembayaran',
    PAID: 'Sudah Dibayar',
    PROCESSING: 'Sedang Diproses',
    SHIPPING: 'Sedang Dikirim',
    DELIVERED: 'Pesanan Tiba',
    COMPLETED: 'Selesai',
    CANCELLED: 'Dibatalkan',
    EXPIRED: 'Kedaluwarsa',
  };
  return labels[status] || status;
}
