'use client';

import { forwardRef } from 'react';
import type { ButtonVariant, ButtonSize } from './button.types';
import { cn } from '@/lib/cn';

// Spinner component for loading state
function Spinner({ className }: { className?: string }) {
  return (
    <svg
      className={cn('animate-spin', className)}
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
  );
}

// Button as button props
interface ButtonAsButtonProps {
  as?: 'button';
  href?: never;
  target?: never;
  rel?: never;
}

// Button as anchor props
interface ButtonAsAnchorProps {
  as: 'a';
  href?: string;
  target?: string;
  rel?: string;
}

// Base button props
interface BaseButtonProps {
  children?: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  onClick?: () => void;
}

type ButtonProps = BaseButtonProps & (ButtonAsButtonProps | ButtonAsAnchorProps);

/**
 * Button Component
 * 
 * A versatile button component with multiple variants and sizes.
 * Supports loading state, disabled state, and icon placement.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      disabled = false,
      fullWidth = false,
      leftIcon,
      rightIcon,
      className,
      type = 'button',
      onClick,
      as,
      href,
      target,
      rel,
    },
    ref
  ) => {
    const baseStyles = `
      inline-flex items-center justify-center gap-2
      font-medium rounded-md
      transition-colors duration-150
      focus:outline-none focus:ring-2 focus:ring-offset-2
      disabled:opacity-50 disabled:cursor-not-allowed
    `;

    const variantStyles: Record<string, string> = {
      primary: `
        bg-primary-600 text-white
        hover:bg-primary-700
        active:bg-primary-800
        focus:ring-primary-500
      `,
      secondary: `
        bg-secondary-600 text-white
        hover:bg-secondary-700
        active:bg-secondary-800
        focus:ring-secondary-500
      `,
      outline: `
        border-2 border-primary-600 text-primary-600
        hover:bg-primary-50
        active:bg-primary-100
        focus:ring-primary-500
      `,
      ghost: `
        text-secondary-700
        hover:bg-secondary-100
        active:bg-secondary-200
        focus:ring-secondary-500
      `,
      danger: `
        bg-red-600 text-white
        hover:bg-red-700
        active:bg-red-800
        focus:ring-red-500
      `,
    };

    const sizeStyles: Record<string, string> = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg',
    };

    // If as="a", render as anchor
    if (as === 'a') {
      return (
        <a
          ref={ref as React.Ref<HTMLAnchorElement>}
          href={href}
          target={target}
          rel={rel}
          className={cn(
            baseStyles,
            variantStyles[variant],
            sizeStyles[size],
            fullWidth && 'w-full',
            className
          )}
        >
          {isLoading && <Spinner className="w-4 h-4" />}
          {!isLoading && leftIcon}
          {children}
          {!isLoading && rightIcon}
        </a>
      );
    }

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        onClick={onClick}
        className={cn(
          baseStyles,
          variantStyles[variant],
          sizeStyles[size],
          fullWidth && 'w-full',
          className
        )}
      >
        {isLoading && <Spinner className="w-4 h-4" />}
        {!isLoading && leftIcon}
        {children}
        {!isLoading && rightIcon}
      </button>
    );
  }
);

Button.displayName = 'Button';
