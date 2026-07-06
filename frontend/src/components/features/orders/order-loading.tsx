'use client';

export function OrderLoading() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="bg-white rounded-lg border border-secondary-200 p-4 animate-pulse"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="h-5 w-24 bg-secondary-200 rounded mb-2" />
              <div className="h-4 w-32 bg-secondary-100 rounded" />
            </div>
            <div className="h-6 w-28 bg-secondary-100 rounded-full" />
          </div>
          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-secondary-100 rounded" />
              <div className="flex-1">
                <div className="h-4 w-3/4 bg-secondary-100 rounded mb-1" />
                <div className="h-3 w-1/2 bg-secondary-100 rounded" />
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between pt-4 border-t border-secondary-100">
            <div className="h-4 w-16 bg-secondary-100 rounded" />
            <div className="h-5 w-20 bg-secondary-100 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}
