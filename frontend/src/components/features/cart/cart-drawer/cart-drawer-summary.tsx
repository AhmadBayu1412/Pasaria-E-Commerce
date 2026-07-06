'use client';

/**
 * Cart Drawer Summary Component
 */

import { useRouter } from 'next/navigation';
import { ArrowRight, Loader2 } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useCartStore, useCartItemCount, useIsCheckoutDisabled } from '@/store/cart.store';

interface CartDrawerSummaryProps {
  subtotal: number;
  onClose: () => void;
}

export function CartDrawerSummary({ subtotal, onClose }: CartDrawerSummaryProps) {
  const router = useRouter();
  const itemCount = useCartItemCount();
  const isCheckoutDisabled = useIsCheckoutDisabled();
  const checkoutInProgress = useCartStore((state) => state.checkoutInProgress);
  const setCheckoutInProgress = useCartStore((state) => state.setCheckoutInProgress);

  const handleCheckout = () => {
    setCheckoutInProgress(true);
    onClose();
    router.push('/checkout/preview');
  };

  return (
    <div className="border-t border-secondary-200 bg-white px-6 py-4">
      {/* Subtotal */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-secondary-600">
          Subtotal ({itemCount} item{itemCount !== 1 ? 's' : ''})
        </span>
        <span className="text-lg font-semibold text-secondary-900">
          Rp {subtotal.toLocaleString('id-ID')}
        </span>
      </div>

      {/* Checkout Button */}
      <div className="space-y-3">
        <button
          onClick={handleCheckout}
          disabled={isCheckoutDisabled || checkoutInProgress}
          className={cn(
            'w-full py-3 px-4 rounded-lg font-medium transition-all',
            'flex items-center justify-center gap-2',
            'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
            isCheckoutDisabled || checkoutInProgress
              ? 'bg-secondary-300 text-secondary-500 cursor-not-allowed'
              : 'bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800'
          )}
        >
          {checkoutInProgress ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
              <span>Processing...</span>
            </>
          ) : (
            <>
              <span>Checkout</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </>
          )}
        </button>

        {/* View Cart Link */}
        <button
          onClick={onClose}
          className={cn(
            'w-full py-2 px-4 rounded-lg font-medium transition-colors text-center',
            'text-secondary-600 hover:text-secondary-900 hover:bg-secondary-50',
            'focus:outline-none focus:ring-2 focus:ring-primary-500'
          )}
        >
          View Cart
        </button>
      </div>
    </div>
  );
}
