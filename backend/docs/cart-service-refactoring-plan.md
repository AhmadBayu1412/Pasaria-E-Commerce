# CartService Refactoring Plan

## Overview

Dokumen ini merencanakan strategi refactoring untuk `CartService` jika ukurannya semakin bertumbuh. Tujuannya adalah menjaga code tetap maintainable seiring bertambahnya fitur.

---

## Current State

| Metric | Value |
|--------|-------|
| **File** | `modules/cart/services/cart.service.ts` |
| **Lines** | ~140 lines |
| **Methods** | 2 (`addToCart`, `getCartByUserId`) |
| **Status** | Healthy |

---

## Growth Projection

| Phase | Methods Added | Estimated Lines |
|-------|---------------|-----------------|
| Step 3 | `removeItem`, `updateQuantity`, `clearCart`, `getCart` | ~300 lines |
| Step 4 | `addToCartWithReservation` | ~350 lines |
| Step 5+ | Checkout, Pricing, Discounts | ~500+ lines |

---

## Refactoring Triggers

Refactoring akan dipertimbangkan ketika:

| Trigger | Threshold | Priority |
|---------|-----------|----------|
| File exceeds | 400 lines | Medium |
| File exceeds | 600 lines | High |
| Cyclomatic complexity | > 20 per method | High |
| Number of dependencies | > 5 per method | Medium |

---

## Refactoring Options

### Option A: Method Separation (Recommended for 400-500 lines)

```
CartService/
├── index.ts
├── add.service.ts      # addToCart, addToCartWithReservation
├── get.service.ts      # getCart, getCartByUserId
├── update.service.ts    # updateQuantity
├── remove.service.ts    # removeItem, clearCart
└── shared/
    ├── types.ts
    └── helpers.ts
```

**Pros:**
- Sederhana
- Tidak perlu pattern baru
- Easy to understand

**Cons:**
- Still in single module
- Shared code needs careful management

---

### Option B: Separate Service Classes

```
CartService/
├── index.ts
├── AddToCartService.ts
├── GetCartService.ts
├── UpdateCartService.ts
├── RemoveItemService.ts
└── CartService.ts (Facade)
```

**Pros:**
- Clear separation
- Each service has single responsibility
- Easy to test

**Cons:**
- More boilerplate
- May be overkill for simple operations

---

### Option C: Command/Query Separation

```
Cart/
├── commands/
│   ├── AddToCartCommand.ts
│   ├── UpdateQuantityCommand.ts
│   └── RemoveItemCommand.ts
├── queries/
│   ├── GetCartQuery.ts
│   └── ListCartItemsQuery.ts
└── CartApplicationService.ts
```

**Pros:**
- CQRS aligned
- Clear command/query separation
- Audit-friendly

**Cons:**
- Significant pattern change
- More code
- Overkill for e-commerce cart

---

## Recommended Approach

### Phase 1: Monitoring (Current - Step 3)

Continue with single `CartService` file. Monitor growth.

**Actions:**
- Track line count
- Track method complexity
- Document decisions

### Phase 2: Logical Grouping (400+ lines)

Split into separate files by domain behavior:

```
modules/cart/services/
├── index.ts
├── add.service.ts       # addToCart
├── query.service.ts     # getCart, getCartByUserId  
├── update.service.ts    # updateQuantity, clearCart
└── remove.service.ts   # removeItem
```

**Reasoning:**
- Follows existing module pattern
- Keeps related behavior together
- Easy migration path

### Phase 3: Consider Facade (600+ lines)

If still growing, introduce a facade:

```
modules/cart/services/
├── index.ts
├── CartFacade.ts       # Orchestrates all services
├── add/
├── query/
├── update/
└── remove/
```

---

## Migration Strategy

### Step 1: Create New Structure

```typescript
// services/add.service.ts
export async function addToCart(input: AddToCartInput) {
  // Move existing code here
}

// services/query.service.ts  
export async function getCart(userId: number) {
  // Move existing code here
}
```

### Step 2: Update Index Exports

```typescript
// services/index.ts
export { addToCart } from './add.service.js'
export { getCart } from './query.service.js'
```

### Step 3: Update Controller Imports

```typescript
// controller/cart.controller.ts
import { addToCart } from '../services/add.service.js'
import { getCart } from '../services/query.service.js'
```

### Step 4: Remove Old Service

```bash
rm services/cart.service.ts
```

---

## Anti-Patterns to Avoid

| Anti-Pattern | Why Bad | Instead |
|--------------|---------|---------|
| Premature extraction | YAGNI | Wait for trigger |
| Deep inheritance | Fragile | Composition |
| God Service | Unmaintainable | Split by behavior |
| Too many files | Hard to navigate | Logical grouping |

---

## Current Recommendation

**Stay with single file until trigger reached.**

The current implementation (~140 lines) is healthy and well-structured. Adding structure now would be premature optimization.

Monitor and refactor when:
1. File exceeds 400 lines
2. Multiple developers working on same file
3. Tests become hard to write

---

## Decision Log

| Date | Decision | Rationale |
|------|----------|------------|
| 2026-07-03 | No refactoring now | 137 lines is healthy |
| 2026-07-03 | Prepare plan for future | Proactive documentation |
| 2026-07-03 | Prefer Option A when triggered | Simple, proven pattern |

---

## References

- [Martin Fowler - YAGNI](https://martinfowler.com/bliki/Yagni.html)
- [Single Responsibility Principle](https://principles.solids.design.br/principles/single-responsibility-principle)
- [Code Ownership](https://martinfowler.com/bliki/CodeOwnership.html)
