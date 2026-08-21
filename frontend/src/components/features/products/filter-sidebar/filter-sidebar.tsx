'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui';
import { SortOptions } from '@/lib/schemas';
import type { Category } from '../product-card';

interface FilterSidebarProps {
  categories: Category[];
  selectedCategory?: string;
  selectedSort?: string;
  searchQuery?: string;
}

/**
 * Filter Sidebar Component
 * 
 * Handles category and sort filtering with URL sync.
 */
export function FilterSidebar({
  categories,
  selectedCategory,
  selectedSort = 'newest',
  searchQuery,
}: FilterSidebarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateFilters = (updates: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams ? searchParams.toString() : '');

    // Update params
    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });

    // Reset page when filters change
    params.set('page', '1');

    router.push(`/products?${params.toString()}`);
  };

  return (
    <aside className="w-full space-y-6">
      {/* Categories */}
      <div className="space-y-3">
        <h3 className="font-semibold text-secondary-900">Kategori</h3>
        <div className="space-y-2">
          <button
            onClick={() => updateFilters({ category: undefined })}
            className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
              !selectedCategory
                ? 'bg-primary-50 text-primary-700 font-medium'
                : 'text-secondary-600 hover:bg-secondary-100'
            }`}
          >
            Semua Kategori
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => updateFilters({ category: category.slug })}
              className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex justify-between items-center ${
                selectedCategory === category.slug
                  ? 'bg-primary-50 text-primary-700 font-medium'
                  : 'text-secondary-600 hover:bg-secondary-100'
              }`}
            >
              <span>{category.name}</span>
              <span className="text-xs text-secondary-400">{category.productCount}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Sort */}
      <div className="space-y-3">
        <h3 className="font-semibold text-secondary-900">Urutkan</h3>
        <div className="space-y-2">
          {SortOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => updateFilters({ sort: option.value })}
              className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                selectedSort === option.value
                  ? 'bg-primary-50 text-primary-700 font-medium'
                  : 'text-secondary-600 hover:bg-secondary-100'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Clear Filters */}
      {(selectedCategory || searchQuery) && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/products')}
          className="w-full"
        >
          Clear Filters
        </Button>
      )}
    </aside>
  );
}
