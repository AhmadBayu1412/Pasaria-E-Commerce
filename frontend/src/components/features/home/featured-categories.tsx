'use client';

/**
 * Featured Categories Section
 * Display categories on homepage with product counts
 */

import Link from 'next/link';
import { Container } from '@/components/layout/container';
import { categoryService } from '@/services/category.service';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { Category } from '@/types/api/category.types';

export function FeaturedCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCategories() {
      try {
        setIsLoading(true);
        const data = await categoryService.getCategories();
        setCategories(data.slice(0, 6)); // Show max 6 categories
        setError(null);
      } catch (err) {
        console.error('Failed to fetch categories:', err);
        setError('Gagal memuat kategori');
      } finally {
        setIsLoading(false);
      }
    }

    fetchCategories();
  }, []);

  return (
    <section className="py-16 md:py-20 bg-white">
      <Container>
        {/* Section Header */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-secondary-900">
              Kategori Pilihan
            </h2>
            <p className="text-secondary-600 mt-2">
              Jelajahi berbagai kategori produk favorit
            </p>
          </div>
          <Link
            href="/categories"
            className="hidden sm:flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium transition-colors"
          >
            Lihat Semua
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Categories Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <CategorySkeleton key={i} />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12 text-secondary-500">
            {error}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/products?category=${category.id}`}
                className="group bg-secondary-50 rounded-2xl p-4 md:p-6 text-center hover:bg-primary-50 hover:shadow-lg transition-all duration-200"
              >
                <div className="text-4xl md:text-5xl mb-3 group-hover:scale-110 transition-transform duration-200">
                  {category.icon}
                </div>
                <h3 className="font-semibold text-secondary-900 group-hover:text-primary-600 transition-colors mb-1">
                  {category.name}
                </h3>
                <p className="text-sm text-secondary-500">
                  {category.productCount} produk
                </p>
              </Link>
            ))}
          </div>
        )}

        {/* Mobile "See All" link */}
        <div className="sm:hidden mt-6 text-center">
          <Link
            href="/categories"
            className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium transition-colors"
          >
            Lihat Semua Kategori
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </Container>
    </section>
  );
}

function CategorySkeleton() {
  return (
    <div className="bg-secondary-50 rounded-2xl p-4 md:p-6 text-center">
      <Skeleton className="w-12 h-12 mx-auto mb-3 rounded-full" />
      <Skeleton className="h-5 w-20 mx-auto mb-2" />
      <Skeleton className="h-4 w-16 mx-auto" />
    </div>
  );
}
