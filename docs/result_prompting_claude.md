# Result: Claude Prompting Bug — Checkout Preview vs Orders Mismatch

## Bug Summary

Checkout preview shows 1 item (qty 1, Rp 165,000) but order shows 2 items (qty 2, @ Rp 220,000 = Rp 440,000). There are 2 separate bugs:

1. **Item Doubling** — qty 1 in checkout preview becomes 2 in order
2. **Price Mismatch** — Rp 165,000 (stale localStorage) vs Rp 220,000 (current DB price)

---

# Prompt Iterations

## Version 1 — Naive Prompt

**Prompt:**
```
Fix this bug.
The fees on the checkout page are different from those on the orders page.
Here is the code.
```

**Output:**
Claude found that `checkout.service.ts` hardcodes `SHIPPING_OPTIONS` and `PAYMENT_METHODS` separately from the controllers, causing a dual source of truth. Solution: extract to a shared constants file.

---

## Version 2 — Role Prompting

**Prompt:**
```
Now, I'd like to correct the previous question.
Add Role Assignments
Assume you're a Senior Frontend Engineer.
Answer again.
```

**Output:**
Claude found that `checkout-preview.tsx` never calls `initiateCheckout()` — the subtotal comes from the Zustand store (localStorage, stale) instead of from the server. Solution: call `initiateCheckout()` and use `preview.subtotal`.

---

## Version 3 — Context

**Prompt:**
```
Now keep it all together.
Add the following context. Project Pasaria ecommerce built using
| Component | Technology |
| Backend   | Express + TypeScript + Modular Monolith |
| Database  | PostgreSQL + Prisma |
| Cache     | Redis |
| Queue     | BullMQ |
| Frontend  | Next.js 14+ |
The goal is production-ready code.
```

**Output:**
Claude provided a complete solution with:
- Prisma schema for ShippingOption and PaymentMethodConfig
- Redis cache-aside PricingService
- Frontend wire `initiateCheckout()` call
- feeType-aware fee calculation

---

## Version 4 — Few-shot

**Prompt:**
```
From the previous code, I want you to review code formatted like this
Problem
Cause
Fix
Testing
Now review mine.
```

**Output:**
Claude followed the requested format with Problem/Cause/Fix/Testing sections.

---

## Version 5 — Output Structure

**Prompt:**
```
Output Structure
Return:
Problem
Root Cause
Solution
Files to Modify
Testing Steps
Possible Risks
```

**Output:**
Claude followed the requested structure with all complete sections.

---

## Version 6 — Step Decomposition

**Prompt:**
```
Before suggesting fixes
1 Analyze state
2 Analyze API
3 Analyze async flow
4 Analyze rendering
Only then conclude.
```

**Output:**
Claude analyzed 4 aspects in depth:
- State: checkoutPreview and selectedShipping in store are not used
- API: initiateCheckout() is not called, feeType is not in the response
- Async flow: sync effect dependency bug
- Rendering: per-item price vs subtotal mismatch

---

## Version 7 — Item Doubling Bug (Discovered During Implementation)

### Bug Description

Checkout preview shows 1 item but orders page shows 2 items (or 2 items → 4 items). Always reproducible, deterministic doubling pattern.

### Root Cause — Three Independent Bugs

#### Bug 1: Sync Effect Double-Trigger

```tsx
// PROBLEMATIC CODE
useEffect(() => {
  const syncCartToBackend = async () => {
    setIsSyncingCart(true);
    await cartService.clearCart();
    for (const item of items) {
      await cartService.addItem({ productId, quantity });
      // addItem() updates local Zustand store → items.length changes
      // This triggers ANOTHER effect run!
    }
    setIsSyncingCart(false);
  };
  syncCartToBackend();
}, [items.length]); // DEPENDENCY ON items.length = ROOT CAUSE
```

#### Bug 2: addItem() INCREMENT vs updateQuantity() REPLACE

Backend `addToCart` uses `{ increment: quantity }` not replace.

#### Bug 3: Items NOT Synced to Backend on Add

Zustand `addItem()` only updates local state — never syncs to backend.

### Fix Applied

