# Payment Engine Production Deployment Checklist

**Phase:** Phase 5 Final Validation  
**Date:** 2026-07-06  
**Status:** Ready for Production

---

## Pre-Deployment Checklist

### Infrastructure ✅

```
[ ] Database migration applied
    - npx prisma migrate deploy
    - Verify all tables created
    - Verify all indexes created

[ ] Database connection pool configured
    - max connections: 20 (adjust for load)
    - connection timeout: 30s
    - idle timeout: 10s

[ ] Redis connection configured
    - Host and port configured
    - Password set (if required)
    - Max memory configured

[ ] Queue connection configured
    - BullMQ connection established
    - Redis backend verified
```

### Gateway Configuration ✅

```
[ ] Midtrans Server Key configured
    - Production key set
    - Sandbox key removed

[ ] Midtrans Client Key configured
    - Production key set
    - Sandbox key removed

[ ] Webhook URL registered at Midtrans
    - https://api.pasaria.com/webhook/midtrans
    - Verified in Midtrans Dashboard

[ ] Webhook Signature verified
    - Server key configured
    - Signature validation active

[ ] Sandbox mode disabled
    - Production mode enabled
    - Test transactions disabled
```

### Security ✅

```
[ ] Webhook secret configured
    - Environment variable set
    - Not committed to git

[ ] Idempotency window set correctly
    - 24-hour window configured
    - Cleanup job scheduled

[ ] Payment amount validation active
    - Server-side validation enabled
    - Client cannot override amount

[ ] Order ownership check active
    - User must own order to initiate payment
    - Authorization middleware active
```

### Recovery Configuration ✅

```
[ ] Recovery scheduler configured
    - Cron job: every 15 minutes
    - Or BullMQ scheduled job

[ ] Recovery window (24h) set
    - Only recover payments < 24h old
    - Older payments auto-expire

[ ] Batch size (100) configured
    - Balance between throughput and rate limits
    - Adjustable per gateway

[ ] Manual recovery endpoint secured
    - Requires admin authentication
    - Rate limited
    - Audit logged
```

### Operational ✅

```
[ ] Health check endpoint active
    - GET /health
    - GET /health/db

[ ] Metrics endpoint active
    - GET /admin/payments/metrics

[ ] Diagnostics endpoint active
    - GET /admin/payments/diagnostics

[ ] Structured logging configured
    - JSON format enabled
    - Level filtering active
    - Correlation ID enabled

[ ] Log aggregation configured
    - ELK Stack OR CloudWatch
    - Retention policy set
    - Alert thresholds configured
```

---

## Deployment Verification

### Smoke Tests ✅

```
[ ] Health check returns UP
    - curl /health

[ ] Database query works
    - curl /health/db

[ ] Gateway connectivity
    - Manual test charge

[ ] Webhook reception
    - Test webhook from gateway

[ ] Recovery job runs
    - Manual trigger test
```

---

## Post-Deployment Checklist

### Monitoring ✅

```
[ ] Payment success rate > 95%
    - Check metrics dashboard

[ ] Average confirmation time < 60s
    - Check metrics dashboard

[ ] Webhook success rate > 99%
    - Check metrics dashboard

[ ] Recovery success rate > 80%
    - Check metrics dashboard

[ ] No stuck payments
    - Check diagnostics
```

### Rollback Plan ✅

```
[ ] Previous version tagged
    - git tag -a v5.x.x

[ ] Database rollback script ready
    - prisma migrate reset (if needed)

[ ] Feature flag for payments
    - Disable payments if critical issue

[ ] Communication plan
    - CS team notified
    - Status page updated
```

---

## Sign-off

| Role             | Name | Date | Signature |
| ---------------- | ---- | ---- | --------- |
| Engineering Lead |      |      |           |
| Product Owner    |      |      |           |
| DevOps           |      |      |           |
| QA               |      |      |           |

---

## Notes

_Add deployment notes here._

---

## Version History

| Version | Date       | Changes           | Author       |
| ------- | ---------- | ----------------- | ------------ |
| 1.0     | 2026-07-06 | Initial checklist | Phase 5 Team |
