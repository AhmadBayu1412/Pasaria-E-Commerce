'use client';

import { cn } from '@/lib/cn';

/**
 * Base Skeleton Primitive
 * Bisa dirangkai untuk membuat skeleton kompleks
 */
interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
}

export function Skeleton({
  className,
  variant = 'rectangular',
  width,
  height,
}: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse bg-gray-200',
        variant === 'circular' && 'rounded-full',
        variant === 'rectangular' && 'rounded-lg',
        className,
      )}
      style={{ width, height }}
    />
  );
}

/**
 * Primitive Skeletons - bisa reuse untuk berbagai card
 */
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
        <Skeleton key={i} className={widths[i % widths.length]} height={16} />
      ))}
    </div>
  );
}

export function SkeletonAvatar({ size = 40 }: { size?: number }) {
  return <Skeleton variant="circular" width={size} height={size} />;
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
  return <Skeleton className={aspectClasses[aspectRatio]} />;
}
