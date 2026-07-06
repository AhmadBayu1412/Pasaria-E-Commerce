import Link from 'next/link';
import type { Product } from './product-card.types';

/**
 * Product Card Info Component
 * 
 * Displays product name and category.
 */
export function ProductCardInfo({
  product,
}: {
  product: Pick<Product, 'name' | 'slug' | 'category'>;
}) {
  return (
    <div className="flex-1 min-w-0">
      <p className="text-xs text-secondary-500 mb-1">{product.category.name}</p>
      <Link
        href={`/products/${product.slug}`}
        className="text-sm font-medium text-secondary-900 hover:text-primary-600 transition-colors line-clamp-2"
      >
        {product.name}
      </Link>
    </div>
  );
}
