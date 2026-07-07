/**
 * Admin Update Strategy
 * Documentation for optimistic vs refetch updates
 */

/**
 * Update Strategy
 * - optimistic: Update UI immediately, rollback on error
 * - refetch: Wait for server response
 * - hybrid: Optimistic update with verification
 */
export type UpdateStrategy = 'optimistic' | 'refetch' | 'hybrid';

/**
 * Strategy per action type
 */
export const UPDATE_STRATEGIES: Record<string, UpdateStrategy> = {
  // Orders - always refetch for consistency
  'order-status': 'refetch',
  'order-note': 'refetch',

  // Products - can be optimistic for better UX
  'product-active': 'optimistic',
  'product-featured': 'optimistic',
  'product-inventory': 'hybrid', // Optimistic + verify
  'product-price': 'refetch',

  // Users - conservative
  'user-role': 'refetch',
};

/**
 * Get strategy for an action
 */
export function getUpdateStrategy(action: string): UpdateStrategy {
  return UPDATE_STRATEGIES[action] || 'refetch';
}
