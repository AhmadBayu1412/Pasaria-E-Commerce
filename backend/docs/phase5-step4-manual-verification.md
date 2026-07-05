# Phase 5 — Step 4: Manual Verification Steps

---

## Prerequisites

1. Backend server running: `npm run dev`
2. Database accessible
3. No real payment credentials needed (uses StubGateway)

---

## API Endpoint Setup

Since Step 4 doesn't include a controller yet, we'll use a temporary test endpoint or direct service invocation.

### Option A: Temporary Test Route (Recommended)

Add this to `app.ts` or create a test file:

```typescript
// POST /test/payment/initiate
// Body: { orderId: number, userId: number, amount: number }
```

### Option B: Direct Service Test

Use a simple script to call the services directly.

---

## Test Scenarios

### Scenario 1: Happy Path — Successful Payment Initiation

**Objective**: Verify full payment flow with StubGateway

**Steps**:
```bash
# 1. Create an order (via existing checkout flow)
POST /checkout
{
  "items": [
    { "productId": 1, "quantity": 2 }
  ]
}
# Response: { "orderId": 123, "status": "DRAFT" }

# 2. Initiate payment
POST /test/payment/initiate
{
  "orderId": 123,
  "userId": 1,
  "amount": 200000
}
```

**Expected Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "paymentId": 1,
    "orderId": 123,
    "redirectUrl": "https://stub-gateway.pasaria.test/pay/STUB_xxx_1",
    "gatewayTransactionId": "STUB_123456789_1"
  }
}
```

**Database Verification**:
```sql
-- Payment record created
SELECT * FROM "Payment" WHERE "orderId" = 123;

-- Order status changed
SELECT status FROM "Order" WHERE id = 123;
-- Expected: WAITING_PAYMENT
```

**Success Criteria**:
- [ ] Payment record exists with status PENDING
- [ ] Order status changed to WAITING_PAYMENT
- [ ] redirectUrl is returned
- [ ] gatewayTransactionId follows pattern `STUB_{timestamp}_{paymentId}`

---

### Scenario 2: Error — Gateway Failure

**Objective**: Verify error handling when gateway fails

**Steps**:
```bash
# Configure environment
PAYMENT_GATEWAY_SIMULATE_FAILURE=true

# Or use test endpoint with failure flag
POST /test/payment/initiate
{
  "orderId": 124,
  "userId": 1,
  "amount": 100000,
  "simulateFailure": true
}
```

**Expected Response** (502 Bad Gateway):
```json
{
  "success": false,
  "error": {
    "code": "GATEWAY_ERROR",
    "message": "Payment gateway error: PROVIDER_ERROR - StubGateway: Simulated failure"
  }
}
```

**Database Verification**:
```sql
-- Payment should be rolled back or marked failed
SELECT status FROM "Payment" WHERE "orderId" = 124;
-- Expected: Either no record OR status indicates failure
```

**Success Criteria**:
- [ ] Returns 502 status code
- [ ] Error code is GATEWAY_ERROR
- [ ] Error message includes provider error type
- [ ] Payment record handled appropriately

---

### Scenario 3: Error — Network/Timeout

**Objective**: Verify timeout handling

**Steps**:
```bash
# Configure long delay
PAYMENT_GATEWAY_DELAY_MS=10000

