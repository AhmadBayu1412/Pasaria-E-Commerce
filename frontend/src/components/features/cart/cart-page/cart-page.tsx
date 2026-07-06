'use client';

/**
 * Cart Page Component
 */

import { useCartStore, useCartItemCount } from '@/store/cart.store';
import { CartItemComponent } from './cart-item';
import { CartSummary } from './cart-summary';
import { CartEmpty } from './cart-empty';

export function CartPage() {
  const items = useCartStore((state) => state.items);
  const itemCount = useCartItemCount();

  if (items.length === 0) {
    return <CartEmpty />;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Cart Items */}
      <div className="lg:col-span-2 space-y-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-secondary-900">
            Shopping Cart
          </h1>
          <span className="text-secondary-500">
            {itemCount} item{itemCount !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="space-y-4">
          {items.map((item) => (
            <CartItemComponent key={item.id} item={item} />
          ))}
        </div>
      </div>

      {/* Summary Sidebar */}
      <div className="lg:col-span-1">
        <CartSummary />
      </div>
    </div>
  );
}
