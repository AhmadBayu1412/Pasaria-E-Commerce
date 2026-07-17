'use client';

/**
 * Order Card - Shopee Style
 * Features:
 * - Shopee-like layout with seller info header
 * - Order status badge
 * - Items with images and quantities
 * - Action buttons including return/refund
 * - Total calculation
 * - Return modal for DELIVERED orders
 */

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { ChevronRight, Store, RotateCcw, Check, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/cn';
import { formatCurrency } from '@/lib/utils/currency';
import { formatDate } from '@/lib/utils/date';
import type { Order, OrderStatus } from '@/types/api';
import { orderService } from '@/services/order.service';
import { getNextStatus } from '@/lib/orders/order-status';
import { OrderStatusBadge } from './order-status-badge';

interface OrderCardProps {
  readonly order: Order;
  readonly variant?: 'default' | 'shopee';
  readonly onStatusUpdate?: (orderId: number, newStatus: OrderStatus) => void;
  readonly onRefresh?: () => void;
}

export function OrderCard({ order, variant = 'default', onStatusUpdate, onRefresh }: Readonly<OrderCardProps>) {
  if (variant === 'shopee') {
    return <ShopeeOrderCard order={order} onStatusUpdate={onStatusUpdate} onRefresh={onRefresh} />;
  }
  return <DefaultOrderCard order={order} />;
}

/**
 * Shopee-style Order Card with enhanced UI
 */
interface ShopeeOrderCardProps {
  readonly order: Order;
  readonly onStatusUpdate?: (orderId: number, newStatus: OrderStatus) => void;
  readonly onRefresh?: () => void;
}

function ShopeeOrderCard({ order, onStatusUpdate, onRefresh }: Readonly<ShopeeOrderCardProps>) {
  const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const [returningItems, setReturningItems] = useState<Set<string>>(new Set());
  const [showReturnConfirm, setShowReturnConfirm] = useState(false);

  // Return modal state
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnReason, setReturnReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Confirmation modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'next' | 'confirm' | null>(null);

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
        onStatusUpdate?.(order.id, itemId as unknown as OrderStatus);
      });
      setReturningItems(new Set());
      setShowReturnConfirm(false);
    } else {
      setShowReturnConfirm(true);
    }
  };

  const canReturn = order.status === 'COMPLETED' || order.status === 'DELIVERED';

  // Handle "Next Proses" action
  const handleNextProses = async () => {
    setConfirmAction('next');
    setShowConfirmModal(true);
  };

  const confirmNextProses = async () => {
    setIsLoading(true);
    setShowConfirmModal(false);
    try {
      const nextStatus = getNextStatus(order.status);
      if (nextStatus) {
        await orderService.updateOrderStatus(order.id, nextStatus);
        onStatusUpdate?.(order.id, nextStatus);
        onRefresh?.();
      }
    } catch (error) {
      console.error('Failed to update status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle "Pesanan Diterima" action
  const handlePesananDiterima = () => {
    setConfirmAction('confirm');
    setShowConfirmModal(true);
  };

  const confirmPesananDiterima = async () => {
    setIsLoading(true);
    setShowConfirmModal(false);
    try {
      await orderService.updateOrderStatus(order.id, 'COMPLETED');
      onStatusUpdate?.(order.id, 'COMPLETED');
      onRefresh?.();
    } catch (error) {
      console.error('Failed to confirm receipt:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle "Return Pesanan" action
  const handleReturnPesanan = () => {
    setShowReturnModal(true);
  };

  const confirmReturnPesanan = async () => {
    setIsLoading(true);
    try {
      await orderService.cancelOrder(order.id, returnReason);
      onStatusUpdate?.(order.id, 'CANCELLED');
      setShowReturnModal(false);
      setReturnReason('');
      onRefresh?.();
    } catch (error) {
      console.error('Failed to return order:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle "Batalkan" action
  const handleBatal = async () => {
    setIsLoading(true);
    try {
      await orderService.cancelOrder(order.id);
      onStatusUpdate?.(order.id, 'CANCELLED');
      onRefresh?.();
    } catch (error) {
      console.error('Failed to cancel order:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle "Bayar Sekarang" action - Navigate to payment page
  const handleBayarSekarang = () => {
    // TODO: Implement payment page navigation for order.id
    console.log('Navigate to payment page for order:', order.id);
  };

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
              key={item.id ? String(item.id) : `item-${index}`}
              className="p-4 flex gap-4 hover:bg-secondary-50/50 transition-colors"
            >
              {/* Product Image */}
              <div className="w-20 h-20 rounded-lg bg-secondary-100 overflow-hidden relative shrink-0">
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
                {canReturn && returningItems.has(String(String(item.id)) || `item-${index}`) && (
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
                    handleReturnToggle(item.id ? String(item.id) : `item-${index}`);
                  }}
                  className={cn(
                    'w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all',
                    returningItems.has(item.id ? String(item.id) : `item-${index}`)
                      ? 'border-green-500 bg-green-500 text-white'
                      : 'border-secondary-300 hover:border-secondary-400'
                  )}
                >
                  {returningItems.has(item.id ? String(item.id) : `item-${index}`) && (
                    <Check className="w-4 h-4" />
                  )}
                </button>
              )}

              {/* Subtotal */}
              <div className="text-right shrink-0">
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
          <ActionButtons
            status={order.status}
            orderId={order.id}
            isLoading={isLoading}
            onNextProses={handleNextProses}
            onPesananDiterima={handlePesananDiterima}
            onReturnPesanan={handleReturnPesanan}
            onBatal={handleBatal}
            onBayarSekarang={handleBayarSekarang}
          />
        </div>

        {/* Confirmation Modal */}
        {showConfirmModal && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-blue-900 mb-1">
                  {confirmAction === 'next' ? 'Lanjut ke Proses Berikutnya?' : 'Konfirmasi Pesanan Diterima?'}
                </h4>
                <p className="text-sm text-blue-700 mb-3">
                  {confirmAction === 'next'
                    ? 'Status pesanan akan berubah menjadi langkah berikutnya dalam proses.'
                    : 'Pastikan Anda sudah menerima pesanan dengan benar.'}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowConfirmModal(false)}
                    className="flex-1 px-4 py-2 border border-blue-300 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    onClick={confirmAction === 'next' ? confirmNextProses : confirmPesananDiterima}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                  >
                    Ya, Lanjutkan
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Return Modal */}
        {showReturnModal && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-red-900 mb-2">
                  Return Pesanan
                </h4>
                <p className="text-sm text-red-700 mb-3">
                  Jelaskan alasan mengapa Anda ingin mengembalikan pesanan ini.
                </p>
                <textarea
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  placeholder="Contoh: Barang tidak sesuai dengan foto, produk rusak, dll..."
                  className="w-full p-3 border border-red-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-300 resize-none"
                  rows={3}
                />
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => {
                      setShowReturnModal(false);
                      setReturnReason('');
                    }}
                    className="flex-1 px-4 py-2 border border-red-300 text-red-700 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    onClick={confirmReturnPesanan}
                    disabled={isLoading || !returnReason.trim()}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Mengirim...' : 'Kirim Return'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Default Style Order Card
 */
function DefaultOrderCard({ order }: Readonly<{ order: Order }>) {
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
            <div key={item.id ? String(item.id) : `item-${index}`} className="flex items-center gap-3">
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
function OrderStatusButton({ status }: Readonly<{ status: string }>) {
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
 * Action Buttons Props
 */
interface ActionButtonsProps {
  readonly status: string;
  readonly orderId: number;
  readonly isLoading?: boolean;
  readonly onNextProses?: () => void;
  readonly onPesananDiterima?: () => void;
  readonly onReturnPesanan?: () => void;
  readonly onBatal?: () => void;
  readonly onBayarSekarang?: () => void;
}

function ActionButtons({
  status,
  orderId,
  isLoading = false,
  onNextProses,
  onPesananDiterima,
  onReturnPesanan,
  onBatal,
  onBayarSekarang,
}: Readonly<ActionButtonsProps>) {
  switch (status) {
    case 'DRAFT':
      // No actions - display only
      return null;

    case 'WAITING_PAYMENT':
      // User exited before payment - show Pay Now and Cancel
      return (
        <>
          <button
            onClick={onBayarSekarang}
            disabled={isLoading}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors disabled:opacity-50"
          >
            Bayar Sekarang
          </button>
          <button
            onClick={onBatal}
            disabled={isLoading}
            className="px-4 py-2 border border-red-300 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors disabled:opacity-50"
          >
            Batalkan
          </button>
        </>
      );

    case 'PAID':
      // No user action - auto transition or admin handles
      return null;

    case 'PROCESSING':
    case 'SHIPPING':
      // Show Next Proses button for both PROCESSING and SHIPPING
      return (
        <button
          onClick={onNextProses}
          disabled={isLoading}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center gap-1"
        >
          Next Proses
          <ChevronRight className="w-4 h-4" />
        </button>
      );

    case 'DELIVERED':
      // Show "Pesanan Diterima" and "Return Pesanan" buttons
      return (
        <>
          <button
            onClick={onPesananDiterima}
            disabled={isLoading}
            className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            Pesanan Diterima
          </button>
          <button
            onClick={onReturnPesanan}
            disabled={isLoading}
            className="px-4 py-2 border border-red-300 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors disabled:opacity-50"
          >
            Return Pesanan
          </button>
        </>
      );

    case 'COMPLETED':
    case 'CANCELLED':
    case 'EXPIRED':
      // Terminal states - no actions
      return null;

    default:
      return (
        <Link
          href={`/orders/${orderId}`}
          className="px-4 py-2 border border-secondary-300 text-secondary-700 rounded-lg text-sm font-medium hover:bg-secondary-50 transition-colors flex items-center gap-1"
        >
          Detail
          <ChevronRight className="w-4 h-4" />
        </Link>
      );
  }
}
