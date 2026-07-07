import { Skeleton } from './skeleton';

export function FormSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton height={40} width="100%" />
      <Skeleton height={40} width="100%" />
      <Skeleton height={100} width="100%" />
      <Skeleton height={40} width="50%" />
    </div>
  );
}
