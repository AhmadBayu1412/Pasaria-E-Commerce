/**
 * Color Tokens
 * 
 * Single source of truth for all colors in the design system.
 * Organized from primitive (raw values) to semantic (meaning-based).
 */

export const colors = {
  // Primary palette (E-commerce action color - trust, reliability)
  primary: {
    50: '#EFF6FF',
    100: '#DBEAFE',
    200: '#BFDBFE',
    300: '#93C5FD',
    400: '#60A5FA',
    500: '#3B82F6',
    600: '#2563EB',
    700: '#1D4ED8',
    800: '#1E40AF',
    900: '#1E3A8A',
    950: '#172554',
  },

  // Secondary palette (Support, neutral actions)
  secondary: {
    50: '#F8FAFC',
    100: '#F1F5F9',
    200: '#E2E8F0',
    300: '#CBD5E1',
    400: '#94A3B8',
    500: '#64748B',
    600: '#475569',
    700: '#334155',
    800: '#1E293B',
    900: '#0F172A',
  },

  // Semantic colors
  semantic: {
    success: {
      light: '#DCFCE7',
      DEFAULT: '#22C55E',
      dark: '#16A34A',
    },
    warning: {
      light: '#FEF3C7',
      DEFAULT: '#F59E0B',
      dark: '#D97706',
    },
    error: {
      light: '#FEE2E2',
      DEFAULT: '#EF4444',
      dark: '#DC2626',
    },
    info: {
      light: '#DBEAFE',
      DEFAULT: '#3B82F6',
      dark: '#2563EB',
    },
  },

  // Neutral palette (Backgrounds, surfaces, borders)
  neutral: {
    white: '#FFFFFF',
    50: '#F8FAFC',
    100: '#F1F5F9',
    200: '#E2E8F0',
    300: '#CBD5E1',
    400: '#94A3B8',
    500: '#64748B',
    600: '#475569',
    700: '#334155',
    800: '#1E293B',
    900: '#0F172A',
    black: '#000000',
  },
} as const;

// Semantic color aliases for common use cases
export const semanticColors = {
  primary: colors.primary[600],
  primaryHover: colors.primary[700],
  primaryActive: colors.primary[800],
  secondary: colors.secondary[600],
  secondaryHover: colors.secondary[700],
  success: colors.semantic.success.DEFAULT,
  successLight: colors.semantic.success.light,
  warning: colors.semantic.warning.DEFAULT,
  warningLight: colors.semantic.warning.light,
  error: colors.semantic.error.DEFAULT,
  errorLight: colors.semantic.error.light,
  info: colors.semantic.info.DEFAULT,
  infoLight: colors.semantic.info.light,
  background: colors.neutral.white,
  surface: colors.neutral[50],
  border: colors.neutral[200],
  textPrimary: colors.neutral[900],
  textSecondary: colors.neutral[600],
  textMuted: colors.neutral[400],
} as const;

export type ColorToken = typeof colors;
export type SemanticColorToken = typeof semanticColors;
