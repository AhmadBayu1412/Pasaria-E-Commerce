# Payment State Machine

**Document Version:** 1.0  
**Last Updated:** 2026-07-05  
**Phase:** Phase 5 Step 6

---

## Overview

This document defines the explicit state machine for payment lifecycle management. The state machine ensures:

1. **Consistency** - Order state is always synchronized with Payment state
2. **Immutability** - Terminal states cannot transition back to active states
3. **Auditability** - Every transition is recorded in the timeline

---

## Payment States

```typescript
enum PaymentStatus {
  PENDING = 'PENDING',     // Awaiting payment confirmation
  SUCCESS = 'SUCCESS',     // Payment confirmed successfully
  FAILED = 'FAILED',       // Payment failed
  CANCELLED = 'CANCELLED', // Payment cancelled (expired or user-cancelled)
  EXPIRED = 'EXPIRED',     // Payment window expired
  DECLINED = 'DECLINED',   // Payment declined by gateway
}
```

### State Classification

| State | Type | Description |
|-------|------|-------------|
| `PENDING` | **Active** | Payment is in progress, awaiting confirmation |
| `SUCCESS` | **Terminal** | Payment confirmed, order should proceed |
| `FAILED` | **Terminal** | Payment failed, order should be cancelled |
| `CANCELLED` | **Terminal** | Payment cancelled, order should be cancelled |
| `EXPIRED` | **Terminal** | Payment window expired, order should be cancelled |
| `DECLINED` | **Terminal** | Payment declined by gateway, order should be cancelled |

---

## State Transition Diagram

```
                    ┌─────────────────────────────────────────────────────────────┐
                    │                                                             │
                    │                    PENDING                                  │
                    │            (Awaiting Confirmation)                        │
                    │                                                             │
                    │   ○────────○────────○────────○────────○                    │
                    │   │        │        │        │        │                    │
                    │   │        │        │        │        │                    │
                    │   │        │        │        │        │                    │
                    │   │   ┌────┴────────┴────────┴────────┴────┐               │
                    │   │   │                                     │               │
                    │   │   │                                     │               │
                    │   │   ▼                                     ▼               │
                    │   │   ○─────────────────┐       ┌─────────────────○         │
                    │   │   │                 │       │                 │         │
                    │   │   │    SUCCESS      │       │     FAILED      │         │
                    │   │   │   (Terminal)    │       │    (Terminal)   │         │
                    │   │   │                 │       │                 │         │
                    │   │   │                 │       │                 │         │
                    │   │   │                 │       │                 │         │
                    │   │   └─────────────────┘       └─────────────────┘         │
                    │   │                                     │                   │
                    │   │                                     │                   │
                    │   │   ┌─────────────────┐       ┌─────────────────┐         │
                    │   │   │                 │       │                 │         │
                    │   │   │   CANCELLED     │       │    EXPIRED      │         │
                    │   │   │   (Terminal)   │       │   (Terminal)    │         │
                    │   │   │                 │       │                 │         │
                    │   │   └─────────────────┘       └─────────────────┘         │
                    │   │                                     │                   │
                    │   │                                     │                   │
                    │   │   ┌─────────────────┐               │                   │
                    │   │   │                 │               │                   │
                    │   │   │    DECLINED     │◄──────────────┘                   │
                    │   │   │   (Terminal)   │   (Gateway Decline)              │
                    │   │   │                 │                                 │
                    │   │   └─────────────────┘                                 │
                    │                                                             │
                    └─────────────────────────────────────────────────────────────┘
```

---

## Valid Transitions

### From PENDING

| Target State | Trigger Event | Order Action | Description |
|--------------|---------------|--------------|-------------|
| `SUCCESS` | `PAYMENT_SETTLEMENT` | → `PAID` | Payment confirmed by gateway |
| `SUCCESS` | `PAYMENT_SUCCESS` | → `PAID` | Payment successful (alt event) |
| `FAILED` | `PAYMENT_DENY` | → `CANCELLED` | Payment denied |
| `FAILED` | `PAYMENT_FAILURE` | → `CANCELLED` | Payment failed |
| `CANCELLED` | `PAYMENT_CANCEL` | → `CANCELLED` | User cancelled |
| `EXPIRED` | `PAYMENT_EXPIRE` | → `CANCELLED` | Payment window expired |
| `DECLINED` | `PAYMENT_DENY` | → `CANCELLED` | Gateway declined |

### Terminal States

Once a payment enters a terminal state (`SUCCESS`, `FAILED`, `CANCELLED`, `EXPIRED`, `DECLINED`):

- **NO outbound transitions allowed**
- Payment can never return to `PENDING`
- This prevents race conditions where a failed payment "comes back to life"

---

## Order State Synchronization

The following invariant is enforced atomically:

> **When Payment → Terminal State, Order → Corresponding State**

