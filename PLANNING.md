# 📋 Perencanaan Perbaikan & Pengembangan Pasaria E-Commerce

**Tanggal:** 16 Juli 2026  
**Project:** Pasaria E-Commerce  
**Versi:** 1.0

---

## 📊 Ringkasan Eksekutif

Dokumen ini berisi perencanaan untuk memperbaiki dan mengembangkan fitur-fitur utama pada website e-commerce Pasaria. Fokus utama adalah memperbaiki integrasi frontend-backend yang bermasalah dan meningkatkan pengalaman pengguna.

---

## 🔍 Analisis Masalah Saat Ini

### Masalah yang Ditemukan

| No  | Halaman        | Masalah                                                    | Severity    |
| --- | -------------- | ---------------------------------------------------------- | ----------- |
| 1   | Detail Pesanan | Error "NaN" pada harga (shippingFee, tax, total tidak ada) | 🔴 Critical |
| 2   | Pesanan Saya   | Semua pesanan muncul di semua tab (filter tidak berfungsi) | 🔴 Critical |
| 3   | Pesanan Saya   | Status tidak match antara frontend dan backend             | 🔴 Critical |
| 4   | Kategori       | Data kategori dan jumlah produk di-hardcode (tidak real)   | 🟡 High     |
| 5   | Beranda        | Sangat dasar, hanya teks selamat datang                    | 🟡 High     |

---

### 1. Detail Pesanan - Error "NaN"

**Penyebab:**

- Frontend mengharapkan field: `shippingFee`, `tax`, `total`
- Backend `OrderMapper` hanya mengembalikan: `id`, `userId`, `status`, `items`, `totalQuantity`, `totalItemCount`, `subtotal`, `createdAt`, `updatedAt`

**Lokasi Code:**

```
frontend/src/components/features/orders/order-detail.tsx
backend/modules/order/order.mapper.ts
backend/modules/order/order.types.ts
```

**Screenshot Issue:**
![Order Detail dengan NaN](placeholder-nan.png)

---

### 2. Pesanan Saya - Filter Tidak Berfungsi

**Penyebab:**

- Frontend tabs: Semua, Belum Bayar, Diproses, Dikirim, Selesai, Dibatalkan
- Backend `getOrders()` tidak mendukung filtering berdasarkan status
- Frontend mencoba filter secara lokal tapi gagal

**Lokasi Code:**

```
frontend/src/app/(main)/orders/page.tsx
backend/modules/order/order.controller.ts (getOrders)
backend/modules/order/order.service.ts (getOrdersByUser)
```

**Screenshot Issue:**
![Semua pesanan muncul di semua tab](placeholder-all-tabs.png)

---

### 3. Status Pesanan Tidak Match

**Frontend Expects:**

```
PENDING, PROCESSING, SHIPPED, DELIVERED, COMPLETED, CANCELLED, EXPIRED, DRAFT
```

**Backend Actual:**

```
DRAFT, WAITING_PAYMENT, PAID, EXPIRED, CANCELLED
```

**Lokasi Code:**

```
frontend/src/types/api/order.types.ts (OrderStatus)
backend/modules/order/order-lifecycle.types.ts (OrderStatus)
```

---

### 4. Halaman Kategori - Data Statis

**Saat Ini:**

```typescript
const categories = [
  { id: 'electronics', name: 'Elektronik', count: 156, ... },
  { id: 'fashion', name: 'Fashion', count: 324, ... },
  // ... semua di-hardcode
];
```

**Seharusnya:**

- Ambil dari API `/categories`
- Hitung jumlah produk per kategori dari database

**Lokasi Code:**

```
frontend/src/app/(main)/categories/page.tsx
```

---

### 5. Halaman Beranda - Sangat Dasar

**Saat Ini:**

```tsx
<h1>Selamat Datang di Pasaria</h1>
<p>Pasar Indonesia Online...</p>
```

**Seharusnya:**

- Hero Section dengan banner promo
- Featured Categories
- Featured Products carousel
- Footer yang lengkap

**Lokasi Code:**

```
frontend/src/app/(main)/page.tsx
```

---

## 🎯 Tujuan Proyek

1. **Fix Critical Bugs**
   - Perbaiki error "NaN" pada halaman detail pesanan
   - Perbaiki filter status pesanan
   - Integrasikan status pesanan frontend dan backend

2. **Integrasi Data Real**
   - Halaman kategori dengan data real dari database
   - Jumlah produk per kategori yang akurat

