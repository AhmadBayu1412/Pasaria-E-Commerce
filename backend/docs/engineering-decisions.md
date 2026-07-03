# Engineering Decision Log

## Overview

Dokumen ini mencatat semua keputusan arsitektur yang dibuat selama pengembangan proyek Pasaria E-commerce. Setiap keputusan mencakup konteks, alternatif yang dipertimbangkan, dan alasan di balik keputusan yang diambil.

---

## Phase 4 - Step 2: Add To Cart

### Decision 1: HTTP 200 OK untuk Add To Cart

| Field | Value |
|-------|-------|
| **Decision** | Gunakan HTTP 200 OK untuk response POST /cart/items |
| **Alternatives Considered** | HTTP 201 Created |
| **Rationale** | Endpoint tidak selalu membuat resource baru (kadang hanya increment quantity). HTTP 201 sebaiknya digunakan ketika benar-benar membuat resource baru. Karena Add To Cart bisa berupa CREATE atau INCREMENT, HTTP 200 lebih tepat. |
| **Status** | ✅ Applied |
| **Date** | 2026-07-03 |

### Decision 2: Prisma Transaction untuk Konsistensi

| Field | Value |
|-------|-------|
| **Decision** | Gunakan Prisma transaction untuk seluruh operasi Add To Cart |
| **Alternatives Considered** | Individual queries tanpa transaction |
| **Rationale** | Tujuan utama transaction bukan untuk performance, tetapi untuk **konsistensi data**. Create Cart + Create CartItem harus menjadi satu unit pekerjaan. Jika salah satu gagal, seluruh perubahan harus dibatalkan. |
| **Status** | ✅ Applied |
| **Date** | 2026-07-03 |

### Decision 3: Lazy Cart Creation

| Field | Value |
|-------|-------|
| **Decision** | Cart dibuat saat Add To Cart pertama kali, bukan saat User register |
| **Alternatives Considered** | Cart dibuat saat User register |
| **Rationale** | Mayoritas user tidak pernah berbelanja. Membuat Cart saat register akan mengisi database dengan Cart kosong. Lazy creation lebih realistis dan efisien. |
| **Status** | ✅ Applied (Step 1) |
| **Date** | 2026-07-03 |

### Decision 4: Increment Quantity (Bukan Duplicate Error)

| Field | Value |
|-------|-------|
| **Decision** | Jika product sudah ada di cart, increment quantity |
| **Alternatives Considered** | Reject dengan error DUPLICATE_PRODUCT |
| **Rationale** | Mental model user: "Add to Cart" berarti "tambahkan satu lagi". User tidak Expect error ketika menambahkan product yang sama dua kali. |
| **Status** | ✅ Applied |
| **Date** | 2026-07-03 |

### Decision 5: Tidak Ada Price Snapshot di Cart

| Field | Value |
|-------|-------|
| **Decision** | Cart tidak menyimpan snapshot harga product |
| **Alternatives Considered** | Simpan price saat item ditambahkan ke cart |
| **Rationale** | Snapshot harga adalah tanggung jawab Order Draft, bukan Cart. Harga bisa berubah sewaktu-waktu dan final price ditentukan saat checkout. |
| **Status** | ✅ Applied (Step 1) |
| **Date** | 2026-07-03 |

### Decision 6: Hapus DUPLICATE_PRODUCT Error

| Field | Value |
|-------|-------|
| **Decision** | Hapus error DUPLICATE_PRODUCT dari CartRules |
| **Alternatives Considered** | Pertahankan error untuk API update quantity |
| **Rationale** | Error DUPLICATE_PRODUCT tidak pernah triggered karena perilaku Add To Cart adalah increment. Error ini lebih tepat untuk operasi update, bukan add. |
| **Status** | ✅ Applied |
| **Date** | 2026-07-03 |

### Decision 7: Action `CREATED`/`INCREMENTED` Internal Only

| Field | Value |
|-------|-------|
| **Decision** | Tidak expose `action` ke API public response |
| **Alternatives Considered** | Expose action ke frontend |
| **Rationale** | Frontend tidak perlu tahu apakah operasi adalah CREATE atau INCREMENT. Frontend cukup render state terbaru. Action berguna untuk logging/debugging internal saja. |
| **Status** | ✅ Applied |
| **Date** | 2026-07-03 |

---

## Phase 4 - Step 1: Cart Foundation

### Decision 8: Aggregate Root Pattern

| Field | Value |
|-------|-------|
| **Decision** | Cart adalah Aggregate Root, CartItem adalah child entity |
| **Alternatives Considered** | CartItem sebagai independent entity |
| **Rationale** | Semua perubahan terhadap CartItem harus melewati Cart. Ini menjaga invariant aggregate (quantity >= 1, unique product per cart, dll). |
| **Status** | ✅ Applied |
| **Date** | 2026-07-03 |

### Decision 9: CartRules adalah Business Validation, Bukan Data Access

| Field | Value |
|-------|-------|
| **Decision** | CartRules hanya berisi validasi, data access di Service |
| **Alternatives Considered** | CartRules berisi query dan validasi |
| **Rationale** | Separation of concerns. Rules dibaca seperti bahasa bisnis (`assertQuantityValid`). Service orchestrates data access. Ini lebih dekat dengan DDD principles. |
| **Status** | ✅ Applied |
| **Date** | 2026-07-03 |

### Decision 10: BUSINESS_LIMITS Configuration

| Field | Value |
|-------|-------|
| **Decision** | Konstanta bisnis di single config file |
| **Alternatives Considered** | Hardcode di berbagai tempat |
| **Rationale** | Jika batas bisnis berubah (misal MAX_QUANTITY dari 99 jadi 50), cukup ubah satu tempat. Single source of truth. |
| **Status** | ✅ Applied |
| **Date** | 2026-07-03 |

---

## Future Decisions (Pending)

### FD-1: CartService Refactoring Threshold

| Field | Value |
|-------|-------|
| **Trigger** | CartService melebihi 400-500 lines |
| **Options Considered** | Separate services, Facade pattern, Module pattern |
| **Current Status** | Monitoring. Belum diperlukan saat ini (137 lines). |
| **Target Phase** | Step 5+ |

### FD-2: Inventory Reservation Hook Point

| Field | Value |
|-------|-------|
| **Trigger** | Step 4 implementation |
| **Options Considered** | Hook after addToCart, Transactional with reservation, Async reservation |
| **Current Status** | Pending |
| **Target Phase** | Step 4 |

### FD-3: Redis Cache untuk Cart

| Field | Value |
|-------|-------|
| **Trigger** | Performance requirements |
| **Options Considered** | Cache-aside, Write-through, No cache |
| **Current Status** | Pending |
| **Target Phase** | Step 9 |

---

## Decision Review Process

Ketika ada keputusan arsitektur baru:

1. **Context**: Apa masalah yang sedang dipecahkan?
2. **Alternatives**: Apa opsi yang tersedia?
3. **Consequences**: Apa dampak dari setiap opsi?
4. **Decision**: Apa yang dipilih dan mengapa?
5. **Status**: Applied / Pending / Deprecated
6. **Review Date**: Tanggal keputusan ditinjau ulang

---

## References

- [DDD Aggregate Pattern](https://martinfowler.com/bliki/DDD_Aggregate.html)
- [REST API Status Codes](https://restfulapi.net/http-status-codes/)
- [Prisma Transactions](https://www.prisma.io/docs/guides/database/troubleshooting-orm/help-articles/transaction-error)
