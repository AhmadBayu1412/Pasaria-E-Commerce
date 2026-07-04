# Phase 5 Step 3 — Payment Intent Blueprint

**Version:** 1.1  
**Date:** 2026-07-04  
**Phase:** Phase 5 Step 3  
**Focus:** Payment Intent — Create Payment for Order

> **Revisi dari konsep:** Step 3 bukan "melakukan pembayaran". Step 3 adalah **membuat niat untuk melakukan pembayaran (Payment Intent)**.

> **Revisi dari review (v1.1):**
>
> - ✅ Transaction Safety: Wrap Create Payment + Transition Order dalam single DB transaction
> - ✅ Business Invariant: Tuliskan explicit domain contracts
> - ✅ Ownership-first validation: Check ownership SEBELUM status
> - ✅ DTO Return Type: Return DTO instead of raw entity
> - ✅ Simplified file layout: Hapus payment.service.ts (re-export unnecessary)

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Why This Step Exists](#2-why-this-step-exists)
3. [Business Invariants](#3-business-invariants)
4. [Prerequisites](#4-prerequisites)
5. [Scope Guard](#5-scope-guard)
6. [Definition of Done](#6-definition-of-done)
7. [Gap Analysis](#7-gap-analysis)
8. [File Layout](#8-file-layout)
9. [Interface Blueprint](#9-interface-blueprint)
10. [Domain Design Decisions](#10-domain-design-decisions)
11. [Error Handling Matrix](#11-error-handling-matrix)
12. [Objective Audit Matrix](#12-objective-audit-matrix)
13. [Implementation Checklist](#13-implementation-checklist)

---

## 1. Executive Summary

### Mission

> **Create the Payment Intent — the first use case that connects Order and Payment through business rules, without depending on Payment Gateway.**

### Position in Journey

```
Step 1: Order Lifecycle (what states exist)
Step 2: Payment Domain (what Payment is)
───────────────────────────────────────────
Step 3: Payment Intent (create intent for Order)
───────────────────────────────────────────
Step 4: Gateway Abstraction (talk to outside)
Step 5: Idempotency
Step 6: Webhook
Step 7: Real Gateway
```

### Key Insight

> **Step 3 is NOT about paying. It's about creating a "promise to pay" (Intent).**
>
> Money doesn't move yet. Gateway isn't contacted yet.
> That's Step 4+.

### What Step 3 IS and IS NOT

| ✅ IS                               | ❌ IS NOT                         |
| ----------------------------------- | --------------------------------- |
| Create Payment Intent for an Order  | Gateway communication             |
| Validate Order is payable (DRAFT)   | Virtual Account / QRIS generation |
| Prevent duplicate Payment           | Snap Token / redirect URL         |
| Transition Order to WAITING_PAYMENT | Idempotency table                 |
| Return "ready for gateway" response | Webhook handling                  |
|                                     | Payment confirmation              |
|                                     | Expiry/timeout                    |

---

## 2. Why This Step Exists

### The Problem Without Payment Intent

If we skip Step 3 and go directly to Step 4 (Gateway), we risk:

1. **No validation** — Anyone can "pay" any Order
2. **No state management** — Order stays DRAFT forever
3. **No business rules** — Can't prevent double payment
4. **No domain boundary** — Gateway logic bleeds into Order

### The Analogy

```
Restaurant Order System:

Step 1: Define menu (Order Lifecycle)
Step 2: Define receipt format (Payment Domain)
───────────────────────────────────────────
Step 3: Take the order (Payment Intent)
         "What would you like to order?"
         (Creates promise, not food yet)
───────────────────────────────────────────
Step 4: Send to kitchen (Gateway)
         "Please cook this"
```

### The Design Principle

> **Step 3 is the "gatekeeper" between pure domain logic and external systems.**

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  Pure Domain Logic           External Systems              │
│  ─────────────────           ──────────────────            │
│                                                             │
│  • Order lifecycle        • Gateway                        │
│  • Payment aggregate      • Webhook                       │
│  • Business rules         • Provider API                  │
│                                                             │
│  Step 1 + 2 + 3 ────────► Step 4 + 5 + 6 + 7             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Business Invariants

### Apa Itu Invariant?

> **Invariant adalah "kontrak" domain yang HARUS SELALU benar, tidak peduli apa pun.**

Invariant bukan validation method biasa. Ia adalah **constitution** dari domain.

---

### Invariant 1: Exactly One ACTIVE Payment Per Order

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   Invariant 1: One ACTIVE Payment Per Order                 │
│                                                             │
│   At any given time, an Order can have:                     │
│   ├── Zero payments (never initiated)                      │
│   ├── One PENDING payment                                  │
│   └── NO multiple PENDING payments                         │
│                                                             │
│   Once a payment is SUCCESS/DECLINED/EXPIRED,              │
│   any new attempt must create a NEW payment record.         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Enforcement:** `validateNoActivePayment(orderId)` — throws `PAYMENT_EXISTS`

---

### Invariant 2: Payment PENDING ↔ Order WAITING_PAYMENT

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   Invariant 2: Status Consistency                           │
│                                                             │
│   Payment PENDING  ⇔  Order WAITING_PAYMENT               │
│   Payment SUCCESS  ⇔  Order PAID                          │
│   Payment DECLINED ⇔  Order (retry allowed)               │
│   Payment EXPIRED ⇔  Order EXPIRED                       │
│                                                             │
│   NEVER:                                                    │
│   ├── Payment PENDING + Order DRAFT                        │
│   └── Payment PENDING + Order PAID                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Enforcement:** Transaction ensures both succeed or both fail

---

### Invariant 3: Atomic State Transition

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   Invariant 3: Atomic Operation                             │
│                                                             │
│   createPaymentIntent = atomic operation                    │
│                                                             │
│   ┌─────────────────────────────────────────────────────┐   │
│   │ BEGIN TRANSACTION                                    │   │
│   │   Create Payment (PENDING)                          │   │
│   │   Update Order (DRAFT → WAITING_PAYMENT)            │   │
│   │ COMMIT                                               │   │
│   └─────────────────────────────────────────────────────┘   │
│                                                             │
│   IF any step fails → ROLLBACK                             │
│   IF database dies → ROLLBACK                              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Enforcement:** Single transaction wraps both operations

---

### Invariant 4: Ownership Before Information

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   Invariant 4: Security Boundary                            │
│                                                             │
│   Validation order:                                         │
│   1. Ownership (WHO)                                      │
│   2. Status (WHAT can be done)                             │
│   3. Payment exists (CONSTRAINT)                          │
│                                                             │
│   Why?                                                     │
│   ├── Non-owner should NOT know order status              │
│   └── Reduces information leakage                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Enforcement:** `validateOwnership()` called FIRST, before any other checks

---

## 4. Prerequisites

Step 3 mengasumsikan Step 1 dan Step 2 sudah selesai.

### Required from Step 1

| Requirement                                   | Evidence                                   |
| --------------------------------------------- | ------------------------------------------ |
| OrderLifecycleService exists                  | `modules/order/order-lifecycle.service.ts` |
| OrderLifecycleRules.isPayable()               | `modules/order/order-lifecycle.rules.ts`   |
| OrderStateTransitions.DRAFT → WAITING_PAYMENT | Defined in `order-lifecycle.types.ts`      |

### Required from Step 2

| Requirement                             | Evidence                                |
| --------------------------------------- | --------------------------------------- |
| PaymentRepository                       | `modules/payment/payment.repository.ts` |
| PaymentRepository.create()              | Creates Payment with PENDING            |
| PaymentRepository.findActiveByOrderId() | Invariant enforcement                   |
| PaymentStatus.PENDING                   | Defined in `payment.types.ts`           |

---

## 5. Scope Guard

### Yang BOLEH Dikerjakan

#### ✅ Payment Intent Use Case

Membuat use case yang menghubungkan Order dan Payment:

```typescript
// Create Payment Intent Use Case
interface CreatePaymentIntentInput {
  orderId: number;
  userId: number;
  amount: number;
  currency?: string; // Default: 'IDR'
  provider?: PaymentProvider; // Default: 'STUB'
}

interface PaymentIntentResultDTO {
  paymentId: number;
  orderId: number;
  amount: number;
  currency: string;
  provider: PaymentProvider;
  status: 'READY_FOR_GATEWAY'; // Not SUCCESS, not PAID
}
```

#### ✅ Business Rule Validations (Ownership-First)

Validasi dilakukan dalam urutan:

```typescript
// 1. Check ownership FIRST (Invariant 4)
validateOwnership(orderUserId, requestUserId)

// 2. Check status (Invariant 2)
canInitiatePayment(orderStatus: OrderStatus): boolean

// 3. Check no active Payment (Invariant 1)
findActiveByOrderId(orderId): Payment | null
```

#### ✅ Transaction Safety

```typescript
// All operations in ONE transaction
await prisma.$transaction(async (tx) => {
  // Create Payment
  // Update Order status
  // Commit or Rollback
});
```

### Yang TIDAK BOLEH Disentuh

| Feature                | Scope   | When Added |
| ---------------------- | ------- | ---------- |
| Gateway communication  | Step 4  | Not yet    |
| Virtual Account / QRIS | Step 4+ | Not yet    |
| Snap Token             | Step 4+ | Not yet    |
| Redirect URL           | Step 4+ | Not yet    |
| Idempotency            | Step 5  | Not yet    |
| Webhook                | Step 6  | Not yet    |
| providerReference      | Step 7  | Not yet    |
| expiresAt              | Step 8  | Not yet    |
| Payment confirmation   | Step 6  | Not yet    |

---

## 6. Definition of Done

Step 3 dianggap **100% selesai** apabila seluruh poin berikut terpenuhi.

### A. Functional Requirements

- [ ] `createPaymentIntent()` creates Payment with PENDING status
- [ ] Order transitions from DRAFT → WAITING_PAYMENT atomically
- [ ] Duplicate payment is rejected (PAYMENT_EXISTS error)
- [ ] Non-payable Order is rejected (ORDER_TERMINAL / ORDER_NOT_PAYABLE)
- [ ] Wrong user is rejected (ORDER_NOT_OWNED)

### B. Transaction Safety

- [ ] Create Payment and Update Order wrapped in single transaction
- [ ] Either both succeed or both rollback
- [ ] No partial state possible

### C. Invariant Compliance

- [ ] Exactly one PENDING payment per Order enforced
- [ ] Payment PENDING ↔ Order WAITING_PAYMENT always consistent
- [ ] Ownership checked before any other information revealed

### D. Return Value

- [ ] Returns `PaymentIntentResultDTO` (not raw entity)
- [ ] Contains: paymentId, orderId, amount, currency, provider, status
- [ ] Does NOT return `paymentUrl` or `redirectUrl` (Step 4)

### E. Scope Clean

- [ ] No Gateway interface
- [ ] No Webhook handling
- [ ] No Idempotency (Step 5)
- [ ] No providerReference

---

## 7. Gap Analysis

### Current State (After Step 1 & 2)

| File/Directory                          | Status        | Notes                      |
| --------------------------------------- | ------------- | -------------------------- |
| `modules/order/`                        | ✅ Complete   | Order lifecycle foundation |
| `modules/payment/payment.types.ts`      | ✅ Complete   | Minimal types              |
| `modules/payment/payment.repository.ts` | ✅ Complete   | CRUD operations            |
| `modules/payment/payment.mapper.ts`     | ✅ Complete   | Data transformation        |
| `prisma/schema.prisma`                  | ✅ Complete   | Payment model exists       |
| `modules/payment/`                      | ❌ Incomplete | Need PaymentIntentService  |

### What's Missing for Step 3

1. **PaymentIntentService** — Orchestrates the flow with transaction
2. **Business validations** — Ownership-first, atomic
3. **Payment Intent types** — Input/DTO types
4. **Error codes** — Step 3 specific errors

---

## 8. File Layout

### New Files

```
modules/payment/
├── payment-intent.types.ts       [NEW] — Intent-specific types (Input + DTO)
├── payment-intent.service.ts     [NEW] — Core intent logic with transaction
└── index.ts                   [MODIFY] — Add exports
```

### Files NOT to Modify in Step 3

```
❌ modules/order/order.types.ts           (complete)
❌ modules/order/order-lifecycle.types.ts (complete)
❌ modules/order/order-lifecycle.rules.ts (complete)
❌ modules/payment/payment.types.ts        (complete)
❌ modules/payment/payment.repository.ts   (complete)
❌ modules/payment/payment.mapper.ts       (complete)
❌ prisma/schema.prisma                    (complete)
❌ modules/payment/gateways/                (Step 4 scope)
❌ modules/payment/webhooks/               (Step 6 scope)
❌ modules/payment/idempotency/            (Step 5 scope)
```

### Removed from Original Design

```
❌ modules/payment/payment.service.ts     (NOT NEEDED - unnecessary re-export)
```

---

## 9. Interface Blueprint

### 9.1 Payment Intent Types (`payment-intent.types.ts`)

```typescript
// ============================================================
// PAYMENT INTENT TYPES
// Phase 5 Step 3: Create Payment Intent
//
// Philosophy:
// - Minimal types for Step 3
// - Returns DTO (not raw entity) for API stability
// - No gateway-specific types (Step 4+)
// ============================================================

import type { PaymentProvider } from './payment.types.js';

// ----- Input -----
export interface CreatePaymentIntentInput {
  readonly orderId: number;
  readonly userId: number;
  readonly amount: number;
  readonly currency?: string;
  readonly provider?: PaymentProvider;
}

// ----- Result DTO -----
/**
 * DTO for API response
 * Returns structured data, not raw entity
 */
export interface PaymentIntentResultDTO {
  readonly paymentId: number;
  readonly orderId: number;
  readonly amount: number;
  readonly currency: string;
  readonly provider: PaymentProvider;
  readonly status: 'READY_FOR_GATEWAY';
}

// ----- Error Codes (Step 3 scope) -----
export const PaymentIntentErrorCodes = {
  ORDER_NOT_FOUND: 'ORDER_NOT_FOUND',
  ORDER_TERMINAL: 'ORDER_TERMINAL',
  ORDER_NOT_PAYABLE: 'ORDER_NOT_PAYABLE',
  ORDER_NOT_OWNED: 'ORDER_NOT_OWNED',
  PAYMENT_EXISTS: 'PAYMENT_EXISTS',
} as const;

export type PaymentIntentErrorCode =
  (typeof PaymentIntentErrorCodes)[keyof typeof PaymentIntentErrorCodes];
```

### 9.2 Payment Intent Service (`payment-intent.service.ts`)

```typescript
// ============================================================
// PAYMENT INTENT SERVICE
// Phase 5 Step 3: Create Payment Intent
//
// Philosophy:
// - Use Case, not CRUD
// - NO Gateway communication
// - Transaction Safety: Both Order and Payment succeed or fail together
// - Ownership-first validation: Check WHO before WHAT
//
// Flow:
// 1. Fetch Order
// 2. Validate ownership FIRST (Invariant 4)
// 3. Validate Order is payable (Invariant 2)
// 4. Check no active Payment exists (Invariant 1)
// 5. Execute atomic transaction:
//    - Create Payment record (PENDING)
//    - Transition Order to WAITING_PAYMENT
// 6. Return DTO (not raw entity)
// ============================================================

import { prisma } from '../../infra/db/prisma.js';
import { PaymentRepository } from '../payment.repository.js';
import { OrderLifecycleService } from '../../order/order-lifecycle.service.js';
import { OrderLifecycleRules } from '../../order/order-lifecycle.rules.js';
import { BusinessError } from '../../shared/errors/business.error.js';
import type { PaymentIntentResultDTO } from './payment-intent.types.js';
import type { CreatePaymentIntentInput } from './payment-intent.types.js';
import { PaymentIntentErrorCodes } from './payment-intent.types.js';

export const PaymentIntentService = {
  /**
   * Create Payment Intent
   *
   * The "Pay" button handler.
   * Creates the promise to pay, not the payment itself.
   */
  async createPaymentIntent(
    input: CreatePaymentIntentInput,
  ): Promise<PaymentIntentResultDTO> {
    // STEP 1: Fetch Order
    const order = await prisma.order.findUnique({
      where: { id: input.orderId },
      include: { items: true },
    });

    if (!order) {
      throw new BusinessError(
        `Order ${input.orderId} not found`,
        404,
        PaymentIntentErrorCodes.ORDER_NOT_FOUND,
      );
    }

    // STEP 2: Validate ownership FIRST (Invariant 4)
    // Check WHO before revealing any information
    if (order.userId !== input.userId) {
      throw new BusinessError(
        'User does not own this order',
        403,
        PaymentIntentErrorCodes.ORDER_NOT_OWNED,
      );
    }

    // STEP 3: Validate Order is payable (Invariant 2)
    if (!OrderLifecycleRules.isPayable(order.status as any)) {
      if (OrderLifecycleRules.isTerminal(order.status as any)) {
        throw new BusinessError(
          `Order cannot be paid — status is terminal: ${order.status}`,
          400,
          PaymentIntentErrorCodes.ORDER_TERMINAL,
        );
      }
      throw new BusinessError(
        `Order cannot initiate payment from status: ${order.status}. Expected: DRAFT`,
        400,
        PaymentIntentErrorCodes.ORDER_NOT_PAYABLE,
      );
    }

    // STEP 4: Check no active Payment exists (Invariant 1)
    const activePayment = await PaymentRepository.findActiveByOrderId(
      input.orderId,
    );
    if (activePayment) {
      throw new BusinessError(
        `Order already has active payment (ID: ${activePayment.id})`,
        400,
        PaymentIntentErrorCodes.PAYMENT_EXISTS,
      );
    }

    // STEP 5: Execute atomic transaction (Invariant 2 + 3)
    const payment = await prisma.$transaction(async (tx) => {
      // 5a: Create Payment record
      const newPayment = await tx.payment.create({
        data: {
          orderId: input.orderId,
          userId: input.userId,
          amount: input.amount,
          currency: input.currency ?? 'IDR',
          provider: input.provider ?? 'STUB',
          status: 'PENDING',
        },
      });

      // 5b: Update Order status
      await tx.order.update({
        where: { id: input.orderId },
        data: { status: 'WAITING_PAYMENT' },
      });

      return newPayment;
    });

    // STEP 6: Return DTO (not raw entity)
    return {
      paymentId: payment.id,
      orderId: payment.orderId,
      amount: payment.amount,
      currency: payment.currency,
      provider: payment.provider as any,
      status: 'READY_FOR_GATEWAY',
    };
  },
} as const;
```

### 9.3 Module Export (`payment/index.ts`)

```typescript
// ============================================================
// PAYMENT MODULE — Public API
// Phase 5 Step 3: Payment Intent
// ============================================================

// Step 2 exports
export { PaymentRepository } from './payment.repository.js';
export { PaymentMapper } from './payment.mapper.js';

export type {
  Payment,
  PaymentStatus,
  PaymentProvider,
  CreatePaymentInput,
  PaymentViewDTO,
} from './payment.types.js';

export {
  PAYMENT_TERMINAL_STATUSES,
  PAYMENT_ACTIVE_STATUSES,
} from './payment.types.js';

// Step 3 exports
export { PaymentIntentService } from './payment-intent.service.js';

export type {
  CreatePaymentIntentInput,
  PaymentIntentResultDTO,
  PaymentIntentErrorCode,
} from './payment-intent.types.js';

export { PaymentIntentErrorCodes } from './payment-intent.types.js';
```

---

## 10. Domain Design Decisions

### Decision 1: Payment Intent is NOT Payment

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   Payment Intent ≠ Payment                                  │
│                                                             │
│   Payment Intent:                                          │
│   - "I want to pay"                                       │
│   - Created when user clicks "Bayar"                       │
│   - Order: DRAFT → WAITING_PAYMENT                        │
│   - Payment: PENDING                                      │
│                                                             │
│   Payment (Actual):                                         │
│   - "I have paid"                                          │
│   - Created when money arrives                             │
│   - Order: PAID                                           │
│   - Payment: SUCCESS                                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Decision 2: Transaction Safety First

```typescript
// WRONG: Separate operations = potential inconsistency
await PaymentRepository.create(input);
await OrderLifecycleService._transition(orderId, 'WAITING_PAYMENT');

// CORRECT: Atomic transaction
await prisma.$transaction(async (tx) => {
  await tx.payment.create(...);
  await tx.order.update(...);
});
```

**Rationale:**

- Database failure between operations = inconsistent state
- Payment PENDING + Order DRAFT violates Invariant 2
- Transaction ensures both succeed or both fail

### Decision 3: Ownership-First Validation

```typescript
// WRONG: Reveal information before ownership check
const order = await getOrder(orderId);
if (order.status === 'PAID') throw ...; // Information leaked!
if (order.userId !== userId) throw ...;

// CORRECT: Check ownership first
if (order.userId !== userId) throw ...;
if (order.status === 'PAID') throw ...; // Only if owner
```

**Rationale:**

- Non-owner shouldn't know order exists
- Reduces information leakage
- Security through defense in depth

### Decision 4: Return DTO, Not Entity

```typescript
// WRONG: Return raw entity
return payment;

// CORRECT: Return structured DTO
return {
  paymentId: payment.id,
  orderId: payment.orderId,
  amount: payment.amount,
  currency: payment.currency,
  provider: payment.provider,
  status: 'READY_FOR_GATEWAY',
};
```

**Rationale:**

- API contract should be stable
- Entity may evolve in future steps
- DTO protects consumers from internal changes

### Decision 5: No Intermediate Re-export File

```typescript
// WRONG: Unnecessary indirection
// payment.service.ts just re-exports PaymentIntentService

// CORRECT: Direct export
// modules/payment/index.ts exports PaymentIntentService directly
```

**Rationale:**

- No value added by re-export
- Extra file = extra maintenance
- Direct is clearer

---

## 11. Error Handling Matrix

| Scenario                 | Error Message                                                | Status Code | Error Code        |
| ------------------------ | ------------------------------------------------------------ | ----------- | ----------------- |
| Order not found          | `Order ${orderId} not found`                                 | 404         | ORDER_NOT_FOUND   |
| Order is PAID            | `Order cannot be paid — status is terminal: PAID`            | 400         | ORDER_TERMINAL    |
| Order is EXPIRED         | `Order cannot be paid — status is terminal: EXPIRED`         | 400         | ORDER_TERMINAL    |
| Order is CANCELLED       | `Order cannot be paid — status is terminal: CANCELLED`       | 400         | ORDER_TERMINAL    |
| Order is WAITING_PAYMENT | `Order cannot initiate payment from status: WAITING_PAYMENT` | 400         | ORDER_NOT_PAYABLE |
| User doesn't own order   | `User does not own this order`                               | 403         | ORDER_NOT_OWNED   |
| Payment PENDING exists   | `Order already has active payment (ID: ${id})`               | 400         | PAYMENT_EXISTS    |

---

## 12. Objective Audit Matrix

### A. Architecture Alignment

| Criterion                | Assessment | Evidence                                                             |
| ------------------------ | ---------- | -------------------------------------------------------------------- |
| Aggregate Independence   | ✅ PASS    | PaymentIntentService orchestrates Order and Payment without coupling |
| Domain Isolation         | ✅ PASS    | No Gateway types in PaymentIntent                                    |
| Single Responsibility    | ✅ PASS    | Use Case, not CRUD — validates, orchestrates, returns DTO            |
| Progressive Engineering  | ✅ PASS    | Only domain logic, no Gateway yet                                    |
| Transaction Safety       | ✅ PASS    | Single DB transaction wraps all operations                           |
| Ownership-First Security | ✅ PASS    | User validated before status is revealed                             |
| DTO Return               | ✅ PASS    | Returns PaymentIntentResultDTO, not raw entity                       |

### B. Scope Guard Adherence

| Forbidden Item         | Status          | Evidence                       |
| ---------------------- | --------------- | ------------------------------ |
| Gateway communication  | ✅ NOT IN SCOPE | No gateway code                |
| Snap Token             | ✅ NOT IN SCOPE | Returns READY_FOR_GATEWAY only |
| Virtual Account / QRIS | ✅ NOT IN SCOPE | Step 4+                        |
| Idempotency            | ✅ NOT IN SCOPE | Step 5                         |
| Webhook                | ✅ NOT IN SCOPE | Step 6                         |
| providerReference      | ✅ NOT IN SCOPE | Step 7                         |
| expiresAt              | ✅ NOT IN SCOPE | Step 8                         |
| paymentUrl             | ✅ NOT IN SCOPE | Step 4+                        |
| redirectUrl            | ✅ NOT IN SCOPE | Step 4+                        |

### C. Progressive Check

| Step 1 Prerequisites               | Status  | Evidence                                   |
| ---------------------------------- | ------- | ------------------------------------------ |
| OrderLifecycleService exists       | ✅ PASS | `modules/order/order-lifecycle.service.ts` |
| OrderLifecycleRules.isPayable()    | ✅ PASS | `modules/order/order-lifecycle.rules.ts`   |
| OrderStateTransitions.DRAFT        | ✅ PASS | Defined in types                           |
| DRAFT → WAITING_PAYMENT transition | ✅ PASS | Rule exists                                |

| Step 2 Prerequisites                    | Status  | Evidence                                |
| --------------------------------------- | ------- | --------------------------------------- |
| PaymentRepository                       | ✅ PASS | `modules/payment/payment.repository.ts` |
| PaymentRepository.create()              | ✅ PASS | Creates Payment with PENDING            |
| PaymentRepository.findActiveByOrderId() | ✅ PASS | Invariant enforcement                   |
| PaymentStatus.PENDING                   | ✅ PASS | Defined in schema                       |

| Step 3 Deliverables            | Status     | Notes                              |
| ------------------------------ | ---------- | ---------------------------------- |
| PaymentIntentService           | ❌ MISSING | Need to implement                  |
| Transaction Safety             | ❌ MISSING | $transaction wraps both operations |
| Ownership-first validation     | ❌ MISSING | User validated before status       |
| DTO Return type                | ❌ MISSING | PaymentIntentResultDTO             |
| Business Invariants documented | ✅ PASS    | 4 invariants clearly defined       |
| No Gateway code                | ✅ PASS    | Clean scope                        |

---

## 13. Implementation Checklist

### Phase 5 Step 3 Deliverables

| #   | Deliverable            | File                                        | Action |
| --- | ---------------------- | ------------------------------------------- | ------ |
| 1   | Payment Intent types   | `modules/payment/payment-intent.types.ts`   | CREATE |
| 2   | Payment Intent service | `modules/payment/payment-intent.service.ts` | CREATE |
| 3   | Update module exports  | `modules/payment/index.ts`                  | MODIFY |
| 4   | Unit tests             | `tests/unit/payment/payment-intent.test.ts` | CREATE |

### Files NOT TO Modify

| File                                    | Reason           |
| --------------------------------------- | ---------------- |
| `modules/order/`                        | Already complete |
| `modules/payment/payment.types.ts`      | Already complete |
| `modules/payment/payment.repository.ts` | Already complete |
| `modules/payment/payment.mapper.ts`     | Already complete |
| `prisma/schema.prisma`                  | Already complete |
| `modules/payment/gateways/`             | Step 4 scope     |
| `modules/payment/webhooks/`             | Step 6 scope     |
| `modules/payment/idempotency/`          | Step 5 scope     |

---

## Appendix: Flow Diagram

```
                    User
                      │
                      ▼
             createPaymentIntent()
                      │
                      ▼
          ┌───────────────────────────┐
          │ 1. Fetch Order           │
          │    (with items)          │
          └─────────────┬─────────────┘
                        ▼
          ┌───────────────────────────┐
          │ 2. Validate Ownership     │ ◄── Invariant 4
          │    (WHO before WHAT)      │    Security first
          └─────────────┬─────────────┘
                        ▼
          ┌───────────────────────────┐
          │ 3. Validate Status         │ ◄── Invariant 2
          │    (isPayable?)            │
          └─────────────┬─────────────┘
                        ▼
          ┌───────────────────────────┐
          │ 4. Check No Active Payment│ ◄── Invariant 1
          │    (findActiveByOrderId)  │
          └─────────────┬─────────────┘
                        ▼
          ┌───────────────────────────┐
          │ 5. BEGIN TRANSACTION      │ ◄── Invariant 3
          │ ┌─────────────────────────┴─┐
          │ │ 5a. Create Payment          │
          │ │     (PENDING)               │
          │ ├─────────────────────────────┤
          │ │ 5b. Update Order Status     │
          │ │     (→ WAITING_PAYMENT)     │
          │ └─────────────────────────────┘
          │         │
          │    COMMIT or ROLLBACK
          └─────────────┬─────────────┘
                        ▼
          ┌───────────────────────────┐
          │ 6. Return DTO              │
          │    PaymentIntentResultDTO  │
          └─────────────┬─────────────┘
                        ▼
             READY_FOR_GATEWAY
                        │
                        ▼
           Step 4 (Gateway Adapter)
```

---

## Appendix: Integration with Future Steps

### Step 4 (Gateway Abstraction)

```typescript
// After Step 3 completes:
// - Order is WAITING_PAYMENT
// - Payment is PENDING
// - Returns DTO with READY_FOR_GATEWAY

// Step 4 adds:
const gatewayUrl = await PaymentGateway.createCharge({
  amount: dto.amount,
  orderId: dto.orderId,
});

// Returns paymentUrl for user to visit
```

### Step 5 (Idempotency)

```typescript
// Step 5 adds idempotency key check BEFORE Step 3 logic:
const idempotency = await IdempotencyService.check(`payment-intent:${orderId}`);

if (idempotency) {
  return idempotency.response; // Return cached DTO
}
```

### Step 6 (Webhook - Payment Confirmation)

```typescript
// After Gateway processes payment:
// Gateway sends webhook: "Payment SUCCESS"

// Step 6 handles:
// 1. Find Payment by providerReference
// 2. Update Payment status: PENDING → SUCCESS
// 3. Transition Order: WAITING_PAYMENT → PAID
```

---

**Blueprint Status:** ✅ IMPLEMENTED  
**Version:** 1.2  
**Date:** 2026-07-04  
**Score:** 9.9/10 (after reviewer feedback)  
**Implemented Features:**

- ✅ Atomic transaction
- ✅ Ownership-first validation
- ✅ DTO return type
- ✅ Executable invariants (helper functions)
- ✅ Domain event placeholder (PaymentIntentCreatedEvent)

---

## Appendix: Reviewer Feedback & Improvements (v1.2)

### Improvements Applied

| #   | Feedback                     | Action Taken                                                                      |
| --- | ---------------------------- | --------------------------------------------------------------------------------- |
| 1   | Invariant sebagai kode       | ✅ Created `ensurePayable()`, `ensureSinglePendingPayment()`, `ensureOwnership()` |
| 2   | Domain event placeholder     | ✅ Added `PaymentIntentCreatedEvent` interface                                    |
| 3   | READY_FOR_GATEWAY definition | ✅ Added comment: "Response Status, not Order/Payment status"                     |

### Future Improvements (Not Implemented - Scope)

| #   | Feedback               | Recommended Action                             | Step     |
| --- | ---------------------- | ---------------------------------------------- | -------- |
| 1   | Transaction Boundary   | Consider Unit of Work pattern                  | Future   |
| 2   | Repository consistency | Decide: Repository or Prisma direct            | Future   |
| 3   | Error catalog          | Create `payment.errors.ts`                     | Step 5-6 |
| 4   | Integration tests      | Test business flow (DRAFT→WAITING, PAID→error) | Future   |
| 5   | Unit of Work           | Abstract transaction to infrastructure         | Future   |

### Design Decisions (v1.2)

#### Executable Invariants

Invariant sekarang adalah helper functions:

```typescript
// Before: Inline validation
if (!OrderLifecycleRules.isPayable(order.status)) { ... }

// After: Explicit helper function
ensurePayable(currentStatus);
ensureOwnership(orderUserId, requestUserId);
ensureSinglePendingPayment(orderId);
```

#### Domain Event Placeholder

```typescript
// Future: Publish PaymentIntentCreatedEvent
interface PaymentIntentCreatedEvent {
  readonly eventType: 'PAYMENT_INTENT_CREATED';
  readonly paymentId: number;
  readonly orderId: number;
  readonly userId: number;
  readonly amount: number;
  readonly timestamp: Date;
}
```

#### READY_FOR_GATEWAY Definition

```typescript
// Note: READY_FOR_GATEWAY is a Response Status, not Order/Payment status
// It's the status of the use case RESULT, not the domain entities
```
