'use client';

/**
 * Product Info Component
 * 
 * Displays product information: name, price, rating, badges, stock.
 */

import Link from 'next/link';
import { Star, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui';
import { formatCurrency } from '@/lib/format';
import type { Product } from '../product-detail.types';

interface ProductInfoProps {
  product: Product;
  className?: string;
}

export function ProductInfo({ product, className }: ProductInfoProps) {
  const discount = product.originalPrice
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : 0;

  return (
    <div className={className}>
      {/* Category */}
      <Link
        href={`/products?category=${product.category.slug}`}
        className="text-sm text-primary-600 hover:text-primary-700 hover:underline"
      >
        {product.category.name}
      </Link>

      {/* Name */}
      <h1 className="text-2xl md:text-3xl font-bold text-secondary-900 mt-1">
        {product.name}
      </h1>

      {/* SKU */}
      <p className="text-sm text-secondary-500 mt-1">
        SKU: {product.sku}
      </p>

      {/* Badges */}
      {product.badges && product.badges.length > 0 && (
        <div className="flex gap-2 mt-3">
          {product.badges.map((badge) => (
            <Badge
              key={badge}
              variant={badge === 'sale' ? 'error' : badge === 'new' ? 'info' : 'warning'}
            >
              {badge === 'sale' && `Diskon ${discount}%`}
              {badge === 'new' && 'Baru'}
              {badge === 'hot' && 'Terlaris'}
            </Badge>
          ))}
        </div>
      )}

      {/* Rating */}
      <div className="flex items-center gap-2 mt-4">
        <div className="flex items-center">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={`w-5 h-5 ${
                star <= Math.round(product.rating)
                  ? 'fill-warning-400 text-warning-400'
                  : 'text-secondary-300'
              }`}
            />
          ))}
        </div>
        <span className="text-sm text-secondary-600">
          {product.rating.toFixed(1)} ({product.reviewCount.toLocaleString()} ulasan)
        </span>
      </div>

      {/* Price */}
      <div className="mt-6">
        <div className="flex items-baseline gap-3">
          <span className="text-3xl font-bold text-primary-600">
            {formatCurrency(product.price)}
          </span>
          {product.originalPrice && (
            <>
              <span className="text-lg text-secondary-400 line-through">
                {formatCurrency(product.originalPrice)}
              </span>
              <Badge variant="error">Hemat {discount}%</Badge>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
