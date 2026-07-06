/**
 * Number Formatting
 * 
 * Single source of truth for number formatting across the app.
 */

export function formatNumber(value: number, locale = 'id-ID'): string {
  return new Intl.NumberFormat(locale).format(value);
}
