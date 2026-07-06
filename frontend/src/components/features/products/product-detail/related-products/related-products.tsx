'use client';

/**
 * Related Products Component
 */

import Link from 'next/link';
import Image from 'next/image';
import { Badge } from '@/components/ui';
import { formatCurrency } from '@/lib/format';
import type { ProductListItem } from '../product-detail.types';

interface RelatedProductsProps {
  products: ProductListItem[];
  className?: string;
}

export function RelatedProducts({ products, className }: RelatedProductsProps) {
  if (!products || products.length === 0) {
    return null;
  }

  return (
    <section className={className}>
      <h2 className="text-xl font-bold text-secondary-900 mb-6">
        Produk Terkait
      </h2>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {products.map((product) => {
          const discount = product.originalPrice
            ? Math.round((1 - product.price / product.originalPrice) * 100)
            : 0;

          return (
            <Link
              key={product.id}
              href={`/products/${product.slug}`}
              className="group block bg-white rounded-lg border border-secondary-200 overflow-hidden hover:shadow-lg transition-shadow duration-200"
            >
              {/* Image */}
              <div className="relative aspect-square bg-secondary-50">
                {product.primaryImage ? (
                  <Image
                    src={product.primaryImage}
                    alt={product.name}
                    fill
                    sizes="(max-width: 768px) 50vw, 25vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-secondary-400">
                    Tidak ada gambar
                  </div>
                )}
                
                {/* Badges */}
                {product.badges && product.badges.length > 0 && (
                  <div className="absolute top-2 left-2 flex flex-col gap-1">
                    {product.badges.slice(0, 2).map((badge) => (
                      <Badge
                        key={badge}
                        variant={badge === 'sale' ? 'error' : badge === 'new' ? 'info' : 'warning'}
                      >
                        {badge === 'sale' && `${discount}%`}
                        {badge === 'new' && 'Baru'}
                        {badge === 'hot' && 'Hot'}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-3">
                <h3 className="text-sm font-medium text-secondary-900 line-clamp-2 group-hover:text-primary-600 transition-colors">
                  {product.name}
                </h3>
                <div className="mt-2">
                  <span className="text-sm font-bold text-primary-600">
                    {formatCurrency(product.price)}
                  </span>
                  {product.originalPrice && (
                    <span className="ml-2 text-xs text-secondary-400 line-through">
                      {formatCurrency(product.originalPrice)}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
