'use client';

/**
 * Product Gallery Component
 * 
 * Image gallery with thumbnails for product detail page.
 */

import { useState, useCallback } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/cn';
import type { ProductImage } from '../product-detail.types';

interface ProductGalleryProps {
  images: ProductImage[];
  productName: string;
  className?: string;
}

export function ProductGallery({ images, productName, className }: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        setActiveIndex((prev) => Math.max(0, prev - 1));
      } else if (e.key === 'ArrowRight') {
        setActiveIndex((prev) => Math.min(images.length - 1, prev + 1));
      }
    },
    [images.length]
  );

  // If no images, show placeholder
  if (!images || images.length === 0) {
    return (
      <div className={cn('relative aspect-square bg-secondary-100 rounded-lg flex items-center justify-center', className)}>
        <span className="text-secondary-400">Tidak ada gambar</span>
      </div>
    );
  }

  const currentImage = images[activeIndex] || images[0];

  return (
    <div
      className={cn('space-y-4', className)}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="region"
      aria-label="Galeri gambar produk"
    >
      {/* Main Image */}
      <div className="relative aspect-square bg-secondary-50 rounded-xl overflow-hidden border border-secondary-200">
        <Image
          src={currentImage.url}
          alt={currentImage.alt || productName}
          fill
          priority={activeIndex === 0}
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover"
        />
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div
          className="flex gap-2 overflow-x-auto pb-2"
          role="list"
          aria-label="Thumbnail gambar"
        >
          {images.map((image, index) => (
            <button
              key={image.id}
              onClick={() => setActiveIndex(index)}
              aria-label={`Lihat gambar ${index + 1}`}
              aria-current={index === activeIndex ? 'true' : undefined}
              className={cn(
                'relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all duration-200',
                'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
                index === activeIndex
                  ? 'border-primary-500 shadow-md'
                  : 'border-transparent hover:border-secondary-300'
              )}
            >
              <Image
                src={image.url}
                alt={image.alt || `${productName} - Gambar ${index + 1}`}
                fill
                sizes="64px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Image Counter */}
      {images.length > 1 && (
        <p className="text-sm text-secondary-500 text-center">
          {activeIndex + 1} / {images.length}
        </p>
      )}
    </div>
  );
}
