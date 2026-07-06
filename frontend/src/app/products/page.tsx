import { Suspense } from 'react';
import type { Metadata } from 'next';
import { Container } from '@/components/layout';
import { Spinner } from '@/components/ui';
import { ProductGrid, FilterSidebar, SearchInput, EmptyState, Pagination } from '@/components/features/products';
import { fetchProducts } from '@/components/features/products/api';
import { ProductFilterSchema } from '@/lib/schemas';

export const metadata: Metadata = {
  title: 'Products - Pasaria',
  description: 'Browse our complete collection of quality products at great prices.',
};

interface ProductsPageProps {
  searchParams: Promise<{
    page?: string;
    pageSize?: string;
    sort?: string;
    category?: string;
    q?: string;
  }>;
}

async function ProductsContent({
  page,
  pageSize,
  sort,
  category,
  q,
}: {
  page: number;
  pageSize: number;
  sort: string;
  category?: string;
  q?: string;
}) {
  // Validate and parse filters using Zod schema
  const filters = ProductFilterSchema.parse({
    page: page,
    pageSize: pageSize,
    sort: sort,
    category: category,
    q: q,
  });

  const data = await fetchProducts(filters);

  if (data.products.length === 0) {
    return (
      <EmptyState
        variant={q ? 'no-results' : 'no-category'}
        searchQuery={q}
      />
    );
  }

  return (
    <>
      <ProductGrid products={data.products} />
      {data.pagination.totalPages > 1 && (
        <div className="mt-8">
          <Pagination
            currentPage={filters.page}
            totalPages={data.pagination.totalPages}
            onPageChange={(newPage) => {
              // This is handled by URL params, will be implemented with router
            }}
          />
        </div>
      )}
    </>
  );
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams;

  const page = parseInt(params.page || '1', 10);
  const pageSize = parseInt(params.pageSize || '12', 10);
  const sort = params.sort || 'newest';
  const category = params.category;
  const q = params.q;

  // Validate page numbers
  const validPage = isNaN(page) || page < 1 ? 1 : page;

  return (
    <Container className="py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-secondary-900 mb-4">
          Produk
        </h1>
        <SearchInput />
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Filter Sidebar */}
        <aside className="w-full lg:w-64 flex-shrink-0">
          <Suspense fallback={<div className="h-64 bg-secondary-100 rounded-lg animate-pulse" />}>
            <FilterSidebar
              categories={[
                { id: '1', name: 'Elektronik', slug: 'elektronik', productCount: 150 },
                { id: '2', name: 'Fashion', slug: 'fashion', productCount: 280 },
                { id: '3', name: 'Kecantikan', slug: 'kecantikan', productCount: 95 },
                { id: '4', name: 'Rumah Tangga', slug: 'rumah-tangga', productCount: 120 },
                { id: '5', name: 'Olahraga', slug: 'olahraga', productCount: 75 },
              ]}
              selectedCategory={category}
              selectedSort={sort}
              searchQuery={q}
            />
          </Suspense>
        </aside>

        {/* Product Grid */}
        <main className="flex-1">
          <Suspense fallback={<ProductGridSkeleton />}>
            <ProductsContent
              page={validPage}
              pageSize={pageSize}
              sort={sort}
              category={category}
              q={q}
            />
          </Suspense>
        </main>
      </div>
    </Container>
  );
}

function ProductGridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="bg-white rounded-lg border border-secondary-200 overflow-hidden">
          <div className="aspect-[4/3] bg-secondary-200 animate-pulse" />
          <div className="p-4 space-y-3">
            <div className="h-3 bg-secondary-200 rounded animate-pulse w-1/4" />
            <div className="h-4 bg-secondary-200 rounded animate-pulse" />
            <div className="h-4 bg-secondary-200 rounded animate-pulse w-3/4" />
            <div className="h-5 bg-secondary-200 rounded animate-pulse w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}
