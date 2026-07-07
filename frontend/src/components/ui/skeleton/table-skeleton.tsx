import { Skeleton, SkeletonAvatar } from './skeleton';

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex gap-4 pb-3 border-b">
        <Skeleton width="10%" />
        <Skeleton width="40%" />
        <Skeleton width="20%" />
        <Skeleton width="15%" />
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <SkeletonAvatar size={32} />
          <Skeleton width="40%" />
          <Skeleton width="20%" />
          <Skeleton width="15%" />
        </div>
      ))}
    </div>
  );
}
