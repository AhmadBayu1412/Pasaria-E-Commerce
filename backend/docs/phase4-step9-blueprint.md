# Phase 4 Step 9 Blueprint — Cart Optimization

**Version:** 1.2 (Revisi setelah audit architect)  
**Date:** 2026-07-04  
**Status:** 🟡 PENDING REVISION

---

## Table of Contents

1. [Context & Rationale](#1-context--rationale)
2. [Decision: What to Cache](#2-decision-what-to-cache)
3. [File Layout](#3-file-layout)
4. [Interface Blueprint](#4-interface-blueprint)
5. [Cache Key Structure](#5-cache-key-structure)
6. [Function Signatures](#6-function-signatures)
7. [Cache Flow Diagrams](#7-cache-flow-diagrams)
8. [Scope Boundaries](#8-scope-boundaries)
9. [Objective Audit Matrix](#9-objective-audit-matrix)
10. [Test Scenarios](#10-test-scenarios)
11. [Decision Log](#11-decision-log)
12. [Risk Assessment](#12-risk-assessment)

---

## 1. Context & Rationale

### Why Cart First?

| Resource  | Access Pattern            | Cache Candidate |
| --------- | ------------------------- | --------------- |
| **Cart**  | High read, low mutation   | ✅ Ideal        |
| Order     | Low read, high mutation   | ❌ Not suitable |
| Inventory | High mutation on checkout | ❌ Not suitable |

### Philosophy: Redis as Accelerator, Not Database

```
Redis DOWN
    ↓
CartController.getCart()
    ↓
Cache miss → PostgreSQL
    ↓
Response returned normally
```

**Constraint:** Sistem HARUS berfungsi tanpa Redis. Cache adalah optimization, bukan dependency.

---

## 2. Decision: What to Cache

### Audit Finding #1 — Resolved

**Decision: Cache GET /cart Response (CartView)**

| Option                            | Decision    | Rationale                                              |
| --------------------------------- | ----------- | ------------------------------------------------------ |
| Cart Summary only                 | ❌ REJECTED | Inkonsisten dengan flow yang menggunakan GetCartResult |
| **GET /cart response (CartView)** | ✅ ACCEPTED | Redis mampu menyimpan payload ini dengan murah         |
| Separate /cart/summary endpoint   | ❌ REJECTED | Tidak ada use case yang membutuhkan                    |

**Definitive Answer:**

Yang di-cache adalah output dari `GET /cart`:

```typescript
CartView {
  cartId: number | null
  userId: number
  items: CartItemView[]        // Full items with product info
  itemCount: number
  totalQuantity: number
  createdAt: string | null
  updatedAt: string             // Cart.updatedAt
}
```

**Definisi updatedAt:**  
Selalu berasal dari `Cart.updatedAt`. Bukan timestamp cache creation.

**Definisi subtotal:**  
Phase 4 TIDAK menghitung subtotal di cart summary (pricing out of scope). `itemCount` dan `totalQuantity` sudah cukup untuk cache.

---

## 3. File Layout

### Audit Finding #2 — Resolved

**Decision: Adapter, not Service**

File `cart-cache.adapter.ts` — adapter cache, bukan domain service:

```
modules/cart/
├── services/
│   └── cart-cache.adapter.ts  [CREATE] Cache operations only
│                                 NOT a domain service
│                                 NOT a database query
└── services/
    └── cart.service.ts        [MODIFY] Orchestrate cache aside

shared/cache/
├── cache.keys.ts              [MODIFY] Add cartKey(userId)
└── cache.config.ts            [MODIFY] Add CACHE_TTL.CART

tests/unit/cart/
└── cart-cache.test.ts         [CREATE] 9 test scenarios
```

**Audit Finding #Final — Resolved**

**Orchestration stays in CartService:**

```
CartService (Orchestrator)
    │
    ├── getCart()
    │     │
    │     ├── try getCachedCart()
    │     │     │
    │     ├── HIT? → return
    │     │     │
    │     └── MISS → query database → return
    │
    └── mutations (add, update, remove, clear)
          │
          └── after DB write → invalidateCartCache()
```

Adapter ONLY provides:

- `getCachedCart()` — read from cache
- `setCachedCart()` — write to cache
- `invalidateCartCache()` — delete from cache

Adapter does NOT query database.

### NO CHANGES

- `prisma/schema.prisma` — No schema changes
- `modules/cart/controller/cart.controller.ts` — Controller unchanged
- `modules/cart/validation/cart.validation.ts` — No validation changes
- `infra/cache/redis.ts` — Redis client unchanged
- `shared/cache/cache.service.ts` — Reuse existing functions (NOT direct Redis)

---

## 4. Interface Blueprint

### 4.1 Cart Cache Key

```typescript
// shared/cache/cache.keys.ts

/**
 * Build key for cart cache
 * Format: pasaria:cart:{userId}
 */
export function cartKey(userId: number): string {
  return buildKey(CACHE_KEYS.NAMESPACES.CART, String(userId));
}
```

### 4.2 Cart Cache Config

```typescript
// shared/config/cache.config.ts

export const CACHE_TTL = {
  // ... existing
  CART: 300, // 5 minutes
} as const;

export const CACHE_KEYS = {
  PREFIX: 'pasaria',
  NAMESPACES: {
    PRODUCTS: 'products',
    CATEGORIES: 'categories',
    USERS: 'users',
    CART: 'cart', // [ADD]
  },
} as const;
```

### 4.3 Cart Cache Adapter (Cache Operations Only)

```typescript
// modules/cart/services/cart-cache.adapter.ts

/**
 * Cart Cache Adapter
 *
 * Provides cache operations only.
 * Does NOT orchestrate database queries.
 * Does NOT know about business logic.
 *
 * Single Responsibility: Cache storage operations
 */
import type { CartView } from '../types/cart.types.js';

/**
 * Get cart from cache only
 *
 * @param userId - User ID
 * @returns Cached CartView or null if miss
 */
export async function getCachedCart(userId: number): Promise<CartView | null>;

/**
 * Set cart to cache
 *
 * @param userId - User ID
 * @param cartView - Cart data to cache
 */
export async function setCachedCart(
  userId: number,
  cartView: CartView,
): Promise<void>;

/**
 * Invalidate cart cache for user
 *
 * Called after every mutation.
 * Centralized invalidation — mutations don't know WHAT to invalidate.
 */
export async function invalidateCartCache(userId: number): Promise<void>;
```

### 4.4 CartView (Existing, no changes)

```typescript
// modules/cart/types/cart.types.ts (existing, no changes)

export interface CartView {
  readonly cartId: number | null;
  readonly userId: number;
  readonly items: CartItemView[];
  readonly itemCount: number;
  readonly totalQuantity: number;
  readonly createdAt: string | null;
  readonly updatedAt: string | null; // Cart.updatedAt — NOT cache timestamp
}
```

---

## 5. Cache Key Structure

```
pasaria:cart:{userId}
         │    │
         │    └── Dynamic: 15, 42, 99
         └── Namespace: "cart"
```

**Audit Finding #3 — Resolved**

Nama interface tidak mengandung `Cache`:

```typescript
// ❌ Wrong
interface CartSummaryCache

// ✅ Correct — domain model, not storage concern
interface CartSummary
```

Key di Redis tetap `pasaria:cart:15`, tetapi TypeScript type adalah `CartView`.

---

## 6. Function Signatures

### 6.1 CartService (Modified)

```typescript
// modules/cart/services/cart.service.ts

export const CartService = {
  /**
   * Get Cart — WITH Cache Aside
   *
   * CartController calls this. No changes to controller.
   *
   * Flow:
   * 1. Call getCartWithCache(userId)
   * 2. getCartWithCache handles cache logic
   * 3. Return CartView (from cache or DB)
   */
  async getCart(input: GetCartServiceInput): Promise<GetCartResult>

  // --- Mutation Methods ---

  /**
   * Add to Cart
   * After successful DB write → invalidateCartCache(userId)
   */
  async addToCart(input: AddToCartServiceInput): Promise<AddToCartResult>

  /**
   * Update Quantity
   * After successful DB write → invalidateCartCache(userId)
   */
  async updateQuantity(input: UpdateQuantityServiceInput): Promise<UpdateQuantityResult>

  /**
   * Remove Item
   * After successful DB write → invalidateCartCache(userId)
   */
  async removeItem(input: RemoveItemServiceInput): Promise<RemoveItemResult>

  /**
   * Clear Cart
   * After successful DB write → invalidateCartCache(userId)
   */
  async clearCart(input: ClearCartServiceInput): Promise<ClearCartResult>
}
```

### 6.2 Dependency Direction

**Audit Finding #6 — Resolved**

```
CartService
    │
    ├── calls getCartWithCache()
    │
    └── calls invalidateCartCache()
              │
              └── calls cacheService.get()    ← shared/cache/cache.service.ts
              └── calls cacheService.set()    ← NOT redis.get() directly
              └── calls cacheService.delete() ← NOT redis.del() directly
```

**Constraint:** CartService only knows about `shared/cache/cache.service.ts`. Never imports `infra/cache/redis.ts`.

---

## 7. Cache Flow Diagrams

### 7.1 READ Flow (Cache Hit)

```
GET /cart
    │
    ▼
CartController.getCart()
    │
    ▼
CartService.getCart({ userId })
    │
    ▼
getCartWithCache(userId)
    │
    ▼
cacheService.get(cartKey(userId))
    │
    ▼
┌─────────────┐
│ CACHE HIT   │
│             │
│ Return from │
│ cacheService│
└─────────────┘
    │
    ▼
CartView returned
( PostgreSQL NOT touched )
```

### 7.2 READ Flow (Cache Miss)

```
GET /cart
    │
    ▼
getCartWithCache(userId)
    │
    ▼
cacheService.get(cartKey(userId))
    │
    ▼
┌─────────────┐
│ CACHE MISS  │
│             │
│ Query       │
│ PostgreSQL  │
└─────────────┘
    │
    ▼
cacheService.set(cartKey(userId), cartView, TTL)
    │
    ▼
CartView returned
```

### 7.3 WRITE Flow (All Mutations)

```
POST /cart/items     PUT /cart/items/:id    DELETE /cart/items/:id    DELETE /cart
    │                     │                      │                      │
    ▼                     ▼                      ▼                      ▼
CartService          CartService            CartService             CartService
.addToCart()         .updateQuantity()      .removeItem()           .clearCart()
    │                     │                      │                      │
    ▼                     ▼                      ▼                      ▼
PostgreSQL           PostgreSQL             PostgreSQL               PostgreSQL
(write)              (write)               (write)                  (write)
    │                     │                      │                      │
    ▼                     ▼                      ▼                      ▼
invalidateCartCache  invalidateCartCache    invalidateCartCache      invalidateCartCache
(userId)             (userId)             (userId)                 (userId)
    │                     │                      │                      │
    ▼                     ▼                      ▼                      ▼
cacheService.delete  cacheService.delete    cacheService.delete      cacheService.delete
(cartKey)            (cartKey)            (cartKey)                (cartKey)
    │                     │                      │                      │
    ▼                     ▼                      ▼                      ▼
Response to client  Response to client     Response to client       Response to client
```

**Audit Finding #7 — Resolved**

Invalidasi terpusat di `invalidateCartCache()`. Mutations hanya memanggil satu fungsi. Tidak perlu tahu apa yang di-invalidasi.

### 7.4 Redis DOWN Flow (Graceful Degradation)

**Audit Finding #8 — Resolved**

```
GET /cart
    │
    ▼
getCartWithCache(userId)
    │
    ▼
cacheService.get(cartKey)
    │
    ▼
┌─────────────────────────────────────────┐
│ try {                                    │
│   cacheService.get(key)                 │
│ }                                        │
│ catch (network timeout, connection err) { │
│   // isReady=false juga                  │
│   return null  // Treat as miss         │
│ }                                        │
└─────────────────────────────────────────┘
    │
    ▼
Fallback: Query PostgreSQL
    │
    ▼
try { cacheService.set(...) }  // SET also wrapped
catch { /* silent */ }

Response returned normally
```

**Principle:**

- `isReady` check AND `try-catch` wrapper
- Both `get()` and `set()` wrapped
- PostgreSQL always fallback

---

## 8. Scope Boundaries

### IN SCOPE (Step 9)

| Item                     | Description                             |
| ------------------------ | --------------------------------------- |
| Cart Cache               | Full CartView for GET /cart             |
| Cache Aside Pattern      | Read from cache, fallback to PostgreSQL |
| Centralized Invalidation | Single `invalidateCartCache()` function |
| Graceful Degradation     | try-catch on all cache operations       |
| TTL = 300 seconds        | Safety net                              |

### OUT OF SCOPE (Deferred)

| Item                      | Reason                |
| ------------------------- | --------------------- |
| Cart Summary only         | Not consistent        |
| Separate /cart/summary    | No use case           |
| Cache Warming             | Not needed yet        |
| Multi-Level Cache         | Over-engineering      |
| Cache Tagging             | No tagging use case   |
| Redis Pub/Sub             | Out of scope          |
| Distributed Cache         | No multi-instance yet |
| Cache Compression         | Premature             |
| Cache Metrics             | Observability concern |
| Cache Stampede Protection | Not a bottleneck yet  |
| Cache Versioning          | No rolling deployment |

---

## 9. Objective Audit Matrix

### 9.1 Architecture Alignment

| Criteria             | Status  | Evidence                                                   |
| -------------------- | ------- | ---------------------------------------------------------- |
| Redis as accelerator | ✅ PASS | Graceful degradation via try-catch, not just isReady check |
| Cache Aside pattern  | ✅ PASS | getCartWithCache() using cacheService abstraction          |
| Dependency clean     | ✅ PASS | CartService → cacheService → redis (not direct)            |
| TTL safety net       | ✅ PASS | CACHE_TTL.CART = 300                                       |
| No schema changes    | ✅ PASS | Reuses existing types                                      |

**Verdict:** ✅ PASS

### 9.2 Scope Guard Adherence

| Criteria                 | Status  | Evidence                                          |
| ------------------------ | ------- | ------------------------------------------------- |
| Cache target             | ✅ PASS | Full CartView, consistent with GET /cart response |
| Centralized invalidation | ✅ PASS | invalidateCartCache() single source               |
| No update cache          | ✅ PASS | DELETE only, rebuild on read                      |
| Breaking changes         | ✅ PASS | Controller unchanged, no API changes              |
| No cache suffix in types | ✅ PASS | CartView, not CartViewCache                       |

**Verdict:** ✅ PASS

### 9.3 Progressive Check

| Criteria      | Status  | Evidence                                        |
| ------------- | ------- | ----------------------------------------------- |
| Prerequisites | ✅ PASS | Step 1-8 complete, Redis infra exists           |
| Reuse         | ✅ PASS | cacheService from shared/cache/cache.service.ts |
| Evolution     | ✅ PASS | Natural extension, patterns preserved           |
| Testability   | ✅ PASS | 9 scenarios including cache failure tests       |
| Rollback      | ✅ PASS | Remove helper calls, no schema changes          |

**Verdict:** ✅ PASS

---

## 10. Test Scenarios

| #   | Scenario                                   | Expected Behavior                |
| --- | ------------------------------------------ | -------------------------------- |
| T1  | Cache miss → DB query → cacheService.set() | Next read = cache hit            |
| T2  | Cache hit                                  | Return directly from cache       |
| T3  | Add item → invalidateCartCache()           | Next read fetches from DB        |
| T4  | Update quantity → invalidateCartCache()    | Next read fetches from DB        |
| T5  | Remove item → invalidateCartCache()        | Next read fetches from DB        |
| T6  | Clear cart → invalidateCartCache()         | Next read fetches from DB        |
| T7  | Redis down (isReady=false)                 | Fallback to PostgreSQL, no error |
| T8  | **cacheService.set() fails**               | **Response still succeeds**      |
| T9  | **cacheService.delete() fails**            | **Mutation still succeeds**      |

**Audit Finding #10 — Resolved**

T8 dan T9 adalah tambahan test untuk membuktikan cache BUKAN dependency:

```typescript
// T8: SET failure
it('should succeed even if cache SET fails', async () => {
  // Mock cacheService.set to throw
  // Verify response is still CartView from DB
  // Cache miss on next read is acceptable
});

// T9: DELETE failure
it('should succeed even if cache DELETE fails', async () => {
  // Mock cacheService.delete to throw
  // Verify mutation still completes
  // Stale cache auto-expires via TTL
});
```

---

## 11. Decision Log

| ID     | Decision                                 | Rationale                                         |
| ------ | ---------------------------------------- | ------------------------------------------------- |
| D-9.1  | Cache full CartView (GET /cart response) | Consistent dengan flow, Redis mampu menyimpan     |
| D-9.2  | DELETE on all mutations                  | Safer, simpler than update                        |
| D-9.3  | TTL = 300 seconds                        | Safety net, invalidation already disiplin         |
| D-9.4  | Centralized invalidateCartCache()        | Mutations tidak perlu tahu apa yang di-invalidate |
| D-9.5  | Reuse cacheService from shared/cache     | Dependency satu arah, tidak langsung ke redis     |
| D-9.6  | Try-catch pada get() DAN set()           | isReady check AND runtime failure handling        |
| D-9.7  | Type name: CartView, not CartViewCache   | Domain model, bukan storage concern               |
| D-9.8  | File: cart-cache.helper.ts               | Helper/module utilitas, bukan domain service      |
| D-9.9  | No schema changes                        | Alignment dengan constraint                       |
| D-9.10 | Add T8, T9 for cache failure tests       | Buktikan cache bukan dependency                   |

---

## 12. Risk Assessment

| Risk                         | Likelihood | Impact | Mitigation                       |
| ---------------------------- | ---------- | ------ | -------------------------------- |
| Stale data if DELETE fails   | Low        | Medium | TTL = 300s auto-expire           |
| Cache stampede on cold start | Low        | Low    | Not a bottleneck yet             |
| Memory bloat                 | Low        | Low    | TTL 300s, per-user keys          |
| Redis down on high traffic   | Low        | Medium | Graceful degradation (try-catch) |
| Cache SET breaks request     | Low        | High   | T8 test, try-catch wrapper       |
| Cache DELETE breaks mutation | Low        | High   | T9 test, try-catch wrapper       |

---

## Summary

| Aspect                   | Decision                                 |
| ------------------------ | ---------------------------------------- |
| **Pattern**              | Cache Aside via cacheService abstraction |
| **What to Cache**        | Full CartView (GET /cart response)       |
| **Cache Key**            | `pasaria:cart:{userId}`                  |
| **TTL**                  | 300 seconds                              |
| **Invalidation**         | Centralized invalidateCartCache()        |
| **Graceful Degradation** | try-catch on get() AND set()             |
| **Files Changed**        | 3 existing + 1 new helper + 1 test       |
| **Breaking Changes**     | None                                     |

---

## Audit Result

| Criteria                   | Status  | Notes                                              |
| -------------------------- | ------- | -------------------------------------------------- |
| **Architecture Alignment** | ✅ PASS | cacheService abstraction, try-catch wrapper        |
| **Scope Guard Adherence**  | ✅ PASS | Centralized invalidation, no cache suffix in types |
| **Progressive Check**      | ✅ PASS | T8/T9 added, reuses existing infrastructure        |

---

## Audit Findings Response

| #   | Finding                     | Resolution                                  |
| --- | --------------------------- | ------------------------------------------- |
| 1   | Inkonsistensi cache target  | ✅ Cache full CartView, bukan hanya summary |
| 2   | cart-cache.service → helper | ✅ Menjadi cart-cache.helper.ts             |
| 3   | CartSummaryCache → CartView | ✅ Domain model, bukan storage concern      |
| 4   | updatedAt asal明确化        | ✅ Cart.updatedAt, bukan cache timestamp    |
| 5   | subtotal scope              | ✅ Phase 4 tidak hitung subtotal di cart    |
| 6   | Direct redis → cacheService | ✅ Dependency satu arah                     |
| 7   | Decentralized invalidation  | ✅ Centralized invalidateCartCache()        |
| 8   | isReady only → try-catch    | ✅ isReady AND try-catch                    |
| 9   | TTL 300 detik               | ✅ Agree, safety net bukan sinkronisasi     |
| 10  | T8, T9 missing              | ✅ Ditambahkan untuk bukti bukan dependency |

---

**Blueprint Version:** 1.2  
**Status:** ✅ READY TO CODE  
**Next Action:** Toggle to ACT MODE for implementation
