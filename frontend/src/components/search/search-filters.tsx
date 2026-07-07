'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { SearchFilters as SearchFiltersType, FacetItem } from '@/types/search';

interface SearchFiltersProps {
  facets?: {
    categories?: FacetItem[];
  };
  filters: SearchFiltersType;
  onCategoryChange: (categoryId: number | undefined) => void;
  onPriceRangeChange: (min?: number, max?: number) => void;
  onAvailabilityChange: (availability: 'all' | 'in_stock') => void;
}

export function SearchFilters({
  facets,
  filters,
  onCategoryChange,
  onPriceRangeChange,
  onAvailabilityChange,
}: SearchFiltersProps) {
  const [priceMin, setPriceMin] = useState(filters.minPrice?.toString() || '');
  const [priceMax, setPriceMax] = useState(filters.maxPrice?.toString() || '');
  const [expandedSections, setExpandedSections] = useState({
    category: true,
    price: true,
    availability: true,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const handlePriceApply = () => {
    const min = priceMin ? Number(priceMin) : undefined;
    const max = priceMax ? Number(priceMax) : undefined;
    onPriceRangeChange(min, max);
  };

  const handlePriceClear = () => {
    setPriceMin('');
    setPriceMax('');
    onPriceRangeChange(undefined, undefined);
  };

  // Active filters for display
  const hasActiveFilters =
    filters.category !== undefined ||
    filters.minPrice !== undefined ||
    filters.maxPrice !== undefined ||
    filters.availability !== 'all';

  return (
    <div className="space-y-4">
      {/* Active Filters */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 pb-4 border-b border-gray-100">
          {filters.category !== undefined && (
            <button
              onClick={() => onCategoryChange(undefined)}
              className="flex items-center gap-1 px-3 py-1 bg-primary-100 text-primary-700
                         rounded-full text-sm hover:bg-primary-200 transition-colors"
            >
              Kategori
              <X className="w-3 h-3" />
            </button>
          )}
          {(filters.minPrice !== undefined || filters.maxPrice !== undefined) && (
            <button
              onClick={handlePriceClear}
              className="flex items-center gap-1 px-3 py-1 bg-primary-100 text-primary-700
                         rounded-full text-sm hover:bg-primary-200 transition-colors"
            >
              Rp{filters.minPrice?.toLocaleString() || '0'} - Rp
              {filters.maxPrice?.toLocaleString() || '∞'}
              <X className="w-3 h-3" />
            </button>
          )}
          {filters.availability === 'in_stock' && (
            <button
              onClick={() => onAvailabilityChange('all')}
              className="flex items-center gap-1 px-3 py-1 bg-primary-100 text-primary-700
                         rounded-full text-sm hover:bg-primary-200 transition-colors"
            >
              Tersedia
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      )}

      {/* Categories */}
      {facets?.categories && facets.categories.length > 0 && (
        <FilterSection
          title="Kategori"
          isExpanded={expandedSections.category}
          onToggle={() => toggleSection('category')}
        >
          <div className="space-y-2">
            {facets.categories.map((category) => (
              <label
                key={category.value}
                className="flex items-center gap-3 cursor-pointer group"
              >
                <input
                  type="radio"
                  name="category"
                  checked={filters.category === category.value}
                  onChange={() => onCategoryChange(category.value)}
                  className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                />
                <span className="flex-1 text-sm group-hover:text-primary-600">
                  {category.label}
                </span>
                <span className="text-xs text-gray-400">({category.count})</span>
              </label>
            ))}
          </div>
        </FilterSection>
      )}

      {/* Price Range */}
      <FilterSection
        title="Harga"
        isExpanded={expandedSections.price}
        onToggle={() => toggleSection('price')}
      >
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <input
              type="number"
              placeholder="Min"
              value={priceMin}
              onChange={(e) => setPriceMin(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg
                         focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            />
            <span className="text-gray-400">-</span>
            <input
              type="number"
              placeholder="Max"
              value={priceMax}
              onChange={(e) => setPriceMax(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg
                         focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handlePriceApply}
              className="flex-1 py-2 bg-gray-100 text-sm font-medium rounded-lg
                         hover:bg-gray-200 transition-colors"
            >
              Terapkan
            </button>
            <button
              onClick={handlePriceClear}
              className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700"
            >
              Reset
            </button>
          </div>
        </div>
      </FilterSection>

      {/* Availability */}
      <FilterSection
        title="Ketersediaan"
        isExpanded={expandedSections.availability}
        onToggle={() => toggleSection('availability')}
      >
        <div className="space-y-2">
          {(['all', 'in_stock'] as const).map((option) => (
            <label
              key={option}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <input
                type="radio"
                name="availability"
                checked={filters.availability === option}
                onChange={() => onAvailabilityChange(option)}
                className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
              />
              <span className="text-sm group-hover:text-primary-600">
                {option === 'all' ? 'Semua' : 'Tersedia'}
              </span>
            </label>
          ))}
        </div>
      </FilterSection>
    </div>
  );
}

function FilterSection({
  title,
  isExpanded,
  onToggle,
  children,
}: {
  title: string;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-gray-100 pb-4">
      <button
        onClick={onToggle}
        className="flex items-center justify-between w-full py-2 font-medium"
        aria-expanded={isExpanded}
      >
        {title}
        {isExpanded ? (
          <ChevronUp className="w-4 h-4" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        )}
      </button>
      {isExpanded && <div className="mt-3">{children}</div>}
    </div>
  );
}
