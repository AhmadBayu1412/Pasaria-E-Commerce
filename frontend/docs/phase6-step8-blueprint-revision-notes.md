# Phase 6 Step 8 - Blueprint Revision Notes

## Tanggal: 7 Juli 2026

## Original Score: 9.2/10

---

## 🔴 Wajib Direvisi

### 1. Pecah Domain Admin

**Masalah:** Semua masuk ke `features/admin/`

**Solusi:** Pisahkan per domain

```
src/components/features/
├── admin-dashboard/    ← Dashboard widgets
├── admin-orders/      ← Order management
├── admin-products/    ← Product management
└── admin-users/       ← User management
```

Benefit: Batas domain jelas, maintainable

---

### 2. Store Per Domain

**Masalah:** `AdminStore` menampung semua state

**Solusi:** Store per domain

```
store/
├── admin-dashboard.store.ts   ← Dashboard state
├── admin-order.store.ts       ← Orders state
├── admin-product.store.ts     ← Products state
└── admin-user.store.ts       ← Users state
```

Benefit: Store tidak menjadi monster

---

### 3. Backend Order Status Verification

**Masalah:** Blueprint menambahkan PROCESSING, SHIPPED, DELIVERED tanpa verifikasi

**Solusi:** Tambahkan catatan

```typescript
// Status yang perlu verifikasi backend
// - PROCESSING (backend Phase 6+)
// - SHIPPED (future)
// - DELIVERED (future)

// Status yang sudah ada
// - DRAFT, PENDING, PAID, CANCELLED, EXPIRED
```

---

## 🟡 Sangat Disarankan

### 4. Permission Lebih Granular

**Masalah:** Hanya `orders:read`, `orders:write`

**Solusi:** Permission berbasis aksi

```typescript
export const PERMISSIONS = {
  // Orders
  'orders:read': 'Lihat daftar pesanan',
  'orders:update-status': 'Update status pesanan',
  'orders:refund': 'Proses refund',
  'orders:cancel': 'Batalkan pesanan',

  // Products
  'products:read': 'Lihat produk',
  'products:create': 'Tambah produk',
  'products:update': 'Edit produk',
  'products:publish': 'Publikasi produk',
  'products:archive': 'Arsipkan produk',

  // Users
  'users:read': 'Lihat pengguna',
  'users:export': 'Export data pengguna',

  // Dashboard
  'dashboard:view': 'Lihat dashboard',
  'dashboard:export': 'Export laporan',
} as const;
```

---

### 5. DataTable Reusable Component

**Masalah:** Setiap halaman buat tabel sendiri

**Solusi:** Buat DataTable reusable

```typescript
interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  pagination?: PaginationConfig;
  filters?: FilterConfig[];
  onSort?: (sort: SortConfig) => void;
  onFilter?: (filters: FilterValues) => void;
  onRowClick?: (row: T) => void;
  isLoading?: boolean;
}
```

Benefit: Konsisten, DRY

---

### 6. Dashboard Widget System

**Masalah:** Dashboard hanya statis

**Solusi:** Widget-based dashboard

```typescript
interface DashboardWidget {
  id: string;
  type: 'stat' | 'chart' | 'table' | 'activity';
  title: string;
  permission?: Permission;
  refreshInterval?: number; // ms
  data?: unknown;
}

const DASHBOARD_WIDGETS: DashboardWidget[] = [
  { id: 'pending-orders', type: 'stat', title: 'Pesanan Pending' },
  { id: 'today-revenue', type: 'stat', title: 'Revenue Hari Ini' },
  { id: 'low-stock', type: 'table', title: 'Stok Rendah' },
  { id: 'recent-activity', type: 'activity', title: 'Aktivitas Terbaru' },
];
```

---

### 7. Activity Feed

**Masalah:** Tidak ada log aktivitas

**Solusi:** Tambahkan activity feed widget

```typescript
interface ActivityItem {
  id: string;
  type: 'order' | 'product' | 'user' | 'payment';
  action: string;
  actor: { id: number; name: string };
  target?: { id: number; name: string };
  timestamp: string;
  metadata?: Record<string, unknown>;
}
```

---

### 8. Navigation Config Lebih Lengkap

**Masalah:** Hanya label dan href

**Solusi:** Konfigurasi lengkap

