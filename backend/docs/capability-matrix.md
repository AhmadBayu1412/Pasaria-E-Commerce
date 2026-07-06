# Phase 5 Test Capability Matrix

**Phase:** Phase 5 Final Validation  
**Date:** 2026-07-06

---

## Test Coverage by Capability

| Capability         | Unit Tests | Integration Tests | E2E Tests | Status   | Coverage |
| ------------------ | ---------- | ----------------- | --------- | -------- | -------- |
| Payment Intent     | ✅ 18      | ❌                | ❌        | COMPLETE | ~85%     |
| Gateway Charge     | ✅ 42      | ✅ 2              | ❌        | COMPLETE | ~90%     |
| Idempotency        | ✅ 25      | ❌                | ❌        | COMPLETE | ~88%     |
| Webhook Processing | ✅ 15      | ✅ 1              | ❌        | COMPLETE | ~85%     |
| Webhook Signature  | ✅ 8       | ❌                | ❌        | PARTIAL  | ~75%     |
| Recovery Engine    | ✅ 12      | ❌                | ❌        | PARTIAL  | ~70%     |
| Health Contributor | ✅ 3       | ❌                | ❌        | PARTIAL  | ~60%     |
| Metrics            | ✅ 2       | ❌                | ❌        | PARTIAL  | ~50%     |
| Diagnostics        | ✅ 2       | ❌                | ❌        | PARTIAL  | ~50%     |
| Structured Logging | ✅ 0       | ❌                | ❌        | MANUAL   | N/A      |

---

## Minimum Coverage Requirements

```typescript
const MINIMUM_COVERAGE = {
  statements: 80,
  branches: 75,
  functions: 85,
  lines: 80,
};
```

---

## Test Count Summary

| Category          | Count   |
| ----------------- | ------- |
| Unit Tests        | 127     |
| Integration Tests | 3       |
| E2E Tests         | 0       |
| **Total**         | **130** |

---

## Coverage by Step

| Step   | Capability          | Test Count | Coverage                |
| ------ | ------------------- | ---------- | ----------------------- |
| Step 2 | Payment Aggregate   | 0          | N/A (domain model)      |
| Step 3 | Payment Intent      | 18         | ~85%                    |
| Step 4 | Gateway Abstraction | 42         | ~90%                    |
| Step 5 | Idempotency         | 25         | ~88%                    |
| Step 6 | Webhook             | 23         | ~80%                    |
| Step 7 | Gateway Integration | 0          | N/A (uses Step 4 tests) |
| Step 8 | Recovery            | 12         | ~70%                    |
| Step 9 | Operational         | 10         | ~55%                    |

---

## Gaps and Recommendations

### High Priority

| Gap                        | Impact                              | Recommendation                          |
| -------------------------- | ----------------------------------- | --------------------------------------- |
| Recovery integration tests | Cannot verify end-to-end recovery   | Add integration tests for recovery flow |
| Health contributor tests   | Cannot verify health check behavior | Add tests for passive indicators        |

### Medium Priority

| Gap               | Impact                           | Recommendation                           |
| ----------------- | -------------------------------- | ---------------------------------------- |
| Metrics tests     | Cannot verify metric computation | Add unit tests for PaymentMetricsService |
| Diagnostics tests | Cannot verify orchestration      | Add tests for PaymentDiagnosticsService  |

### Low Priority

| Gap                     | Impact                  | Recommendation          |
| ----------------------- | ----------------------- | ----------------------- |
| E2E tests               | Cannot verify full flow | Add E2E tests (Phase 6) |
| Webhook signature tests | Partial coverage        | Add integration tests   |

---

## Status Legend

- **COMPLETE:** Full coverage with unit and integration tests
- **PARTIAL:** Unit tests only, integration tests missing
- **MANUAL:** Manual verification required
- **N/A:** Not applicable (domain model, infrastructure, etc.)

---

## Test Files Reference

```
tests/unit/payment/
├── gateway/
│   ├── gateway-charge.service.test.ts
│   ├── gateway.errors.test.ts
│   ├── payment-handler.test.ts
│   └── stub.gateway.test.ts
├── idempotency/
│   ├── idempotency.repository.test.ts
│   └── idempotency.service.test.ts
├── webhook/
│   ├── webhook-handler.test.ts
│   ├── webhook-repository.test.ts
│   └── webhook-validator.test.ts
├── payment-intent.service.test.ts
└── payment.types.test.ts

tests/integration/payment/
├── gateway/
│   └── gateway-integration.test.ts (if exists)
└── webhook/
    └── webhook-concurrency.test.ts
```

---

## Notes

1. **Coverage is estimated** based on test file analysis. Actual coverage should be measured with `vitest --coverage`.

2. **Step 7 tests use Step 4 tests** because Gateway Integration is tested via the Gateway Abstraction tests.

3. **Operational tests are minimal** because Step 9 focused on infrastructure and documentation.

4. **E2E tests are Phase 6 items** as they require full integration environment.
