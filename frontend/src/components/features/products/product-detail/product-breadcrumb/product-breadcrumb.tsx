'use client';

/**
 * Product Breadcrumb Component
 */

import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import type { Category } from '../product-detail.types';

interface ProductBreadcrumbProps {
  category: Category;
  productName: string;
  className?: string;
}

export function ProductBreadcrumb({
  category,
  productName,
  className,
}: ProductBreadcrumbProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      className={`flex items-center gap-1 text-sm ${className || ''}`}
    >
      {/* Home */}
      <Link
        href="/"
        className="flex items-center text-secondary-500 hover:text-primary-600 transition-colors"
      >
        <Home className="w-4 h-4" />
        <span className="sr-only">Beranda</span>
      </Link>

      <ChevronRight className="w-4 h-4 text-secondary-300" />

      {/* Products */}
      <Link
        href="/products"
        className="text-secondary-500 hover:text-primary-600 transition-colors"
      >
        Produk
      </Link>

      <ChevronRight className="w-4 h-4 text-secondary-300" />

      {/* Category */}
      <Link
        href={`/products?category=${category.slug}`}
        className="text-secondary-500 hover:text-primary-600 transition-colors"
      >
        {category.name}
      </Link>

      <ChevronRight className="w-4 h-4 text-secondary-300" />

      {/* Current Product */}
      <span className="text-secondary-700 font-medium truncate max-w-[200px]">
        {productName}
      </span>
    </nav>
  );
}