3. **Improve UX**
   - Halaman beranda yang menarik dan informatif
   - User flow yang lebih baik

4. **Konsistensi Backend-Fontend**
   - Type definitions yang match
   - API response yang sesuai kebutuhan frontend

---

## 📋 Rencana Pengerjaan

### TAHAP 1: Backend Fixes (Schema, Service, Controller)

**Durasi Estimasi:** 2-3 jam

#### 1.1 Update Schema Prisma

**File:** `backend/prisma/schema.prisma`

```prisma
model Order {
  // ... existing fields

  // TAMBAHAN untuk fix NaN
  shippingFee Decimal @default(0)
  tax Decimal @default(0)
  total Decimal @default(0)
}
```

#### 1.2 Extend OrderStatus

**File:** `backend/modules/order/order-lifecycle.types.ts`

**Status yang dibutuhkan:**

```typescript
export type OrderStatus =
  | 'DRAFT' // Keranjang → Order draft
  | 'WAITING_PAYMENT' // Menunggu pembayaran
  | 'PAID' // Sudah dibayar
  | 'PROCESSING' // Seller sedang memproses
  | 'SHIPPING' // Sedang dikirim
  | 'DELIVERED' // Sudah sampai
  | 'COMPLETED' // Selesai (user konfirmasi)
  | 'EXPIRED' // Pembayaran kadaluarsa
  | 'CANCELLED'; // Dibatalkan
```

#### 1.3 Update Order Service

**File:** `backend/modules/order/order.service.ts`

```typescript
// Tambahkan parameter filter
async getOrdersByUser(
  userId: number,
  options?: {
    status?: OrderStatus | OrderStatus[];
  }
): Promise<ReadonlyArray<OrderDraft>> {
  // ... existing code
  // Add where clause untuk filter status
}
```

#### 1.4 Update Order Mapper

**File:** `backend/modules/order/order.mapper.ts`

```typescript
toOrderDraft(order: OrderWithItems): OrderDraft {
  return {
    // ... existing fields
    shippingFee: Number(order.shippingFee),    // TAMBAHAN
    tax: Number(order.tax),                    // TAMBAHAN
    total: Number(order.total),                // TAMBAHAN
  }
}
```

#### 1.5 Update Order Controller

**File:** `backend/modules/order/order.controller.ts`

```typescript
async getOrders(req: Request, res: Response): Promise<void> {
  // Ambil query param status
  const status = req.query.status as string | undefined;

  // Parse dan filter
  const { OrderService } = await import("./order.service.js")
  const orders = await OrderService.getOrdersByUser(user.id, {
    status: status ? parseStatusFilter(status) : undefined
  });

  // Return dengan pagination
}
```

---

### TAHAP 2: Frontend Type & Service Fixes

**Durasi Estimasi:** 1-2 jam

#### 2.1 Update Types API

**File:** `frontend/src/types/api/order.types.ts`

```typescript
export type OrderStatus =
  | 'DRAFT'
  | 'WAITING_PAYMENT'
  | 'PAID'
  | 'PROCESSING'
  | 'SHIPPING'
  | 'DELIVERED'
  | 'COMPLETED'
  | 'EXPIRED'
  | 'CANCELLED';

export interface Order {
  id: number;
  userId: number;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  shippingFee: number; // TAMBAHAN
  tax: number; // TAMBAHAN
  total: number; // TAMBAHAN
  totalQuantity: number;
  totalItemCount: number;
  createdAt: string;
  updatedAt: string;
  payment?: PaymentInfo;
}
```

#### 2.2 Update Order Service

**File:** `frontend/src/services/order.service.ts`

```typescript
async getOrders(
  page: number = 1,
  limit: number = 10,
  status?: string  // TAMBAHAN
): Promise<{ items: Order[]; pagination: {...} }> {
  const params: Record<string, any> = { page, limit };
  if (status && status !== 'all') {
    params.status = status;
  }

  const response = await apiClient.get<BackendOrdersResponse>('/orders', { params });
  return {
    items: response.data.data.items,
    pagination: response.data.data.pagination,
  };
}
```

#### 2.3 Update Order Status Mapping

**File:** `frontend/src/components/features/orders/order-card.tsx`

