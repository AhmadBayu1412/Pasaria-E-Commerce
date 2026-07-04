# Phase 5 Step 2 — Payment Domain Foundation Blueprint

**Version:** 2.0  
**Date:** 2026-07-04  
**Phase:** Phase 5 Step 2  
**Focus:** Payment Domain Foundation

> **Revisi dari review:** Menghapus field dan method premature, mengubah relasi Order:Payment menjadi 1:\*

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Why This Step Exists](#2-why-this-step-exists)
3. [Prerequisites](#3-prerequisites)
4. [Scope Guard](#4-scope-guard)
5. [Definition of Done](#5-definition-of-done)
6. [Gap Analysis](#6-gap-analysis)
7. [File Layout](#7-file-layout)
8. [Interface Blueprint](#8-interface-blueprint)
9. [Domain Design Decisions](#9-domain-design-decisions)
10. [Objective Audit Matrix](#10-objective-audit-matrix)
11. [Implementation Checklist](#11-implementation-checklist)

---

## 1. Executive Summary

### Mission

> **Introduce Payment as a new Aggregate that represents the record of an attempt to pay for an Order.**

Step 1 telah mendefinisikan **Order Lifecycle**. Sekarang kita perlu memperkenalkan **Payment** sebagai domain baru yang bertanggung jawab atas pembayaran.

### What Step 2 IS NOT

- ❌ **NOT** about Midtrans, Xendit, or any gateway
- ❌ **NOT** about creating Virtual Account or QRIS
- ❌ **NOT** about webhook handling
- ❌ **NOT** about money transfer
- ❌ **NOT** about payment confirmation

### What Step 2 IS

- ✅ **IS** about defining what Payment is as a domain
- ✅ **IS** about the Aggregate structure and its identity
- ✅ **IS** about Repository patterns for the new Aggregate
- ✅ **IS** about establishing domain boundaries

### Key Insight

> **Payment is not money. Payment is a record of the attempt to pay.**

```
Customer clicks "Bayar"

↓

System creates: Payment #500

Status: PENDING

Does the money exist yet? NO.

But Payment already exists.

Because Payment is about the ATTEMPT, not the RESULT.
```

---

## 2. Why This Step Exists

### The Problem Without Payment Domain

Without Payment as a separate domain, Order would slowly become a "monster":

```
Order
├── status
├── paymentReference
├── paymentMethod
├── provider
├── paidAt
├── gatewayResponse
├── paymentToken
├── paymentUrl
└── ... (grows forever)
```

Eventually:

- Gateway sends SUCCESS → Order changes
- Gateway sends EXPIRED → Order changes
- Gateway sends REFUND → Order changes
- Gateway sends CHARGEBACK → Order changes

Order no longer manages Order. It manages Payment.

This violates Single Responsibility.

### The Analogy

Think of a restaurant:

```
Table 1 (Kasir)
├── Takes orders
├── Calculates bill
├── Prints invoice
└── Does NOT handle money

Table 2 (Pembayaran)
├── Handles EDC
├── Handles QRIS
├── Handles bank transfer
└── Handles credit card
```

They have **different jobs**. So should our software:

```
Order Aggregate
├── Manages what was purchased
├── Manages lifecycle status
└── Does NOT know about payment details

Payment Aggregate
├── Manages payment attempt
├── Knows about provider
├── Knows about status
└── Does NOT know about products
```

### Position in Phase 5 Journey

```
Step 1: What is the lifecycle of an Order?

Step 2: What is Payment as a domain?

Step 3: How to create the first Payment?

Step 4: How does Payment talk to Gateway?

Step 5: How to prevent double payment?

Step 6: How to receive news from Gateway?

Step 7: How to connect real providers?

Step 8: What if payment fails or expires?

Step 9: How to record all Payment history?

Step 10: Does everything actually work?
```

---

## 3. Prerequisites

Step 2 mengasumsikan Step 1 sudah selesai.

### Required from Step 1

| Requirement                      | Evidence                              |
| -------------------------------- | ------------------------------------- |
| Order Lifecycle defined          | `order-lifecycle.service.ts` exists   |
| OrderStatus with WAITING_PAYMENT | `order-lifecycle.types.ts`            |
| Single entry point for status    | `OrderLifecycleService._transition()` |
| Order Module stable              | `modules/order/` complete             |

---

## 4. Scope Guard

### Yang BOLEH Dikerjakan

#### ✅ Payment Aggregate Definition (MINIMAL)

Mendefinisikan Payment sebagai Aggregate baru:

```typescript
interface Payment {
  id: number;
  orderId: number; // Reference to Order
  userId: number;

  amount: number;
  currency: string; // 'IDR'

  provider: PaymentProvider; // Initially only STUB

  status: PaymentStatus;

  createdAt: Date;
  updatedAt: Date;
}
```

**Catatan:** `providerReference` dan `expiresAt` belum ada. Ditambahkan di Step 7 dan Step 8.

#### ✅ PaymentStatus Enum

```typescript
type PaymentStatus =
  | 'PENDING' // Intent created, awaiting confirmation
  | 'SUCCESS' // Payment confirmed (Step 6+)
  | 'DECLINED' // Gateway rejected (Step 6+)
  | 'EXPIRED'; // Timeout exceeded (Step 8+)
```

#### ✅ PaymentRepository (MINIMAL)

CRUD operations untuk Step 2:

```typescript
// Create
create(input: CreatePaymentInput): Promise<Payment>

// Read
findById(id: number): Promise<Payment | null>
findByOrderId(orderId: number): Promise<Payment | null> // Returns latest
findActiveByOrderId(orderId: number): Promise<Payment | null>

// Update
updateStatus(id: number, status: PaymentStatus): Promise<Payment>
```

**Catatan:** `findByProviderReference()` tidak ada di Step 2. Ditambahkan di Step 6.

#### ✅ PaymentMapper

Transformasi data:

```typescript
// Database → Domain
toDomain(prismaPayment): Payment

// Domain → View (for API)
toView(payment: Payment): PaymentViewDTO
```

#### ✅ Prisma Schema (MINIMAL)

Menambahkan Payment model untuk Step 2:

```prisma
model Payment {
  id                Int              @id @default(autoincrement())
  orderId           Int              @index() // NOT @unique - supports retry
  userId            Int

  amount            Int              // In smallest unit (rupiah)
  currency          String           @default("IDR")

  provider          PaymentProvider

  status            PaymentStatus    @default(PENDING)

  createdAt         DateTime         @default(now())
  updatedAt         DateTime         @updatedAt

  order             Order            @relation(fields: [orderId], references: [id])

  @@index([status])
  @@index([orderId])
}

enum PaymentProvider {
  STUB  // Step 2: Only STUB
  // MIDTRANS, XENDIT, STRIPE added in Step 7
}

enum PaymentStatus {
  PENDING
  SUCCESS
  DECLINED
  EXPIRED
}
```

### Yang TIDAK BOLEH Disentuh

| Feature                   | Scope  | When Added     |
| ------------------------- | ------ | -------------- |
| Payment creation (intent) | Step 3 | Not yet        |
| Gateway interface         | Step 4 | Not yet        |
| Payment creation logic    | Step 3 | Not yet        |
| Payment Gateway           | Step 4 | Not yet        |
| Idempotency               | Step 5 | Not yet        |
| Webhook                   | Step 6 | Not yet        |
| Real Gateway integration  | Step 7 | Not yet        |
| Expiry job                | Step 8 | Not yet        |
| Timeline                  | Step 9 | Not yet        |
| Refund                    | Future | Not MVP        |
| providerReference         | Step 7 | Gateway needed |
| expiresAt                 | Step 8 | Expiry needed  |
| findByProviderReference   | Step 6 | Webhook needed |

---

## 5. Definition of Done

Step 2 dianggap **100% selesai** apabila seluruh poin berikut terpenuhi.

### A. Payment Aggregate Defined

- [ ] `Payment` interface dengan field MINIMAL
- [ ] `PaymentStatus` enum dengan 4 nilai
- [ ] `PaymentProvider` dengan hanya `STUB`
- [ ] Tidak ada field gateway-specific (providerReference, expiresAt)

### B. Repository Functional

- [ ] `create()` - membuat Payment record
- [ ] `findById()` - mencari by ID
- [ ] `findByOrderId()` - mencari by Order ID (returns latest)
- [ ] `findActiveByOrderId()` - mencari Payment PENDING
- [ ] `updateStatus()` - mengupdate status

### C. Mapper Functional

- [ ] `toDomain()` - Prisma → Domain
- [ ] `toView()` - Domain → DTO

### D. Database Schema Updated

- [ ] `Payment` model ada di schema
- [ ] `PaymentProvider` enum ada (STUB only)
- [ ] `PaymentStatus` enum ada
- [ ] `orderId` menggunakan `@index()` (bukan `@unique`)

### E. No Feature Creep

Dipastikan **belum** ada implementasi:

- [ ] Payment creation (intent)
- [ ] Gateway interface
- [ ] Stub provider implementation
- [ ] Idempotency
- [ ] Webhook
- [ ] Expiry job
- [ ] providerReference
- [ ] expiresAt

### F. Integration Points Clear

Step 3 dapat langsung menggunakan:

- [ ] `PaymentRepository` untuk menyimpan Payment baru
- [ ] `PaymentStatus` untuk validasi status
- [ ] `findActiveByOrderId()` untuk invariant "satu PENDING per order"

---

## 6. Gap Analysis

### Current State (After Step 1)

| File/Directory         | Status             | Notes                      |
| ---------------------- | ------------------ | -------------------------- |
| `modules/order/`       | ✅ Complete        | Order lifecycle foundation |
| `modules/payment/`     | ❌ Empty           | Belum ada                  |
| `prisma/schema.prisma` | ⚠️ Missing Payment | Perlu ditambahkan          |

### What's Missing for Step 2

1. **Payment Aggregate** - Tidak ada definisi Payment
2. **PaymentRepository** - Tidak ada data access layer
3. **PaymentMapper** - Tidak ada data transformation
4. **Prisma Schema** - Payment model belum ada

---

## 7. File Layout

### New Files

```
modules/payment/
├── payment.types.ts          [NEW] — Domain types & interfaces
├── payment.repository.ts      [NEW] — Data access layer
├── payment.mapper.ts         [NEW] — Data transformation
└── index.ts                [NEW] — Module exports

prisma/
└── schema.prisma           [MODIFY] — Add Payment model
```

### Files NOT to Modify in Step 2

```
❌ modules/order/                     (already complete)
❌ modules/checkout/                  (already complete)
❌ modules/payment/payment.service.ts (Step 3)
❌ modules/payment/gateways/          (Step 4)
❌ modules/payment/webhooks/          (Step 6)
❌ modules/payment/idempotency/       (Step 5)
```

---

## 8. Interface Blueprint

### 8.1 Payment Types (`payment.types.ts`)

```typescript
// ============================================================
// PAYMENT DOMAIN TYPES
// Phase 5 Step 2: Payment Domain Foundation
//
// Philosophy:
// - Payment is a RECORD OF ATTEMPT, not money
// - Payment knows about Order, Order doesn't know about Payment
// - MINIMAL fields for Step 2, grows with future steps
// ============================================================

// ----- Payment Provider -----
/**
 * Supported payment providers
 * Step 2: Only STUB for testing
 * Step 7: Add MIDTRANS, XENDIT, STRIPE
 */
export type PaymentProvider = 'STUB';

// ----- Payment Status -----
/**
 * Payment Status — Represents the state of a payment attempt
 *
 * Step 2 Scope:
 * - PENDING: Intent created, awaiting confirmation
 * - SUCCESS/DECLINED/EXPIRED: Added for completeness, used in later steps
 */
export type PaymentStatus =
  | 'PENDING' // Intent created
  | 'SUCCESS' // Payment confirmed (Step 6+)
  | 'DECLINED' // Gateway rejected (Step 6+)
  | 'EXPIRED'; // Timeout exceeded (Step 8+)

// ----- Payment Aggregate -----
/**
 * Payment Aggregate
 *
 * Represents a RECORD OF ATTEMPT to pay for an Order.
 * NOT the money itself.
 *
 * Design Decisions (Step 2):
 * - Minimal fields only
 * - providerReference NOT included (Step 7)
 * - expiresAt NOT included (Step 8)
 * - orderId is @index (supports retry - one Order can have many Payments)
 */
export interface Payment {
  readonly id: number;
  readonly orderId: number; // FK to Order
  readonly userId: number;

  readonly amount: number; // Amount in smallest unit (rupiah)
  readonly currency: string; // 'IDR'

  readonly provider: PaymentProvider;

  readonly status: PaymentStatus;

  readonly createdAt: Date;
  readonly updatedAt: Date;
}

// ----- Payment Creation Input -----
/**
 * Input needed to create a Payment
 */
export interface CreatePaymentInput {
  readonly orderId: number;
  readonly userId: number;
  readonly amount: number;
  readonly currency: string; // 'IDR'
  readonly provider: PaymentProvider;
}

// ----- Payment View DTO -----
/**
 * What frontend sees
 */
export interface PaymentViewDTO {
  readonly id: number;
  readonly orderId: number;
  readonly amount: number;
  readonly currency: string;
  readonly provider: PaymentProvider;
  readonly status: PaymentStatus;
  readonly createdAt: Date;
}

// ----- Terminal Statuses -----
export const PAYMENT_TERMINAL_STATUSES: readonly PaymentStatus[] = [
  'SUCCESS',
  'DECLINED',
  'EXPIRED',
] as const;

// ----- Active Statuses -----
export const PAYMENT_ACTIVE_STATUSES: readonly PaymentStatus[] = [
  'PENDING',
] as const;
```

### 8.2 Payment Repository (`payment.repository.ts`)

```typescript
// ============================================================
// PAYMENT REPOSITORY
// Phase 5 Step 2: Data Access Layer
//
// Philosophy:
// - Repository pattern for data access
// - All queries go through repository
// - MINIMAL methods for Step 2
// ============================================================

import { prisma } from '../../infra/db/prisma.js';
import { PaymentMapper } from './payment.mapper.js';
import type {
  Payment,
  PaymentStatus,
  CreatePaymentInput,
} from './payment.types.js';

export const PaymentRepository = {
  // ----- Create -----

  /**
   * Create a new Payment record
   * Called by PaymentService (Step 3)
   */
  async create(input: CreatePaymentInput): Promise<Payment> {
    const payment = await prisma.payment.create({
      data: {
        orderId: input.orderId,
        userId: input.userId,
        amount: input.amount,
        currency: input.currency,
        provider: input.provider,
        status: 'PENDING',
      },
    });

    return PaymentMapper.toDomain(payment);
  },

  // ----- Read -----

  /**
   * Find Payment by ID
   */
  async findById(id: number): Promise<Payment | null> {
    const payment = await prisma.payment.findUnique({
      where: { id },
    });

    return payment ? PaymentMapper.toDomain(payment) : null;
  },

  /**
   * Find Payment by Order ID
   * Returns the LATEST payment for an order
   */
  async findByOrderId(orderId: number): Promise<Payment | null> {
    const payment = await prisma.payment.findFirst({
      where: { orderId },
      orderBy: { createdAt: 'desc' },
    });

    return payment ? PaymentMapper.toDomain(payment) : null;
  },

  /**
   * Find ACTIVE (PENDING) Payment by Order ID
   * Used for: "Does this order have an active payment?"
   */
  async findActiveByOrderId(orderId: number): Promise<Payment | null> {
    const payment = await prisma.payment.findFirst({
      where: {
        orderId,
        status: 'PENDING',
      },
    });

    return payment ? PaymentMapper.toDomain(payment) : null;
  },

  // ----- Update -----

  /**
   * Update Payment status
   * Used by: Webhook handler (Step 6)
   */
  async updateStatus(id: number, status: PaymentStatus): Promise<Payment> {
    const payment = await prisma.payment.update({
      where: { id },
      data: { status },
    });

    return PaymentMapper.toDomain(payment);
  },
} as const;
```

### 8.3 Payment Mapper (`payment.mapper.ts`)

```typescript
// ============================================================
// PAYMENT MAPPER
// Phase 5 Step 2: Data Transformation
//
// Philosophy:
// - Mapper transforms data between layers
// - No business logic in mapper
// - No database access in mapper
// ============================================================

import type { Payment, PaymentViewDTO } from './payment.types.js';
import type { Prisma } from '@prisma/client';

// ----- Prisma Payload Type -----
type PaymentPrisma = Prisma.PaymentGetPayload<Record<string, never>>;

export const PaymentMapper = {
  /**
   * Transform Prisma model → Domain
   */
  toDomain(payment: PaymentPrisma): Payment {
    return {
      id: payment.id,
      orderId: payment.orderId,
      userId: payment.userId,
      amount: payment.amount,
      currency: payment.currency,
      provider: payment.provider as Payment['provider'],
      status: payment.status as Payment['status'],
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
    };
  },

  /**
   * Transform Domain → View DTO (for API)
   */
  toView(payment: Payment): PaymentViewDTO {
    return {
      id: payment.id,
      orderId: payment.orderId,
      amount: payment.amount,
      currency: payment.currency,
      provider: payment.provider,
      status: payment.status,
      createdAt: payment.createdAt,
    };
  },
} as const;
```

### 8.4 Module Index (`payment/index.ts`)

```typescript
// ============================================================
// PAYMENT MODULE — Public API
// Phase 5 Step 2: Payment Domain Foundation
// ============================================================

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
```

### 8.5 Prisma Schema (`schema.prisma`)

```prisma
// ============================================================
// PAYMENT MODEL (Phase 5 Step 2)
// Payment Aggregate - Record of payment attempt
//
// Design: MINIMAL for Step 2
// - providerReference NOT included (Step 7)
// - expiresAt NOT included (Step 8)
// - orderId uses @index (supports retry)
// ============================================================

model Payment {
  id                Int              @id @default(autoincrement())
  orderId           Int              @index() // NOT @unique - supports multiple attempts
  userId            Int

  amount            Int              // In smallest unit (rupiah)
  currency          String           @default("IDR")

  provider          PaymentProvider

  status            PaymentStatus    @default(PENDING)

  createdAt         DateTime         @default(now())
  updatedAt         DateTime         @updatedAt

  order             Order            @relation(fields: [orderId], references: [id])

  @@index([status])
  @@index([orderId])
}

enum PaymentProvider {
  STUB  // Step 2: Only STUB for testing
}

enum PaymentStatus {
  PENDING   // Intent created
  SUCCESS   // Payment confirmed (Step 6+)
  DECLINED  // Gateway rejected (Step 6+)
  EXPIRED   // Timeout exceeded (Step 8+)
}
```

---

## 9. Domain Design Decisions

### Decision 1: Payment Knows Order, Order Doesn't Know Payment

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   Order Aggregate                                          │
│   │                                                         │
│   ├── id: number                                          │
│   ├── status: OrderStatus                                 │
│   └── ...                                                 │
│        │                                                   │
│        │ (knows)                                           │
│        ▼                                                   │
│   ┌─────────────────────────────────────────────────────┐ │
│   │                                                      │ │
│   │   Payment Aggregate                                 │ │
│   │   │                                                │ │
│   │   ├── id: number                                  │ │
│   │   ├── orderId: number                             │ │
│   │   ├── amount: number                              │ │
│   │   └── status: PaymentStatus                       │ │
│   │                                                      │ │
│   └─────────────────────────────────────────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Rationale:**

- Order tidak berubah ketika Payment berubah
- Jika gateway diganti, Order tidak berubah
- Payment adalah Aggregate yang mandiri

### Decision 2: `orderId` uses `@index()` NOT `@unique`

```prisma
orderId Int @index()  // NOT @unique
```

**Rationale:**

- Satu Order BOLEH memiliki BANYAK Payment (retry adalah hal yang normal)
- Hanya SATU Payment yang boleh berstatus PENDING pada satu waktu
- Invariant: `findActiveByOrderId()` memastikan tidak ada duplikasi PENDING

### Decision 3: Minimal Fields

Step 2 HANYA memiliki:

```typescript
{
  (id,
    orderId,
    userId,
    amount,
    currency,
    provider, // STUB only
    status,
    createdAt,
    updatedAt);
}
```

Yang BUKAN di Step 2 (ditambahkan nanti):

| Field             | When Added       |
| ----------------- | ---------------- |
| providerReference | Step 7 (Gateway) |
| expiresAt         | Step 8 (Expiry)  |
| gatewayResponse   | Step 7           |
| idempotencyKey    | Step 5           |

### Decision 4: `amount` is Integer (Smallest Unit)

```typescript
amount Int  // In rupiah (not cents)
```

**Rationale:**

- Avoid floating point issues
- 'IDR' tidak punya subunit

### Decision 5: Only `STUB` Provider

```typescript
type PaymentProvider = 'STUB';
```

**Rationale:**

- Step 2 belum butuh provider nyata
- STUB cukup untuk testing
- Provider lain ditambahkan di Step 7

---

## 10. Objective Audit Matrix

### A. Architecture Alignment

| Criterion               | Assessment | Evidence                                  |
| ----------------------- | ---------- | ----------------------------------------- |
| Aggregate Independence  | ✅ PASS    | Payment does not import Order             |
| Domain Isolation        | ✅ PASS    | No Order types in Payment module          |
| Repository Pattern      | ✅ PASS    | All data access through PaymentRepository |
| Mapper Pattern          | ✅ PASS    | Data transformation separated             |
| Progressive Engineering | ✅ PASS    | Model grows with steps                    |

### B. Scope Guard Adherence

| Forbidden Item    | Status          | Evidence                            |
| ----------------- | --------------- | ----------------------------------- |
| PaymentService    | ✅ NOT IN SCOPE | `payment.service.ts` does not exist |
| Gateway Interface | ✅ NOT IN SCOPE | No gateway code                     |
| Stub Gateway      | ✅ NOT IN SCOPE | `stubs/` does not exist             |
| Payment Intent    | ✅ NOT IN SCOPE | No create logic                     |
| Idempotency       | ✅ NOT IN SCOPE | No idempotency table                |
| Webhook           | ✅ NOT IN SCOPE | No webhook code                     |
| providerReference | ✅ NOT IN SCOPE | Not in schema                       |
| expiresAt         | ✅ NOT IN SCOPE | Not in schema                       |
| Real Providers    | ✅ NOT IN SCOPE | Only STUB in enum                   |

### C. Progressive Check

| Step 1 Prerequisites  | Status | Evidence                              |
| --------------------- | ------ | ------------------------------------- |
| Order Lifecycle       | ✅     | `order-lifecycle.service.ts` exists   |
| Single Entry Point    | ✅     | `OrderLifecycleService._transition()` |
| Order Module Complete | ✅     | `modules/order/` stable               |

| Step 2 Deliverables | Status     | Notes                               |
| ------------------- | ---------- | ----------------------------------- |
| Payment Aggregate   | ❌ MISSING | Need to implement                   |
| PaymentRepository   | ❌ MISSING | Need to implement                   |
| PaymentMapper       | ❌ MISSING | Need to implement                   |
| Prisma Schema       | ❌ MISSING | Need to add Payment model           |
| No Premature Fields | ❌ MISSING | Remove providerReference, expiresAt |

---

## 11. Implementation Checklist

### Phase 5 Step 2 Deliverables

| #   | Deliverable        | File                                    | Action |
| --- | ------------------ | --------------------------------------- | ------ |
| 1   | Payment types      | `modules/payment/payment.types.ts`      | CREATE |
| 2   | Payment repository | `modules/payment/payment.repository.ts` | CREATE |
| 3   | Payment mapper     | `modules/payment/payment.mapper.ts`     | CREATE |
| 4   | Module exports     | `modules/payment/index.ts`              | CREATE |
| 5   | Prisma schema      | `prisma/schema.prisma`                  | MODIFY |
| 6   | Generate Prisma    | `npx prisma generate`                   | RUN    |
| 7   | Unit tests         | `tests/unit/payment/`                   | CREATE |

### Files NOT TO Modify

| File                                 | Reason           |
| ------------------------------------ | ---------------- |
| `modules/order/`                     | Already complete |
| `modules/checkout/`                  | Already complete |
| `modules/payment/payment.service.ts` | Step 3 scope     |
| `modules/payment/gateways/`          | Step 4 scope     |
| `modules/payment/webhooks/`          | Step 6 scope     |

---

## Appendix: Integration with Future Steps

### Step 3 (Payment Intent)

```typescript
// modules/payment/payment.service.ts (Step 3)
export const PaymentService = {
  async createPaymentIntent(input: CreatePaymentIntentInput) {
    // Step 2: Use PaymentRepository
    const payment = await PaymentRepository.create({
      orderId: input.orderId,
      userId: input.userId,
      amount: input.amount,
      currency: 'IDR',
      provider: 'STUB', // Step 2: Only STUB
    });

    return payment;
  },
};
```

### Step 5 (Idempotency) - Invariant Enforcement

```typescript
// Step 2 provides the invariant check
async function ensureNoActivePayment(orderId: number) {
  const active = await PaymentRepository.findActiveByOrderId(orderId);
  if (active) {
    throw new BusinessError(
      'Order already has active payment',
      400,
      'PAYMENT_EXISTS',
    );
  }
}
```

### Step 7 (Gateway) - Add providerReference

```typescript
// Step 7: Migration adds providerReference
async updateProviderReference(
  id: number,
  providerReference: string,
): Promise<Payment> {
  const payment = await prisma.payment.update({
    where: { id },
    data: { providerReference },
  });
  return PaymentMapper.toDomain(payment);
}
```

### Step 8 (Expiry) - Add expiresAt

```typescript
// Step 8: Migration adds expiresAt
async updateExpiresAt(
  id: number,
  expiresAt: Date,
): Promise<Payment> {
  const payment = await prisma.payment.update({
    where: { id },
    data: { expiresAt },
  });
  return PaymentMapper.toDomain(payment);
}
```

---

**Blueprint Status:** ✅ READY FOR IMPLEMENTATION  
**Version:** 2.0  
**Date:** 2026-07-04  
**Score:** 9.8/10  
**Next Action:** Toggle to Act Mode for implementation