1. Empty dependency array `[]` for single execution
2. useRef to capture items at effect execution time
3. isCancelled flag for cleanup
4. Sync error surfaced to user
5. REPLACED sync loop with `getCart()` — reads from backend cart

### Files Modified (Version 7)

- `frontend/src/components/features/cart/checkout-preview/checkout-preview.tsx`
- `frontend/src/store/cart.store.ts`

---

# Final Fix (This Session)

## Bugs Found

### Bug 1: Item Doubling — Race Condition Two POSTs

Two POSTs to `POST /cart/items` for the same item:

1. **Sync effect** (`checkout-preview.tsx`): `await cartService.addItem(...)` → POST #1
2. **Zustand addItem** (`cart.store.ts`): `fetch(POST /cart/items)` fire-and-forget → POST #2

Backend uses `increment`, so:
```
POST #1 → qty = 1
POST #2 → qty = 2  ← doubling
```

### Bug 2: Price Mismatch — Stale Local Price

Sync effect calls `getCart()` which returns `{ productId, quantity }` — **no price**. Merge logic uses `localItem?.price || 0` → stale price from localStorage (Rp 165,000). But order uses `getProductForSnapshot()` → current DB price (Rp 220,000).

## Files Modified

### `frontend/src/store/cart.store.ts`

```diff
  } else {
    // Add new item — local state only.
    // Backend sync is handled exclusively by the checkout-preview sync effect.
    // This prevents the race condition where two POSTs to /cart/items
    // (one from sync effect, one from here) each increment the quantity.
    set({ items: [...items, item] });

-   // Sync new item to backend (async, fire-and-forget)
-   const productId = parseInt(item.productId) || parseInt(item.id.replace('temp-', ''));
-   if (productId && item.quantity > 0) {
-     fetch(`${API_BASE_URL}/cart/items`, {
-       method: 'POST',
-       credentials: 'include',
-       headers: { 'Content-Type': 'application/json' },
-       body: JSON.stringify({ productId, quantity: item.quantity }),
-     }).catch((e: unknown) => {
-       console.warn('[Cart] Failed to sync addItem to backend:', e);
-     });
-   }
  }
```

### `frontend/src/components/features/cart/checkout-preview/checkout-preview.tsx`

1. **Import** — Add `CartItem` type:
```tsx
import type { Address, ShippingOption, PaymentMethod, CartItem } from '@/store/cart.types';

// Backend checkout item format (from POST /checkout response)
interface CheckoutItemPreview {
  productId: number;
  productName: string;
  productImage?: string | null;
  unitPrice: number;
  quantity: number;
  availableStock: number;
  subtotal: number;
  status: 'VALID' | 'INVALID';
  reason?: 'PRODUCT_NOT_FOUND' | 'OUT_OF_STOCK';
}
```

