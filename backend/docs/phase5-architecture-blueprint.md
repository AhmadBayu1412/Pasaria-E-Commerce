# Phase 5 Architecture Blueprint (v2)

**Version:** 2.0  
**Date:** 2026-07-04  
**Phase:** Payment Lifecycle Foundation  
**Based on:** Review feedback — v1 score: 9.2/10

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Design Philosophy](#2-design-philosophy)
3. [Domain Model](#3-domain-model)
4. [State Machine Design](#4-state-machine-design)
5. [10-Step Implementation Plan](#5-10-step-implementation-plan)
6. [Scope Boundaries](#6-scope-boundaries)
7. [Refinements from Review](#7-refinements-from-review)
8. [Proposed Changes](#8-proposed-changes)
9. [Payment Invariants](#9-payment-invariants)
10. [Order ↔ Payment Relationship](#10-order--payment-relationship)
11. [Testing Strategy](#11-testing-strategy)

---

## 1. Executive Summary

### Phase 5 Mission

> **Transform Order dari DRAFT transaction menjadi PAID transaction through external Payment Gateway.**

### Phase 5 Theme

> **"Payment is the most expensive domain to fix when broken."**

### Why Phase 5 is Different

| Aspect         | Phase 4            | Phase 5                     |
| -------------- | ------------------ | --------------------------- |
| Domain Control | 100% internal      | External gateway            |
| Consistency    | Atomic (immediate) | Eventual (webhooks)         |
| Error Cost     | Low (data)         | High (money)                |
| Idempotency    | Optional           | **Critical**                |
| Retry Model    | Simple queue       | Idempotent deduplication    |
| Foundation     | Database           | **Persistent storage (DB)** |

### Phase 5 vs Phase 4

```
Phase 4: Atomic Transaction
┌────────────────────────────────────┐
│                                    │
│  BEGIN TRANSACTION                 │
│    reserve stock                  │
│    create order                   │
│    clear cart                     │
│  COMMIT                           │
│                                    │
└────────────────────────────────────┘

Phase 5: Distributed Transaction
┌────────────────────────────────────┐
│                                    │
│  Pasaria ←→ Gateway               │
│    async via webhooks              │
│    idempotency critical            │
│    money at stake                  │
│                                    │
└────────────────────────────────────┘
```

---

## 2. Design Philosophy

### Key Principles

1. **Domain Decoupling**
   - Order only knows `paymentId`
   - Payment knows gateway details
   - No cross-imports

2. **Stub First, Real Later**
   - Learn concepts with fake provider
   - Real integration later

3. **Persistent Idempotency**
   - Database as source of truth
   - NOT Redis (can lose data on restart)

4. **Simple State Machine**
   - Results, not complex transitions
   - New attempt = new Payment

5. **Single Timeline**
   - OrderTimeline for everything
   - No separate PaymentStatusHistory

---

## 3. Domain Model

### Order Entity (Enhanced)

```typescript
// modules/order/order.types.ts

type OrderStatus =
  | 'DRAFT' // Created from checkout
  | 'WAITING_PAYMENT' // Payment initiated
  | 'PAID' // Payment confirmed
  | 'CANCELLED' // Cancelled/timeout
  | 'EXPIRED'; // Payment timeout exceeded

interface Order {
  id: number;
  userId: number;
  status: OrderStatus;

  // From Phase 4
  totalQuantity: number;
  totalItemCount: number;
  subtotal: number;

  // Phase 5 - ONLY paymentId, nothing more
  paymentId: number | null; // Reference to Payment aggregate

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}
```

**Design Decision: Why only `paymentId`?**

> Order tidak perlu tahu `paymentReference` (gateway-specific detail).
> Itu adalah tanggung jawab Payment aggregate.
> Jika gateway diganti, Order TIDAK berubah.

### Payment Entity (New)

```typescript
// modules/payment/payment.types.ts

type PaymentStatus =
  | 'PENDING' // Intent created
  | 'SUCCESS' // Payment confirmed
  | 'DECLINED' // Gateway rejected payment
  | 'EXPIRED'; // Timeout exceeded

type PaymentProvider = 'MIDTRANS' | 'XENDIT' | 'STRIPE' | 'STUB';

interface Payment {
  id: number;
  orderId: number; // FK to Order
  userId: number;

  amount: number;
  currency: string; // 'IDR'

  provider: PaymentProvider;
  providerReference: string | null; // Gateway transaction ID

  // Idempotency - stored in DATABASE, not cache
  idempotencyKey: string; // Unique per attempt

  status: PaymentStatus;

  // Gateway raw response (for debugging)
  gatewayResponse: Record<string, unknown> | null;

  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date | null;
}
```

**Design Decision: Why persistent idempotency?**

> Redis bisa restart. Database tidak.
> Untuk payment (money at stake), idempotency record harus persisten.

### OrderTimeline Entity (Single Audit Trail)

```typescript
// modules/order/order-timeline.types.ts

type TimelineEvent =
  | 'ORDER_CREATED'
  | 'PAYMENT_INITIATED'
  | 'PAYMENT_SUCCESS'
  | 'PAYMENT_FAILED'
  | 'PAYMENT_EXPIRED'
  | 'ORDER_CANCELLED'
  | 'STOCK_RELEASED'
  | 'EMAIL_SENT';

interface OrderTimeline {
  id: number;
  orderId: number;

  event: TimelineEvent;
  metadata: Record<string, unknown> | null; // Flexible data

  createdAt: Date;
}
```

**Design Decision: Why single OrderTimeline?**

> Dibanding pisah PaymentStatusHistory dan OrderTimeline,
> lebih baik satu timeline yang centralized.
> Semua event terkait Order berada di satu tempat.

### Relationship Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   Order (Aggregate Root)                                  │
│   │                                                         │
│   ├── id: number                                          │
│   ├── status: OrderStatus                                 │
│   ├── paymentId: number | null ◄─── FK to Payment         │
│   └── timeline: OrderTimeline[]                            │
│                                                             │
│                         ┌─────────────────────────────┐    │
│                         │          Payment            │    │
│                         │                             │    │
│                         ├── id: number               │    │
│                         ├── orderId: number ◄─────────┘    │
│                         ├── provider: Provider          │
│                         ├── providerReference: string   │
│                         ├── idempotencyKey: string    │
│                         └── status: PaymentStatus      │
│                                                             │
│                         ┌─────────────────────────────┐    │
│                         │    PaymentGateway (Interface) │    │
│                         │                             │    │
│                         ├── createCharge()            │    │
│                         ├── getStatus()              │    │
│                         └── parseWebhook()            │    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. State Machine Design

### Order State Machine

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   DRAFT                                                     │
│   (Checkout complete, ready to pay)                        │
│                                                             │
│   Transitions:                                              │
│   → WAITING_PAYMENT (initiate payment)                     │
│   → CANCELLED (user cancels before payment)                │
│                                                             │
└────────────────────────┬─────────────────────────────────┘
                         │
                         │ initiatePayment()
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   WAITING_PAYMENT                                           │
│   (Payment intent created, awaiting confirmation)           │
│                                                             │
│   Transitions:                                              │
│   → PAID (webhook: success)                               │
│   → CANCELLED (user cancels at gateway)                    │
│   → EXPIRED (timeout exceeded)                            │
│                                                             │
└────────────────────────┬─────────────────────────────────┘
                         │
                         │ webhook / timeout
                         ▼
        ┌────────────────┴────────────────┐
        │                                 │
        ▼                                 ▼
┌─────────────────┐             ┌─────────────────┐
│                 │             │                 │
│      PAID       │             │    EXPIRED     │
│                 │             │                 │
│   Terminal      │             │   Terminal     │
│   Stock sold    │             │   Stock released│
│                 │             │                 │
└─────────────────┘             └─────────────────┘
```

**Design Decision: Why EXPIRED, not FAILED → CANCELLED?**

> `FAILED`, `EXPIRED`, `CANCELLED` adalah hasil akhir, bukan transisi.
> Jika customer ingin retry, buat Payment baru.
> Tidak ada "change FAILED to CANCELLED".

### Payment State Machine

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   PENDING                                                   │
│   (Intent created, user not yet at gateway)                │
│                                                             │
│   Transitions:                                              │
│   → SUCCESS (webhook: settlement)                         │
│   → DECLINED (webhook: decline)                          │
│   → EXPIRED (timeout exceeded)                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                         │
                         │ webhook / timeout
                         ▼
        ┌────────────────┴────────────────┐
        │                                 │
        ▼                                 ▼
┌─────────────────┐             ┌─────────────────┐
│                 │             │                 │
│    SUCCESS      │             │    DECLINED     │
│                 │             │                 │
│   Terminal      │             │   Terminal      │
│                 │             │   Retry = new   │
│                 │             │   Payment       │
└─────────────────┘             └─────────────────┘
```

---

## 5. 10-Step Implementation Plan

### Revised Step Breakdown

| Step   | Concept             | Major Focus         | Deliverable              |
| ------ | ------------------- | ------------------- | ------------------------ |
| **1**  | Order Lifecycle     | State Machine       | Order status transitions |
| **2**  | Payment Domain      | Entity + Repository | Payment model + CRUD     |
| **3**  | Payment Intent      | Create + Redirect   | Payment initiation flow  |
| **4**  | Gateway Abstraction | Interface + Stub    | PaymentGateway interface |
| **5**  | Idempotency         | Database-based      | IdempotencyService       |
| **6**  | Webhook Foundation  | Security + Parsing  | Webhook controller       |
| **7**  | Gateway Integration | Real Provider       | Midtrans/Xendit          |
| **8**  | Compensation        | Timeout + Release   | Expiry handler           |
| **9**  | Order Timeline      | Audit Trail         | Timeline service         |
| **10** | Validation          | Tests               | Test suite               |

### Step 1: Order Lifecycle Foundation

**Philosophy:** Define the lifecycle before implementing payment.

**Deliverables:**

```
modules/order/
├── order.types.ts      (enhanced statuses)
├── order.rules.ts       (transition validation)
└── order-lifecycle.service.ts
```

**Key Question:** What are valid transitions?

### Step 2: Payment Domain Model

**Philosophy:** Payment is a new aggregate. Order only knows `paymentId`.

**Deliverables:**

```
modules/payment/
├── payment.types.ts
├── payment.repository.ts
└── payment.mapper.ts
```

**Key Question:** What fields does Payment need?

### Step 3: Payment Intent Pattern

**Philosophy:** Payment intent creates a "promise to pay", not the payment itself.

**Deliverables:**

```
modules/payment/
└── services/
    └── payment.service.ts  (createPaymentIntent)
```

**Key Question:** How to create payment without charging?

### Step 4: Gateway Abstraction (Stub Only)

**Philosophy:** Learn the interface first. Real provider later.

**Deliverables:**

```
modules/payment/
├── gateways/
│   ├── payment-gateway.interface.ts
│   └── stubs/
│       └── stub.gateway.ts  (fake, for learning)
```

**NO Midtrans/Xendit code in this step.**

### Step 5: Idempotency (Database-Based)

**Philosophy:** For money, idempotency must survive Redis restart.

**Deliverables:**

```
modules/payment/
├── idempotency/
│   ├── idempotency.service.ts
│   └── idempotency.repository.ts
```

**Implementation:**

```typescript
// Use database table, NOT Redis
// Table: idempotency_keys (key, response, created_at)
```

### Step 6: Webhook Foundation

**Philosophy:** Handle incoming events securely.

**Deliverables:**

```
modules/payment/
└── webhooks/
    ├── webhook-validator.ts  (signature verification)
    ├── webhook.controller.ts
    └── routes.ts
```

**Key Question:** Why return 200 even on error?

> **Answer:**
>
> - Gateway will RETRY if we return non-200
> - Returning 200 stops retry
> - Our error = 500 = retry = potential double charge
> - Always return 200, log internally

### Step 7: Real Gateway Integration

**Philosophy:** Now connect real provider.

**Deliverables:**

```
modules/payment/
├── gateways/
│   ├── midtrans.gateway.ts
│   └── xendit.gateway.ts
```

### Step 8: Compensation

**Philosophy:** Handle failures gracefully.

**Deliverables:**

```
modules/payment/
├── jobs/
│   └── payment-expiry.handler.ts

modules/order/
├── order-cancellation.service.ts  (abstracts inventory)
```

**Design:** OrderCancellationService orchestrates:

```typescript
class OrderCancellationService {
  async cancel(orderId: number, reason: string) {
    // 1. Update order status
    // 2. Release stock (via Inventory)
    // 3. Add timeline event
  }
}
```

### Step 9: Order Timeline

**Philosophy:** Single audit trail for everything.

**Deliverables:**

```
modules/order/
└── order-timeline.service.ts

prisma/
└── schema.prisma  (order_timeline table)
```

### Step 10: Validation

**Philosophy:** Prove it works.

**Deliverables:**

```
tests/
├── unit/payment/
├── integration/payment/
└── system/payment-flow.test.ts
```

---

## 6. Scope Boundaries

### What Goes Into Phase 5

| Feature                | Status | Notes                  |
| ---------------------- | ------ | ---------------------- |
| Order State Machine    | ✅     | DRAFT → PAID/EXPIRED   |
| Payment Entity         | ✅     | Minimal fields         |
| Payment Intent         | ✅     | Create + redirect      |
| Gateway Abstraction    | ✅     | Interface + Stub first |
| Real Gateway (Step 7)  | ✅     | Midtrans/Xendit        |
| Idempotency (DB)       | ✅     | NOT Redis              |
| Webhook Processing     | ✅     | Signature + parsing    |
| Compensation           | ✅     | Expiry + release       |
| Order Timeline         | ✅     | Single audit trail     |
| Unit/Integration Tests | ✅     | Coverage               |

### What Does NOT Go Into Phase 5

| Feature           | Reason             | Future Phase |
| ----------------- | ------------------ | ------------ |
| Refund            | Complex compliance | Phase 6      |
| Partial Payment   | Not MVP            | Future       |
| Payment Retry UI  | Frontend           | Phase 6      |
| Admin Dashboard   | UI                 | Phase 6      |
| Payment Polling   | Premature          | Phase 8      |
| Recovery/Repair   | Premature          | Phase 8      |
| Multiple Currency | IDR only           | Future       |
| Recurring Payment | Not MVP            | Future       |

---

## 7. Refinements from Review

### Refinement #1: Order-Payment Coupling

**Before:**

```typescript
interface Order {
  paymentId: number | null;
  paymentReference: string | null; // ❌ Gateway detail leaks to Order
  provider: PaymentProvider | null;
}
```

**After:**

```typescript
interface Order {
  paymentId: number | null; // ✅ Only reference
}
```

> Order tidak perlu tahu gateway-specific details.

### Refinement #2: Idempotency Storage

**Before:**

```typescript
// ❌ Redis-based
await cache.set(`idempotency:${key}`, response);
```

**After:**

```typescript
// ✅ Database-based
await prisma.idempotencyKey.create({ key, response });
```

> Redis bisa restart. Database persist.
> Untuk payment, kita butuh persistence.

### Refinement #3: State Machine Simplification

**Before:**

```
FAILED → CANCELLED  // ❌ Strange transition
```

**After:**

```
WAITING_PAYMENT
    │
    ├── SUCCESS  (terminal)
    ├── FAILED   (terminal, retry = new Payment)
    └── EXPIRED  (terminal)
```

> FAILED adalah hasil, bukan state yang bisa ditransisi.

### Refinement #4: Single Timeline

**Before:**

```typescript
// ❌ Two histories
Payment.statusHistory[]
Order.auditLog[]
```

**After:**

```typescript
// ✅ Single timeline
Order.timeline[]  // All events
```

> Semua event sistem ada di satu tempat.

### Refinement #5: Gateway Separation

**Before:**

```
Step 4: Gateway Abstraction + Midtrans + Xendit
```

**After:**

```
Step 4: Gateway Abstraction + Stub
Step 7: Real Gateway (Midtrans/Xendit)
```

> Learn concept first, real integration later.

### Refinement #6: Webhook Always Returns 200

**Question:** Why always return 200?

**Answer:**

```
Gateway sends webhook
    │
    ├── Returns 200
    │   └── Gateway stops retrying
    │
    └── Returns non-200 (our error)
        └── Gateway retries
            └── Multiple webhook processing
                └── Potential double charge 💸💸💸
```

> Always return 200. Log errors internally.
> Gateway retries = BAD for payments.

---

## 8. Proposed Changes

### Changes Summary

| #   | Area          | Original                     | Proposed                       |
| --- | ------------- | ---------------------------- | ------------------------------ |
| 1   | Order-Payment | Order knows paymentReference | Order only knows paymentId     |
| 2   | Idempotency   | Redis-based                  | Database-based                 |
| 3   | State Machine | FAILED→CANCELLED             | Terminal states                |
| 4   | Timeline      | PaymentStatusHistory         | OrderTimeline only             |
| 5   | Gateway       | All in Step 4                | Stub in Step 4, Real in Step 7 |
| 6   | Webhook       | No explanation               | Explicit rationale             |
| 7   | Recovery      | Step 8                       | Phase 8                        |
| 8   | Compensation  | Payment knows Inventory      | OrderCancellationService       |

### File Structure (Revised)

```
modules/
├── payment/
│   ├── payment.types.ts
│   ├── payment.repository.ts
│   ├── payment.service.ts
│   │
│   ├── gateways/
│   │   ├── payment-gateway.interface.ts
│   │   └── stubs/
│   │       └── stub.gateway.ts      ← Step 4
│   │
│   ├── webhooks/
│   │   ├── webhook-validator.ts      ← Step 6
│   │   ├── webhook.controller.ts
│   │   └── routes.ts
│   │
│   └── idempotency/
│       ├── idempotency.service.ts   ← Step 5
│       └── idempotency.repository.ts
│
├── order/
│   ├── order.types.ts               (enhanced) ← Step 1
│   ├── order.rules.ts               (enhanced)
│   ├── order.service.ts             (enhanced)
│   ├── order-lifecycle.service.ts   ← Step 1
│   └── order-timeline.service.ts    ← Step 9
│
└── inventory/
    └── inventory.service.ts
        └── releaseReservation()    (called by OrderCancellationService)

prisma/
└── schema.prisma
    ├── model Payment { ... }
    ├── model IdempotencyKey { key, response }  ← Database, not Redis
    └── model OrderTimeline { orderId, event }
```

---

## 9. Payment Invariants

### What Are Invariants?

> **Invariants are the "constitution" of a domain.**
> They are rules that must ALWAYS be true, no matter what.

### Payment Domain Invariants

These are the non-negotiable rules of the Payment domain:

```typescript
// modules/payment/payment.invariants.ts

export const PaymentInvariants = {
  /**
   * Invariant 1: Exactly One Active Payment Per Order
   *
   * At any given time, an order can have:
   * - Zero payments (never initiated)
   * - One PENDING payment
   * - NO multiple PENDING payments
   *
   * Once a payment is SUCCESS/FAILED/EXPIRED,
   * any new attempt must create a NEW payment record.
   */
  oneActivePaymentPerOrder(orderId: number): boolean {
    const activePayments = db.payment.count({
      where: {
        orderId,
        status: 'PENDING',
      },
    });
    return activePayments <= 1;
  },

  /**
   * Invariant 2: Payment Amount Is Immutable
   *
   * Once a payment is created, its amount cannot change.
   * If order total changes, create a new payment.
   */
  amountIsImmutable(payment: Payment): boolean {
    // Amount can only be set on creation
    // No update method should ever modify amount
  },

  /**
   * Invariant 3: Order Cannot Revert After PAID
   *
   * Once an order reaches PAID status:
   * - Cannot go back to WAITING_PAYMENT
   * - Cannot cancel
   * - Can only proceed to fulfillment
   */
  noRevertFromPaid(order: Order): boolean {
    const nonRevertableStatuses = ['PAID'];
    return !nonRevertableStatuses.includes(order.status);
  },

  /**
   * Invariant 4: Expired/Declined Payments Always Release Stock
   *
   * When payment reaches terminal failure state:
   * - Stock MUST be released
   * - This is guaranteed by the compensation flow
   */
  stockReleaseGuaranteed(orderId: number): boolean {
    // Compensation is triggered atomically
  },

  /**
   * Invariant 5: Webhook Processing Is Idempotent
   *
   * The same webhook event:
   * - Processed once = state changes
   * - Processed twice = no additional state change
   * - Processed N times = same as once
   */
  webhookIsIdempotent(transactionId: string): boolean {
    // Guaranteed by idempotency table
  },

  /**
   * Invariant 6: Payment Status Matches Order Status
   *
   * Order PAID ↔ Payment SUCCESS
   * Order WAITING_PAYMENT ↔ Payment PENDING
   * Order EXPIRED ↔ Payment EXPIRED
   */
  statusConsistency(order: Order, payment: Payment): boolean {
    const validCombinations = {
      DRAFT: ['PENDING'],
      WAITING_PAYMENT: ['PENDING'],
      PAID: ['SUCCESS'],
      EXPIRED: ['EXPIRED', 'DECLINED'],
      CANCELLED: ['DECLINED'],
    };
    return validCombinations[order.status].includes(payment.status);
  },
};
```

### Why These Invariants Matter

```
Without Invariants:

User clicks "Pay" twice
    │
    ├── Payment #1 created ($100)
    │
    └── Payment #2 created ($100)
              │
              └── 💸 Double charge possible

With Invariant #1:

User clicks "Pay" twice
    │
    ├── Payment #1 created ($100) - PENDING
    │
    └── Payment #2 REJECTED
              │
              └── "Order already has active payment"
              └── ✅ Protected
```

---

## 10. Order ↔ Payment Relationship

### The Design Question

```
┌─────────────────────────────────────────┐
│                                         │
│   Option A: Bidirectional              │
│                                         │
│   Order ──────────► Payment             │
│   paymentId ◄────── orderId            │
│                                         │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│                                         │
│   Option B: Unidirectional             │
│                                         │
│   Order                 Payment         │
│        ◄─────────────── orderId        │
│       (no field)     (UNIQUE)         │
│                                         │
└─────────────────────────────────────────┘
```

### Option A: Bidirectional

```typescript
// Order has paymentId
interface Order {
  paymentId: number | null;
}

// Payment has orderId
interface Payment {
  orderId: number;
}
```

**Pros:**

- Easy to navigate from Order to Payment
- Clear reference

**Cons:**

- Two references to maintain
- What if they get out of sync?

### Option B: Unidirectional (Recommended)

```typescript
// Order knows nothing about Payment
interface Order {
  status: OrderStatus;
  // NO paymentId field
}

// Payment has orderId with UNIQUE constraint
interface Payment {
  orderId: number; // @unique in Prisma
}
```

**Pros:**

- True aggregate independence
- Order never needs to change when Payment changes
- Single source of truth (Payment)
- Easier to reason about

**Cons:**

- To find Payment from Order, use repository method

```typescript
// Instead of order.paymentId
const payment = await paymentRepository.findByOrderId(orderId);

// Instead of order.payment
const payment = await paymentRepository.findActiveByOrderId(orderId);
```

### Recommended Decision: Option B

> **Unidirectional: Payment owns the relationship.**

Rationale:

1. **Order is focused** — It only cares about its status
2. **Payment is rich** — It knows about amount, provider, gateway
3. **Single responsibility** — Each aggregate manages its own relationships
4. **Future-proof** — If we add Refund (Phase 6), Order still doesn't change

### Finding Payment from Order

```typescript
// modules/payment/payment.repository.ts

class PaymentRepository {
  /**
   * Find active payment for order
   * Used when checking if order has pending payment
   */
  async findActiveByOrderId(orderId: number): Promise<Payment | null> {
    return await this.prisma.payment.findFirst({
      where: {
        orderId,
        status: 'PENDING',
      },
    });
  }

  /**
   * Find latest payment for order
   * Used for history/timeline
   */
  async findLatestByOrderId(orderId: number): Promise<Payment | null> {
    return await this.prisma.payment.findFirst({
      where: { orderId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
```

### OrderTimeline Query

```typescript
// modules/order/order-timeline.service.ts

class OrderTimelineService {
  async getTimeline(orderId: number) {
    // Query order timeline
    const events = await this.prisma.orderTimeline.findMany({
      where: { orderId },
      orderBy: { createdAt: 'asc' },
    });

    // If we need payment details, query separately
    const payment = await this.paymentRepository.findLatestByOrderId(orderId);

    return {
      events,
      payment: payment ? this.paymentMapper.toView(payment) : null,
    };
  }
}
```

---

## 11. Testing Strategy

### Test Pyramid for Payment

```
           ┌───────────────┐
           │   System     │  ← Happy path E2E
           │    Tests      │
           └───────┬───────┘
                   │
         ┌─────────┴─────────┐
         │   Integration    │  ← With real/stub gateway
         │    Tests         │
         └─────────┬─────────┘
                   │
         ┌─────────┴─────────┐
         │     Unit          │  ← Mocked dependencies
         │    Tests          │
         └───────────────────┘
```

### Key Test Scenarios

| Scenario                    | Type        | Focus                                         |
| --------------------------- | ----------- | --------------------------------------------- |
| Create payment idempotently | Unit        | Same request = same response                  |
| Webhook idempotency         | Unit        | Same webhook twice = no double processing     |
| Order state transitions     | Unit        | Valid transitions pass, invalid rejected      |
| Gateway abstraction         | Integration | Swap provider without changing business logic |
| Payment expiry              | Integration | Order → EXPIRED, stock released               |
| Happy path E2E              | System      | DRAFT → PAID                                  |

### Idempotency Test

```typescript
describe('PaymentService', () => {
  it('should return same payment for duplicate request', async () => {
    // First request
    const payment1 = await service.createPaymentIntent(orderId);

    // Duplicate request (user double-click)
    const payment2 = await service.createPaymentIntent(orderId);

    // Same payment returned
    expect(payment2.id).toBe(payment1.id);
    expect(payment2.amount).toBe(payment1.amount);
  });
});
```

---

## Appendix A: Prisma Schema (Revised)

```prisma
// prisma/schema.prisma

model Payment {
  id                Int              @id @default(autoincrement())
  orderId           Int              @unique
  userId            Int
  amount            Int
  currency          String           @default("IDR")
  provider          PaymentProvider
  providerReference String?
  idempotencyKey   String           @unique  // Database-enforced uniqueness
  status            PaymentStatus
  gatewayResponse   Json?
  createdAt         DateTime         @default(now())
  updatedAt         DateTime         @updatedAt
  expiresAt         DateTime?

  order             Order            @relation(fields: [orderId], references: [id])

  @@index([provider])
  @@index([status])
}

// Idempotency - in DATABASE, not Redis
model IdempotencyKey {
  key        String   @id
  response   Json
  createdAt  DateTime @default(now())

  @@index([createdAt])
}

model OrderTimeline {
  id        Int      @id @default(autoincrement())
  orderId  Int
  event     String
  metadata  Json?
  createdAt DateTime @default(now())

  order     Order    @relation(fields: [orderId], references: [id])

  @@index([orderId])
  @@index([createdAt])
}

enum PaymentProvider {
  MIDTRANS
  XENDIT
  STRIPE
  STUB
}

enum PaymentStatus {
  PENDING
  SUCCESS
  DECLINED
  EXPIRED
}
```

---

## Appendix B: Review Response Summary

| Feedback                              | Response                                 |
| ------------------------------------- | ---------------------------------------- |
| Too many concepts                     | Reduced to 10 clear steps                |
| Midtrans too early                    | Stub first (Step 4), Real later (Step 7) |
| Order knows too much                  | Only `paymentId`, no gateway details     |
| PaymentStatusHistory vs OrderTimeline | Chose OrderTimeline (single source)      |
| Recovery too early                    | Moved to Phase 8                         |
| Payment knows Inventory               | Introduced OrderCancellationService      |
| FAILED → CANCELLED                    | Removed, use terminal states             |
| Redis idempotency                     | Changed to database                      |
| Webhook 200 explanation               | Added explicit rationale                 |

---

**Blueprint Status:** ✅ REFINED  
**Ready for Implementation:** After approval  
**Next Action:** Review refinements and approve
