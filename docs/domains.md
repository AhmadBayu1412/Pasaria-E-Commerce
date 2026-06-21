<!-- Tujuan: Menentukan objek bisnis dan relasi -->

# DOMAIN MODEL

---

## User

Tujuan:
Pengguna aplikasi.

Fields:

- id
- email
- password_hash
- role
- created_at

Rules:

- Email unik
- Guest boleh convert jadi User

Relationship:
User
├── hasMany Ordrs
├── hasOne Cart

---

## Product

Tujuan:
Barang yang dijual.

Fields:

- id
- slug
- name
- description
- price
- active
- created_at
- updated_at
- deleted_at (nullable)

Rules:

- Harga ≥ 0

relationship:
Product
└── hasOne Inventory

---

## Inventory

Fields:

- id
- product_id
- stock
- reserved_stock

Rules:

- stock ≥ reserved_stock

---

## Cart

Fields:

- id
- user_id
- expires_at

## CartItem

- id
- cart_id
- product_id
- quantity
- snapshot_price

Rules:

- TTL 7 hari

---

## Order

Fields:

- id
- user id
- status
- total

## OrderItem

- product_id
- quantity
- snapshot_price

Rules:

- Immutable setelah confirmed

Status:
PENDING
PAID
CANCELLED
EXPIRED

---

## Payment

Fields:

- id
- order_id
- method
- status

Rules:

- Idempotent request
