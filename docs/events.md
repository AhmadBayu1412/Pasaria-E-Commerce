<!-- Tujuan: mendefinisikan apa yang terjadi di sistem -->

# EVENTS

OrderPlaced
-> reserve stock
-> create payment

PaymentCompleted
-> confirm order
-> reduce stock

PaymentFailed
-> release stock

OrderCancelled
-> release stock

GuestConverted
-> merge cart

Tambahan:

- Trigger
- Producer
- Consumer
- Retry
- PaymentExpired
- InventoryLow
- OrderConfirmed
- OrderExpired
- PaymentTimeout
- GuestCheckoutCompleted

| Event            | Trigger  | Producer  | Consumer  | Retry |
| ---------------- | -------- | --------- | --------- | ----- |
| OrderPlaced      | checkout | Order     | Inventory | no    |
| PaymentCompleted | webhook  | Payment   | Order     | yes   |
| StockReleased    | cancel   | Inventory | Cart      | no    |
