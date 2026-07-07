import { SkeletonImage, SkeletonText, Skeleton } from './skeleton';

/**
 * ProductCardSkeleton - dirangkai dari primitives
 */
export function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <SkeletonImage />
      <div className="p-4">
        <SkeletonText lines={2} className="mb-3" />
        <Skeleton height={24} width="40%" />
      </div>
    </div>
  );
}
