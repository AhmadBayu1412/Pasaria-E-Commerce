/**
 * Currency Utilities
 * Indonesian Rupiah formatting
 */

/**
 * Format number to Indonesian Rupiah
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}

/**
 * Parse currency string to number
 */
export function parseCurrency(value: string): number {
  return parseInt(value.replace(/[^0-9]/g, ''), 10);
}
