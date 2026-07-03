# Phase 4 Step 7-10 Blueprint — Complete Sketch

**Version:** 2.0 (Revised with ARB-001 Feedback)  
**Date:** 2026-07-03  
**Status:** 🟢 READY TO IMPLEMENT

---

## Table of Contents

1. [File Layout](#1-file-layout)
2. [Interface Blueprint](#2-interface-blueprint)
3. [Function Signatures](#3-function-signatures)
4. [Order State Machine](#4-order-state-machine)
5. [Transaction Architecture](#5-transaction-architecture)
6. [Queue Architecture (Step 8)](#6-queue-architecture-step-8)
7. [Audit Matrix](#7-audit-matrix)

---

## 1. File Layout

### Modifikasi File Existing

```
modules/
├── checkout/
│   ├── checkout.service.ts         [MODIFY] completeCheckout() as sole orchestrator
│   ├── checkout.types.ts          [MODIFY] Add CompleteCheckoutInput/Result
│   ├── checkout.rules.ts          [MODIFY] Add checkout completion rules
│   └── checkout.controller.ts     [MODIFY] Add POST /checkout/complete
│
├── order/
│   ├── order.service.ts           [MODIFY] createDraftTx(tx, input)
│   ├── order.types.ts             [MODIFY] Add OrderStatus, state transitions
│   ├── order.rules.ts             [MODIFY] Add state transition rules
│   ├── order.mapper.ts            [EXISTS] Add toConfirmedOrder mapping
│   └── order.controller.ts        [MODIFY] Add confirm/cancel endpoints
│
├── inventory/
│   ├── inventory.service.ts       [MODIFY] reserveStockTx(), releaseStockTx() interface
│   └── inventory.types.ts         [MODIFY] Add ReserveStockInput/Result
│
├── cart/
│   ├── services/
│   │   └── cart.service.ts        [MODIFY] clearCartTx(tx, input)
│   └── types/
│       └── cart.types.ts          [MODIFY] Add ClearCartTxInput
│
├── queue-producers/               [NEW - Step 8]
│   └── checkout.producer.ts      [CREATE] Email + Audit Log jobs only
│
└── queue-workers/                 [NEW - Step 8]
    └── checkout.worker.ts        [CREATE] Email + Audit Log handlers only
```

### File Baru

```
modules/queue-producers/
└── checkout.producer.ts          [CREATE - Step 8]

modules/queue-workers/
└── checkout.worker.ts           [CREATE - Step 8]

tests/unit/checkout/
└── checkout-complete.test.ts     [CREATE]

tests/unit/order/
└── order-lifecycle.test.ts      [CREATE]

tests/unit/inventory/
└── reserve-stock.test.ts         [CREATE]

tests/integration/
└── checkout-atomicity.test.ts    [CREATE]
```

### NO CHANGES

- `prisma/schema.prisma` — No new models
- `shared/transaction/transaction.ts` — Already correct
- `shared/queue/queue.types.ts` — Will extend with new job types

---

## 2. Interface Blueprint

### 2.1 Checkout Types (Step 7)

```typescript
// modules/checkout/checkout.types.ts

/**
 * Input for complete checkout
 * Minimal - uses existing CheckoutPreview from Step 6
 */
export interface CompleteCheckoutInput {
  readonly userId: number;
}

/**
 * Result of complete checkout
 * API-friendly - only data that makes sense for response
 */
export interface CompleteCheckoutResult {
  readonly orderId: number;
  readonly status: 'DRAFT'; // Step 7 only creates DRAFT
  readonly totalQuantity: number;
  readonly totalItemCount: number;
  readonly subtotal: number;
  readonly createdAt: Date;
}

/**
 * Reserved inventory item (internal use)
 */
export interface ReservedItem {
  readonly productId: number;
  readonly quantity: number;
  readonly reservedAt: Date;
}
```

### 2.2 Inventory Types (Step 7)

```typescript
// modules/inventory/inventory.types.ts

/**
 * Reserve Stock Input — Domain-friendly
 * Only what Inventory domain needs to know
 */
export interface ReserveStockInput {
  readonly productId: number;
  readonly quantity: number;
}

/**
 * Reserve Stock Result — Minimal
 */
export interface ReserveStockResult {
  readonly productId: number;
  readonly reservedQuantity: number;
  readonly remainingStock: number;
}

/**
 * Release Stock Input — Interface only in Step 7
 * Implementation deferred to Step 8
 */
export interface ReleaseStockInput {
  readonly productId: number;
  readonly quantity: number;
  readonly reason: 'CANCELLED' | 'EXPIRED'; // Future use
}

/**
 * Reserve Stock with Transaction — Step 7
 * @param tx - Prisma.TransactionClient (REQUIRED)
 */
export interface ReserveStockTxInput extends ReserveStockInput {
  tx: Prisma.TransactionClient;
}
```

### 2.3 Order Types (Step 7)

```typescript
// modules/order/order.types.ts

/**
 * Order Status — Complete State Machine
 */
export type OrderStatus =
  | 'DRAFT' // Created, pending confirmation
  | 'CONFIRMED' // Checkout complete, awaiting payment
  | 'PAID' // Payment received (Future)
  | 'SHIPPING' // Order being shipped (Future)
  | 'DELIVERED' // Order delivered (Future)
  | 'CANCELLED' // Order cancelled
  | 'EXPIRED'; // Session timeout (Step 8)

/**
 * State Transition Map
 */
export const OrderStateTransitions = {
  DRAFT: {
    canTransitionTo: ['CONFIRMED', 'CANCELLED', 'EXPIRED'] as const,
    triggers: {
      CONFIRMED: 'Checkout complete',
      CANCELLED: 'User cancellation',
      EXPIRED: 'Session timeout',
    },
  },
  CONFIRMED: {
    canTransitionTo: ['PAID', 'CANCELLED'] as const,
    triggers: {
      PAID: 'Payment success',
      CANCELLED: 'Refund request',
    },
  },
  PAID: {
    canTransitionTo: ['SHIPPING', 'CANCELLED'] as const,
  },
  SHIPPING: {
    canTransitionTo: ['DELIVERED', 'CANCELLED'] as const,
  },
  DELIVERED: {
    canTransitionTo: [] as const, // Terminal state
  },
  CANCELLED: {
    canTransitionTo: [] as const, // Terminal state
  },
  EXPIRED: {
    canTransitionTo: [] as const, // Terminal state
  },
} as const;

/**
 * Create Draft Input — Inside Transaction
 */
export interface CreateDraftInput {
  readonly checkoutPreview: import('../checkout/checkout.types.js').CheckoutPreview;
}

/**
 * Create Draft Input with Transaction Client
 */
export interface CreateDraftTxInput extends CreateDraftInput {
  readonly tx: Prisma.TransactionClient;
}
```

### 2.4 Cart Types (Step 7)

```typescript
// modules/cart/types/cart.types.ts

/**
 * Clear Cart Input — Inside Transaction
 */
export interface ClearCartTxInput {
  readonly userId: number;
  readonly cartId: number;
}

/**
 * Clear Cart Result — Inside Transaction
 */
export interface ClearCartTxResult {
  readonly itemsRemoved: number;
  readonly cartId: number;
}
```

### 2.5 Queue Types (Step 8 - Simplified)

```typescript
// shared/queue/queue.types.ts (extend existing)

/**
 * Email Job — Step 8 only
 */
export interface CheckoutEmailJob {
  readonly type: 'checkout_email';
  readonly orderId: number;
  readonly userId: number;
  readonly email: string;
  readonly template: 'order_confirmation';
  readonly data: {
    orderId: number;
    totalAmount: number;
    itemCount: number;
  };
  readonly timestamp: number;
}

/**
 * Audit Log Job — Step 8 only
 */
export interface CheckoutAuditJob {
  readonly type: 'checkout_audit';
  readonly orderId: number;
  readonly userId: number;
  readonly action: 'ORDER_CONFIRMED';
  readonly metadata: {
    totalAmount: number;
    itemCount: number;
    transactionTimeMs: number;
  };
  readonly timestamp: number;
}

/**
 * Union type for queue jobs
 */
export const CheckoutJobSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('checkout_email'),
    orderId: z.number(),
    userId: z.number(),
    email: z.string().email(),
    template: z.literal('order_confirmation'),
    data: z.object({
      orderId: z.number(),
      totalAmount: z.number(),
      itemCount: z.number(),
    }),
    timestamp: z.number(),
  }),
  z.object({
    type: z.literal('checkout_audit'),
    orderId: z.number(),
    userId: z.number(),
    action: z.literal('ORDER_CONFIRMED'),
    metadata: z.object({
      totalAmount: z.number(),
      itemCount: z.number(),
      transactionTimeMs: z.number(),
    }),
    timestamp: z.number(),
  }),
]);
```

---

## 3. Function Signatures

### 3.1 CheckoutService (Sole Transaction Owner)

```typescript
// modules/checkout/checkout.service.ts

export const CheckoutService = {
  /**
   * COMPLETE CHECKOUT — Sole Transaction Orchestrator
   *
   * Responsibilities:
   * 1. Open transaction
   * 2. Coordinate Order + Inventory + Cart
   * 3. Handle commit/rollback
   * 4. Enqueue post-commit jobs
   *
   * @param input - CompleteCheckoutInput with userId
   * @returns CompleteCheckoutResult
   *
   * @throws BusinessError CART_EMPTY
   * @throws BusinessError CHECKOUT_UNAVAILABLE_ITEMS
   * @throws BusinessError INSUFFICIENT_STOCK
   * @throws BusinessError ORDER_CREATION_FAILED
   */
  async completeCheckout(
    input: CompleteCheckoutInput
  ): Promise<CompleteCheckoutResult>

  /**
   * INITIATE CHECKOUT — Preview Only (existing)
   *
   * @param input - InitiateCheckoutInput with userId
   * @returns CheckoutPreview
   */
  async initiateCheckout(
    input: InitiateCheckoutInput
  ): Promise<CheckoutPreview>
}
```

### 3.2 OrderService (Transaction Client)

```typescript
// modules/order/order.service.ts

export const OrderService = {
  /**
   * Create Draft — Inside Transaction
   *
   * @param tx - Prisma.TransactionClient (REQUIRED)
   * @param input - CreateDraftInput with checkoutPreview
   * @returns OrderDraft
   */
  async createDraftTx(
    tx: Prisma.TransactionClient,
    input: CreateDraftInput
  ): Promise<OrderDraft>

  /**
   * Create Draft — Standalone (for testing)
   *
   * @param input - CreateDraftInput
   * @returns OrderDraft
   */
  async createDraft(
    input: CreateDraftInput
  ): Promise<OrderDraft>

  /**
   * Get Order by ID
   *
   * @param orderId - Order ID
   * @returns OrderDraft | null
   */
  async getOrder(orderId: number): Promise<OrderDraft | null>

  /**
   * Get Orders by User ID
   *
   * @param userId - User ID
   * @returns ReadonlyArray<OrderDraft>
   */
  async getOrdersByUser(userId: number): Promise<ReadonlyArray<OrderDraft>>
}
```

### 3.3 InventoryService (Transaction Client, Domain-Independent)

```typescript
// modules/inventory/inventory.service.ts

export const InventoryService = {
  /**
   * Reserve Stock — Inside Transaction
   *
   * Domain operation only. Does NOT know about Order, Checkout, or Payment.
   *
   * @param tx - Prisma.TransactionClient (REQUIRED)
   * @param input - ReserveStockInput with productId + quantity
   * @returns ReserveStockResult
   *
   * @throws BusinessError PRODUCT_NOT_FOUND
   * @throws BusinessError INSUFFICIENT_STOCK
   */
  async reserveStockTx(
    tx: Prisma.TransactionClient,
    input: ReserveStockInput
  ): Promise<ReserveStockResult>

  /**
   * Reserve Stock — Standalone (for testing)
   */
  async reserveStock(input: ReserveStockInput): Promise<ReserveStockResult>

  /**
   * Release Stock — INTERFACE ONLY in Step 7
   * Implementation deferred to Step 8
   *
   * @param tx - Prisma.TransactionClient (REQUIRED)
   * @param input - ReleaseStockInput
   * @throws Error "Not implemented in Step 7"
   */
  async releaseStockTx(
    tx: Prisma.TransactionClient,
    input: ReleaseStockInput
  ): Promise<void>

  /**
   * Validate Stock — Existing (for Step 6 compatibility)
   */
  async validateStock(input: ValidateStockInput): Promise<ValidateStockResult>

  /**
   * Validate Cart Item for Checkout — Existing
   */
  async validateCartItemForCheckout(
    input: ValidateCartItemForCheckoutInput
  ): Promise<ValidateCartItemForCheckoutResult>
}
```

### 3.4 CartService (Transaction Client)

```typescript
// modules/cart/services/cart.service.ts

export const CartService = {
  /**
   * Clear Cart — Inside Transaction
   *
   * @param tx - Prisma.TransactionClient (REQUIRED)
   * @param input - ClearCartTxInput with userId + cartId
   * @returns ClearCartTxResult
   */
  async clearCartTx(
    tx: Prisma.TransactionClient,
    input: ClearCartTxInput
  ): Promise<ClearCartTxResult>

  // ... existing methods (NO CHANGES)
}
```

### 3.5 Queue Producer (Step 8)

```typescript
// modules/queue-producers/checkout.producer.ts

export const CheckoutQueueProducer = {
  /**
   * Enqueue order confirmation email
   * MUST be called AFTER database transaction commits
   *
   * @param input - CheckoutEmailJob data
   * @returns Job ID if successful, undefined if failed
   */
  async enqueueOrderConfirmationEmail(
    input: Omit<CheckoutEmailJob, "type" | "timestamp">
  ): Promise<string | undefined>

  /**
   * Enqueue audit log
   * MUST be called AFTER database transaction commits
   *
   * @param input - CheckoutAuditJob data
   * @returns Job ID if successful, undefined if failed
   */
  async enqueueAuditLog(
    input: Omit<CheckoutAuditJob, "type" | "timestamp">
  ): Promise<string | undefined>
}
```

### 3.6 Queue Worker (Step 8)

```typescript
// modules/queue-workers/checkout.worker.ts

export const CheckoutWorker = {
  /**
   * Process checkout email job
   *
   * @param job - BullMQ Job
   */
  async processEmailJob(job: Job<CheckoutEmailJob>): Promise<void>

  /**
   * Process checkout audit job
   *
   * @param job - BullMQ Job
   */
  async processAuditJob(job: Job<CheckoutAuditJob>): Promise<void>
}
```

---

## 4. Order State Machine

### 4.1 State Diagram

```
                         ┌─────────────────────────────────────────┐
                         │                                         │
                         ▼                                         │
┌───────┐    ┌───────────────┐    ┌─────────┐    ┌──────────┐       │
│ DRAFT │───▶│   CONFIRMED   │───▶│  PAID   │───▶│ SHIPPING │───┤
└───────┘    └───────────────┘    └─────────┘    └──────────┘   │
     │              │                                           │
     │              │                                           │
     │              ▼                                           ▼
     │       ┌───────────┐                               ┌──────────┐
     │       │ CANCELLED │                               │ DELIVERED│
     │       └───────────┘                               └──────────┘
     │              │                                           ▲
     └──────────────┴───────────────────────────────────────────┘
                    │
                    ▼
              ┌───────────┐
              │  EXPIRED  │ (Step 8: Session timeout)
              └───────────┘
```

### 4.2 State Transition Rules

```typescript
// modules/order/order.rules.ts

export const OrderStateRules = {
  /**
   * Check if transition is valid
   */
  canTransition(current: OrderStatus, target: OrderStatus): boolean {
    const allowed = OrderStateTransitions[current]?.canTransitionTo;
    return allowed?.includes(target) ?? false;
  },

  /**
   * Assert transition is valid
   */
  assertTransition(current: OrderStatus, target: OrderStatus): void {
    if (!this.canTransition(current, target)) {
      throw new BusinessError(
        `Cannot transition from ${current} to ${target}`,
        400,
        'INVALID_STATE_TRANSITION',
      );
    }
  },

  /**
   * Get valid next states
   */
  getValidNextStates(current: OrderStatus): readonly OrderStatus[] {
    return OrderStateTransitions[current]?.canTransitionTo ?? [];
  },

  /**
   * Check if state is terminal
   */
  isTerminalState(status: OrderStatus): boolean {
    return OrderStateTransitions[status]?.canTransitionTo.length === 0;
  },
};
```

### 4.3 State Triggers

| From      | To        | Trigger           | Step   |
| --------- | --------- | ----------------- | ------ |
| DRAFT     | CONFIRMED | Checkout complete | 7      |
| DRAFT     | CANCELLED | User cancellation | 8      |
| DRAFT     | EXPIRED   | Session timeout   | 8      |
| CONFIRMED | PAID      | Payment success   | Future |
| CONFIRMED | CANCELLED | Refund request    | Future |
| PAID      | SHIPPING  | Order shipped     | Future |
| PAID      | CANCELLED | Refund request    | Future |
| SHIPPING  | DELIVERED | Order delivered   | Future |
| SHIPPING  | CANCELLED | Return request    | Future |

---

## 5. Transaction Architecture

### 5.1 Principle: Single Transaction Owner

```
┌─────────────────────────────────────────────────────────────────────┐
│                    TRANSACTION BOUNDARY                             │
│                                                                     │
│  CheckoutService.completeCheckout()                                  │
│           │                                                         │
│           ├── [1] TransactionManager.withTransaction(tx)             │
│           │         │                                               │
│           │         ├── OrderService.createDraftTx(tx, ...)        │
│           │         │         │                                     │
│           │         │         └── tx.order.create()                │
│           │         │                                              │
│           │         ├── InventoryService.reserveStockTx(tx, ...)   │
│           │         │         │                                     │
│           │         │         └── tx.product.update()              │
│           │         │                                              │
│           │         └── CartService.clearCartTx(tx, ...)          │
│           │                   │                                     │
│           │                   └── tx.cartItem.deleteMany()         │
│           │                                                         │
│           ├── [2] COMMIT SUCCESS                                    │
│           │         │                                               │
│           │         ├── Cache invalidation (outside tx)             │
│           │         └── BullMQ: Email + Audit enqueue (outside tx)  │
│           │                                                         │
│           └── [3] ROLLBACK (automatic via Prisma)                  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 5.2 Rule: No Global PrismaClient in Transaction Workflow

```typescript
// ❌ FORBIDDEN
async function createOrder(input: CreateDraftInput) {
  await prisma.order.create({ ... })  // Uses global client - WRONG
}

// ✅ REQUIRED
async function createOrderTx(tx: Prisma.TransactionClient, input: CreateDraftInput) {
  await tx.order.create({ ... })  // Uses provided tx - CORRECT
}
```

### 5.3 Transaction Flow (Pseudo-code)

```typescript
async function completeCheckout(
  input: CompleteCheckoutInput,
): Promise<CompleteCheckoutResult> {
  // 1. Get checkout preview (existing method)
  const preview = await initiateCheckout({ userId: input.userId });

  // 2. Validate (existing rules)
  assertCartNotEmpty(preview.summary.totalQuantity);
  assertPreviewValid(preview);

  // 3. Execute in transaction
  const result = await TransactionManager.withTransaction(async (tx) => {
    // 3a. Create order draft
    const order = await OrderService.createDraftTx(tx, {
      checkoutPreview: preview,
    });

    // 3b. Reserve inventory for each item
    const reservations = [];
    for (const item of preview.items) {
      const reserved = await InventoryService.reserveStockTx(tx, {
        productId: item.productId,
        quantity: item.quantity,
      });
      reservations.push(reserved);
    }

    // 3c. Clear cart
    const cartCleared = await CartService.clearCartTx(tx, {
      userId: input.userId,
      cartId: preview.summary.cartId!,
    });

    return { order, reservations, cartCleared };
  });

  // 4. Post-commit: Enqueue jobs (AFTER successful commit)
  await enqueueOrderConfirmationEmail({
    orderId: result.order.id,
    userId: input.userId,
    email: await getUserEmail(input.userId),
    template: 'order_confirmation',
    data: {
      orderId: result.order.id,
      totalAmount: result.order.subtotal,
      itemCount: result.order.totalItemCount,
    },
  });

  await enqueueAuditLog({
    orderId: result.order.id,
    userId: input.userId,
    action: 'ORDER_CONFIRMED',
    metadata: {
      totalAmount: result.order.subtotal,
      itemCount: result.order.totalItemCount,
      transactionTimeMs: performance.now(),
    },
  });

  // 5. Return result
  return {
    orderId: result.order.id,
    status: result.order.status,
    totalQuantity: result.order.totalQuantity,
    totalItemCount: result.order.totalItemCount,
    subtotal: result.order.subtotal,
    createdAt: result.order.createdAt,
  };
}
```

---

## 6. Queue Architecture (Step 8)

### 6.1 Scope: Email + Audit Log Only

```
┌─────────────────────────────────────────────────────────────┐
│                    POST-COMMIT OPERATIONS                   │
│                                                             │
│  After Transaction Commits:                                 │
│                                                             │
│  ┌──────────────────┐    ┌──────────────────────┐          │
│  │  Email Job       │    │  Audit Log Job        │          │
│  │  checkout_email  │    │  checkout_audit       │          │
│  └────────┬─────────┘    └──────────┬───────────┘          │
│           │                         │                       │
│           ▼                         ▼                       │
│  ┌──────────────────┐    ┌──────────────────────┐          │
│  │  Email Service   │    │  Audit Service        │          │
│  │  (SMTP/SendGrid) │    │  (Database/Logger)     │          │
│  └──────────────────┘    └──────────────────────┘          │
│                                                             │
│  NOT IN SCOPE:                                              │
│  - Analytics                                               │
│  - Webhooks                                                │
│  - Search reindex                                          │
│  - Notification system                                      │
│  - Event bus                                               │
└─────────────────────────────────────────────────────────────┘
```

### 6.2 Queue Configuration

```typescript
// infra/queue/bullmq.ts (extend existing)

export const CHECKOUT_QUEUE_NAME = 'checkout';

export function getCheckoutQueue(): Queue {
  // Return or create checkout queue
}

export function setupCheckoutWorker(): Worker {
  // Process email + audit jobs
}
```

### 6.3 Job Data

```typescript
// Example: checkout_email job
{
  type: "checkout_email",
  orderId: 123,
  userId: 456,
  email: "user@example.com",
  template: "order_confirmation",
  data: {
    orderId: 123,
    totalAmount: 150000,
    itemCount: 3
  },
  timestamp: 1719940800000
}

// Example: checkout_audit job
{
  type: "checkout_audit",
  orderId: 123,
  userId: 456,
  action: "ORDER_CONFIRMED",
  metadata: {
    totalAmount: 150000,
    itemCount: 3,
    transactionTimeMs: 45.2
  },
  timestamp: 1719940800000
}
```

---

## 7. Audit Matrix

### Step 7: Transaction Integrity

| Audit Criteria               | Status    | Evidence                              |
| ---------------------------- | --------- | ------------------------------------- |
| **Architecture Alignment**   | ✅ PASS   | Single orchestrator, clear boundaries |
| **Scope Guard Adherence**    | ✅ PASS   | Only Order + Inventory + Cart in tx   |
| **Progressive Check**        | ✅ PASS   | Natural evolution from existing       |
| **Breaking Changes**         | ✅ NONE   | No existing API modified              |
| **Backward Compatibility**   | ✅ FULL   | `initiateCheckout()` still works      |
| **Transaction Owner**        | ✅ LOCKED | CheckoutService only                  |
| **Prisma.TransactionClient** | ✅ LOCKED | All tx ops accept tx param            |
| **Inventory Independence**   | ✅ LOCKED | Minimal input only                    |

### Step 8: Background Jobs

| Audit Criteria             | Status      | Evidence                   |
| -------------------------- | ----------- | -------------------------- |
| **Architecture Alignment** | ✅ PASS     | BullMQ pattern established |
| **Scope Guard Adherence**  | ✅ PASS     | Email + Audit only         |
| **Progressive Check**      | ✅ PASS     | Requires Step 7 first      |
| **Event Bus**              | ❌ DEFERRED | Not in scope               |

### Step 9: Cart Optimization

| Audit Criteria             | Status         | Evidence                      |
| -------------------------- | -------------- | ----------------------------- |
| **Architecture Alignment** | ⚠️ CONDITIONAL | Depends on performance needs  |
| **Scope Guard Adherence**  | ⚠️ CONDITIONAL | Stale data risk               |
| **Progressive Check**      | ⚠️ CONDITIONAL | Performance benchmarks needed |

### Step 10: System Validation

| Audit Criteria             | Status  | Evidence                         |
| -------------------------- | ------- | -------------------------------- |
| **Architecture Alignment** | ✅ PASS | Integration test pattern ready   |
| **Scope Guard Adherence**  | ✅ PASS | Testing only, no production code |
| **Progressive Check**      | ✅ PASS | Validates all previous steps     |

---

## Summary

### What We ARE Building (Step 7-10)

| Step   | Scope                                                   |
| ------ | ------------------------------------------------------- |
| **7**  | Transaction integrity (Order + Inventory + Cart atomic) |
| **8**  | Background jobs (Email + Audit Log only)                |
| **9**  | Cart optimization (optional, based on performance)      |
| **10** | System validation (integration tests)                   |

### What We Are NOT Building (Deferred)

| Item                    | Reason                       |
| ----------------------- | ---------------------------- |
| **Reservation Model**   | Not needed yet               |
| **Event Bus**           | Over-engineering for Phase 4 |
| **Analytics**           | Future Phase                 |
| **Webhooks**            | Future Phase                 |
| **Search Reindex**      | Future Phase                 |
| **Notification System** | Future Phase                 |

---

## Pre-Implementation Checklist

- [x] Transaction boundary: CheckoutService as sole owner
- [x] All tx operations: Accept Prisma.TransactionClient
- [x] No global PrismaClient: In transaction workflows
- [x] DTO simplification: Minimal input/output
- [x] No new models: Reservation deferred
- [x] Event Bus deferred: Step 8 = BullMQ only
- [x] Queue scope: Email + Audit only
- [x] Order state machine: Locked with diagram
- [x] Release stock: Interface only, implementation deferred

---

## Decision Log

| ID        | Decision                                                 | Rationale                    |
| --------- | -------------------------------------------------------- | ---------------------------- |
| **D-7.1** | CheckoutService as sole transaction owner                | Prevents nested transactions |
| **D-7.2** | Pass Prisma.TransactionClient to all tx operations       | Ensures atomicity            |
| **D-7.3** | Inventory takes minimal input (productId, quantity only) | Domain independence          |
| **D-7.4** | No transactionId in API response                         | Use logging/tracing instead  |
| **D-7.5** | No Reservation model in Prisma                           | Not needed yet               |
| **D-7.6** | Order state machine locked before Step 7                 | Prevents future refactor     |
| **D-7.7** | Step 8 = BullMQ only, no Event Bus                       | Scope discipline             |
| **D-7.8** | Queue jobs: Email + Audit only                           | Maintain focus               |
| **D-7.9** | releaseStockTx() interface only in Step 7                | Scope discipline             |

---

**Blueprint Version:** 2.0  
**Status:** 🟢 READY TO IMPLEMENT  
**Next Action:** Toggle to ACT MODE for implementation
