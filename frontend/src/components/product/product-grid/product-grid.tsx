'use client';

import { Pagination } from '@/components/ui/pagination';
import { cn } from '@/lib/cn';
import type { SearchProductItem } from '@/types/search';

interface ProductCardProps {
  product: SearchProductItem;
  className?: string;
}

function ProductCard({ product, className }: ProductCardProps) {
  return (
    <div
      className={cn(
        'bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow',
        className,
      )}
    >
      <div className="aspect-square bg-gray-100">
        {product.thumbnail ? (
          <img
            src={product.thumbnail}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            No Image
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-medium text-sm line-clamp-2 mb-2 min-h-[2.5rem]">
          {product.name}
        </h3>
        <p className="text-lg font-bold text-gray-900">
          Rp{product.price.toLocaleString('id-ID')}
        </p>
        {product.originalPrice && product.originalPrice > product.price && (
          <p className="text-sm text-gray-500 line-through">
            Rp{product.originalPrice.toLocaleString('id-ID')}
          </p>
        )}
        <div className="mt-2 flex items-center gap-2">
          <span
            className={`text-xs px-2 py-1 rounded ${
              product.stock > 10
                ? 'bg-green-100 text-green-700'
                : product.stock > 0
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'bg-red-100 text-red-700'
            }`}
          >
            {product.stock > 10 ? 'Tersedia' : product.stock > 0 ? 'Terbatas' : 'Habis'}
          </span>
        </div>
      </div>
    </div>
  );
}

interface ProductGridProps {
  items: SearchProductItem[];
  currentPage: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
  emptyMessage?: string;
  className?: string;
}

export function ProductGrid({
  items,
  currentPage,
  totalPages,
  totalItems,
  onPageChange,
  isLoading,
  emptyMessage = 'Tidak ada produk',
  className,
}: ProductGridProps) {
  if (isLoading) {
    return (
      <div
        className={cn(
          'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4',
          className,
        )}
      >
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-gray-200 aspect-square rounded-lg mb-3" />
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">{emptyMessage}</div>
    );
  }

  return (
    <>
      <div
        className={cn(
          'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4',
          className,
        )}
      >
        {items.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="mt-8">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            onPageChange={onPageChange}
          />
        </div>
      )}
    </>
  );
}
