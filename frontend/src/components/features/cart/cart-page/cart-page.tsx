'use client';

/**
 * Cart Page Component - Redesigned
 * Modern, clean design with better visual hierarchy
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useCartStore, useCartSubtotal, useCartItemCount, useHasUnavailableItems } from '@/store/cart.store';
import { cartService } from '@/services/cart.service';
import type { CartItem } from '@/store/cart.types';

export function CartPage() {
  const items = useCartStore((state) => state.items);
  const itemCount = useCartItemCount();
  const subtotal = useCartSubtotal();
  const hasUnavailableItems = useHasUnavailableItems();
  const syncWithServer = useCartStore((state) => state.syncWithServer);
  const isSyncing = useCartStore((state) => state.isSyncing);
  const [isSyncingItems, setIsSyncingItems] = useState<Record<string, boolean>>({});
  const router = useRouter();

  // Load cart - sync with server only if we have no local items
  useEffect(() => {
    // If we have local items, don't sync (would overwrite local data)
    // If no local items, sync to get server data
    if (items.length === 0) {
      syncWithServer();
    }
  }, [items.length]);

  const handleQuantityChange = async (item: CartItem, newQuantity: number) => {
    if (newQuantity < 1) return;
    if (newQuantity > item.stock) return;

    setIsSyncingItems(prev => ({ ...prev, [item.id]: true }));
    try {
      await cartService.updateQuantity(item.productId, newQuantity);
      useCartStore.getState().updateQuantity(item.id, newQuantity);
    } finally {
      setIsSyncingItems(prev => ({ ...prev, [item.id]: false }));
    }
  };

  const handleRemove = async (item: CartItem) => {
    setIsSyncingItems(prev => ({ ...prev, [item.id]: true }));
    try {
      await cartService.removeItem(item.productId);
      useCartStore.getState().removeItem(item.id);
    } finally {
      setIsSyncingItems(prev => ({ ...prev, [item.id]: false }));
    }
  };

  const handleCheckout = () => {
    router.push('/checkout/preview');
  };

  if (items.length === 0) {
    return <CartEmpty />;
  }

  return (
    <div className="bg-secondary-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-secondary-900">Keranjang Belanja</h1>
          <p className="text-secondary-500 mt-1">{itemCount} item dalam keranjang</p>
        </div>

        <div className="lg:grid lg:grid-cols-12 lg:gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-8">
            <div className="bg-white rounded-2xl shadow-sm border border-secondary-200 overflow-hidden">
              {/* Header */}
              <div className="px-6 py-4 border-b border-secondary-100 bg-secondary-50/50">
                <div className="grid grid-cols-12 gap-4 text-sm font-medium text-secondary-500 uppercase tracking-wider">
                  <div className="col-span-5">Produk</div>
                  <div className="col-span-2 text-center">Harga</div>
                  <div className="col-span-2 text-center">Jumlah</div>
                  <div className="col-span-3 text-right">Total</div>
                </div>
              </div>

              {/* Items */}
              <div className="divide-y divide-secondary-100">
                {items.map((item) => (
                  <CartItemRow
                    key={item.id}
                    item={item}
                    isUpdating={isSyncingItems[item.id]}
                    onQuantityChange={handleQuantityChange}
                    onRemove={handleRemove}
                  />
                ))}
              </div>
            </div>

            {/* Continue Shopping */}
            <div className="mt-6">
              <Link
                href="/products"
                className="inline-flex items-center text-primary-600 hover:text-primary-700 font-medium transition-colors"
              >
                <ArrowRight className="w-4 h-4 mr-2 rotate-180" />
                Lanjut Belanja
              </Link>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-4 mt-8 lg:mt-0">
            <div className="bg-white rounded-2xl shadow-sm border border-secondary-200 p-6 sticky top-24">
              <h2 className="text-lg font-semibold text-secondary-900 mb-6">Ringkasan Pesanan</h2>

              {/* Items Preview */}
              <div className="space-y-3 mb-6 max-h-48 overflow-y-auto">
                {items.slice(0, 3).map((item) => (
                  <div key={item.id} className="flex items-center gap-3">
                    <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-secondary-100 shrink-0">
                      {item.image ? (
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-cover"
                          sizes="48px"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-secondary-400 text-sm font-semibold">
                            {item.name.charAt(0)}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-secondary-900 truncate">{item.name}</p>
                      <p className="text-xs text-secondary-500">{item.quantity}x</p>
                    </div>
                    <p className="text-sm font-medium text-secondary-900">
                      Rp {(item.price * item.quantity).toLocaleString('id-ID')}
                    </p>
                  </div>
                ))}
                {items.length > 3 && (
                  <p className="text-sm text-secondary-500 text-center">
                    +{items.length - 3} item lainnya
                  </p>
                )}
              </div>

              {/* Summary */}
              <div className="space-y-3 border-t border-secondary-100 pt-4">
                <div className="flex justify-between text-secondary-600">
                  <span>Subtotal</span>
                  <span>Rp {subtotal.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between text-secondary-600">
                  <span>Ongkos Kirim</span>
                  <span className="text-secondary-400">Dihitung saat checkout</span>
                </div>
                <div className="flex justify-between border-t border-secondary-100 pt-3">
                  <span className="font-semibold text-secondary-900">Total</span>
                  <span className="text-xl font-bold text-primary-600">
                    Rp {subtotal.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              {/* Warning */}
              {hasUnavailableItems && (
                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-sm text-amber-800">
                      Beberapa item tidak tersedia. Mohon periksa kembali.
                    </p>
                  </div>
                </div>
              )}

              {/* Checkout Button */}
              <button
                onClick={handleCheckout}
                disabled={items.length === 0 || hasUnavailableItems || isSyncing}
                className={cn(
                  'w-full mt-6 py-4 px-6 rounded-xl font-semibold transition-all',
                  'flex items-center justify-center gap-3',
                  'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
                  items.length === 0 || hasUnavailableItems || isSyncing
                    ? 'bg-secondary-200 text-secondary-400 cursor-not-allowed'
                    : 'bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800 shadow-lg shadow-primary-600/25'
                )}
              >
                {isSyncing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Memuat...</span>
                  </>
                ) : (
                  <>
                    <span>Checkout</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Cart Item Row Component
 */
interface CartItemRowProps {
  item: CartItem;
  isUpdating: boolean;
  onQuantityChange: (item: CartItem, quantity: number) => void;
  onRemove: (item: CartItem) => void;
}

function CartItemRow({ item, isUpdating, onQuantityChange, onRemove }: CartItemRowProps) {
  const isOutOfStock = !item.isAvailable || item.quantity > item.stock;
  const priceChanged = item.price !== item.currentPrice;

  return (
    <div className={cn('p-6 transition-all', isUpdating && 'opacity-60')}>
      <div className="grid grid-cols-12 gap-4 items-center">
        {/* Product */}
        <div className="col-span-5 flex items-center gap-4">
          <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-secondary-100 shrink-0">
            {item.image ? (
              <Image
                src={item.image}
                alt={item.name}
                fill
                className="object-cover"
                sizes="80px"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-secondary-400 text-xl font-semibold">
                  {item.name.charAt(0)}
                </span>
              </div>
            )}
            {isOutOfStock && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <span className="text-white text-xs font-medium">Habis</span>
              </div>
            )}
          </div>
          <div className="min-w-0">
            <Link
              href={`/products/${item.slug}`}
              className="text-base font-medium text-secondary-900 hover:text-primary-600 transition-colors line-clamp-2"
            >
              {item.name}
            </Link>
            {item.variantInfo && (
              <div className="flex gap-2 mt-1">
                {item.variantInfo.color && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-secondary-100 text-secondary-600">
                    {item.variantInfo.color}
                  </span>
                )}
                {item.variantInfo.size && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-secondary-100 text-secondary-600">
                    {item.variantInfo.size}
                  </span>
                )}
              </div>
            )}
            {priceChanged && (
              <p className="text-xs text-blue-600 mt-1">
                Harga berubah dari Rp {item.currentPrice.toLocaleString('id-ID')}
              </p>
            )}
          </div>
        </div>

        {/* Price */}
        <div className="col-span-2 text-center">
          <p className="font-medium text-secondary-900">
            Rp {item.price.toLocaleString('id-ID')}
          </p>
        </div>

        {/* Quantity */}
        <div className="col-span-2 flex justify-center">
          <div className="flex items-center gap-2 bg-secondary-50 rounded-lg p-1">
            <button
              onClick={() => onQuantityChange(item, item.quantity - 1)}
              disabled={isUpdating || item.quantity <= 1}
              className={cn(
                'w-9 h-9 rounded-md flex items-center justify-center transition-all',
                'bg-white border border-secondary-200 hover:bg-secondary-100 hover:border-secondary-300',
                'disabled:opacity-40 disabled:cursor-not-allowed',
                'focus:outline-none focus:ring-2 focus:ring-primary-500'
              )}
            >
              <Minus className="w-4 h-4 text-secondary-600" />
            </button>
            <span className="w-12 text-center font-bold text-lg text-secondary-900 bg-white px-2 py-1 rounded border border-secondary-200">
              {item.quantity}
            </span>
            <button
              onClick={() => onQuantityChange(item, item.quantity + 1)}
              disabled={isUpdating || item.quantity >= item.stock}
              className={cn(
                'w-9 h-9 rounded-md flex items-center justify-center transition-all',
                'bg-white border border-secondary-200 hover:bg-secondary-100 hover:border-secondary-300',
                'disabled:opacity-40 disabled:cursor-not-allowed',
                'focus:outline-none focus:ring-2 focus:ring-primary-500'
              )}
            >
              <Plus className="w-4 h-4 text-secondary-600" />
            </button>
          </div>
        </div>

        {/* Total */}
        <div className="col-span-3 flex items-center justify-end gap-3">
          <p className="text-lg font-bold text-secondary-900">
            Rp {(item.price * item.quantity).toLocaleString('id-ID')}
          </p>
          <button
            onClick={() => onRemove(item)}
            disabled={isUpdating}
            className={cn(
              'p-2 rounded-lg transition-colors shrink-0',
              'text-secondary-400 hover:text-red-500 hover:bg-red-50',
              'focus:outline-none focus:ring-2 focus:ring-red-500',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
            title="Hapus item"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Empty Cart Component
 */
function CartEmpty() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-secondary-100 flex items-center justify-center">
          <ShoppingBag className="w-12 h-12 text-secondary-400" />
        </div>
        <h1 className="text-2xl font-bold text-secondary-900 mb-2">
          Keranjang Kosong
        </h1>
        <p className="text-secondary-500 mb-8">
          Sepertinya belum ada barang di keranjang belanja kamu. Yuk, mulai belanja!
        </p>
        <Link
          href="/products"
          className="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-xl font-semibold bg-primary-600 text-white hover:bg-primary-700 transition-colors shadow-lg shadow-primary-600/25"
        >
          Mulai Belanja
          <ArrowRight className="w-5 h-5" />
        </Link>
      </div>
    </div>
  );
}
