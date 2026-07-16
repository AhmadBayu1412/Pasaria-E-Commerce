# 📋 PERENCANAAN PERBAIKAN & PENGEMBANGAN PASARIA E-COMMERCE

## Dokumen Overview & Analisis Masalah

**Tanggal:** 16 Juli 2026  
**Project:** Pasaria E-Commerce  
**Versi:** 2.0 (Perbaikan Besar)

---

## 📊 Ringkasan Eksekutif

Dokumen ini berisi perencanaan untuk memperbaiki dan mengembangkan fitur-fitur utama pada website e-commerce Pasaria. Fokus utama adalah memperbaiki **integrasi frontend-backend** yang bermasalah dan meningkatkan **pengalaman pengguna**.

### Masalah Kritis yang Ditemukan

| No  | Masalah                                          | Severity    | Dampak               |
| --- | ------------------------------------------------ | ----------- | -------------------- |
| 1   | Error "NaN" pada harga (shippingFee, tax, total) | 🔴 Critical | Checkout gagal       |
| 2   | Semua pesanan muncul di semua tab                | 🔴 Critical | UX sangat buruk      |
| 3   | Status pesanan tidak match FE-BE                 | 🔴 Critical | Logic error          |
| 4   | Kategori menggunakan data hardcode               | 🟡 High     | Data tidak real-time |
| 5   | Halaman beranda sangat dasar                     | 🟡 High     | Impression buruk     |

---

## 🔍 Analisis Masalah Detail

### 1. Masalah NaN pada Detail Pesanan

#### Kondisi Sekarang (Backend - order.mapper.ts):

```typescript
// Backend hanya mengembalikan:
{
  (id,
    userId,
    status,
    items,
    totalQuantity,
    totalItemCount,
    subtotal, // ← HANYA ADA SUBTOTAL
    createdAt,
    updatedAt);
}
```

#### Kondisi Sekarang (Frontend - order.types.ts):

```typescript
interface Order {
  // ...
  subtotal: number;
  shippingFee: number; // ← DIHARAPKAN
  tax: number; // ← DIHARAPKAN
  total: number; // ← DIHARAPKAN
  // ...
}
```

#### Akar Masalah:

- Schema Prisma **TIDAK memiliki** field `shippingFee`, `tax`, `total`
- Backend mapper **TIDAK mapping** field tersebut
- Frontend **MENGHARAPKAN** field tersebut → muncul `NaN`

#### Lokasi File Bermasalah:

```
backend/prisma/schema.prisma (baris 167-193)
backend/modules/order/order.mapper.ts (baris 54-74)
frontend/src/components/features/orders/order-detail.tsx (baris 76-87)
```

---

### 2. Masalah Filter Tab Pesanan

#### Kondisi Sekarang (Frontend - orders/page.tsx):

```typescript
// Frontend punya tabs: Semua, Belum Bayar, Diproses, Dikirim, Selesai, Dibatalkan
// Tapi backend TIDAK support filtering by status

const getStatusFilter = (tab: OrderTab): string | undefined => {
  return undefined; // Selalu undefined!
};

const fetchOrders = async (pageNum: number = 1) => {
  const response = await orderService.getOrders(pageNum); // Tidak ada filter
  // Filtering dilakukan di LOCAL (gagal karena data tidak sesuai)
};
```

#### Kondisi Sekarang (Backend - order.controller.ts):

```typescript
async getOrders(req: Request, res: Response): Promise<void> {
  const page = parseInt(req.query.page as string, 10) || 1;
  const limit = Math.min(parseInt(req.query.limit as string, 10) || 10, 100);

  // TIDAK ADA status filter!
  const allOrders = await OrderService.getOrdersByUser(user.id);
  // ...
}
```

#### Akar Masalah:

- Frontend tabs: `pending`, `processing`, `shipped`, `completed`, `cancelled`
- Backend status: `DRAFT`, `WAITING_PAYMENT`, `PAID`, `EXPIRED`, `CANCELLED`
- **TIDAK ADA MAPPING** antara tab frontend dan status backend

#### Lokasi File Bermasalah:

```
frontend/src/app/(main)/orders/page.tsx (baris 41-53)
backend/modules/order/order.controller.ts (baris 116-157)
backend/modules/order/order.service.ts (baris 170-178)
```

---

### 3. Masalah Status Pesanan Tidak Match

#### Frontend expects (frontend/src/types/api/order.types.ts):