2. **Sync effect** — Use `initiateCheckout()` for authoritative items with prices:
```tsx
const syncCartToBackend = async () => {
  // IMPORTANT: Read from store at effect execution time
  const currentItems = useCartStore.getState().items;

  if (currentItems.length === 0) {
    if (!isCancelled) setIsLoading(false);
    return;
  }

  if (!isCancelled) {
    setIsSyncingCart(true);
    setSyncError(null);
  }

  try {
    // Check if backend has items first
    const cartResponse = await cartService.getCart();
    const backendHasItems = cartResponse.success && cartResponse.cart?.items && cartResponse.cart.items.length > 0;

    if (backendHasItems) {
      // Backend cart has items — use initiateCheckout for AUTHORITATIVE items with correct prices
      if (!isCancelled) {
        const checkoutRes = await cartService.initiateCheckout();
        if (checkoutRes.success && checkoutRes.preview?.items) {
          const backendItems = checkoutRes.preview.items as unknown as CheckoutItemPreview[];
          const localItemsMap = new Map(
            currentItems.map((item) => [String(item.productId), item])
          );
          const mergedItems: CartItem[] = backendItems.map((backendItem) => {
            const localItem = localItemsMap.get(String(backendItem.productId));
            return {
              id: localItem?.id || String(backendItem.productId),
              productId: String(backendItem.productId),
              quantity: backendItem.quantity,
              name: backendItem.productName || localItem?.name || '',
              slug: localItem?.slug || '',
              price: backendItem.unitPrice || 0,
              currentPrice: backendItem.unitPrice || 0,
              image: backendItem.productImage || localItem?.image || '',
              stock: backendItem.availableStock || localItem?.stock || 0,
              isAvailable: backendItem.status !== 'INVALID',
              variantId: localItem?.variantId,
            };
          });
          setItems(mergedItems);
          console.log(`[Checkout] Loaded ${backendItems.length} authoritative items with correct prices from backend`);
        }
      }
    } else if (currentItems.length > 0) {
      // Backend cart is empty — push local items to backend first
      if (!isCancelled) {
        for (const item of currentItems) {
          const productId = parseInt(item.productId) || parseInt(item.id.replace('temp-', ''));
          if (productId && item.quantity > 0) {
            await cartService.addItem({ productId, quantity: item.quantity }).catch(() => {});
          }
        }
        // Now get authoritative items with correct prices from initiateCheckout
        const checkoutRes = await cartService.initiateCheckout();
        if (checkoutRes.success && checkoutRes.preview?.items) {
          const backendItems = checkoutRes.preview.items as unknown as CheckoutItemPreview[];
          const localItemsMap = new Map(
            currentItems.map((item) => [String(item.productId), item])
          );
          const mergedItems: CartItem[] = backendItems.map((backendItem) => {
            const localItem = localItemsMap.get(String(backendItem.productId));
            return {
              id: localItem?.id || String(backendItem.productId),
              productId: String(backendItem.productId),
              quantity: backendItem.quantity,
              name: backendItem.productName || localItem?.name || '',
              slug: localItem?.slug || '',
              price: backendItem.unitPrice || 0,
              currentPrice: backendItem.unitPrice || 0,
              image: backendItem.productImage || localItem?.image || '',
              stock: backendItem.availableStock || localItem?.stock || 0,
              isAvailable: backendItem.status !== 'INVALID',
              variantId: localItem?.variantId,
            };
          });
          setItems(mergedItems);
          console.log(`[Checkout] Pushed ${currentItems.length} local items to backend, loaded authoritative items with correct prices`);
        }
      }
    } else {
      // Both empty
      if (!isCancelled) setIsLoading(false);
      return;
    }
  } catch (err) {
    console.error('Failed to load cart from backend:', err);
    if (!isCancelled) {
      setSyncError('Gagal memuat keranjang dari server. Checkout mungkin tidak berjalan dengan benar.');
    }
  } finally {
    if (!isCancelled) setIsSyncingCart(false);
  }
};

syncCartToBackend();
return () => { isCancelled = true; };
}, []); // Empty deps = run ONCE on mount only
```

## Fix Flow

### Item Doubling Fix Flow

```
User adds item (qty 1)
  → Zustand addItem: set local state only (NO POST)
  → Backend cart: EMPTY

User navigates to /checkout
  → Sync effect: backend cart EMPTY
  → Sync effect: POST /cart/items (qty=1) → ONE POST only
  → Sync effect: initiateCheckout() → authoritative item with qty=1
  → setItems(mergedItems)

User places order
  → completeCheckout() → qty=1 ✓
```

### Price Fix Flow

```
User adds item (price: Rp 165,000 at that time)
  → Zustand store: item.price = 165,000

Product price changes (Rp 165,000 → Rp 220,000)

User navigates to /checkout
  → Sync effect: backend cart has item
  → Sync effect: initiateCheckout() → getProductForSnapshot() → Rp 220,000
  → mergedItems: price = 220,000 (from backend, not localStorage)
  → setItems(mergedItems)

User places order
  → completeCheckout() → getProductForSnapshot() → Rp 220,000 ✓
```

## Verification

1. **Item doubling fix**: Add 1 item to cart, navigate to checkout, check network tab → should be 1 POST `/cart/items` (not 2)
2. **Price mismatch fix**: Change product price in DB, add item to cart, navigate to checkout → checkout preview price should be current DB price (Rp 220,000), not price at add-to-cart time (Rp 165,000)
3. **End-to-end**: Checkout with 1 item → order should be 1 item with matching price
4. **No "Cart is empty" error**: Items must reach the backend cart correctly
