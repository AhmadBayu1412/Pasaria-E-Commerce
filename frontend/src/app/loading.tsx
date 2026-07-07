import { PageSkeleton } from '@/components/ui';

/**
 * Global Loading - Shown during route transitions
 */
export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <PageSkeleton />
      </div>
    </div>
  );
}
