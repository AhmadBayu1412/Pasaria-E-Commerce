/**
 * Cart Cache Adapter
 *
 * Provides cache operations only.
 * Does NOT orchestrate database queries.
 * Does NOT know about business logic.
 *
 * Single Responsibility: Cache storage operations
 *
 * Step 9: Cart Optimization
 */

import { cacheGet, cacheSet, cacheDelete } from "../../../shared/cache/cache.service.js";
import { cartKey } from "../../../shared/cache/cache.keys.js";
import { CACHE_TTL } from "../../../shared/config/cache.config.js";
import type { CartView } from "../types/cart.types.js";

/**
 * Get cart from cache only
 *
 * @param userId - User ID
 * @returns Cached CartView or null if miss
 */
export async function getCachedCart(userId: number): Promise<CartView | null> {
  const key = cartKey(userId);
  const result = await cacheGet<CartView>(key);
  return result.data;
}

/**
 * Set cart to cache
 *
 * @param userId - User ID
 * @param cartView - Cart data to cache
 *
 * NOTE: Fire-and-forget pattern. Errors are logged but not thrown.
 */
export async function setCachedCart(
  userId: number,
  cartView: CartView
): Promise<void> {
  try {
    const key = cartKey(userId);
    await cacheSet(key, cartView, CACHE_TTL.CART);
  } catch (error) {
    // Fire-and-forget: Log error but don't throw
    console.error(`[CACHE] Failed to set cart for user ${userId}:`, error);
  }
}

/**
 * Invalidate cart cache for user
 *
 * Called after every mutation.
 * Centralized invalidation - mutations don't know WHAT to invalidate.
 *
 * NOTE: Fire-and-forget pattern. Errors are logged but not thrown.
 * Cache invalidation failure should NOT block business operations.
 */
export async function invalidateCartCache(userId: number): Promise<void> {
  try {
    const key = cartKey(userId);
    await cacheDelete(key);
  } catch (error) {
    // Fire-and-forget: Log error but don't throw
    console.error(`[CACHE] Failed to invalidate cart for user ${userId}:`, error);
  }
}
