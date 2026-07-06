import { formatCurrency } from '@/lib/format';
import type { Product } from './product-card.types';

/**
 * Product Card Price Component
 * 
 * Displays price with discount calculation.
 */
export function ProductCardPrice({
  product,
}: {
  product: Pick<Product, 'price' | 'originalPrice'>;
}) {
  const hasDiscount = product.originalPrice && product.originalPrice > product.price;
  const discountPercentage = hasDiscount
    ? Math.round((1 - product.price / product.originalPrice!) * 100)
    : 0;

  return (
    <div className="flex items-baseline gap-2">
      <span className="text-lg font-bold text-secondary-900">
        {formatCurrency(product.price)}
      </span>
      {hasDiscount && (
        <>
          <span className="text-sm text-secondary-400 line-through">
            {formatCurrency(product.originalPrice!)}
          </span>
          <span className="text-xs font-medium text-red-500">
            -{discountPercentage}%
          </span>
        </>
      )}
    </div>
  );
}
