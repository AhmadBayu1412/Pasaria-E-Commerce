<!-- Tujuan: trarnslate domain -> database -->

User

---

id UUID PK
email UNIQUE

## PRODUCT

id UUID PK
name
price

## INVENTORY

- product_id FK
- stock
- reserved_stock
- version
- CartItem
- OrderItem
- timestamps

## CART

user_id FK

## ORDER

- id UUID PK
- user_id FK
- status
- subtotal
- shipping_fee
- tax
- grand_total
- created_at

## PAYMENT

order_id FK

Tambahkan:
Indexes:

- product.slug
- user.email
- order.status
