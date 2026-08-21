import type { BadgeProps } from './badge.types';
import { cn } from '@/lib/cn';

/**
 * Badge Component
 * 
 * A small status indicator or label component.
 */
export function Badge({
  children,
  variant = 'default',
  size = 'md',
  dot = false,
  className,
}: BadgeProps) {
  const variantStyles = {
    default: 'bg-muted text-muted-foreground',
    primary: 'bg-primary/10 text-primary',
    success: 'bg-[--success-light] text-[--success]',
    warning: 'bg-[--warning-light] text-[--warning]',
    error: 'bg-[--error-light] text-[--error]',
    info: 'bg-[--info-light] text-[--info]',
  };

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-0.5 text-sm',
    lg: 'px-3 py-1 text-base',
  };

  const dotColors = {
    default: 'bg-muted-foreground',
    primary: 'bg-primary',
    success: 'bg-[--success]',
    warning: 'bg-[--warning]',
    error: 'bg-[--error]',
    info: 'bg-[--info]',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-medium rounded-full',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
    >
      {dot && (
        <span className={cn('w-1.5 h-1.5 rounded-full', dotColors[variant])} />
      )}
      {children}
    </span>
  );
}
