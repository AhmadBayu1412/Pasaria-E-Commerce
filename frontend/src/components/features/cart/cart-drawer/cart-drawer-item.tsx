'use client';

/**
 * Cart Drawer Item Component
 */

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Minus, Plus, Trash2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useCartStore } from '@/store/cart.store';
import type { CartItem } from '@/store/cart.types';

interface CartDrawerItemProps {
  item: CartItem;
}

export function CartDrawerItem({ item }: CartDrawerItemProps) {
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
        'px-6 py-4 transition-opacity',
        isUpdating && 'opacity-50',
        isOutOfStock && 'bg-red-50'
      )}
    >
      <div className="flex gap-4">
        {/* Product Image */}
        <Link
          href={`/products/${item.slug}`}
          className="relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-secondary-100"
        >
          {item.image ? (
            <Image
              src={item.image}
              alt={item.name}
              fill
              className="object-cover"
              sizes="80px"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-secondary-100">
              <span className="text-secondary-400 text-lg font-semibold">
                {item.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </Link>

        {/* Product Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <Link
              href={`/products/${item.slug}`}
              className="text-sm font-medium text-secondary-900 hover:text-primary-600 transition-colors line-clamp-2"
            >
              {item.name}
            </Link>
            <button
              onClick={handleRemove}
              disabled={isUpdating}
              className={cn(
                'p-1 rounded transition-colors flex-shrink-0',
                'text-secondary-400 hover:text-red-500',
                'focus:outline-none focus:ring-2 focus:ring-red-500'
              )}
              aria-label={`Remove ${item.name} from cart`}
            >
              <Trash2 className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>

          {/* Variant Info */}
          {item.variantInfo && (
            <p className="text-xs text-secondary-500 mt-1">
              {item.variantInfo.color && `${item.variantInfo.color}`}
              {item.variantInfo.color && item.variantInfo.size && ' / '}
              {item.variantInfo.size}
            </p>
          )}

          {/* Price */}
          <div className="mt-2">
            <span className="text-sm font-semibold text-secondary-900">
              Rp {item.price.toLocaleString('id-ID')}
            </span>
            {priceChanged && (
              <span className="ml-2 text-xs text-blue-600">
                (Changed from Rp {item.currentPrice.toLocaleString('id-ID')})
              </span>
            )}
          </div>

          {/* Stock Warning */}
          {isOutOfStock && (
            <div className="flex items-center gap-1 mt-2 text-xs text-red-600">
              <AlertCircle className="w-3 h-3" aria-hidden="true" />
              <span>Stok habis atau melebihi available</span>
            </div>
          )}

          {/* Quantity Controls */}
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleQuantityChange(item.quantity - 1)}
                disabled={isUpdating || item.quantity <= 1}
                className={cn(
                  'w-7 h-7 rounded-lg flex items-center justify-center transition-colors',
                  'border border-secondary-200 hover:bg-secondary-50',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  'focus:outline-none focus:ring-2 focus:ring-primary-500'
                )}
                aria-label="Decrease quantity"
              >
                <Minus className="w-3 h-3" aria-hidden="true" />
              </button>
              <span className="w-8 text-center text-sm font-medium">
                {item.quantity}
              </span>
              <button
                onClick={() => handleQuantityChange(item.quantity + 1)}
                disabled={isUpdating || item.quantity >= item.stock}
                className={cn(
                  'w-7 h-7 rounded-lg flex items-center justify-center transition-colors',
                  'border border-secondary-200 hover:bg-secondary-50',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  'focus:outline-none focus:ring-2 focus:ring-primary-500'
                )}
                aria-label="Increase quantity"
              >
                <Plus className="w-3 h-3" aria-hidden="true" />
              </button>
            </div>

            {/* Subtotal for this item */}
            <span className="text-sm font-medium text-secondary-900">
              Rp {(item.price * item.quantity).toLocaleString('id-ID')}
            </span>
          </div>

          {/* Stock info */}
          <p className="text-xs text-secondary-400 mt-1">
            Stok tersedia: {item.stock}
          </p>
        </div>
      </div>
    </div>
  );
}
