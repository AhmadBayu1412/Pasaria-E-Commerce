import { SkeletonAvatar, SkeletonText } from './skeleton';

export function ListSkeleton({ items = 5 }: { items?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <SkeletonAvatar size={48} />
          <div className="flex-1">
            <SkeletonText lines={2} />
          </div>
        </div>
      ))}
    </div>
  );
}
