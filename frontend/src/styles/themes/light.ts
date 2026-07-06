/**
 * Light Theme
 * 
 * Theme tokens for light mode.
 */

import { colors, semanticColors } from '../tokens/colors';
import { typography } from '../tokens/typography';

export const lightTheme = {
  colors: {
    primary: colors.primary[600],
    primaryHover: colors.primary[700],
    primaryActive: colors.primary[800],
    secondary: colors.secondary[600],
    secondaryHover: colors.secondary[700],
    background: colors.neutral.white,
    surface: colors.neutral[50],
    border: colors.neutral[200],
    text: colors.neutral[900],
    textMuted: colors.neutral[500],
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
  },
  radius: {
    sm: '0.25rem',
    md: '0.5rem',
    lg: '0.75rem',
    full: '9999px',
  },
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
  },
} as const;

export type LightTheme = typeof lightTheme;
