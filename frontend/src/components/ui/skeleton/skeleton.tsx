import type { SkeletonProps } from './skeleton.types';
import { cn } from '@/lib/cn';

/**
 * Skeleton Component
 * 
 * A placeholder loading component that shows a pulsing animation.
 */
export function Skeleton({
  variant = 'rect',
  className,
  ...props
}: SkeletonProps) {
  const variantStyles = {
    rect: 'rounded-md',
    circle: 'rounded-full',
    text: 'rounded h-4',
  };

  return (
    <div
      className={cn(
        'animate-pulse bg-secondary-200',
        variantStyles[variant],
        className
      )}
      {...props}
    />
  );
}

// Preset skeletons
Skeleton.Card = function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-3', className)}>
      <Skeleton className="aspect-square w-full" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  );
};

Skeleton.Text = function SkeletonText({
  lines = 3,
  className,
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className="h-4"
          style={{ width: i === lines - 1 ? '75%' : '100%' }}
        />
      ))}
    </div>
  );
};

Skeleton.Avatar = function SkeletonAvatar({
  size = 'md',
  className,
}: {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const sizeStyles = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };

  return <Skeleton className={cn('rounded-full', sizeStyles[size], className)} />;
};
