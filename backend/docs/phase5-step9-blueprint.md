# Phase 5 — Step 9

# Payment Operational Readiness & Production Validation

---

# Executive Summary

Step 9 bukan tentang menambah fitur payment.

Melainkan memastikan bahwa seluruh fondasi yang sudah dibangun dari Step 1-8 bisa di-deploy dan dioperasikan di production dengan confidence.

**v2 Improvements:** Gateway health check menggunakan passive indicators, Diagnostics orchestrates MetricsService, shared logger infrastructure.

---

# Kenapa Step 9 Bukan Fitur Baru?

Jika kita lihat perjalanan Phase 5:

```text
Step 1:  Order Lifecycle
Step 2:  Payment Aggregate
Step 3:  Payment Intent
Step 4:  Gateway Abstraction
Step 5:  Idempotency
Step 6:  Webhook
Step 7:  Gateway Integration
Step 8:  Recovery Engine
Step 9:  Operational Readiness
Step 10: Final Validation
```

Fondasi payment engine sudah selesai di Step 8.

Step 9 menjawab pertanyaan:

> "Kalau seluruh Payment Engine ini di-deploy besok pagi ke production, apa saja yang masih kurang agar engineer bisa mengoperasikan, memonitor, dan mendiagnosis sistemnya?"

---

# Scope Guard Step 9

## Boleh masuk ✅

- Health contributors (not standalone endpoints)
- Diagnostics queries
- Metrics aggregation
- Structured logging standardization
- Test helpers
- End-to-end flow verification
- Failure scenario testing
- Documentation/Playbook
- Readiness Report

## Tidak Boleh Masuk ❌

- Refund logic
- Chargeback handling
- Settlement reports
- Accounting/Ledger
- Dashboard UI
- Alerting system

---

# Architecture Overview

```text
┌─────────────────────────────────────────────────────────┐
│                  Payment Engine (Step 1-8)              │
│  PaymentIntent → Gateway → Webhook → Recovery          │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│              Step 9: Operational Readiness              │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────┐  │
│  │   Health    │  │  Diagnostic  │  │   Metrics   │  │
│  │   Check     │  │    Query     │  │  Aggregate  │  │
│  └─────────────┘  └──────────────┘  └─────────────┘  │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────┐  │
│  │  Structured │  │     E2E      │  │   Failure   │  │
│  │   Logging   │  │   Verify     │  │  Scenario   │  │
│  └─────────────┘  └──────────────┘  └─────────────┘  │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                   Step 10: Final Validation             │
│              Sign-off untuk Production Deploy           │
└─────────────────────────────────────────────────────────┘
```

---

# Component: Payment Health Check

## Masalah yang Diresahkan

Engineer tidak tahu apakah payment engine sehat atau tidak.

Tanpa health check:

```text
User: "Payment tidak bisa"

CS: "Ada error?"

Engineer: "Kita harus cek satu-satu"
```

Dengan health check:

```text
GET /admin/payments/health

{
  status: "UP",
  components: {
    database: "UP",
    gateway: "DOWN",
    webhook: "UP",
    recovery: "UP"
  },
  timestamp: "2026-07-05T21:00:00Z"
}
```

## Interface Design

```typescript
// modules/payment/health/payment-health.types.ts

enum HealthStatus {
  UP = 'UP',
  DEGRADED = 'DEGRADED',
  DOWN = 'DOWN',
}

interface ComponentHealth {
  name: string;
  status: HealthStatus;
  latencyMs?: number;
  error?: string;
  lastChecked: Date;
}

interface PaymentHealthResult {
  overall: HealthStatus;
  components: ComponentHealth[];
  timestamp: Date;
  version: string;
}
```

## Function Signature

