'use client';

import { forwardRef } from 'react';
import type { InputProps } from './input.types';
import { cn } from '@/lib/cn';

/**
 * Input Component
 * 
 * A versatile input component with label, validation states, and icon support.
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      hint,
      isValid,
      leftElement,
      rightElement,
      className,
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-foreground"
          >
            {label}
          </label>
        )}

        <div className="relative">
          {leftElement && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {leftElement}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            aria-invalid={!!error}
            aria-describedby={
              error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined
            }
            className={cn(
              `
              w-full px-4 py-2
              rounded-md border border-input
              bg-background text-foreground
              placeholder:text-muted-foreground
              transition-colors duration-150

              focus:outline-none focus:ring-2 focus:ring-offset-0
              focus:border-primary focus:ring-primary/20

              disabled:bg-muted disabled:cursor-not-allowed
              `,
              error
                ? 'border-destructive focus:border-destructive focus:ring-destructive/20'
                : isValid
                  ? 'border-[--success] focus:border-[--success] focus:ring-[--success]/20'
                  : 'focus:border-primary focus:ring-primary/20',
              leftElement && 'pl-10',
              rightElement && 'pr-10',
              className
            )}
            {...props}
          />

          {rightElement && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {rightElement}
            </div>
          )}

          {/* Status indicators */}
          {error && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-destructive">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          )}
          {isValid && !error && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[--success]">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          )}
        </div>

        {error && (
          <p id={`${inputId}-error`} className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}

        {hint && !error && (
          <p id={`${inputId}-hint`} className="text-sm text-muted-foreground">
            {hint}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
