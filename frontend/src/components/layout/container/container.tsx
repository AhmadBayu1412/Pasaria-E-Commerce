import type { ContainerProps } from './container.types';
import { cn } from '@/lib/cn';

/**
 * Container Component
 * 
 * A layout component that provides consistent max-width and padding.
 */
export function Container({
  children,
  size = 'default',
  className,
  ...props
}: ContainerProps) {
  const sizeStyles: Record<string, string> = {
    sm: 'max-w-screen-sm',
    default: 'max-w-screen-xl',
    lg: 'max-w-screen-2xl',
    full: 'max-w-full',
  };

  return (
    <div
      className={cn(
        'mx-auto w-full px-4 sm:px-6 lg:px-8',
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