```typescript
// modules/payment/health/payment-health.service.ts

/**
 * Check overall payment engine health
 *
 * @returns PaymentHealthResult with all component statuses
 */
async function checkPaymentHealth(): Promise<PaymentHealthResult> {
  const components = await Promise.all([
    checkDatabaseHealth(),
    checkGatewayHealth(),
    checkWebhookHealth(),
    checkRecoveryHealth(),
  ]);

  return aggregateHealth(components);
}

async function checkGatewayHealth(): Promise<ComponentHealth> {
  // Test actual gateway connectivity
  // Not just ping - try a real operation
}

async function checkDatabaseHealth(): Promise<ComponentHealth> {
  // Check Prisma connection
  // Check payment table accessibility
}

async function checkWebhookHealth(): Promise<ComponentHealth> {
  // Check webhook event table
  // Check recent event processing rate
}

async function checkRecoveryHealth(): Promise<ComponentHealth> {
  // Check recovery job status
  // Check for stuck recovery candidates
}
```

---

# Component: Operational Diagnostics

## Masalah yang Diresahkan

Payment stuck di PENDING.

Tanpa diagnostics:

```text
CS: "Payment customer ABC masih pending"

Engineer: "Bisa coba cek database?
           SELECT * FROM payments
           WHERE status = 'PENDING'
           AND created_at < NOW() - INTERVAL '1 hour'"

CS: ???
```

Dengan diagnostics:

```text
GET /admin/payments/diagnostics

{
  stuckPayments: [
    {
      paymentId: 123,
      orderId: 456,
      amount: 150000,
      provider: "MIDTRANS",
      createdAt: "2026-07-05T19:00:00Z",
      ageHours: 4.5,
      hasExternalRef: true,
      hasSnapToken: true
    }
  ],
  recentFailures: {
    webhookErrors: 3,
    recoveryFailures: 1,
    gatewayErrors: 0
  },
  metrics: {
    successRate24h: 98.5,
    avgConfirmationTimeMs: 45000
  }
}
```

## Interface Design

```typescript
// modules/payment/diagnostics/payment-diagnostics.types.ts

interface StuckPayment {
  paymentId: number;
  orderId: number;
  amount: number;
  provider: string;
  createdAt: Date;
  ageHours: number;
  hasExternalRef: boolean;
  hasSnapToken: boolean;
  recoveryCandidate: boolean;
}

interface RecentFailures {
  webhookErrors: number;
  recoveryFailures: number;
  gatewayErrors: number;
  failedWebhooks: Array<{
    transactionId: string;
    failedAt: Date;
    error: string;
  }>;
}

interface PaymentDiagnostics {
  stuckPayments: StuckPayment[];
  recentFailures: RecentFailures;
  metrics: {
    successRate24h: number;
    avgConfirmationTimeMs: number;
    pendingCount: number;
    todayPaymentCount: number;
  };
}
```

## Function Signature

```typescript
// modules/payment/diagnostics/payment-diagnostics.service.ts

/**
 * Get operational diagnostics for payment engine
 *
 * Used by: Operations team, CS, monitoring systems
 *
 * @param options - Filter options (stuck threshold hours, etc)
 * @returns PaymentDiagnostics with current state
 */
async function getPaymentDiagnostics(options?: {
  stuckThresholdHours?: number;
  limit?: number;
}): Promise<PaymentDiagnostics>;
```

---

# Component: Structured Logging

## Masalah yang Diresahkan

Log tersebar dan tidak konsisten.

Contoh log yang ada sekarang:

```javascript
// Di berbagai tempat
console.log('Payment confirmed');
console.error('[ERROR] Gateway timeout');
console.log({ event: 'RECOVERY', payment: 123 });
console.log('Webhook received for txn: ' + txnId);
```

Dengan structured logging:

```json
{
  "event": "PAYMENT_CONFIRMED",
  "paymentId": 123,
  "orderId": 456,
  "provider": "MIDTRANS",
  "source": "WEBHOOK",
  "duration": 45,
  "status": "SUCCESS",
  "timestamp": "2026-07-05T21:00:00Z",
  "correlationId": "req-abc-123"
}
```

## Interface Design

