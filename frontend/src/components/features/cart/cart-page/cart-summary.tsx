'use client';

/**
 * Cart Summary Component (Full Page Version)
 */

import { useRouter } from 'next/navigation';
import { ArrowRight, Loader2, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useCartStore, useCartSubtotal, useCartItemCount, useIsCheckoutDisabled, useHasUnavailableItems } from '@/store/cart.store';

export function CartSummary() {
  const router = useRouter();
  const subtotal = useCartSubtotal();
  const itemCount = useCartItemCount();
  const isCheckoutDisabled = useIsCheckoutDisabled();
  const hasUnavailableItems = useHasUnavailableItems();
  const checkoutInProgress = useCartStore((state) => state.checkoutInProgress);
  const setCheckoutInProgress = useCartStore((state) => state.setCheckoutInProgress);

  const handleCheckout = () => {
    setCheckoutInProgress(true);
    router.push('/checkout/preview');
  };

  return (
    <div className="bg-white rounded-xl border border-secondary-200 p-6 sticky top-24">
      <h3 className="text-lg font-semibold text-secondary-900 mb-4">
        Ringkasan Pesanan
      </h3>

      {/* Summary Items */}
      <div className="space-y-3 mb-6">
        <div className="flex justify-between text-secondary-600">
          <span>Subtotal ({itemCount} item{itemCount !== 1 ? 's' : ''})</span>
          <span>Rp {subtotal.toLocaleString('id-ID')}</span>
        </div>
        <div className="flex justify-between text-secondary-600">
          <span>Shipping</span>
          <span className="text-secondary-400">Dihitung saat checkout</span>
        </div>
        <div className="border-t border-secondary-100 pt-3">
          <div className="flex justify-between">
            <span className="font-semibold text-secondary-900">Total</span>
            <span className="text-xl font-bold text-secondary-900">
              Rp {subtotal.toLocaleString('id-ID')}
            </span>
          </div>
        </div>
      </div>

      {/* Unavailable Items Warning */}
      {hasUnavailableItems && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <p className="text-sm text-amber-800">
              Beberapa item tidak tersedia atau melebihi stok. Mohon periksa kembali sebelum checkout.
            </p>
          </div>
        </div>
      )}

      {/* Checkout Button */}
      <button
        onClick={handleCheckout}
        disabled={isCheckoutDisabled || checkoutInProgress}
        className={cn(
          'w-full py-3.5 px-4 rounded-lg font-semibold transition-all',
          'flex items-center justify-center gap-2',
          'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
          isCheckoutDisabled || checkoutInProgress
            ? 'bg-secondary-300 text-secondary-500 cursor-not-allowed'
            : 'bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800'
        )}
      >
        {checkoutInProgress ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
            <span>Processing...</span>
          </>
        ) : (
          <>
            <span>Proceed to Checkout</span>
            <ArrowRight className="w-5 h-5" aria-hidden="true" />
          </>
        )}
      </button>

      {/* Continue Shopping */}
      <button
        onClick={() => router.push('/products')}
        className={cn(
          'w-full mt-3 py-2.5 px-4 rounded-lg font-medium transition-colors text-center',
          'text-secondary-600 hover:text-secondary-900 hover:bg-secondary-50',
          'focus:outline-none focus:ring-2 focus:ring-primary-500'
        )}
      >
        Continue Shopping
      </button>
    </div>
  );
}
