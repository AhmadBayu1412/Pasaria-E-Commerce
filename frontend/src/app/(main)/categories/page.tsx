'use client';

/**
 * Categories Page
 * Route: /categories
 * Displays all categories with product counts from API
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Container } from '@/components/layout/container';
import { Skeleton } from '@/components/ui/skeleton';
import { categoryService } from '@/services/category.service';
import type { Category } from '@/types/api/category.types';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCategories() {
      try {
        setIsLoading(true);
        setError(null);
        const data = await categoryService.getCategories();
        setCategories(data);
      } catch (err) {
        console.error('Failed to fetch categories:', err);
        setError('Gagal memuat kategori. Silakan coba lagi.');
      } finally {
        setIsLoading(false);
      }
    }

    fetchCategories();
  }, []);

  // Calculate total products
  const totalProducts = categories.reduce(
    (sum, cat) => sum + cat.productCount,
    0
  );

  return (
    <div className="bg-secondary-50 min-h-screen">
      <Container>
        <div className="py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-secondary-900">
              Kategori Produk
            </h1>
            <p className="text-secondary-600 mt-1">
              {isLoading ? (
                'Memuat...'
              ) : (
                <>
                  {categories.length} kategori dengan {totalProducts.toLocaleString('id-ID')} produk
                </>
              )}
            </p>
          </div>

          {/* Content */}
          {isLoading ? (
            <CategoriesSkeleton />
          ) : error ? (
            <ErrorState message={error} onRetry={() => window.location.reload()} />
          ) : categories.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories.map((category) => (
                <Link
                  key={category.id}
                  href={`/products?category=${category.id}`}
                  className="group bg-white rounded-xl border border-secondary-200 p-6 hover:border-primary-300 hover:shadow-lg transition-all duration-200"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 bg-primary-50 rounded-xl flex items-center justify-center text-3xl group-hover:bg-primary-100 transition-colors">
                      {category.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="font-semibold text-secondary-900 group-hover:text-primary-600 transition-colors">
                        {category.name}
                      </h2>
                      <p className="text-sm text-secondary-500 mt-1 line-clamp-2">
                        {category.description}
                      </p>
                      <p className="text-sm text-primary-600 font-medium mt-3">
                        {category.productCount.toLocaleString('id-ID')} produk
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </Container>
    </div>
  );
}

function CategoriesSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="bg-white rounded-xl border border-secondary-200 p-6"
        >
          <div className="flex items-start gap-4">
            <Skeleton className="w-14 h-14 rounded-xl" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="bg-white rounded-xl border border-secondary-200 p-12 text-center">
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg
          className="w-8 h-8 text-red-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-secondary-900 mb-2">
        Gagal memuat kategori
      </h3>
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
    <div className="bg-white rounded-xl border border-secondary-200 p-12 text-center">
      <div className="w-16 h-16 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg
          className="w-8 h-8 text-secondary-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
          />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-secondary-900 mb-2">
        Tidak ada kategori
      </h3>
      <p className="text-secondary-500">
        Belum ada kategori produk yang tersedia saat ini.
      </p>
    </div>
  );
}
