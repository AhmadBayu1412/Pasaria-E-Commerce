'use client';

/**
 * Cart Item Component (Full Page Version)
 */

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Minus, Plus, Trash2, AlertCircle, Check } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useCartStore } from '@/store/cart.store';
import type { CartItem } from '@/store/cart.types';

interface CartItemProps {
  item: CartItem;
}

export function CartItemComponent({ item }: CartItemProps) {
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleQuantityChange = async (newQuantity: number) => {
    if (newQuantity < 1) {
      await handleRemove();
      return;
    }

    if (newQuantity > item.stock) {
      return;
    }

    setIsUpdating(true);
    try {
      updateQuantity(item.id, newQuantity);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemove = async () => {
    setIsUpdating(true);
    try {
      removeItem(item.id);
    } finally {
      setIsUpdating(false);
    }
  };

  const isOutOfStock = !item.isAvailable || item.quantity > item.stock;
  const priceChanged = item.price !== item.currentPrice;

  return (
    <div
      className={cn(
        'bg-white rounded-xl border transition-all',
        isUpdating && 'opacity-50',
        isOutOfStock ? 'border-red-200 bg-red-50/30' : 'border-secondary-200'
      )}
    >
      <div className="p-6">
        <div className="flex gap-6">
          {/* Product Image */}
          <Link
            href={`/products/${item.slug}`}
            className="relative w-28 h-28 flex-shrink-0 rounded-lg overflow-hidden bg-secondary-100"
          >
            <Image
              src={item.image}
              alt={item.name}
              fill
              className="object-cover"
              sizes="112px"
            />
          </Link>

          {/* Product Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div>
                <Link
                  href={`/products/${item.slug}`}
                  className="text-lg font-medium text-secondary-900 hover:text-primary-600 transition-colors"
                >
                  {item.name}
                </Link>
                <p className="text-sm text-secondary-500 mt-1">
                  SKU: {item.id}
                </p>
              </div>
              <button
                onClick={handleRemove}
                disabled={isUpdating}
                className={cn(
                  'p-2 rounded-lg transition-colors flex-shrink-0',
                  'text-secondary-400 hover:text-red-500 hover:bg-red-50',
                  'focus:outline-none focus:ring-2 focus:ring-red-500'
                )}
                aria-label={`Remove ${item.name} from cart`}
              >
                <Trash2 className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            {/* Variant Info */}
            {item.variantInfo && (
              <div className="flex gap-2 mt-2">
                {item.variantInfo.color && (
                  <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-secondary-100 text-secondary-700">
                    {item.variantInfo.color}
                  </span>
                )}
                {item.variantInfo.size && (
                  <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-secondary-100 text-secondary-700">
                    {item.variantInfo.size}
                  </span>
                )}
              </div>
            )}

            {/* Warnings */}
            <div className="flex flex-wrap gap-3 mt-3">
              {priceChanged && (
                <div className="flex items-center gap-1.5 text-sm text-blue-600 bg-blue-50 px-2 py-1 rounded">
                  <AlertCircle className="w-4 h-4" aria-hidden="true" />
                  <span>Harga berubah dari Rp {item.currentPrice.toLocaleString('id-ID')}</span>
                </div>
              )}
              {isOutOfStock && (
                <div className="flex items-center gap-1.5 text-sm text-red-600 bg-red-50 px-2 py-1 rounded">
                  <AlertCircle className="w-4 h-4" aria-hidden="true" />
                  <span>Stok tidak tersedia</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Row: Price, Quantity, Subtotal */}
        <div className="flex items-center justify-between mt-6 pt-6 border-t border-secondary-100">
          {/* Unit Price */}
          <div>
            <p className="text-sm text-secondary-500">Harga per item</p>
            <p className="text-lg font-semibold text-secondary-900">
              Rp {item.price.toLocaleString('id-ID')}
            </p>
          </div>

          {/* Quantity Controls */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleQuantityChange(item.quantity - 1)}
                disabled={isUpdating || item.quantity <= 1}
                className={cn(
                  'w-10 h-10 rounded-lg flex items-center justify-center transition-colors',
                  'border border-secondary-200 hover:bg-secondary-50',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  'focus:outline-none focus:ring-2 focus:ring-primary-500'
                )}
                aria-label="Decrease quantity"
              >
                <Minus className="w-4 h-4" aria-hidden="true" />
              </button>
              <input
                type="number"
                value={item.quantity}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  if (!isNaN(val)) handleQuantityChange(val);
                }}
                min={1}
                max={item.stock}
                className={cn(
                  'w-16 h-10 rounded-lg border text-center font-medium',
                  'focus:outline-none focus:ring-2 focus:ring-primary-500',
                  isOutOfStock ? 'border-red-300 bg-red-50' : 'border-secondary-200'
                )}
                aria-label="Quantity"
              />
              <button
                onClick={() => handleQuantityChange(item.quantity + 1)}
                disabled={isUpdating || item.quantity >= item.stock}
                className={cn(
                  'w-10 h-10 rounded-lg flex items-center justify-center transition-colors',
                  'border border-secondary-200 hover:bg-secondary-50',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  'focus:outline-none focus:ring-2 focus:ring-primary-500'
                )}
                aria-label="Increase quantity"
              >
                <Plus className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>

            {/* Stock Info */}
            <p className="text-sm text-secondary-400">
              Stok: {item.stock}
            </p>
          </div>

          {/* Item Subtotal */}
          <div className="text-right">
            <p className="text-sm text-secondary-500">Subtotal</p>
            <p className="text-xl font-bold text-secondary-900">
              Rp {(item.price * item.quantity).toLocaleString('id-ID')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