```typescript
const statusConfig: Record<
  string,
  { bg: string; text: string; label: string }
> = {
  DRAFT: { bg: 'bg-secondary-300', text: 'text-white', label: 'Draft' },
  WAITING_PAYMENT: {
    bg: 'bg-amber-500',
    text: 'text-white',
    label: 'Menunggu Pembayaran',
  },
  PAID: { bg: 'bg-blue-500', text: 'text-white', label: 'Sudah Dibayar' },
  PROCESSING: {
    bg: 'bg-blue-600',
    text: 'text-white',
    label: 'Sedang Diproses',
  },
  SHIPPING: {
    bg: 'bg-purple-500',
    text: 'text-white',
    label: 'Sedang Dikirim',
  },
  DELIVERED: { bg: 'bg-indigo-500', text: 'text-white', label: 'Pesanan Tiba' },
  COMPLETED: { bg: 'bg-green-600', text: 'text-white', label: 'Selesai' },
  EXPIRED: { bg: 'bg-secondary-400', text: 'text-white', label: 'Kedaluwarsa' },
  CANCELLED: { bg: 'bg-red-100', text: 'text-red-600', label: 'Dibatalkan' },
};
```

---

### TAHAP 3: Halaman Beranda (Full Rebuild)

**Durasi Estimasi:** 3-4 jam

#### 3.1 Struktur Komponen

```
frontend/src/app/(main)/page.tsx
├── Hero Section
│   ├── Banner/Image Carousel
│   ├── Tagline & Headline
│   └── CTA Buttons (Shop Now, See Categories)
├── Featured Categories
│   └── Category Cards (from API)
├── Featured Products
│   └── Product Carousel (from API)
├── Promo Section
│   └── Flash Sale / Special Offers
└── Footer
    ├── Company Info
    ├── Quick Links
    ├── Support
    └── Social Media
```

#### 3.2 API Endpoints yang Dibutuhkan

**GET /categories (existing atau perlu dibuat)**

```json
{
  "success": true,
  "data": {
    "items": [
      { "id": 1, "name": "Elektronik", "icon": "📱", "description": "...", "productCount": 156 },
      ...
    ]
  }
}
```

**GET /products/featured (perlu dibuat)**

```json
{
  "success": true,
  "data": {
    "items": [
      { "id": 1, "name": "...", "price": 150000, "images": [...], "rating": 4.5 },
      ...
    ]
  }
}
```

#### 3.3 Mockup Desain

**Hero Section:**

```
┌─────────────────────────────────────────────────────────┐
│  [Navbar: Logo | Beranda | Produk | Kategori | Tentang] │
├─────────────────────────────────────────────────────────┤
│                                                         │
│     ┌─────────────────────────────────────────────┐     │
│     │                                             │     │
│     │     SELAMAT DATANG DI PASARIA               │     │
│     │     Pasar Indonesia Online                  │     │
│     │     Belanja mudah, aman, terpercaya         │     │
│     │                                             │     │
│     │     [Belanja Sekarang]  [Jelajahi Kategori] │     │
│     │                                             │     │
│     └─────────────────────────────────────────────┘     │
│                                                         │
├─────────────────────────────────────────────────────────┤
│  KATEGORI POPULER                                      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐  │
│  │ 📱       │ │ 👕       │ │ 🏠       │ │ 💄     │  │
│  │Elektronik│ │ Fashion  │ │ Rumah    │ │Beauty  │  │
│  │ 156 item │ │ 324 item │ │ 89 item  │ │201 item│  │
│  └──────────┘ └──────────┘ └──────────┘ └────────┘  │
│                                                         │
├─────────────────────────────────────────────────────────┤
│  PRODUK UNGGULAN                                       │
│  [◀] [Card] [Card] [Card] [Card] [Card] [▶]          │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

### TAHAP 4: Halaman Kategori (API Integration)

**Durasi Estimasi:** 2-3 jam

#### 4.1 Update Halaman Kategori

**File:** `frontend/src/app/(main)/categories/page.tsx`

```typescript
'use client';

import { useEffect, useState } from 'react';
import { categoryService } from '@/services/category.service';

interface Category {
  id: number;
  name: string;
  icon: string;
  description: string;
  productCount: number;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchCategories() {
      try {
        const data = await categoryService.getCategories();
        setCategories(data);
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchCategories();
  }, []);

  // Render dengan data real...
}
```

#### 4.2 Buat Category Service

**File:** `frontend/src/services/category.service.ts`

```typescript
import apiClient from './api-client';

interface Category {
  id: number;
  name: string;
  icon: string;
  description: string;
  productCount: number;
}

