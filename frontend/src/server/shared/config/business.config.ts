// ============================================================
// BUSINESS LIMITS CONFIGURATION
// Single source of truth untuk semua batasan bisnis
// Digunakan oleh: Cart, Inventory, Order, dll
// ============================================================

export const BUSINESS_LIMITS = {
  // ----- Cart Limits -----
  MAX_CART_ITEM_QUANTITY: 99,  // Per item dalam cart

  // ----- Inventory Limits -----
  // MAX_RESERVATION_DURATION: 30,  // minutes (Future)

  // ----- Order Limits -----
  // MAX_ORDER_TOTAL_ITEMS: 100,    // (Future)
  // MAX_ORDER_VALUE: 100_000_000,  // (Future)

} as const

// Type exports for external use
export type BusinessLimits = typeof BUSINESS_LIMITS
export type BusinessLimitKey = keyof typeof BUSINESS_LIMITS

// Validation helper
export function isWithinCartLimit(quantity: number): boolean {
  return (
    quantity >= 1 &&
    quantity <= BUSINESS_LIMITS.MAX_CART_ITEM_QUANTITY
  )
}
