import { Skeleton } from './skeleton';
import { ProductCardSkeleton } from './product-card-skeleton';

export function PageSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton height={32} width={200} />
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