export const categoryService = {
  async getCategories(): Promise<Category[]> {
    const response = await apiClient.get<{
      success: boolean;
      data: { items: Category[] };
    }>('/categories');
    return response.data.data.items;
  },

  async getCategoryById(id: number): Promise<Category> {
    const response = await apiClient.get<{
      success: boolean;
      data: { category: Category };
    }>(`/categories/${id}`);
    return response.data.data.category;
  },
};
```

#### 4.3 Buat Backend Category Endpoints

**File:** `backend/modules/category/category.controller.ts`

```typescript
async getCategories(req: Request, res: Response): Promise<void> {
  const categories = await CategoryService.getAllWithProductCount();

  res.status(200).json({
    success: true,
    data: { items: categories }
  });
}
```

**File:** `backend/modules/category/category.service.ts`

```typescript
async getAllWithProductCount() {
  const categories = await prisma.category.findMany({
    include: {
      _count: {
        select: { products: true }
      }
    }
  });

  return categories.map(cat => ({
    id: cat.id,
    name: cat.name,
    icon: getIconForCategory(cat.name), // Helper untuk icon
    description: getDescriptionForCategory(cat.name),
    productCount: cat._count.products
  }));
}
```

---

### TAHAP 5: Halaman Pesanan Saya (Full Fix)

**Durasi Estimasi:** 2-3 jam

#### 5.1 Tab Mapping

| Tab Frontend | Status Backend         |
| ------------ | ---------------------- |
| Semua        | (tanpa filter)         |
| Belum Bayar  | DRAFT, WAITING_PAYMENT |
| Diproses     | PAID, PROCESSING       |
| Dikirim      | SHIPPING               |
| Selesai      | DELIVERED, COMPLETED   |
| Dibatalkan   | EXPIRED, CANCELLED     |

#### 5.2 Update Orders Page

**File:** `frontend/src/app/(main)/orders/page.tsx`

```typescript
type OrderTab =
  | 'all'
  | 'pending'
  | 'processing'
  | 'shipped'
  | 'completed'
  | 'cancelled';

// Mapping tab ke status filter
const TAB_STATUS_MAP: Record<OrderTab, string | string[] | undefined> = {
  all: undefined,
  pending: ['DRAFT', 'WAITING_PAYMENT'],
  processing: ['PAID', 'PROCESSING'],
  shipped: ['SHIPPING'],
  completed: ['DELIVERED', 'COMPLETED'],
  cancelled: ['EXPIRED', 'CANCELLED'],
};

const fetchOrders = async (pageNum: number = 1) => {
  const statusFilter = TAB_STATUS_MAP[activeTab];
  const statusParam = statusFilter
    ? Array.isArray(statusFilter)
      ? statusFilter.join(',')
      : statusFilter
    : undefined;

  const response = await orderService.getOrders(pageNum, 10, statusParam);
  // ... rest of code
};
```

#### 5.3 Perbaiki Order Detail Display

**File:** `frontend/src/components/features/orders/order-detail.tsx`

```typescript
// Ringkasan Pembayaran - sudah menggunakan field yang benar
<div className="flex justify-between text-secondary-600">
  <span>Subtotal</span>
  <span>{formatCurrency(order.subtotal)}</span>
</div>
<div className="flex justify-between text-secondary-600">
  <span>Ongkos Kirim</span>
  <span>{formatCurrency(order.shippingFee)}</span>  {/* ✅ Fixed */}
</div>
<div className="flex justify-between text-secondary-600">
  <span>Pajak</span>
  <span>{formatCurrency(order.tax)}</span>  {/* ✅ Fixed */}
</div>
<div className="flex justify-between font-semibold text-secondary-900 pt-2 border-t">
  <span>Total</span>
  <span>{formatCurrency(order.total)}</span>  {/* ✅ Fixed */}
