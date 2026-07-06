import type { CardProps, CardHeaderProps, CardBodyProps, CardFooterProps } from './card.types';
import { cn } from '@/lib/cn';

/**
 * Card Component
 * 
 * A versatile card component with compound support (Header, Body, Footer).
 */
export function Card({
  children,
  variant = 'default',
  padding = 'md',
  hoverable = false,
  className,
  ...props
}: CardProps) {
  const variantStyles = {
    default: 'bg-white shadow-sm border border-secondary-200',
    elevated: 'bg-white shadow-md',
    outlined: 'bg-white border-2 border-secondary-300',
    ghost: 'bg-secondary-50',
  };

  const paddingStyles = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  };

  return (
    <div
      className={cn(
        'rounded-lg transition-all duration-200',
        variantStyles[variant],
        paddingStyles[padding],
        hoverable && 'hover:shadow-lg hover:border-primary-200 cursor-pointer',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

// Compound components
Card.Header = function CardHeader({ children, className, ...props }: CardHeaderProps) {
  return (
    <div className={cn('px-4 py-3 border-b border-secondary-200', className)} {...props}>
      {children}
    </div>
  );
};

Card.Body = function CardBody({ children, className, ...props }: CardBodyProps) {
  return (
    <div className={cn('p-4', className)} {...props}>
      {children}
    </div>
  );
};

Card.Footer = function CardFooter({ children, className, ...props }: CardFooterProps) {
  return (
    <div className={cn('px-4 py-3 border-t border-secondary-200 bg-secondary-50 rounded-b-lg', className)} {...props}>
      {children}
    </div>
  );
};
