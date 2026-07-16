'use client';

/**
 * Filter Sidebar Component
 * Sidebar with category filter and product counts
 */

import { useEffect, useState } from 'react';
import { categoryService } from '@/services/category.service';
import { Skeleton } from '@/components/ui/skeleton';
import { X, ChevronDown } from 'lucide-react';
import type { Category } from '@/types/api/category.types';

interface FilterSidebarProps {
  selectedCategoryId: number | null;
  onCategorySelect: (categoryId: number | null) => void;
}

export function FilterSidebar({
  selectedCategoryId,
  onCategorySelect,
}: FilterSidebarProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    async function fetchCategories() {
      try {
        setIsLoading(true);
        const data = await categoryService.getCategories();
        setCategories(data);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch categories:', err);
        setError('Gagal memuat filter');
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
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed bottom-4 right-4 z-40 w-14 h-14 bg-primary-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-primary-700 transition-colors"
        aria-label="Toggle filters"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
          />
        </svg>
      </button>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:relative inset-y-0 left-0 z-50 lg:z-auto
          w-80 lg:w-64 bg-white lg:bg-transparent
          transform transition-transform duration-300 lg:transform-none
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          lg:block p-6 lg:p-0
          overflow-y-auto lg:overflow-visible
          border-r lg:border-r-0 border-secondary-200
        `}
      >
        {/* Mobile Header */}
        <div className="flex items-center justify-between mb-6 lg:hidden">
          <h2 className="text-lg font-semibold text-secondary-900">Filter</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 text-secondary-500 hover:text-secondary-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Categories Section */}
        <div className="bg-white lg:rounded-xl lg:border lg:border-secondary-200 lg:p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-secondary-900">Kategori</h3>
            {selectedCategoryId && (
              <button
                onClick={() => onCategorySelect(null)}
                className="text-xs text-primary-600 hover:text-primary-700 font-medium"
              >
                Reset
              </button>
            )}
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : error ? (
            <p className="text-sm text-red-500">{error}</p>
          ) : (
            <div className="space-y-1">
              {/* All Products */}
              <button
                onClick={() => onCategorySelect(null)}
                className={`
                  w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition-colors
                  ${
                    selectedCategoryId === null
                      ? 'bg-primary-50 text-primary-700 font-medium'
                      : 'text-secondary-700 hover:bg-secondary-50'
                  }
                `}
              >
                <span>Semua Produk</span>
                <span
                  className={`
                    text-xs px-2 py-0.5 rounded-full
                    ${
                      selectedCategoryId === null
                        ? 'bg-primary-100 text-primary-700'
                        : 'bg-secondary-100 text-secondary-600'
                    }
                  `}
                >
                  {totalProducts}
                </span>
              </button>

              {/* Category List */}
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => onCategorySelect(category.id)}
                  className={`
                    w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition-colors
                    ${
                      selectedCategoryId === category.id
                        ? 'bg-primary-50 text-primary-700 font-medium'
                        : 'text-secondary-700 hover:bg-secondary-50'
                    }
                  `}
                >
                  <div className="flex items-center gap-2">
                    <span>{category.icon}</span>
                    <span className="truncate">{category.name}</span>
                  </div>
                  <span
                    className={`
                      text-xs px-2 py-0.5 rounded-full flex-shrink-0
                      ${
                        selectedCategoryId === category.id
                          ? 'bg-primary-100 text-primary-700'
                          : 'bg-secondary-100 text-secondary-600'
                      }
                    `}
                  >
                    {category.productCount}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Mobile Apply Button */}
        <div className="mt-6 lg:hidden">
          <button
            onClick={() => setIsOpen(false)}
            className="w-full py-3 bg-primary-600 text-white font-medium rounded-xl hover:bg-primary-700 transition-colors"
          >
            Tampilkan Hasil
          </button>
        </div>
      </aside>
    </>
  );
}