</div>
```

#### 5.4 Perbaiki Order Timeline

**File:** `frontend/src/components/features/orders/order-timeline.tsx`

```typescript
const TIMELINE_STEPS = [
  { status: 'DRAFT', label: 'Pesanan Dibuat' },
  { status: 'WAITING_PAYMENT', label: 'Menunggu Pembayaran' },
  { status: 'PAID', label: 'Pembayaran Diterima' },
  { status: 'PROCESSING', label: 'Sedang Diproses' },
  { status: 'SHIPPING', label: 'Sedang Dikirim' },
  { status: 'DELIVERED', label: 'Pesanan Tiba' },
  { status: 'COMPLETED', label: 'Selesai' },
];
```

---

## 📁 File yang Perlu Diubah

### Backend Files

| No  | File                                              | Aksi                                      |
| --- | ------------------------------------------------- | ----------------------------------------- |
| 1   | `backend/prisma/schema.prisma`                    | Modify: Tambahkan shippingFee, tax, total |
| 2   | `backend/modules/order/order-lifecycle.types.ts`  | Modify: Extend OrderStatus                |
| 3   | `backend/modules/order/order.types.ts`            | Modify: Update interfaces                 |
| 4   | `backend/modules/order/order.mapper.ts`           | Modify: Map new fields                    |
| 5   | `backend/modules/order/order.service.ts`          | Modify: Add status filter                 |
| 6   | `backend/modules/order/order.controller.ts`       | Modify: Handle status query param         |
| 7   | `backend/modules/category/category.service.ts`    | Create: getAllWithProductCount            |
| 8   | `backend/modules/category/category.controller.ts` | Create/Modify: getCategories              |

### Frontend Files

| No  | File                                                         | Aksi                               |
| --- | ------------------------------------------------------------ | ---------------------------------- |
| 1   | `frontend/src/types/api/order.types.ts`                      | Modify: Update OrderStatus & Order |
| 2   | `frontend/src/services/order.service.ts`                     | Modify: Add status param           |
| 3   | `frontend/src/services/category.service.ts`                  | Create: Category service           |
| 4   | `frontend/src/app/(main)/page.tsx`                           | Modify: Full rebuild               |
| 5   | `frontend/src/app/(main)/categories/page.tsx`                | Modify: Integrate API              |
| 6   | `frontend/src/app/(main)/orders/page.tsx`                    | Modify: Fix status filter          |
| 7   | `frontend/src/app/(main)/orders/[id]/page.tsx`               | Modify: Use new fields             |
| 8   | `frontend/src/components/features/orders/order-detail.tsx`   | Modify: Fixed field names          |
| 9   | `frontend/src/components/features/orders/order-card.tsx`     | Modify: Status mapping             |
| 10  | `frontend/src/components/features/orders/order-timeline.tsx` | Modify/Add: Full timeline          |

---

## ⏱️ Timeline Keseluruhan

| Tahap     | Deskripsi                                   | Estimasi Waktu |
| --------- | ------------------------------------------- | -------------- |
| 1         | Backend Fixes (Schema, Service, Controller) | 2-3 jam        |
| 2         | Frontend Type & Service Fixes               | 1-2 jam        |
| 3         | Halaman Beranda (Full Rebuild)              | 3-4 jam        |
| 4         | Halaman Kategori (API Integration)          | 2-3 jam        |
| 5         | Halaman Pesanan Saya (Full Fix)             | 2-3 jam        |
| **Total** |                                             | **10-15 jam**  |

---

## ✅ Checklist Pengerjaan

### Backend

- [ ] Update schema.prisma (shippingFee, tax, total)
- [ ] Extend OrderStatus enum
- [ ] Update OrderMapper
- [ ] Add status filter di OrderService
- [ ] Handle status query di OrderController
- [ ] Create/Update Category endpoints
- [ ] Run database migration
- [ ] Test all endpoints

### Frontend

- [ ] Update order.types.ts
- [ ] Update order.service.ts
- [ ] Create category.service.ts
- [ ] Rebuild home page
- [ ] Integrate categories page with API
- [ ] Fix orders page status filter
- [ ] Update order detail display
- [ ] Update order status mapping
- [ ] Update order timeline
- [ ] Full testing

---

## 🔗 Referensi Tambahan

### Existing Documentation

- `docs/api_contract.md` - API contract specification
- `docs/db_model.md` - Database model
- `STEP/STEP0.md` - Initial setup guide
- `STEP/STEP1.md` - Phase 1 foundation

### Key Directories

```
backend/
├── modules/
│   ├── order/
│   ├── category/
│   └── checkout/
├── prisma/
│   └── schema.prisma
└── shared/

frontend/
├── src/
│   ├── app/(main)/
│   ├── components/
│   ├── services/
│   └── types/
└── public/
```

---

## 📝 Catatan Penting

1. **Backup sebelum migrasi:** Pastikan backup database sebelum menjalankan migrasi schema baru

2. **Testing bertahap:** Test setiap endpoint setelah dibuat sebelum lanjut ke fitur berikutnya

3. **Error handling:** Pastikan semua API memiliki error handling yang baik

4. **Type consistency:** Pastikan type di frontend match dengan response backend

5. **Mobile responsive:** Semua halaman harus mobile-friendly

---

## 👥 Kontributor

- Project: Pasaria E-Commerce
- Last Updated: 16 Juli 2026

---

**Dokumen ini akan diupdate sesuai kebutuhan selama proses development berlangsung.**