# Initiate payment
POST /test/payment/initiate
{
  "orderId": 125,
  "userId": 1,
  "amount": 50000
}
```

**Expected Response** (502 Bad Gateway):
```json
{
  "success": false,
  "error": {
    "code": "GATEWAY_ERROR",
    "message": "Payment gateway error: TIMEOUT_ERROR - Request timed out"
  }
}
```

**Success Criteria**:
- [ ] Returns 502 after timeout
- [ ] Error code is GATEWAY_ERROR
- [ ] Error type is TIMEOUT_ERROR

---

### Scenario 4: Domain Validation — Unauthorized Order

**Objective**: Verify ownership validation still works

**Steps**:
```bash
# User 2 trying to pay User 1's order
POST /test/payment/initiate
{
  "orderId": 123,
  "userId": 2,  /* Wrong user */
  "amount": 200000
}
```

**Expected Response** (403 Forbidden):
```json
{
  "success": false,
  "error": {
    "code": "ORDER_NOT_OWNED",
    "message": "User does not own this order"
  }
}
```

**Success Criteria**:
- [ ] Returns 403 status code
- [ ] Error code is ORDER_NOT_OWNED
- [ ] No Payment record created

---

### Scenario 5: Domain Validation — Order Not Payable

**Objective**: Verify order status validation

**Steps**:
```sql
-- Manually set order to terminal status
UPDATE "Order" SET status = 'COMPLETED' WHERE id = 126;
```

```bash
POST /test/payment/initiate
{
  "orderId": 126,
  "userId": 1,
  "amount": 100000
}
```

**Expected Response** (400 Bad Request):
```json
{
  "success": false,
  "error": {
    "code": "ORDER_TERMINAL",
    "message": "Order cannot be paid — status is terminal: COMPLETED"
  }
}
```

**Success Criteria**:
- [ ] Returns 400 status code
- [ ] Error code is ORDER_TERMINAL
- [ ] Clear error message

---

### Scenario 6: Domain Validation — Duplicate Payment

**Objective**: Verify no duplicate payments allowed

**Steps**:
```bash
# First payment
POST /test/payment/initiate
{
  "orderId": 127,
  "userId": 1,
  "amount": 75000
}
# Success

# Second payment attempt
POST /test/payment/initiate
{
  "orderId": 127,
  "userId": 1,
  "amount": 75000
}
```

**Expected Response** (400 Bad Request):
```json
{
  "success": false,
  "error": {
    "code": "PAYMENT_EXISTS",
    "message": "Order already has active payment (ID: X)"
  }
}
```

**Success Criteria**:
- [ ] Returns 400 status code
- [ ] Error code is PAYMENT_EXISTS
- [ ] Only one Payment record exists for order

---

### Scenario 7: DI Verification — StubGateway

**Objective**: Verify StubGateway is used by default

**Steps**:
```bash
# Default environment
echo $PAYMENT_PROVIDER
# (should be empty or "stub")

POST /test/payment/initiate
{
  "orderId": 128,
  "userId": 1,
  "amount": 50000
}
```

**Expected**:
- [ ] Uses StubGateway (check logs)
- [ ] redirectUrl contains `stub-gateway.pasaria.test`

---

### Scenario 8: Architecture — Layer Separation

**Objective**: Verify domain doesn't know about gateway

**Steps**:
```typescript
// Test that PaymentIntentService can work standalone
const intent = await PaymentIntentService.createPaymentIntent(input);

// Verify no gateway call made (check logs/metrics)
```

**Expected**:
- [ ] PaymentIntentService returns without calling gateway
- [ ] Payment record created
- [ ] status = READY_FOR_GATEWAY

**Code Verification**:
```typescript
// PaymentIntentService should NOT have:
// - import of PaymentGateway
// - import of GatewayFactory
// - createCharge() call
```

---

## Checklist Summary

### Pre-Flight Check
- [ ] TypeScript compiles without errors
- [ ] All 43 unit tests pass
- [ ] Backend server starts
- [ ] Database accessible

### Happy Path
- [ ] Full payment flow works
- [ ] Payment record created correctly
- [ ] Order status updated
- [ ] redirectUrl returned

### Error Handling
- [ ] Gateway failure handled gracefully
- [ ] Timeout handled gracefully
- [ ] Correct HTTP status codes
- [ ] Meaningful error messages

### Domain Rules
- [ ] Ownership validation works
- [ ] Order status validation works
- [ ] Duplicate payment prevention works

### Architecture
- [ ] Domain/Integration separation
- [ ] StubGateway works standalone
- [ ] No hardcoded provider references in domain

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PAYMENT_PROVIDER` | `stub` | Gateway provider: stub, midtrans, xendit, stripe |
| `PAYMENT_GATEWAY_DELAY_MS` | `0` | Simulated delay for StubGateway |
| `PAYMENT_GATEWAY_SIMULATE_FAILURE` | `false` | Simulate failure for testing |

---

## Debugging

### Enable Gateway Logging
```typescript
// In StubGateway, add logging
console.log('[StubGateway] Creating charge:', request);
console.log('[StubGateway] Result:', result);
```

### Check Gateway Factory
```typescript
// Verify which gateway is used
const gateway = GatewayFactory.create();
console.log('[Factory] Using:', gateway.constructor.name);
```
