'use client';

/**
 * Products Page
 * Route: /products
 */

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useProducts } from '@/lib/hooks/use-product';
import { Container } from '@/components/layout/container';
import { Skeleton } from '@/components/ui/skeleton';
import { ShoppingCart, Heart } from 'lucide-react';
import { useCartStore } from '@/store/cart.store';
import { cn } from '@/lib/cn';

export default function ProductsPage() {
  const [page, setPage] = useState(1);
  const limit = 12;

  const { products, isLoading, error, refetch } = useProducts(page, limit);

  return (
    <div className="bg-secondary-50 min-h-screen">
      <Container>
        {/* Header */}
        <div className="py-6">
          <h1 className="text-2xl font-bold text-secondary-900">
            Semua Produk
          </h1>
          <p className="text-secondary-600 mt-1">
            Jelajahi koleksi produk kami
          </p>
        </div>

        {/* Content */}
        {isLoading ? (
          <ProductsSkeleton />
        ) : error ? (
          <ErrorState message={error} onRetry={refetch} />
        ) : products.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {/* Product Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {/* Pagination */}
            <div className="mt-8 flex justify-center gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-4 py-2 border border-secondary-200 rounded-lg hover:bg-secondary-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="px-4 py-2 text-secondary-600">Page {page}</span>
              <button
                onClick={() => setPage(page + 1)}
                className="px-4 py-2 border border-secondary-200 rounded-lg hover:bg-secondary-100"
              >
                Next
              </button>
            </div>
          </>
        )}
      </Container>
    </div>
  );
}

interface ProductCardProps {
  product: {
    id: number;
    slug: string;
    name: string;
    price: number;
    primaryImage: string | null;
    isAvailable: boolean;
  };
}

function ProductCard({ product }: ProductCardProps) {
  const addItem = useCartStore((state) => state.addItem);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    addItem({
      id: `temp-${product.id}`,
      productId: String(product.id),
      name: product.name,
      slug: product.slug,
      price: product.price,
      currentPrice: product.price,
      quantity: 1,
      image: product.primaryImage || '',
      stock: 0,
      isAvailable: product.isAvailable,
    });
  };

  return (
    <Link href={`/products/${product.slug}`}>
      <article className="group bg-white rounded-lg border border-secondary-200 overflow-hidden hover:shadow-lg hover:border-primary-300 transition-all duration-200">
        {/* Image */}
        <div className="relative aspect-square bg-secondary-100">
          {product.primaryImage ? (
            <Image
              src={product.primaryImage}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              className="object-cover group-hover:scale-105 transition-transform duration-200"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-secondary-400">No Image</span>
            </div>
          )}

          {/* Overlay Actions */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
            <button
              onClick={handleAddToCart}
              className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-lg text-sm font-medium text-secondary-800 hover:bg-primary-600 hover:text-white transition-colors"
            >
              <ShoppingCart className="w-4 h-4" />
              Add to Cart
            </button>
          </div>

          {/* Availability Badge */}
          {!product.isAvailable && (
            <div className="absolute top-2 left-2 px-2 py-1 bg-red-500 text-white text-xs font-medium rounded">
              Sold Out
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-4">
          <h3 className="font-medium text-secondary-900 group-hover:text-primary-600 transition-colors line-clamp-2">
            {product.name}
          </h3>
          <p className="mt-2 text-lg font-bold text-primary-600">
            Rp {product.price.toLocaleString('id-ID')}
          </p>
        </div>
      </article>
    </Link>
  );
}

function ProductsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="bg-white rounded-lg border border-secondary-200 overflow-hidden">
          <Skeleton className="aspect-square w-full rounded-none" />
          <div className="p-4 space-y-3">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-6 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="bg-white rounded-lg border border-secondary-200 p-12 text-center">
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-secondary-900 mb-2">Gagal memuat produk</h3>
      <p className="text-secondary-500 mb-6">{message}</p>
      <button
        onClick={onRetry}
        className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
      >
        Coba Lagi
      </button>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="bg-white rounded-lg border border-secondary-200 p-12 text-center">
      <div className="w-16 h-16 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg className="w-8 h-8 text-secondary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-secondary-900 mb-2">Tidak ada produk</h3>
      <p className="text-secondary-500">Saat ini belum ada produk yang tersedia.</p>
    </div>
  );
}
