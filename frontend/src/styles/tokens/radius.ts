/**
 * Border Radius Tokens
 * 
 * Single source of truth for all border radius values.
 */

export const radius = {
  none: '0',
  sm: '0.25rem',
  DEFAULT: '0.375rem',
  md: '0.5rem',
  lg: '0.75rem',
  xl: '1rem',
  '2xl': '1.5rem',
  '3xl': '2rem',
  full: '9999px',
} as const;

export type RadiusToken = typeof radius;
