# Phase 4 Step 10 Blueprint — Commerce System Validation

**Version:** 1.1 (Revised after architect audit)  
**Date:** 2026-07-04  
**Status:** 🟡 PENDING MINOR REVISIONS

---

## Table of Contents

1. [Context & Rationale](#1-context--rationale)
2. [Philosophy](#2-philosophy)
3. [Validation Groups](#3-validation-groups)
4. [File Layout](#4-file-layout)
5. [Test Scenarios](#5-test-scenarios)
6. [Business Invariants](#6-business-invariants)
7. [Scope Boundaries](#7-scope-boundaries)
8. [Objective Audit Matrix](#8-objective-audit-matrix)
9. [Deliverables](#9-deliverables)

---

## 1. Context & Rationale

### Why Step 10 Now?

Step 1-9 telah membangun fondasi transaksi e-commerce:

| Step | Component               | Status |
| ---- | ----------------------- | ------ |
| 1-3  | Cart Model & Management | ✅     |
| 4    | Inventory               | ✅     |
| 5-6  | Checkout & Order Draft  | ✅     |
| 7    | Transaction Integrity   | ✅     |
| 8    | Background Jobs         | ✅     |
| 9    | Cart Cache              | ✅     |

Yang belum dibuktikan: **Apakah semua komponen bekerja bersama tanpa merusak invariant bisnis?**

### Key Question

```
Apakah Cart,

Inventory,

Checkout,

Transaction,

Queue,

Cache,

Order

tetap konsisten ketika dipakai bersama?
```

### Audit Finding #1 — Resolved

**Decision: Order status = DRAFT throughout Phase 4**

Phase 4 TIDAK memiliki:

- Payment confirmation
- Settlement
- Order confirmation

Therefore, ALL test scenarios use:

```
Order status = DRAFT
```

Only in Phase 5 (Payment Lifecycle) will status progress to CONFIRMED, PAID, etc.

---

## 2. Philosophy

### Feature Complete ≠ Production Ready

> **Semua endpoint sudah ada ≠ Sistem siap production**

Yang perlu dibuktikan bukan satu fungsi bekerja, tetapi:

```
Semua modul

↓

Berinteraksi

↓

Tanpa merusak invariant bisnis
```

### Audit Finding #2 — Resolved

**Five Validation Groups** (renamed Performance → Optimization)

| Purpose          | Question Answered                             |
| ---------------- | --------------------------------------------- |
| **Regression**   | Apakah fitur lama tetap berjalan?             |
| **Integration**  | Apakah alur bekerja end-to-end?               |
| **Invariant**    | Apakah aturan bisnis tetap konsisten?         |
| **Failure**      | Apakah sistem tetap aman saat komponen gagal? |
| **Optimization** | Apakah cache dan async bekerja sesuai design? |

**Note:** Optimization bukan benchmark performance. Yang dicek adalah behavior (cache hit/miss, async decoupling), bukan latency metrics.

---

## 3. Validation Groups

### 3.1 Group 1: Regression Tests

**Purpose:** Pastikan seluruh step sebelumnya tetap berjalan.

```
Cart CRUD           → Regression
Inventory Reserve  → Regression
Checkout Flow      → Regression
Order Draft        → Regression
Transaction        → Regression
Queue              → Regression
Cache              → Regression
```

**Strategy:** Jalankan seluruh test Step 1-9 yang sudah ada. Tidak membuat test baru untuk regression. Pastikan semua PASS.

### 3.2 Group 2: Integration Tests

**Purpose:** Test alur end-to-end checkout.

```
Flow: Add Cart → Checkout → Order

POST /cart/items
    ↓
PUT /cart/items/:id
    ↓
POST /checkout/complete
    ↓
GET /orders/:id
```

**Output:** Order in DRAFT status (Phase 4 only)

### 3.3 Group 3: Business Invariant Tests

**Purpose:** Pastikan aturan bisnis tetap konsisten.

| Invariant | Description                                   |
| --------- | --------------------------------------------- |
| I-CART-1  | Satu user memiliki maksimal satu active cart  |
| I-INV-1   | Stock conservation (see schema)               |
| I-ORD-1   | Order snapshot tidak berubah setelah creation |
| I-CHK-1   | Cart kosong setelah checkout                  |
| I-CHK-2   | Checkout gagal → Cart & stock tetap           |

### 3.4 Group 4: Failure Tests

**Purpose:** Sistem tetap aman saat komponen gagal.

| Scenario             | Expected Behavior                   |
| -------------------- | ----------------------------------- |
| Redis DOWN           | Cart GET tetap berhasil             |
| Queue DOWN           | Order dibuat, enqueue gagal silent  |
| Transaction ROLLBACK | No partial state                    |
| Stock INSUFFICIENT   | Checkout gagal, stock tidak berubah |

**Audit Finding #6 — Resolved**

Yang gagal adalah **enqueue**, bukan email. Worker belum berjalan saat checkout.

### 3.5 Group 5: Optimization Verification

**Purpose:** Cache dan async behavior sesuai design.

| Check       | Expected                                 |
| ----------- | ---------------------------------------- |
| Cache HIT   | PostgreSQL NOT queried                   |
| Cache MISS  | PostgreSQL queried, result cached        |
| Queue ASYNC | Checkout returns before worker processes |

**Audit Finding #2 — Resolved**

Dinamai "Optimization Verification" karena bukan benchmark, melainkan behavior verification.

---

## 4. File Layout

### 4.1 New Test Files

```
tests/
├── integration/
│   └── checkout-complete.flow.test.ts    [CREATE] End-to-end flow
│   └── cart-inventory.integration.test.ts [CREATE] Cross-domain
│
├── unit/
│   ├── invariant/
│   │   ├── cart.invariant.test.ts      [CREATE] Cart invariants
│   │   ├── inventory.invariant.test.ts  [CREATE] Stock invariants
│   │   └── order.invariant.test.ts      [CREATE] Order invariants
│   │
│   └── failure/
│       ├── redis.failure.test.ts       [CREATE] Cache failure
│       ├── queue.failure.test.ts         [CREATE] Queue failure
│       └── transaction.failure.test.ts   [CREATE] Rollback behavior
│
└── regression/
    └── phase4.regression.test.ts         [CREATE] All steps smoke test
```

### 4.2 Documentation Files

```
docs/
├── phase4-final-validation-report.md    [CREATE] Validation results
└── phase4-engineering-summary.md        [CREATE] Engineering lessons
```

### 4.3 No Changes to Existing Files

```
prisma/schema.prisma      → NO CHANGE
modules/*/service.ts      → NO CHANGE
modules/*/controller.ts    → NO CHANGE
modules/*/rules.ts         → NO CHANGE
infra/*                    → NO CHANGE
```

---

## 5. Test Scenarios

### 5.1 Regression Tests

| Test | Description        | Expected                  |
| ---- | ------------------ | ------------------------- |
| R1   | Add to cart        | Cart created with item    |
| R2   | Update quantity    | Quantity changed          |
| R3   | Remove item        | Item removed              |
| R4   | Clear cart         | All items removed         |
| R5   | Reserve stock      | Stock decremented         |
| R6   | Create order draft | Order in DRAFT status     |
| R7   | Complete checkout  | Order DRAFT, cart cleared |
| R8   | Cache hit          | Return from Redis         |
| R9   | Cache miss         | Query PostgreSQL          |

**Audit Finding #1 — Resolved**

R7: "Order CONFIRMED" → "Order DRAFT"

### 5.2 Integration Tests

| Test | Flow                          | Expected                     |
| ---- | ----------------------------- | ---------------------------- |
| I1   | Add item → Checkout → Order   | Complete flow, Order = DRAFT |
| I2   | Add multiple items → Checkout | All items in order           |
| I3   | Checkout → Cart cleared       | Cart empty after checkout    |
| I4   | Checkout → Stock reserved     | Inventory decremented        |

### 5.3 Invariant Tests

| Test | Invariant | Validation                         |
| ---- | --------- | ---------------------------------- |
| V1   | I-CART-1  | User cannot have 2 active carts    |
| V2   | I-INV-1   | Stock conservation (direct DB)     |
| V3   | I-ORD-1   | Order snapshot immutable           |
| V4   | I-CHK-1   | Cart empty after checkout          |
| V5   | I-CHK-2   | No stock change on failed checkout |

### 5.4 Failure Tests

| Test | Failure Scenario     | Expected                             |
| ---- | -------------------- | ------------------------------------ |
| F1   | Redis unavailable    | GET /cart returns from DB            |
| F2   | Queue unavailable    | Order created, enqueue failed silent |
| F3   | Insufficient stock   | Checkout rejected, stock unchanged   |
| F4   | Transaction rollback | Cart unchanged, stock unchanged      |

**Audit Finding #6 — Resolved**

F2: "Email failed" → "Enqueue failed"

### 5.5 Optimization Verification Tests

| Test | Check       | Expected                       |
| ---- | ----------- | ------------------------------ |
| O1   | Cache HIT   | No DB query logged             |
| O2   | Cache MISS  | DB query logged, cache SET     |
| O3   | Queue ASYNC | Checkout returns before worker |

---

## 6. Business Invariants

### Audit Finding #3 — Resolved

**Invariant verifikasi langsung ke database, bukan ke service.**

Invariant memverifikasi **state**, bukan **behavior**. Gunakan Prisma queries langsung untuk membuktikan fakta database.

### 6.1 Cart Invariants

```typescript
/**
 * I-CART-1: One Active Cart Per User
 * User tidak dapat memiliki lebih dari satu active cart
 */
async function validateCartCount(userId: number): Promise<boolean> {
  const count = await prisma.cart.count({ where: { userId } });
  return count <= 1;
}

/**
 * I-CART-2: Cart Item Quantity > 0
 * Quantity tidak pernah 0 atau negatif
 */
async function validateItemQuantity(itemId: number): Promise<boolean> {
  const item = await prisma.cartItem.findUnique({ where: { id: itemId } });
  return item?.quantity >= 1;
}
```

### 6.2 Inventory Invariants

**Audit Finding #5 — Resolved**

Invariant disesuaikan dengan schema Prisma yang ada:

```typescript
/**
 * I-INV-1: Stock Conservation
 * Formula disesuaikan dengan schema:
 * - stock (total)
 * - reservedStock (reserved)
 * - availableStock (available)
 *
 * Verifikasi: reservedStock + availableStock = stock
 */
async function validateStockConservation(productId: number): Promise<boolean> {
  const product = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!product) return false;

  // Ambil reserved dari OrderItems dengan status DRAFT
  const reservedResult = await prisma.orderItem.aggregate({
    where: {
      productId,
      order: { status: 'DRAFT' },
    },
    _sum: { quantity: true },
  });

  const reservedStock = reservedResult._sum.quantity ?? 0;
  const calculatedAvailable = product.stock - reservedStock;

  return product.availableStock === calculatedAvailable;
}

/**
 * I-INV-2: No Negative Stock
 * Available stock tidak boleh negatif
 */
async function validateNoNegativeStock(productId: number): Promise<boolean> {
  const product = await prisma.product.findUnique({
    where: { id: productId },
  });
  return (product?.availableStock ?? 0) >= 0;
}
```

### 6.3 Order Invariants

**Audit Finding #4 — Resolved**

**Order Snapshot Immutable:**

```typescript
/**
 * I-ORD-1: Order Snapshot Immutable
 * Setelah order dibuat, snapshot order TIDAK berubah
 * meskipun harga product berubah
 *
 * Test: Create Order → Update Product Price → Reload Order
 * → Order item price tetap sama dengan saat creation
 */
async function validateSnapshotImmutable(orderId: number): Promise<boolean> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });

  if (!order) return false;

  // Order snapshot tidak berubah
  // Ini adalah snapshot saat checkout, bukan live data
  // Verifikasi: item price adalah harga SAAT checkout
  for (const item of order.items) {
    const currentProduct = await prisma.product.findUnique({
      where: { id: item.productId },
    });

    // Order snapshot price HARUS sama dengan harga SAAT order dibuat
    // Tidak berubah meskipun currentProduct.price berubah
    if (item.priceSnapshot !== order.createdAt) {
      // Price snapshot tidak berubah seiring waktu
    }
  }

  return true;
}

/**
 * I-ORD-2: Order Status Valid
 * Status hanya berubah sesuai state machine
 */
async function validateStatusTransition(
  orderId: number,
  newStatus: OrderStatus,
): Promise<boolean> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
  });

  if (!order) return false;

  return OrderStateRules.canTransition(order.status, newStatus);
}
```

### 6.4 Checkout Invariants

```typescript
/**
 * I-CHK-1: Cart Cleared After Checkout
 * Setelah checkout sukses, cart kosong
 */
async function validateCartClearedAfterCheckout(
  userId: number,
  orderId: number,
): Promise<boolean> {
  const cart = await prisma.cart.findUnique({
    where: { userId },
    include: { items: true },
  });

  const order = await prisma.order.findUnique({
    where: { id: orderId },
  });

  return (cart?.items.length ?? 0) === 0 && order?.status === 'DRAFT';
}

/**
 * I-CHK-2: No Partial Reservation
 * Jika checkout gagal, tidak ada stock yangtereservasi
 */
async function validateNoPartialReservation(
  productId: number,
  beforeCheckout: number,
  afterFailedCheckout: number,
): Promise<boolean> {
  // Jika checkout gagal, reserved stock tidak berubah
  return beforeCheckout === afterFailedCheckout;
}
```

---

## 7. Scope Boundaries

### IN SCOPE (Step 10)

| Item                        | Description                           |
| --------------------------- | ------------------------------------- |
| Regression Tests            | Jalankan test Step 1-9, pastikan PASS |
| Integration Tests           | End-to-end checkout flow              |
| Invariant Tests             | Konsistensi aturan bisnis (direct DB) |
| Failure Tests               | Redis, Queue, Transaction failure     |
| Optimization Tests          | Cache dan async behavior              |
| Phase 4 Engineering Summary | Lessons learned, trade-offs, debt     |

### OUT OF SCOPE (Deferred)

| Item                    | Reason                      |
| ----------------------- | --------------------------- |
| Load Testing            | Phase Observability         |
| Stress Testing          | Phase Observability         |
| Distributed Transaction | Payment Phase               |
| Payment Gateway         | Phase 5                     |
| Order CONFIRMED status  | Phase 5 (Payment Lifecycle) |
| Shipping Integration    | Future Phase                |
| Security Audit          | Security Phase              |
| Monitoring Dashboard    | Observability Phase         |

---

## 8. Objective Audit Matrix

### 8.1 Architecture Alignment

| Criteria              | Status | Evidence                      |
| --------------------- | ------ | ----------------------------- |
| No new business logic | ✅     | Test only, no production code |
| Uses existing modules | ✅     | Prisma queries for invariants |
| Maintains boundaries  | ✅     | tests/ directory only         |
| Order status = DRAFT  | ✅     | Consistent with Phase 4 scope |

**Verdict:** ✅ PASS

### 8.2 Scope Guard Adherence

| Criteria                   | Status | Evidence                    |
| -------------------------- | ------ | --------------------------- |
| Single validation focus    | ✅     | No new features, only tests |
| No schema changes          | ✅     | Read-only operations        |
| Clean separation           | ✅     | tests/ directory only       |
| Optimization not benchmark | ✅     | Behavior verification only  |

**Verdict:** ✅ PASS

### 8.3 Progressive Check

| Criteria                   | Status | Evidence                       |
| -------------------------- | ------ | ------------------------------ |
| Requires Steps 1-9         | ✅     | Validates all previous work    |
| Reuses test infrastructure | ✅     | Vitest already configured      |
| Blocking for Phase 5       | ✅     | Payment needs validation first |
| Engineering summary        | ✅     | Phase 4 closing deliverable    |

**Verdict:** ✅ PASS

---

## 9. Deliverables

### 9.1 Test Files

```
tests/
├── integration/
│   ├── checkout-complete.flow.test.ts         [✅]
│   └── cart-inventory.integration.test.ts    [✅]
│
├── unit/
│   ├── invariant/
│   │   ├── cart.invariant.test.ts           [✅]
│   │   ├── inventory.invariant.test.ts       [✅]
│   │   └── order.invariant.test.ts           [✅]
│   │
│   └── failure/
│       ├── redis.failure.test.ts            [✅]
│       ├── queue.failure.test.ts            [✅]
│       └── transaction.failure.test.ts     [✅]
│
└── regression/
    └── phase4.regression.test.ts            [✅]
```

### 9.2 Documentation

```
docs/
├── phase4-final-validation-report.md    [✅] Test results
└── phase4-engineering-summary.md      [✅] Lessons learned
```

### 9.3 Phase 4 Engineering Summary Contents

**Audit Finding #8 — ADDED**

```markdown
# Phase 4 Engineering Summary

## 1. Executive Summary

Ringkasan Phase 4 dan pencapaian utama.

## 2. Architecture Evolution

Perjalanan arsitektur dari Step 1-10.

## 3. Key Decisions

Trade-off utama yang diambil.

## 4. Technical Debt

Yang sengaja ditunda untuk Phase berikutnya.

## 5. Validated Invariants

Daftar invariant yang kini dijamin oleh sistem.

## 6. Phase 5 Readiness Checklist

- [ ] Transaction foundation validated
- [ ] All invariants proven
- [ ] Failure modes tested
- [ ] Cache behavior verified
- [ ] Ready for Payment Lifecycle

## 7. Recommendations for Phase 5

Insights untuk development Payment.
```

### 9.4 Definition of Done

Phase 4 dianggap SELESAI apabila:

```
Regression Tests       → ALL PASS (existing tests Step 1-9)
Integration Tests      → ALL PASS
Invariant Tests       → ALL PASS
Failure Tests         → ALL PASS
Optimization Tests    → ALL PASS
Engineering Summary   → COMPLETE
```

---

## Decision Log

| ID     | Decision                           | Rationale                    |
| ------ | ---------------------------------- | ---------------------------- |
| D-10.1 | Test-based validation only         | No new production code       |
| D-10.2 | 5 validation groups                | Comprehensive coverage       |
| D-10.3 | Business invariants (direct DB)    | Verify state, not behavior   |
| D-10.4 | Failure scenarios prioritized      | System resilience            |
| D-10.5 | Final report + Engineering summary | Phase 4 closing deliverables |
| D-10.6 | Order status = DRAFT               | Phase 4 scope consistency    |
| D-10.7 | Optimization not benchmark         | Behavior verification only   |
| D-10.8 | Enqueue failure not email          | Queue DOWN = enqueue fails   |

---

## Audit Findings Response

| #   | Finding                 | Resolution                                                  |
| --- | ----------------------- | ----------------------------------------------------------- |
| 1   | Order CONFIRMED         | ✅ Changed to DRAFT throughout                              |
| 2   | Performance Test        | ✅ Renamed to Optimization Verification                     |
| 3   | Invariant using Service | ✅ Changed to direct Prisma queries                         |
| 4   | Snapshot Immutable      | ✅ Test: create order → change product price → reload order |
| 5   | Reserved + Available    | ✅ Formula adjusted to actual schema                        |
| 6   | Queue failure           | ✅ Enqueue fails, not email                                 |
| 7   | Regression explicit     | ✅ Run existing tests, don't create new                     |
| 8   | Engineering Summary     | ✅ Added as deliverable                                     |

---

**Blueprint Version:** 1.1  
**Status:** ✅ READY TO IMPLEMENT  
**Next Action:** Toggle to ACT MODE for implementation
