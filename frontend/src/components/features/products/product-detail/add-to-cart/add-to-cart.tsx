'use client';

/**
 * Add to Cart Button Component
 */

import { ShoppingCart, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui';
import { cn } from '@/lib/cn';

interface AddToCartButtonProps {
  onClick: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  stock?: number;
  className?: string;
}

export function AddToCartButton({
  onClick,
  isLoading = false,
  disabled = false,
  stock = 0,
  className,
}: AddToCartButtonProps) {
  const isOutOfStock = stock === 0;

  return (
    <div className={cn('space-y-2', className)}>
      <Button
        onClick={onClick}
        disabled={disabled || isLoading || isOutOfStock}
        className={cn(
          'w-full gap-2',
          isOutOfStock && 'bg-secondary-400 hover:bg-secondary-400 cursor-not-allowed'
        )}
        size="lg"
        aria-label={isOutOfStock ? 'Stok habis' : 'Tambah ke keranjang'}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Memproses...</span>
          </>
        ) : isOutOfStock ? (
          'Stok Habis'
        ) : (
          <>
            <ShoppingCart className="w-5 h-5" />
            <span>Tambah ke Keranjang</span>
          </>
        )}
      </Button>

      {isOutOfStock && (
        <p className="text-sm text-error-600 text-center" role="alert">
          Maaf, produk ini sedang tidak tersedia
        </p>
      )}
    </div>
  );
}
