// Skeleton Component

import { type HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/cn';

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rectangular';
}

const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, variant = 'text', ...props }, ref) => {
    const variants = {
      text: 'h-4 rounded',
      circular: 'rounded-full',
      rectangular: 'rounded-lg',
    };
    
    return (
      <div
        ref={ref}
        className={cn(
          'animate-pulse bg-slate-200',
          variants[variant],
          className
        )}
        {...props}
      />
    );
  }
);

Skeleton.displayName = 'Skeleton';

// Product Card Skeleton
function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <Skeleton className="w-full aspect-square" variant="rectangular" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-5 w-1/3" />
      </div>
    </div>
  );
}

// Cart Item Skeleton
function CartItemSkeleton() {
  return (
    <div className="flex gap-4 p-4 border-b border-slate-100">
      <Skeleton className="w-20 h-20" variant="rectangular" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-1/3" />
      </div>
      <Skeleton className="w-16 h-8" />
    </div>
  );
}

export { Skeleton, ProductCardSkeleton, CartItemSkeleton };
