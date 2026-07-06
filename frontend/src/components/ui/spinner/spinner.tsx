import type { SpinnerProps } from './spinner.types';
import { cn } from '@/lib/cn';

/**
 * Spinner Component
 * 
 * A loading indicator component.
 */
export function Spinner({
  size = 'md',
  label = 'Loading',
  className,
}: SpinnerProps) {
  const sizeStyles = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12',
  };

  return (
    <div
      role="status"
      aria-label={label}
      className={cn('inline-flex items-center justify-center', className)}
    >
      <svg
        className={cn('animate-spin text-current', sizeStyles[size])}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      <span className="sr-only">{label}</span>
    </div>
  );
}

// Full page spinner
Spinner.Page = function PageSpinner() {
  return (
    <div className="flex items-center justify-center min-h-[400px] w-full">
      <Spinner size="lg" />
    </div>
  );
};

// Inline spinner for buttons
Spinner.Inline = function InlineSpinner({ className }: { className?: string }) {
  return <Spinner size="sm" className={cn('ml-2', className)} />;
};
