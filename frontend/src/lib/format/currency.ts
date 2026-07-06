/**
 * Currency Formatting
 * 
 * Single source of truth for currency formatting across the app.
 */

export function formatCurrency(
  amount: number,
  locale = 'id-ID',
  currency = 'IDR',
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