```typescript
// modules/payment/logging/payment-logger.ts

enum PaymentEvent {
  PAYMENT_INTENT_CREATED = 'PAYMENT_INTENT_CREATED',
  GATEWAY_CHARGE_INITIATED = 'GATEWAY_CHARGE_INITIATED',
  GATEWAY_CHARGE_SUCCESS = 'GATEWAY_CHARGE_SUCCESS',
  GATEWAY_CHARGE_FAILED = 'GATEWAY_CHARGE_FAILED',
  WEBHOOK_RECEIVED = 'WEBHOOK_RECEIVED',
  WEBHOOK_PROCESSED = 'WEBHOOK_PROCESSED',
  WEBHOOK_FAILED = 'WEBHOOK_FAILED',
  PAYMENT_CONFIRMED = 'PAYMENT_CONFIRMED',
  PAYMENT_DECLINED = 'PAYMENT_DECLINED',
  PAYMENT_EXPIRED = 'PAYMENT_EXPIRED',
  RECOVERY_STARTED = 'RECOVERY_STARTED',
  RECOVERY_COMPLETED = 'RECOVERY_COMPLETED',
  RECOVERY_FAILED = 'RECOVERY_FAILED',
}

interface PaymentLogContext {
  paymentId?: number;
  orderId?: number;
  provider?: string;
  source?: string;
  duration?: number;
  error?: string;
  correlationId?: string;
}

function logPaymentEvent(
  event: PaymentEvent,
  context?: PaymentLogContext,
): void {
  // Consistent format
  console.log(
    JSON.stringify({
      event,
      ...context,
      timestamp: new Date().toISOString(),
    }),
  );
}
```

## Usage Pattern

```typescript
// Before (scattered)
console.log('Payment confirmed');

// After (structured)
logPaymentEvent(PaymentEvent.PAYMENT_CONFIRMED, {
  paymentId: payment.id,
  orderId: payment.orderId,
  provider: payment.provider,
  source: 'WEBHOOK',
  duration: 45,
});
```

---

# Component: Metrics Aggregation

## Masalah yang Diresahkan

Tidak ada visibility ke metrics payment.

Dengan metrics:

```typescript
interface PaymentMetrics {
  // Volume
  totalPaymentsToday: number;
  totalAmountToday: number;

  // Success Rate
  successRate24h: number;
  declineRate24h: number;
  expireRate24h: number;

  // Latency
  avgConfirmationTimeMs: number;
  p95ConfirmationTimeMs: number;

  // Health
  webhookSuccessRate: number;
  recoverySuccessRate: number;
  gatewayAvailability: number;

  // Funnel
  intentToConfirmationRate: number;
}
```

## Function Signature

```typescript
// modules/payment/metrics/payment-metrics.service.ts

/**
 * Aggregate payment metrics for dashboards and alerting
 *
 * @param window - Time window for metrics (default: 24h)
 * @returns PaymentMetrics
 */
async function getPaymentMetrics(
  window: { hours?: number } = { hours: 24 },
): Promise<PaymentMetrics>;
```

---

# Component: End-to-End Flow Verification

## Masalah yang Diresahkan

Tidak ada cara untuk verify bahwa seluruh flow работает.

Tanpa E2E test:

```text
Engineer: "Saya yakin Step 4-8 sudah terintegrasi"

Manager: "Bagaimana kalau ada bug yang baru ketemu di production?"
```

Dengan E2E verification:

```typescript
// tests/e2e/payment/payment-flow-verification.test.ts

describe('Payment Flow E2E Verification', () => {
  it('should complete full payment lifecycle', async () => {
    // 1. Create payment intent
    const intent = await PaymentIntentService.createPaymentIntent({...});

    // 2. Initiate charge
    const charge = await GatewayChargeService.initiateCharge({...});

    // 3. Simulate webhook
    const webhook = await WebhookService.processWebhook({...});

    // 4. Verify order updated
    const order = await OrderRepository.findById(intent.orderId);
    expect(order.status).toBe('PAID');

    // 5. Cleanup
    await cleanupTestPayment(intent.paymentId);
  });

  it('should recover stuck payment via recovery engine', async () => {
    // 1. Create and leave payment in PENDING
    const payment = await createStuckPayment();

    // 2. Run recovery
    const result = await PaymentRecoveryService.recoverPayment({...});

    // 3. Verify status synced
    expect(result.outcome).not.toBe('FAILED');
  });
});
```

