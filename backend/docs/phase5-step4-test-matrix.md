# Phase 5 — Step 4: Automated Test Matrix

> **Tool**: Vitest + TypeScript
> **Command**: `npm run test:run`

---

## 1. Test Coverage Summary

| Layer | File | Tests | Status |
|-------|------|-------|--------|
| Errors | `gateway.errors.test.ts` | 11 | ✅ PASS |
| Stub | `stub.gateway.test.ts` | 12 | ✅ PASS |
| Service | `gateway-charge.service.test.ts` | 12 | ✅ PASS |
| Handler | `payment-handler.test.ts` | 8 | ✅ PASS |
| **TOTAL** | **4 files** | **43 tests** | **✅ PASS** |

---

## 2. Test Matrix by Category

### 2.1 Unit Tests — Gateway Errors

| ID | Test Case | Expected | Priority |
|----|-----------|----------|----------|
| E-01 | Constructor with all properties | Error has correct type, retryable, originalError | HIGH |
| E-02 | Constructor without options | originalError undefined | LOW |
| E-03 | networkError factory | type=NETWORK_ERROR, retryable=true | HIGH |
| E-04 | timeoutError factory | type=TIMEOUT_ERROR, retryable=true | HIGH |
| E-05 | authError factory | type=AUTH_ERROR, retryable=false | HIGH |
| E-06 | invalidRequest factory | type=INVALID_REQUEST, retryable=false | HIGH |
| E-07 | providerError factory | type=PROVIDER_ERROR, retryable=true | HIGH |
| E-08 | All 5 error types covered | All types instantiate correctly | MEDIUM |
| E-09 | instanceof Error | PaymentGatewayError is Error | MEDIUM |
| E-10 | instanceof PaymentGatewayError | Correct class check | MEDIUM |

### 2.2 Unit Tests — StubGateway

| ID | Test Case | Expected | Priority |
|----|-----------|----------|----------|
| S-01 | Default success | chargeStatus=CREATED, valid transactionId | HIGH |
| S-02 | Unique transaction IDs | Two calls generate different IDs | HIGH |
| S-03 | Request without returnUrl | Works without optional field | MEDIUM |
| S-04 | shouldSucceed=false | Throws PaymentGatewayError | HIGH |
| S-05 | Error type PROVIDER_ERROR | Error.type = 'PROVIDER_ERROR' | HIGH |
| S-06 | Error message contains StubGateway | Debug info in message | LOW |
| S-07 | Default delay=0 | No delay by default | MEDIUM |
| S-08 | Configurable delay 100ms | Delay occurs | MEDIUM |
| S-09 | Delay with shouldSucceed=false | Delay then error | MEDIUM |
| S-10 | Metadata includes paymentId | Correct mapping | HIGH |
| S-11 | Metadata includes orderId | Correct mapping | HIGH |

### 2.3 Unit Tests — GatewayChargeService

| ID | Test Case | Expected | Priority |
|----|-----------|----------|----------|
| G-01 | Happy path | Returns ChargeInitiatedResult | HIGH |
| G-02 | Correct request to gateway | All fields mapped | HIGH |
| G-03 | Gateway PaymentGatewayError | Maps to BusinessError 502 | HIGH |
| G-04 | AUTH_ERROR → 500 | Correct status code | HIGH |
| G-05 | NETWORK_ERROR → 502 | Correct status code | HIGH |
| G-06 | TIMEOUT_ERROR → 502 | Correct status code | HIGH |
| G-07 | INVALID_REQUEST → 400 | Correct status code | HIGH |
| G-08 | Unknown error | Wraps as GATEWAY_ERROR 502 | MEDIUM |
| G-09 | chargeStatus=FAILED | Throws BusinessError 502 | HIGH |
| G-10 | null redirectUrl | Returns null in result | MEDIUM |

### 2.4 Unit Tests — PaymentHandler

| ID | Test Case | Expected | Priority |
|----|-----------|----------|----------|
| H-01 | Full flow | PaymentIntent + Charge result | HIGH |
| H-02 | Calls PaymentIntentService first | Correct order | HIGH |
| H-03 | Gateway called with correct params | All fields mapped | HIGH |
| H-04 | Gateway error propagation | BusinessError 502 | HIGH |
| H-05 | null redirectUrl handling | Returns empty string | MEDIUM |
| H-06 | initiateChargeOnly | Works without PaymentIntent | MEDIUM |
| H-07 | initiateChargeOnly without returnUrl | Optional handled | MEDIUM |

---

## 3. Integration Test Scenarios (Future Step 5+)

These will be implemented when database and full integration is available:

| ID | Scenario | Precondition | Expected |
|----|----------|--------------|----------|
| INT-01 | Full payment flow | Clean DB, valid order | Payment record + redirect URL |
| INT-02 | Gateway failure | Gateway returns error | Rollback payment, return 502 |
| INT-03 | Duplicate payment | Payment already exists | Reject with PAYMENT_EXISTS |
| INT-04 | Unauthorized order | Wrong userId | Reject with 403 |

---

## 4. Test Execution Commands

```bash
# Run all gateway tests
npm run test:run -- tests/unit/payment/gateway/

# Run specific test file
npx vitest run tests/unit/payment/gateway/stub.gateway.test.ts

# Run with coverage
npm run test:coverage -- --include="tests/unit/payment/gateway/**"
```

---

## 5. Test Data Fixtures

### Valid Request Fixture
```typescript
const validChargeRequest = {
  paymentId: 1,
  orderId: 100,
  amount: 100000,
  currency: 'IDR',
  returnUrl: 'https://example.com/return',
};
```

### StubGateway Configs
```typescript
// Fast success
new StubGateway({ shouldSucceed: true, simulatedDelayMs: 0 });

// Slow success
new StubGateway({ shouldSucceed: true, simulatedDelayMs: 500 });

// Fast failure
new StubGateway({ shouldSucceed: false });

// Slow failure
new StubGateway({ shouldSucceed: false, simulatedDelayMs: 200 });
```