```typescript
export type OrderStatus =
  | 'DRAFT'
  | 'PENDING' // ← ADA
  | 'PAID'
  | 'CANCELLED'
  | 'EXPIRED';
// MISSING: PROCESSING, SHIPPING, DELIVERED, COMPLETED
```

#### Backend actual (backend/modules/order/order-lifecycle.types.ts):

```typescript
export type OrderStatus =
  | 'DRAFT'
  | 'WAITING_PAYMENT' // ← BEDA!
  | 'PAID'
  | 'EXPIRED'
  | 'CANCELLED';
// MISSING: PROCESSING, SHIPPING, DELIVERED, COMPLETED
```

#### Tab Mapping yang Seharusnya:

| Tab Frontend | Label       | Status Backend                |
| ------------ | ----------- | ----------------------------- |
| all          | Semua       | (tanpa filter)                |
| pending      | Belum Bayar | DRAFT, WAITING_PAYMENT        |
| processing   | Diproses    | PAID                          |
| shipped      | Dikirim     | SHIPPING (perlu ditambahkan)  |
| completed    | Selesai     | COMPLETED (perlu ditambahkan) |
| cancelled    | Dibatalkan  | EXPIRED, CANCELLED            |

#### Akar Masalah:

- **Tidak ada keputusan arsitektur** tentang lifecycle pesanan
- Frontend dan Backend berkembang **terpisah** tanpa sinkronisasi
- Tidak ada **shared types** antara FE dan BE

---

### 4. Masalah Kategori Hardcode

#### Kondisi Sekarang (frontend/src/app/(main)/categories/page.tsx):

```typescript
const categories = [
  { id: 'electronics', name: 'Elektronik', count: 156, ... }, // HARDCODED!
  { id: 'fashion', name: 'Fashion', count: 324, ... },
  // ...
];
```

#### Seharusnya:

- Ambil data dari API `/categories`
- Hitung jumlah produk per kategori dari database
- Update secara real-time

---

### 5. Masalah Halaman Beranda

#### Kondisi Sekarang:

```tsx
<h1>Selamat Datang di Pasaria</h1>
<p>Pasar Indonesia Online...</p>
```

#### Seharusnya:

- Hero Section dengan banner promo
- Featured Categories (from API)
- Featured Products carousel (from API)
- Flash Sale section
- Footer yang lengkap

---

## 🎯 Tujuan Proyek

### Prioritas 1: Fix Critical Bugs

- [ ] Perbaiki error "NaN" pada halaman detail pesanan
- [ ] Perbaiki filter status pesanan
- [ ] Integrasikan status pesanan frontend dan backend

### Prioritas 2: Integrasi Data Real

- [ ] Halaman kategori dengan data real dari database
- [ ] Jumlah produk per kategori yang akurat

### Prioritas 3: Improve UX

- [ ] Halaman beranda yang menarik dan informatif
- [ ] User flow yang lebih baik
- [ ] Responsive design yang konsisten

### Prioritas 4: Konsistensi Backend-Frontend

- [ ] Type definitions yang match
- [ ] API response yang sesuai kebutuhan frontend
- [ ] Shared contracts antara FE dan BE

---

## 📁 Struktur Dokumentasi

Dokumen perencanaan ini terdiri dari:

| File                   | Deskripsi                          |
| ---------------------- | ---------------------------------- |
| `01-OVERVIEW.md`       | Dokumen ini - Ringkasan & Analisis |
| `02-BACKEND.md`        | Perencanaan perubahan Backend      |
| `03-FRONTEND.md`       | Perencanaan perubahan Frontend     |
| `04-TYPES.md`          | Definisi Type yang terintegrasi    |
| `05-API.md`            | Contract API & Endpoints           |
| `06-IMPLEMENTATION.md` | Step-by-step implementasi          |

---

## ⚠️ Catatan Penting

1. **Backup sebelum migrasi:** Pastikan backup database sebelum menjalankan migrasi schema baru

2. **Testing bertahap:** Test setiap endpoint setelah dibuat sebelum lanjut ke fitur berikutnya

3. **Error handling:** Pastikan semua API memiliki error handling yang baik

4. **Type consistency:** Pastikan type di frontend match dengan response backend

5. **Mobile responsive:** Semua halaman harus mobile-friendly

---

**Last Updated:** 16 Juli 2026  
**Next:** Lihat `02-BACKEND.md` untuk detail perubahan Backend
