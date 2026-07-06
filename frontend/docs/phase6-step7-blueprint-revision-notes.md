# Phase 6 Step 7 - Blueprint Revision Notes

## Tanggal: 7 Juli 2026

## Original Score: 9.6/10

---

## 🔴 Wajib Direvisi

### 1. Order Store - Separation of Concerns

**Masalah:** Store masih memiliki HTTP calls

```ts
// ❌ Sebelum
fetchOrders() {
  // HTTP di dalam store
}

fetchOrderById() {
  // HTTP di dalam store
}
```

**Solusi:** Konsisten dengan Step 6 - Auth Store

```ts
// ✅ Sesudah
// Store: State only
orders
selectedOrder
loading
error
pagination

// OrderService: HTTP only
async getOrders()
async getOrderById()
```

---

### 2. Pisahkan Formatter

**Masalah:** `formatCurrency` dan `formatDate` ada di `order-status.ts`

**Solusi:** Buat utility terpisah

```
lib/utils/
├── currency.ts    ← formatCurrency()
└── date.ts       ← formatDate()
```

Benefit: Reusable di Product, Cart, dll.

---

### 3. Ganti `<img>` dengan `<Image>`

**Masalah:** HTML img tag tidak optimal

**Solusi:** Next.js Image component

```tsx
// ❌ Sebelum
<img src={productImage} />;

// ✅ Sesudah
import Image from 'next/image';

<Image src={productImage} alt={productName} width={64} height={64} />;
```

Benefit: Lazy loading, optimization, responsive

---

## 🟡 Sangat Disarankan

### 4. Error Codes

**Masalah:** Error berupa string

```ts
// ❌ Sebelum
error: 'Gagal memuat pesanan';
```

**Solusi:** Enum error codes (sama seperti Auth)

```ts
// ✅ Sesudah
enum OrderError {
  NETWORK = 'NETWORK',
  NOT_FOUND = 'NOT_FOUND',
  UNAUTHORIZED = 'UNAUTHORIZED',
  UNKNOWN = 'UNKNOWN',
}

// Store
error: OrderError | null;

// UI menerjemahkan
const ERROR_MESSAGES: Record<OrderError, string> = {
  NETWORK: 'Koneksi terputus',
  NOT_FOUND: 'Pesanan tidak ditemukan',
  // ...
};
```

---

### 5. Retry Button

**Masalah:** Error state tanpa opsi retry

**Solusi:** Tambahkan tombol retry

```tsx
// ✅ Sesudah
{
  error && (
    <div className="text-center py-8">
      <p className="text-red-600 mb-4">{getErrorMessage(error)}</p>
      <Button onClick={() => fetchOrders()}>Coba Lagi</Button>
    </div>
  );
}
```

---

### 6. Semantic Tokens di StatusConfig

**Masalah:** Tailwind classes hardcoded

```ts
// ❌ Sebelum
bgColor: 'bg-green-100',
textColor: 'text-green-700',
```

**Solusi:** Semantic level

```ts
// ✅ Sesudah
export type StatusLevel = 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';

export const ORDER_STATUS_CONFIG: Record<OrderStatus, StatusConfig> = {
  PAID: {
    label: 'Sudah Dibayar',
    level: 'SUCCESS', // Tidak 'bg-green-100'
    icon: 'check-circle',
    isFinal: false,
  },
  CANCELLED: {
    label: 'Dibatalkan',
    level: 'ERROR', // Tidak 'bg-red-100'
    icon: 'x-circle',
    isFinal: true,
  },
};

// Badge component yang menerjemahkan
const levelStyles: Record<StatusLevel, { bg: string; text: string }> = {
  SUCCESS: { bg: 'bg-green-100', text: 'text-green-700' },
  ERROR: { bg: 'bg-red-100', text: 'text-red-700' },
  // ...
};
```

Benefit: Kalau Design System berubah, hanya ubah mapping di satu tempat

---

### 7. selectedOrder Global State?

**Pertanyaan:** Apakah perlu global?

**Rekomendasi:** Pertimbangkan local state / React Query

```tsx
// ❌ Sebelum - Global state
const { selectedOrder } = useOrderStore();

// ✅ Sesudah - Local state di page
const [order, setOrder] = useState<Order | null>(null);

useEffect(() => {
  orderService.getOrderById(id).then(setOrder);
}, [id]);
```

Benefit: Lebih sedikit global state, lebih predictable

---

## 🟢 Nice to Have

### 8. Pagination Adaptif

**Masalah:** Render semua halaman jika 100 halaman

**Solusi:** Ellipsis pagination

```
1 2 3 ... 20 21 22 ... 99 100
```

---

### 9. State Machine Diagram Extended

Tambahkan state masa depan:

```
DRAFT
  ↓
PENDING
  ↓
PAID ───→ EXPIRED
  ↓
PROCESSING (future)
  ↓
SHIPPED (future)
  ↓
DELIVERED (future)
  ↓
COMPLETED (future)
```

---

### 10. Action Matrix

| Status    | Bayar | Cancel | Invoice | Reorder |
| --------- | ----- | ------ | ------- | ------- |
| DRAFT     | ❌    | ❌     | ❌      | ❌      |
| PENDING   | ✅    | ✅     | ❌      | ❌      |
| PAID      | ❌    | ❌     | ✅      | ❌      |
| CANCELLED | ❌    | ❌     | ❌      | ✅      |
| EXPIRED   | ❌    | ❌     | ❌      | ✅      |

---

### 11. Mapping Layer

```
API Response (DTO)
    ↓
Mapper
    ↓
ViewModel
    ↓
Component
```

Benefit: UI lebih aman jika backend berubah

---

## 📊 Revised Scores

| Area              | Original | Revised |
| ----------------- | -------- | ------- |
| Architecture      | 9.8/10   | 9.9/10  |
| Backend Alignment | 9.6/10   | 9.8/10  |
| State Management  | 9.3/10   | 9.8/10  |
| UX                | 9.8/10   | 9.9/10  |
| Accessibility     | 9.5/10   | 9.5/10  |
| Error Handling    | 9.3/10   | 9.8/10  |
| Maintainability   | 9.8/10   | 9.9/10  |
| Scalability       | 9.6/10   | 9.8/10  |

**Revised Overall: 9.85/10**

---

## ✅ Checklist Revisi

- [ ] Pindahkan HTTP ke OrderService
- [ ] Pisahkan formatter ke lib/utils
- [ ] Ganti `<img>` dengan `<Image>`
- [ ] Gunakan error codes
- [ ] Tambahkan Retry button
- [ ] Gunakan semantic tokens
- [ ] Dokumentasikan Action Matrix
- [ ] Tambahkan state machine diagram extended
