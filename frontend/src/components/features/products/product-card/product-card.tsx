import Link from 'next/link';
import { Badge } from '@/components/ui';
import type { Product } from './product-card.types';
import { ProductCardImage } from './product-card-image';
import { ProductCardInfo } from './product-card-info';
import { ProductCardPrice } from './product-card-price';
import { ProductCardRating } from './product-card-rating';
import { ProductCardActions } from './product-card-actions';

export interface ProductCardProps {
  product: Product;
  priority?: boolean;
}

/**
 * Product Card Component
 * 
 * A compound component for displaying product information.
 * Uses Link for proper accessibility (keyboard, screen reader, SEO).
 */
export function ProductCard({ product, priority = false }: ProductCardProps) {
  return (
    <article className="group flex flex-col bg-white rounded-lg border border-secondary-200 overflow-hidden hover:shadow-lg transition-shadow duration-200">
      {/* Image with Link wrapper */}
      <Link
        href={`/products/${product.slug}`}
        className="block relative"
        tabIndex={-1}
        aria-hidden="true"
      >
        <ProductCardImage product={product} priority={priority} />
        {/* Badges */}
        {product.badges && product.badges.length > 0 && (
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {product.badges.map((badge) => (
              <Badge
                key={badge}
                variant={badge === 'sale' ? 'error' : badge === 'new' ? 'info' : 'warning'}
              >
                {badge === 'sale' && 'Sale'}
                {badge === 'new' && 'Baru'}
                {badge === 'hot' && 'Hot'}
              </Badge>
            ))}
          </div>
        )}
      </Link>

      {/* Content */}
      <div className="flex flex-col flex-1 p-4">
        <ProductCardInfo product={product} />
        <div className="mt-2">
          <ProductCardPrice product={product} />
        </div>
        <div className="mt-2">
          <ProductCardRating rating={product.rating} reviewCount={product.reviewCount} />
        </div>
        <ProductCardActions
          productId={product.id}
          productName={product.name}
          stock={product.stock}
        />
      </div>
    </article>
  );
}
