# Phase 5 Architecture Decision Records Summary

**Phase:** Phase 5 Payment Engine  
**Date:** 2026-07-06  
**Status:** Complete

---

## ADR-001: Database-based Idempotency

**Date:** 2025-07-01

**Decision:** Use database unique constraint for idempotency

**Context:**
Payment operations must be idempotent to prevent double-charging. We needed a mechanism that could reliably detect and reject duplicate requests.

**Alternatives Considered:**

- Redis-based idempotency: Fast but requires additional infrastructure
- In-memory idempotency: Not durable across restarts
- UUID-based: Doesn't prevent duplicates

**Decision:**
Use PostgreSQL unique constraint on `idempotencyKey` column in `IdempotencyRecord` table.

**Consequence:**

- Strong consistency with database ACID properties
- Single source of truth for idempotency state
- Works across restarts and distributed systems
- Idempotency window cleanup via scheduled job

**Status:** ✅ Implemented

---

## ADR-002: Gateway as Source of Truth

**Date:** 2025-07-02

**Decision:** Gateway status is authoritative, not local database

**Context:**
Payment status must reflect the actual state at the payment gateway. Local database can become stale if webhooks fail or arrive out of order.

**Alternatives Considered:**

- Local database as truth: Can diverge from gateway
- Optimistic updates: Risk of inconsistency

**Decision:**
Payment gateway status is always authoritative. Recovery engine syncs database with gateway state.

**Consequence:**

- Recovery engine can confidently update local state
- Database always reflects gateway truth
- Webhook failures don't cause permanent inconsistency
- Recovery is a synchronization, not a correction

**Status:** ✅ Implemented

---

## ADR-003: Recovery Uses PaymentConfirmationService

**Date:** 2025-07-03

**Decision:** Recovery delegates to ConfirmationService, not direct repository calls

**Context:**
Recovery must not introduce its own business logic. All payment state changes should flow through the same service.

**Alternatives Considered:**

- Recovery has its own business logic: Duplicates confirmation rules
- Recovery calls repository directly: Bypasses validation

**Decision:**
`PaymentRecoveryService` calls `PaymentConfirmationService.synchronizeStatus()` instead of directly modifying payment state.

**Consequence:**

- Single confirmation flow (Webhook, Recovery, Manual all use same service)
- Business rules are centralized
- Recovery is a coordinator, not a rule enforcer
- Adding new rules doesn't require updating recovery

**Status:** ✅ Implemented

---

## ADR-004: Passive Gateway Health Indicators

**Date:** 2025-07-05

**Decision:** Use last successful communication as health indicator, not active probing

**Context:**
Health checks should be cheap and fast. Active probing of payment gateway could hit rate limits and create unnecessary load.

**Alternatives Considered:**

- Active probing: Creates load, hits rate limits
- Status page API: External dependency, may not be available

**Decision:**
Gateway health is determined by passive indicators:

- `lastWebhookReceived`: Last successful webhook
- `lastRecoverySuccess`: Last successful recovery
- `lastChargeSuccess`: Last successful charge

**Consequence:**

- No active gateway calls during health checks
- Health check is fast and cheap
- Status reflects actual communication history
- DEGRADED/DOWN based on staleness thresholds

**Status:** ✅ Implemented

---

## ADR-005: Contributor Pattern for Health

**Date:** 2025-07-05

**Decision:** Health is a contributor, not a standalone endpoint owned by Payment

**Context:**
System-wide health should aggregate all modules. Each module should contribute its health status.

**Alternatives Considered:**

- Payment owns `/health` endpoint: Fragile, couples health to payment module
- Each module owns its own endpoint: Proliferation of health endpoints

**Decision:**
`PaymentHealthContributor` implements a contributor interface. System health service aggregates all contributors.

**Consequence:**

- Extensible: Order, Inventory can add their own contributors
- System health is the aggregation point
- Payment health is composable
- Future-proof for microservices architecture

**Status:** ✅ Implemented

---

## ADR-006: Shared Logger Infrastructure

**Date:** 2025-07-05

**Decision:** Single logger infrastructure with domain-specific formatters

**Context:**
Observability requires consistent logging across all modules. But each domain has its own events.

**Alternatives Considered:**

- Per-module loggers (PaymentLogger, OrderLogger): Fragmented, inconsistent
- Global logger with no domain context: Missing business context

**Decision:**

- Shared `logger` infrastructure
- Domain-specific event enums (PaymentEvent, OrderEvent)
- Standardized log format (JSON with timestamp, correlationId)

**Consequence:**

- Consistent cross-module observability
- Each domain defines its own events
- Shared formatting ensures consistency
- Easy to filter logs by domain or event type

**Status:** ✅ Implemented

---

## ADR-007: Diagnostics Orchestrates Metrics

**Date:** 2025-07-05

**Decision:** Diagnostics uses MetricsService, doesn't compute its own metrics

**Context:**
Both Diagnostics and Metrics provide operational data. We needed clear separation of concerns.

**Alternatives Considered:**

- Diagnostics computes own metrics: Duplication, inconsistent definitions
- Metrics is orchestration: Violates single responsibility

**Decision:**

- `PaymentMetricsService`: Pure computation of metrics
- `PaymentDiagnosticsService`: Orchestrates queries and uses MetricsService

**Consequence:**

- Single source of truth for metrics computation
- Diagnostics is a view layer, not a computation layer
- Metrics can be used independently
- DRY principle maintained

**Status:** ✅ Implemented

---

## ADR-008: PaymentConfirmationSource Tracking

**Date:** 2025-07-05

**Decision:** Track source of payment confirmation for audit trail

**Context:**
Payment can be confirmed via webhook, recovery, or manual intervention. Audit trail should know which source triggered confirmation.

**Alternatives Considered:**

- Don't track source: Can't distinguish confirmation paths
- Separate services per source: Duplication

**Decision:**
`PaymentConfirmationSource` enum tracks WEBHOOK, RECOVERY, MANUAL sources.

**Consequence:**

- Audit trail knows exact confirmation path
- Timeline shows: "Payment Confirmed via RECOVERY"
- Easier debugging of confirmation issues
- Source-agnostic business logic maintained

**Status:** ✅ Implemented

---

## Summary Table

| ADR     | Decision                       | Rationale                | Status |
| ------- | ------------------------------ | ------------------------ | ------ |
| ADR-001 | Database Idempotency           | Strong consistency       | ✅     |
| ADR-002 | Gateway Source of Truth        | Recovery confidence      | ✅     |
| ADR-003 | Recovery → ConfirmationService | Single flow              | ✅     |
| ADR-004 | Passive Health Indicators      | No rate limits           | ✅     |
| ADR-005 | Contributor Pattern            | Extensible health        | ✅     |
| ADR-006 | Shared Logger                  | Cross-module consistency | ✅     |
| ADR-007 | Diagnostics Orchestrates       | DRY metrics              | ✅     |
| ADR-008 | Source Tracking                | Audit trail              | ✅     |

---

## Future ADRs (Phase 6+)

When the following are implemented, new ADRs should be created:

- **ADR-009:** Refund flow (how refunds interact with payments)
- **ADR-010:** Dispute/Chargeback handling
- **ADR-011:** Settlement reconciliation approach
- **ADR-012:** Accounting ledger integration

---

## Notes

This ADR summary is for documentation purposes. Engineers should read individual step implementation reports for detailed context.
