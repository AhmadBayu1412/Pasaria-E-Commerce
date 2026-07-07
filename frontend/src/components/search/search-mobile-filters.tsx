'use client';

import { X, SlidersHorizontal } from 'lucide-react';
import { useSearchStore } from '@/store/search-store';
import { SearchFilters } from './search-filters';
import { cn } from '@/lib/cn';
import type { SearchFilters as SearchFiltersType, FacetItem } from '@/types/search';

interface SearchMobileFiltersProps {
  facets?: {
    categories?: FacetItem[];
  };
  filters: SearchFiltersType;
  onCategoryChange: (categoryId: number | undefined) => void;
  onPriceRangeChange: (min?: number, max?: number) => void;
  onAvailabilityChange: (availability: 'all' | 'in_stock') => void;
  onApply: () => void;
}

export function SearchMobileFilters({
  facets,
  filters,
  onCategoryChange,
  onPriceRangeChange,
  onAvailabilityChange,
  onApply,
}: SearchMobileFiltersProps) {
  const { isFilterOpen, setFilterOpen } = useSearchStore();

  return (
    <>
      {/* Mobile Filter Button */}
      <button
        onClick={() => setFilterOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200
                   rounded-full text-sm font-medium hover:bg-gray-50 transition-colors
                   lg:hidden"
      >
        <SlidersHorizontal className="w-4 h-4" />
        Filter
      </button>

      {/* Bottom Sheet Overlay */}
      <div
        className={cn(
          'fixed inset-0 z-50 lg:hidden transition-opacity duration-300',
          isFilterOpen ? 'opacity-100' : 'opacity-0 pointer-events-none',
        )}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/50"
          onClick={() => setFilterOpen(false)}
        />

        {/* Sheet */}
        <div
          className={cn(
            'absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl max-h-[80vh]',
            'transform transition-transform duration-300',
            isFilterOpen ? 'translate-y-0' : 'translate-y-full',
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold">Filter</h2>
            <button
              onClick={() => setFilterOpen(false)}
              className="p-2 rounded-full hover:bg-gray-100"
              aria-label="Close filters"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 overflow-y-auto max-h-[60vh]">
            <SearchFilters
              facets={facets}
              filters={filters}
              onCategoryChange={onCategoryChange}
              onPriceRangeChange={onPriceRangeChange}
              onAvailabilityChange={onAvailabilityChange}
            />
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-100">
            <button
              onClick={onApply}
              className="w-full py-3 bg-primary-600 text-white rounded-lg font-medium
                         hover:bg-primary-700 transition-colors"
            >
              Tampilkan Hasil
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
