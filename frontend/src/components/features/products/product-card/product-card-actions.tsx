'use client';

import { Button } from '@/components/ui';

/**
 * Product Card Actions Component
 * 
 * Handles wishlist, compare, and add-to-cart actions.
 */
export function ProductCardActions({
  productId,
  productName,
  stock,
}: {
  productId: string;
  productName: string;
  stock: number;
}) {
  const isOutOfStock = stock === 0;

  return (
    <div className="flex items-center gap-2 pt-2">
      {isOutOfStock ? (
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          disabled
        >
          Stok Habis
        </Button>
      ) : (
        <Button
          variant="primary"
          size="sm"
          className="flex-1"
          aria-label={`Tambah ${productName} ke keranjang`}
        >
          + Keranjang
        </Button>
      )}
      <Button
        variant="ghost"
        size="sm"
        aria-label={`Tambah ${productName} ke wishlist`}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      </Button>
    </div>
  );
}
