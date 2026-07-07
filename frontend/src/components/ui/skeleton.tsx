// Skeleton Component - Updated with primitives

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

// Primitives
export function SkeletonText({
  lines = 1,
  className,
}: {
  lines?: number;
  className?: string;
}) {
  const widths = ['w-full', 'w-3/4', 'w-1/2', 'w-1/3'];
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={widths[i % widths.length]} />
      ))}
    </div>
  );
}

export function SkeletonAvatar({ size = 40 }: { size?: number }) {
  return <Skeleton variant="circular" style={{ width: size, height: size }} />;
}

export function SkeletonImage({
  aspectRatio = 'square',
}: {
  aspectRatio?: 'square' | 'video' | 'portrait';
}) {
  const aspectClasses = {
    square: 'aspect-square',
    video: 'aspect-video',
    portrait: 'aspect-[3/4]',
  };
  return <Skeleton className={aspectClasses[aspectRatio]} variant="rectangular" />;
}

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

// Page Skeleton
export function PageSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-64" />
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

// Table Skeleton
export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      <div className="flex gap-4 pb-3 border-b">
        <Skeleton className="w-10" />
        <Skeleton className="w-40" />
        <Skeleton className="w-20" />
        <Skeleton className="w-15" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <SkeletonAvatar size={32} />
          <Skeleton className="w-40" />
          <Skeleton className="w-20" />
          <Skeleton className="w-15" />
        </div>
      ))}
    </div>
  );
}

// List Skeleton
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

// Form Skeleton
export function FormSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-10 w-1/2" />
    </div>
  );
}

export { Skeleton, ProductCardSkeleton, CartItemSkeleton };
