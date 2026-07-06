/**
 * Typography Tokens
 * 
 * Single source of truth for all typography values.
 */

export const typography = {
  // Font families
  fontFamily: {
    sans: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    mono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
  },

  // Font sizes
  fontSize: {
    xs: { value: '0.75rem', lineHeight: '1rem', letterSpacing: '0.025em' },
    sm: { value: '0.875rem', lineHeight: '1.25rem', letterSpacing: '0.025em' },
    base: { value: '1rem', lineHeight: '1.5rem', letterSpacing: '0' },
    lg: { value: '1.125rem', lineHeight: '1.75rem', letterSpacing: '0' },
    xl: { value: '1.25rem', lineHeight: '1.75rem', letterSpacing: '0' },
    '2xl': { value: '1.5rem', lineHeight: '2rem', letterSpacing: '0' },
    '3xl': { value: '1.875rem', lineHeight: '2.25rem', letterSpacing: '0' },
    '4xl': { value: '2.25rem', lineHeight: '2.5rem', letterSpacing: '0' },
  },

  // Font weights
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
} as const;

export type TypographyToken = typeof typography;
