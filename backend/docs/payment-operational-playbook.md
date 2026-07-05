# Payment Engine Operational Playbook

## Quick Reference

### Health Check

```bash
# System health (includes payment)
curl /admin/system/health

# Quick payment DB check
curl /admin/payments/health/quick
```

### Diagnostics

```bash
# Get all diagnostics
curl /admin/payments/diagnostics

# Get stuck payments only
curl /admin/payments/diagnostics/stuck

# Get metrics
curl /admin/payments/metrics?hours=24
```

### Manual Recovery

```bash
# Run recovery for specific payment
curl -X POST /admin/payments/recovery/manual \
  -d '{"paymentId": 123}'

# Run scheduled recovery batch
curl -X POST /admin/payments/recovery/batch \
  -d '{"batchSize": 100}'
```

---

## Common Issues

### Payment Stuck PENDING

**Symptoms:**

- Customer says payment was made but order not confirmed
- Order status still "WAITING_PAYMENT"

**Diagnosis Steps:**

1. Check if webhook was received:

   ```bash
   curl /admin/payments/diagnostics
   # Look at recentFailures.webhookErrors
   ```

2. Check stuck payments:

   ```bash
   curl /admin/payments/diagnostics/stuck
   # Look for the payment ID
   ```

3. Check gateway health:
   ```bash
   curl /admin/system/health
   # Look at gateway status
   ```

**Resolution:**

1. If webhook failed → Check webhook logs
2. If no webhook received → Run manual recovery:
   ```bash
   curl -X POST /admin/payments/recovery/manual \
     -d '{"paymentId": <id>}'
   ```
3. If gateway DOWN → Escalate to gateway team

---

### High Failure Rate

**Symptoms:**

- `metrics.successRate24h` < 95%
- `recentFailures.webhookErrors` > 5

**Diagnosis Steps:**

1. Check metrics:

   ```bash
   curl /admin/payments/metrics?hours=24
   ```

2. Check gateway health:

   ```bash
   curl /admin/system/health
   ```

3. Check recent failures:
   ```bash
   curl /admin/payments/diagnostics
   ```

**Resolution:**

1. If gateway DEGRADED → Wait and monitor
2. If gateway DOWN → Escalate to gateway team
3. If webhook errors → Check webhook service logs

---

### Recovery Not Working

**Symptoms:**

- Payments remain PENDING after manual recovery
- Recovery success rate < 80%

**Diagnosis Steps:**

1. Check recovery health:

   ```bash
   curl /admin/system/health
   # Look at recovery status
   ```

2. Check stuck payments count:

   ```bash
   curl /admin/payments/diagnostics
   # Look at stuckPayments.length
   ```

3. Check if payments have externalReference:
   - Payments without externalReference cannot be recovered

**Resolution:**

1. If > 10 stuck payments → Investigate gateway connectivity
2. If no externalReference → Payment was never sent to gateway

---

## Escalation Matrix

| Issue                   | Severity | Contact      | SLA     | Action                 |
| ----------------------- | -------- | ------------ | ------- | ---------------------- |
| Gateway DOWN            | P1       | Gateway Team | 15 min  | Escalate immediately   |
| Database DOWN           | P1       | DBA Team     | 15 min  | Escalate immediately   |
| Payment system DOWN     | P1       | Payment Team | 15 min  | All hands              |
| >10% failure rate       | P2       | Payment Team | 1 hour  | Monitor closely        |
| >10 stuck payments      | P2       | Payment Team | 1 hour  | Run manual recovery    |
| High latency (>60s avg) | P2       | Payment Team | 2 hours | Investigate            |
| Recovery rate <80%      | P3       | Payment Team | 4 hours | Schedule investigation |

---

## Log Analysis

### Finding a Payment

```bash
# Search logs by payment ID
grep "paymentId.*123" payment.log | jq

# Search by order ID
grep "orderId.*456" payment.log | jq
```

### Finding a Failure

```bash
# Search for webhook failures
grep "WEBHOOK_FAILED" payment.log | jq

# Search for recovery failures
grep "RECOVERY_FAILED" payment.log | jq
```

### Correlation ID

Every payment operation has a correlationId. Use it to trace across services:

```
correlationId: "req-abc-123"
```

---

## Recovery Window

Payments are eligible for recovery if:

- Status = PENDING
- Provider = MIDTRANS (or supported provider)
- Has externalReference
- Created within 24 hours

After 24 hours, payments are considered expired by the gateway and recovery is not possible.

---

## Health Status Definitions

| Status   | Meaning            | Action                    |
| -------- | ------------------ | ------------------------- |
| UP       | Healthy            | No action needed          |
| DEGRADED | Partially impaired | Monitor closely           |
| DOWN     | Not working        | Immediate action required |
| UNKNOWN  | Status unclear     | Investigate               |

---

## Metrics Definitions

| Metric                | Description                  | Healthy Range |
| --------------------- | ---------------------------- | ------------- |
| successRate24h        | % payments reaching SUCCESS  | > 95%         |
| avgConfirmationTimeMs | Avg time to confirm          | < 60,000ms    |
| webhookSuccessRate    | % webhooks processed         | > 99%         |
| recoverySuccessRate   | % recovery syncing correctly | > 80%         |
| pendingCount          | Current PENDING payments     | < 100         |

---

## Contact Information

### Payment Team

- On-call: See rotation schedule
- Slack: #payment-team
- Email: payment-team@pasaria.com

### Gateway Support (Midtrans)

- Dashboard: https://dashboard.midtrans.com
- Support: support@midtrans.com
- Status: https://status.midtrans.com

---

## Appendix: Payment Lifecycle

```
Customer initiates payment
         ↓
Payment Intent Created
         ↓
Gateway Charge Initiated
         ↓
Customer completes payment at gateway
         ↓
Gateway sends Webhook
         ↓
Webhook Processed
         ↓
Payment Confirmed
         ↓
Order Updated to PAID
```

If any step fails:

- Webhook timeout → Recovery Engine syncs
- Gateway error → Retry with backoff
- Database error → Manual intervention required
