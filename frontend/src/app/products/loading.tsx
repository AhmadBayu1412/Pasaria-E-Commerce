import { Container } from '@/components/layout';

export default function Loading() {
  return (
    <Container className="py-8">
      <div className="mb-8">
        <div className="h-9 w-24 bg-secondary-200 rounded animate-pulse mb-4" />
        <div className="h-10 w-full max-w-md bg-secondary-200 rounded animate-pulse" />
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Filter Sidebar Skeleton */}
        <aside className="w-full lg:w-64 flex-shrink-0">
          <div className="space-y-6">
            <div className="space-y-3">
              <div className="h-5 w-20 bg-secondary-200 rounded animate-pulse" />
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-9 bg-secondary-200 rounded animate-pulse" />
              ))}
            </div>
            <div className="space-y-3">
              <div className="h-5 w-16 bg-secondary-200 rounded animate-pulse" />
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-9 bg-secondary-200 rounded animate-pulse" />
              ))}
            </div>
          </div>
        </aside>

        {/* Product Grid Skeleton */}
        <main className="flex-1">
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
        </main>
      </div>
    </Container>
  );
}