| Payment Status | Order Status | Description |
|----------------|--------------|-------------|
| `PENDING` | `WAITING_PAYMENT` | Order awaiting payment |
| `SUCCESS` | `PAID` | Payment confirmed, ready for fulfillment |
| `FAILED` | `CANCELLED` | Payment failed, order cancelled |
| `CANCELLED` | `CANCELLED` | Order cancelled |
| `EXPIRED` | `CANCELLED` | Order cancelled (expired) |
| `DECLINED` | `CANCELLED` | Order cancelled (declined) |

---

## Invariants

### INVARIANT 1: One Gateway Transaction → One Confirmation

Each `gatewayTransactionId` can only trigger **ONE** successful confirmation.

```
Gateway sends: txn_123, status=success (x3)
                              │
                              ▼
Payment state: PENDING → SUCCESS
Timeline entries: 1 (exactly)
```

**Why?** Prevents duplicate fulfillment if gateway retries webhook.

### INVARIANT 2: Terminal States are Immutable

Terminal states cannot transition to any other state.

```
Payment state: SUCCESS → cannot go back to PENDING
Payment state: FAILED → cannot go back to PENDING
Payment state: CANCELLED → cannot go back to PENDING
Payment state: EXPIRED → cannot go back to PENDING
Payment state: DECLINED → cannot go back to PENDING
```

**Why?** Prevents race conditions and ensures data consistency.

### INVARIANT 3: Amount Validation Before Confirmation

Gateway amount must match stored payment amount.

```
Stored payment: 100000 IDR
Gateway amount:  50000 IDR → REJECT (potential fraud)
Gateway amount: 100000 IDR → ACCEPT
```

**Why?** Prevents amount manipulation in transit.

### INVARIANT 4: Order Sync is Atomic

Order state change is atomic with payment state change.

```typescript
await prisma.$transaction(async (tx) => {
  await tx.payment.update({ status: 'SUCCESS' });    // Step 1
  await tx.order.update({ status: 'PAID' });        // Step 2
  await tx.orderTimeline.create({ ... });           // Step 3
});
```

**Why?** Ensures Payment → Order state is always consistent.

### INVARIANT 5: Duplicate Events are Idempotent

Duplicate webhook events return the same result without side effects.

```
Event 1 (first):  Payment → SUCCESS, Timeline created
Event 2 (dup):    Return same result, no new timeline
Event 3 (dup):    Return same result, no new timeline
```

**Why?** Gateway may retry webhooks; idempotency prevents duplicate processing.

---

## Event Type Mapping

### STUB Gateway

| Gateway Status | Internal Event Type | Target Payment Status |
|---------------|---------------------|----------------------|
| `success` | `PAYMENT_SETTLEMENT` | `SUCCESS` |
| `pending` | `PAYMENT_PENDING` | (no transition) |
| `expired` | `PAYMENT_EXPIRE` | `EXPIRED` |
| `failed` | `PAYMENT_DENY` | `FAILED` |

### Future: Midtrans

| Midtrans Status | Internal Event Type | Target Payment Status |
|----------------|---------------------|----------------------|
| `settlement` | `PAYMENT_SETTLEMENT` | `SUCCESS` |
| `pending` | `PAYMENT_PENDING` | (no transition) |
| `expire` | `PAYMENT_EXPIRE` | `EXPIRED` |
| `deny` | `PAYMENT_DENY` | `DECLINED` |
| `cancel` | `PAYMENT_CANCEL` | `CANCELLED` |
| `failure` | `PAYMENT_FAILURE` | `FAILED` |

### Future: Xendit

| Xendit Status | Internal Event Type | Target Payment Status |
|---------------|---------------------|----------------------|
| `PAID` | `PAYMENT_SETTLEMENT` | `SUCCESS` |
| `PENDING` | `PAYMENT_PENDING` | (no transition) |
| `EXPIRED` | `PAYMENT_EXPIRE` | `EXPIRED` |
| `FAILED` | `PAYMENT_FAILURE` | `FAILED` |

---

## Implementation Notes

### Database Constraints

```sql
-- Payment table has gatewayTransactionId for exact matching
ALTER TABLE payment ADD UNIQUE (gatewayTransactionId);

-- WebhookEvent table deduplicates by gateway transaction
ALTER TABLE webhook_event ADD UNIQUE (gatewayTransactionId);
```

### Transaction Isolation

All state transitions use `SERIALIZABLE` or `READ COMMITTED` isolation to prevent race conditions.

### Audit Trail

Every state transition creates a timeline entry:

```typescript
await tx.orderTimeline.create({
  data: {
    orderId: order.id,
    event: 'PAYMENT_CONFIRMED',
    metadata: {
      paymentId: payment.id,
      gatewayTransactionId: txnId,
      previousStatus: 'PENDING',
      newStatus: 'SUCCESS',
    },
  },
});
```

---

## TODO: Recovery Job

For failed webhook processing (200 OK returned, but internal error occurred):

1. **Scheduled Job**: Run every 5 minutes
2. **Query**: `SELECT * FROM webhook_event WHERE status = 'FAILED'`
3. **Action**: Retry processing or alert ops team
4. **Dead Letter**: After N retries, move to dead letter queue

---

*Document maintained by: Backend Team*
*Next review: Before Phase 6 gateway integration*