```typescript
interface AdminNavItem {
  id: string;
  label: string;
  href?: string;
  icon: string;
  permission?: Permission;
  badge?: number | ((state: AppState) => number);
  children?: AdminNavItem[];
}

export const ADMIN_NAVIGATION: AdminNavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    href: '/admin',
    icon: 'home',
    permission: 'dashboard:view',
  },
  {
    id: 'orders',
    label: 'Pesanan',
    href: '/admin/orders',
    icon: 'shopping-bag',
    permission: 'orders:read',
    badge: getPendingOrdersCount,
    children: [
      { id: 'orders-all', label: 'Semua', href: '/admin/orders' },
      {
        id: 'orders-pending',
        label: 'Pending',
        href: '/admin/orders?status=PENDING',
      },
    ],
  },
];
```

---

## 🟢 Nice to Have

### 9. Upload Service Abstraction

**Masalah:** Langsung File[] di form

**Solusi:** Pisahkan upload service

```typescript
interface UploadService {
  upload(file: File): Promise<UploadedFile>;
  delete(fileId: string): Promise<void>;
  reorder(fileIds: string[]): Promise<void>;
}

const imageUploadService: UploadService = {
  async upload(file) {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post('/uploads', formData);
    return response.data;
  },
  // ...
};
```

---

### 10. Audit Trail

**Masalah:** Perubahan status tidak logged

**Solusi:** Tambahkan audit log

```typescript
interface AuditLog {
  id: number;
  entity: 'order' | 'product' | 'user';
  entityId: number;
  action: string;
  actorId: number;
  actorName: string;
  changes: {
    field: string;
    oldValue: unknown;
    newValue: unknown;
  }[];
  timestamp: string;
  ipAddress?: string;
}
```

---

### 11. Confirmation Flow

**Masalah:** Aksi langsung tanpa konfirmasi

**Solusi:** Confirmation dialog

```typescript
interface ConfirmationDialogProps {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
}

// Usage
<ConfirmationDialog
  title="Hapus Produk"
  message="Produk akan dihapus permanen. Lanjutkan?"
  variant="danger"
  onConfirm={handleDelete}
  onCancel={handleCancel}
/>
```

---

### 12. Optimistic Update Strategy

**Masalah:** Tidak ada dokumentasi strategi update

**Solusi:** Dokumentasikan

```typescript
// Update Strategy
type UpdateStrategy = 'optimistic' | 'refetch' | 'hybrid';

const UPDATE_STRATEGIES: Record<string, UpdateStrategy> = {
  'order-status': 'refetch', // Konsisten dengan backend
  'product-active': 'optimistic', // UX lebih baik
  'product-inventory': 'hybrid', // Optimistic + verify
};
```

---

### 13. Filter Objects

**Masalah:** Parameter tersebar

**Solusi:** Typed filter objects

```typescript
interface OrderFilter {
  status?: OrderStatus[];
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  userId?: number;
  minAmount?: number;
  maxAmount?: number;
}

interface ProductFilter {
  category?: number[];
  status?: 'all' | 'active' | 'inactive';
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  stockStatus?: 'all' | 'in_stock' | 'low_stock' | 'out_of_stock';
}
```

---

## 📊 Revised Scores

| Area              | Original | Revised |
| ----------------- | -------- | ------- |
| Architecture      | 9.4/10   | 9.7/10  |
| Backend Alignment | 9.2/10   | 9.5/10  |
| State Management  | 8.9/10   | 9.5/10  |
| UX                | 9.5/10   | 9.6/10  |
| Maintainability   | 9.0/10   | 9.7/10  |
| Scalability       | 9.3/10   | 9.8/10  |
| Security          | 9.4/10   | 9.7/10  |
| Extensibility     | 9.1/10   | 9.7/10  |

**Revised Overall: 9.7/10**

---

## ✅ Checklist Revisi

- [ ] Pecah domain menjadi admin-dashboard, admin-orders, admin-products, admin-users
- [ ] Store per domain (bukan admin.store)
- [ ] Verifikasi order status dengan backend
- [ ] Permission lebih granular
- [ ] Buat DataTable reusable
- [ ] Widget system untuk dashboard
- [ ] Activity feed
- [ ] Navigation config lengkap
- [ ] Dokumentasi upload service (nice to have)
- [ ] Audit trail (nice to have)
- [ ] Confirmation flow
- [ ] Update strategy dokumentasi
- [ ] Filter objects
