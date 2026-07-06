'use client';

import Image from 'next/image';
import type { Product } from './product-card.types';

/**
 * Product Card Image Component
 * 
 * Handles product image with blur placeholder and fallback.
 */
export function ProductCardImage({
  product,
  priority = false,
}: {
  product: Pick<Product, 'name' | 'images'>;
  priority?: boolean;
}) {
  const imageUrl = product.images[0] || '/images/product-placeholder.png';
  const blurDataUrl = `data:image/svg+xml;base64,${Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
      <rect fill="#e2e8f0" width="400" height="300"/>
      <text fill="#94a3b8" font-family="sans-serif" font-size="14" x="50%" y="50%" text-anchor="middle" dy=".3em">No Image</text>
    </svg>`
  ).toString('base64')}`;

  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-t-lg bg-secondary-100">
      <Image
        src={imageUrl}
        alt={product.name}
        fill
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        className="object-cover"
        placeholder="blur"
        blurDataURL={blurDataUrl}
        priority={priority}
      />
    </div>
  );
}
