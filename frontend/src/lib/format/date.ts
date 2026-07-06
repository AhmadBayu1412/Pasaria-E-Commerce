/**
 * Date Formatting
 * 
 * Single source of truth for date formatting across the app.
 */

export function formatDate(
  date: string | Date,
  locale = 'id-ID',
  options?: Intl.DateTimeFormatOptions,
): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    ...options,
  }).format(d);
}