---

# Component: Failure Scenario Testing

## Scenario Matrix

| Scenario              | Expected Behavior                        | Test |
| --------------------- | ---------------------------------------- | ---- |
| Webhook timeout       | Recovery kicks in                        | ✅   |
| Duplicate webhook     | Idempotency prevents double confirmation | ✅   |
| Gateway error         | Proper error mapping, no double charge   | ✅   |
| Payment stuck PENDING | Manual recovery works                    | ✅   |
| Gateway DOWN          | Health check reports DEGRADED            | ✅   |
| Database DOWN         | Health check reports DOWN                | ✅   |

## Test Pattern

```typescript
// tests/unit/payment/resilience/failure-scenarios.test.ts

describe('Failure Scenarios', () => {
  describe('Webhook Timeout', () => {
    it('should allow recovery to sync status after webhook timeout', async () => {
      // Setup: Payment created, webhook failed
      const payment = await createPayment();

      // Simulate webhook failure
      await WebhookService.processWebhook({...}); // throws

      // Verify recovery can still sync
      const result = await PaymentRecoveryService.recoverPayment({...});
      expect(result.outcome).toBe('CHANGED');
    });
  });

  describe('Idempotency', () => {
    it('should not double-confirm on duplicate webhook', async () => {
      // First webhook
      await WebhookService.processWebhook(payload);

      // Duplicate webhook
      await WebhookService.processWebhook(payload);

      // Order should only be marked PAID once
      const order = await OrderRepository.findById(orderId);
      expect(order.status).toBe('PAID');
    });
  });
});
```

---

# Component: Operational Playbook

## Document Structure

````markdown
# Payment Engine Operational Playbook

## Quick Commands

### Check Payment Health

```bash
curl /admin/payments/health
```
````

### Get Stuck Payments

```bash
curl /admin/payments/diagnostics/stuck
```

### Run Manual Recovery

```bash
node scripts/recovery/manual-recovery.js --payment-id=123
```

### View Recent Failures

```bash
curl /admin/payments/diagnostics/failures
```

## Common Issues

### Payment Stuck PENDING

1. Check diagnostics: `/admin/payments/diagnostics`
2. If webhook failed: Check webhook logs
3. If no webhook received: Run manual recovery
4. If gateway DOWN: Escalate to gateway team

### High Failure Rate

1. Check gateway health
2. Check recent webhook errors
3. Review payment logs with correlation ID
4. Escalate if pattern matches known issue

## Escalation Matrix

| Issue              | Severity | Contact      | SLA    |
| ------------------ | -------- | ------------ | ------ |
| Gateway DOWN       | P1       | Gateway Team | 15 min |
| Database DOWN      | P1       | DBA Team     | 15 min |
| >5% failure rate   | P2       | Payment Team | 1 hour |
| Stuck payments >10 | P2       | Payment Team | 1 hour |

</```

---

# File Layout

```text
modules/payment/
│
├── health/
│   ├── payment-health.service.ts
│   ├── payment-health.types.ts
│   ├── health-checks/
│   │   ├── database.health.ts
│   │   ├── gateway.health.ts
│   │   ├── webhook.health.ts
│   │   └── recovery.health.ts
│   └── payment-health.controller.ts
│
├── diagnostics/
│   ├── payment-diagnostics.service.ts
│   ├── payment-diagnostics.types.ts
│   ├── queries/
│   │   ├── stuck-payments.query.ts
│   │   ├── recent-failures.query.ts
│   │   └── metrics.query.ts
│   └── payment-diagnostics.controller.ts
│
├── logging/
│   ├── payment-logger.ts
│   ├── payment-logger.types.ts
│   └── payment-events.ts
│
├── metrics/
│   ├── payment-metrics.service.ts
│   └── payment-metrics.types.ts
│
├── e2e/
│   └── payment-flow-verification.test.ts
│
└── resilience/
    └── failure-scenarios.test.ts

docs/
└── payment-operational-playbook.md
```

---

# Invariants Step 9

## Invariant 1

```text
Health Check

never

