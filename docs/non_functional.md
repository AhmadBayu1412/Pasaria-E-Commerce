<!-- Tamhahan yg sering dilupakan -->

1. SLO

   Homepage:
   <300ms

   Checkout:
   - <800ms>
   - P95 latency
   - Backup
   - RTO
   - RPO

   contoh checkout:
   P95 API:
   <500ms

   Backup:
   daily

   RTO:
   1 jam

   RPO:
   15 menit

   Availability:
   99.5%

   ***
   2. Constraints

   Cart TTL:
   7 hari

   Payment timeout:
   15 menit

   Rate limit:
   100 req/min

   Order:
   immutable

   ***
   3. Security
      JWT expiry:
      15 min

   Refresh:
   7 hari

   ***

   Tambahkan
   - Logging:
     Pino
   - Monitoring:
     Sentry
   - Metrics:
     Prometheus
