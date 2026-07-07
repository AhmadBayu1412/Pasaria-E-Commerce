import Link from 'next/link';
import { searchService } from '@/services/search.service';
import { ProductGrid } from '@/components/product/product-grid/product-grid';
import { SearchFilters } from '@/components/search/search-filters';
import { SearchMobileFilters } from '@/components/search/search-mobile-filters';
import { SearchEmptyState } from '@/components/search/search-empty-state';
import type { SearchQuery, SortOption } from '@/types/search';

interface SearchPageProps {
  searchParams: {
    q?: string;
    category?: string;
    minPrice?: string;
    maxPrice?: string;
    availability?: string;
    sortBy?: string;
    page?: string;
  };
}

/**
 * Search Page - Server Component
 *
 * Flow:
 * 1. Read searchParams from URL (SSR)
 * 2. Fetch initial search results
 * 3. Render with initial data
 * 4. Client components handle navigation
 */
export default async function SearchPage({ searchParams }: SearchPageProps) {
  // Parse query from URL (source of truth)
  const query: SearchQuery = {
    q: searchParams.q || '',
    category: searchParams.category ? Number(searchParams.category) : undefined,
    minPrice: searchParams.minPrice ? Number(searchParams.minPrice) : undefined,
    maxPrice: searchParams.maxPrice ? Number(searchParams.maxPrice) : undefined,
    availability:
      (searchParams.availability as 'all' | 'in_stock') || 'all',
    sortBy: (searchParams.sortBy as SortOption) || 'relevance',
    page: searchParams.page ? Number(searchParams.page) : 1,
    limit: 20,
  };

  // Build URL helper (for client navigation)
  const buildUrl = (updates: Partial<SearchQuery>): string => {
    const params = new URLSearchParams();

    if (query.q) params.set('q', query.q);

    const buildParam = (
      key: string,
      value: number | string | undefined,
      defaultValue?: number | string,
    ) => {
      if (value !== undefined && value !== defaultValue) {
        params.set(key, String(value));
      }
    };

    buildParam('category', updates.category ?? query.category);
    buildParam('minPrice', updates.minPrice ?? query.minPrice);
    buildParam('maxPrice', updates.maxPrice ?? query.maxPrice);
    buildParam('availability', updates.availability ?? query.availability);
    buildParam('sortBy', updates.sortBy ?? query.sortBy, 'relevance');
    buildParam('page', updates.page ?? query.page, 1);

    return `/search?${params.toString()}`;
  };

  // Fetch results (server-side)
  let result = null;
  let error = null;

  if (query.q.trim()) {
    try {
      result = await searchService.search(query);
    } catch (err) {
      error = (err as Error).message;
    }
  }

  // Empty state - no query
  if (!query.q.trim()) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-12 text-center">
          <h1 className="text-2xl font-bold mb-4">Pencarian</h1>
          <p className="text-gray-500">
            Masukkan kata kunci untuk mencari produk
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-12 text-center">
          <h1 className="text-2xl font-bold mb-4 text-red-600">Error</h1>
          <p className="text-gray-500">{error}</p>
          <Link
            href="/"
            className="text-primary-600 hover:underline mt-4 inline-block"
          >
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    );
  }

  // Results
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold mb-2">
            Hasil pencarian untuk &quot;{query.q}&quot;
          </h1>
          {result && (
            <p className="text-gray-500">Ditemukan {result.total} produk</p>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {result && result.items.length > 0 ? (
          <div className="flex gap-8">
            {/* Desktop Filters Sidebar */}
            <aside className="hidden lg:block w-64 flex-shrink-0">
              <div className="sticky top-4">
                <h2 className="font-semibold mb-4">Filter</h2>
                <SearchFilters
                  filters={{
                    category: query.category,
                    minPrice: query.minPrice,
                    maxPrice: query.maxPrice,
                    availability: query.availability,
                  }}
                  onCategoryChange={(cat) =>
                    window.location.href = buildUrl({ category: cat })
                  }
                  onPriceRangeChange={(min, max) =>
                    window.location.href = buildUrl({
                      minPrice: min,
                      maxPrice: max,
                    })
                  }
                  onAvailabilityChange={(av) =>
                    window.location.href = buildUrl({ availability: av })
                  }
                />
              </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1">
              {/* Mobile Header */}
              <div className="flex items-center justify-between mb-6 lg:hidden">
                <p className="text-sm text-gray-500">{result.total} produk</p>
                <SearchMobileFilters
                  filters={{
                    category: query.category,
                    minPrice: query.minPrice,
                    maxPrice: query.maxPrice,
                    availability: query.availability,
                  }}
                  onCategoryChange={() => {}}
                  onPriceRangeChange={() => {}}
                  onAvailabilityChange={() => {}}
                  onApply={() => {}}
                />
              </div>

              {/* Sort */}
              <div className="flex items-center justify-between mb-6">
                <select
                  value={query.sortBy}
                  onChange={(e) => {
                    window.location.href = buildUrl({
                      sortBy: e.target.value as SortOption,
                    });
                  }}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-sm"
                >
                  <option value="relevance">Ter relevance</option>
                  <option value="newest">Terbaru</option>
                  <option value="price_asc">Harga Terendah</option>
                  <option value="price_desc">Harga Tertinggi</option>
                </select>
              </div>

              {/* Product Grid - REUSED across all listing pages */}
              <ProductGrid
                items={result.items}
                currentPage={result.page}
                totalPages={result.totalPages}
                totalItems={result.total}
                onPageChange={(page) => {
                  window.location.href = buildUrl({ page });
                }}
              />
            </main>
          </div>
        ) : (
          <SearchEmptyState query={query.q} />
        )}
      </div>
    </div>
  );
}