blocks payment operations.
```

Health check adalah read-only operation. Tidak boleh mengubah state.

## Invariant 2

```text
Diagnostics

never

modifies payment state.
```

Hanya membaca data. Modification harus lewat recovery atau manual intervention.

## Invariant 3

```text
Metrics

never

introduce business logic.
```

Metrics adalah agregasi dari data yang ada, bukan tempat untuk implement rules.

## Invariant 4

```text
E2E tests

never

run against production.
```

E2E tests hanya untuk staging atau CI environment.

---

# Deliverables Step 9

## Konsep yang Dipelajari

- Health Check Pattern
- Structured Logging
- Metrics Aggregation
- Diagnostics Query
- E2E Verification
- Failure Scenario Testing
- Operational Documentation

## Deliverables

### Health Check

- `PaymentHealthService` - component health aggregation
- `GET /admin/payments/health` endpoint
- Database, Gateway, Webhook, Recovery health checks

### Diagnostics

- `PaymentDiagnosticsService` - stuck payment queries
- `GET /admin/payments/diagnostics` endpoint
- Recent failure tracking

### Logging

- `PaymentLogger` - structured logging utility
- `PaymentEvent` enum - consistent event types
- Log standardization across modules

### Metrics

- `PaymentMetricsService` - metrics aggregation
- Success rate, latency, volume metrics
- 24h window aggregation

### Testing

- E2E payment flow verification
- Failure scenario tests
- Integration with existing unit tests

### Documentation

- Operational Playbook (markdown)
- Quick commands reference
- Escalation matrix

---

# Yang Tidak Masuk Step 9

- Alerting system (Phase 6+)
- Dashboard UI (Phase 6+)
- Real-time streaming metrics
- Grafana/Prometheus integration
- Alert rules configuration

---

# Objective Audit Matrix

## 1. Architecture Alignment

| Criteria                      | Assessment                                            | Pass/Fail |
| ----------------------------- | ----------------------------------------------------- | --------- |
| Tidak mengubah domain model   | Health check hanya baca, tidak ubah state             | ✅ PASS   |
| Tidak menambah business logic | Metrics adalah agregasi, bukan rules                  | ✅ PASS   |
| Koherensi dengan Step 1-8     | Operational layer untuk engine yang sudah ada         | ✅ PASS   |
| Separation of concerns        | Health, Diagnostics, Logging, Metrics berdiri sendiri | ✅ PASS   |

**STATUS: PASS**

## 2. Scope Guard Adherence

| Criteria             | Assessment                            | Pass/Fail |
| -------------------- | ------------------------------------- | --------- |
| Tidak ada Refund     | Refund adalah Phase 6+                | ✅ PASS   |
| Tidak ada Chargeback | Chargeback adalah Phase 6+            | ✅ PASS   |
| Tidak ada Settlement | Settlement adalah Phase 6+            | ✅ PASS   |
| Tidak ada Dashboard  | Dashboard adalah Phase 6+             | ✅ PASS   |
| Operational saja     | Health, Diagnostics, Metrics, Logging | ✅ PASS   |

**STATUS: PASS**

## 3. Progressive Check

| Criteria                     | Assessment                                              | Pass/Fail |
| ---------------------------- | ------------------------------------------------------- | --------- |
| Membangun di atas Step 1-8   | Tidak menduplikasi, hanya menyediakan layer operasional | ✅ PASS   |
| Memperkuat observability     | Menyediakan visibility untuk production                 | ✅ PASS   |
| Persiapan untuk Step 10      | Final validation离不开 operational data                 | ✅ PASS   |
| Tidak premature optimization | Fokus pada kebutuhan actual production                  | ✅ PASS   |

**STATUS: PASS**

---

# Overall Status

| Aspect                 | Value   |
| ---------------------- | ------- |
| Architecture Alignment | ✅ PASS |
| Scope Guard Adherence  | ✅ PASS |
| Progressive Check      | ✅ PASS |

**STATUS: READY TO CODE**

---

# Next: Step 10

Step 10 adalah **Final Validation** - penutup Phase 5 yang memastikan seluruh fondasi payment engine sudah siap untuk production sign-off.
