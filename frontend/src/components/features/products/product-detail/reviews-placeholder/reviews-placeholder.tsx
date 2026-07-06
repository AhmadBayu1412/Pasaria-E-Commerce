'use client';

/**
 * Reviews Placeholder Component
 * 
 * "Coming Soon" placeholder for reviews section.
 */

import { Star, Clock } from 'lucide-react';

interface ReviewsPlaceholderProps {
  className?: string;
}

export function ReviewsPlaceholder({ className }: ReviewsPlaceholderProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center py-12 text-center ${className || ''}`}
    >
      <div className="w-16 h-16 rounded-full bg-secondary-100 flex items-center justify-center mb-4">
        <Clock className="w-8 h-8 text-secondary-400" />
      </div>
      <h3 className="text-lg font-medium text-secondary-700 mb-2">
        Ulasan Coming Soon
      </h3>
      <p className="text-secondary-500 max-w-md">
        Fitur ulasan produk sedang dalam pengembangan. 
        Nantikan fitur ini untuk membantu Anda membuat keputusan pembelian yang lebih baik!
      </p>
      <div className="flex items-center gap-1 mt-4 text-secondary-400">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star key={i} className="w-5 h-5" />
        ))}
      </div>
    </div>
  );
}
