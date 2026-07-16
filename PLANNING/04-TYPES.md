# 📝 TYPE DEFINITIONS - SHARED CONTRACT

**Based on:** `01-OVERVIEW.md`, `02-BACKEND.md`, `03-FRONTEND.md`  
**Focus:** Unified Type Definitions for Backend & Frontend

---

## 1. Order Types

### 1.1 OrderStatus Enum (Source of Truth)

```typescript
// ✅ FRONTEND & BACKEND AGREED STATUS
export type OrderStatus =
  | 'DRAFT' // Keranjang → Order draft, awaiting payment initiation
  | 'WAITING_PAYMENT' // Payment initiated, awaiting confirmation
  | 'PAID' // Payment confirmed
  | 'PROCESSING' // Seller preparing items
  | 'SHIPPING' // Package shipped
  | 'DELIVERED' // Package delivered to customer
  | 'COMPLETED' // Customer confirmed delivery
  | 'EXPIRED' // Payment timeout exceeded
  | 'CANCELLED'; // Order cancelled
```

### 1.2 OrderItemSnapshot

```typescript
// ✅ Matches BE: OrderItemSnapshot
export interface OrderItemSnapshot {
  readonly productId: number;
  readonly productName: string;
  readonly unitPrice: number;
  readonly quantity: number;
  readonly subtotal: number;
}
```

### 1.3 OrderDraft (Backend)

```typescript
// ✅ BACKEND TYPE - Matches exactly
export interface OrderDraft {
  readonly id: number;
  readonly userId: number;
  readonly status: OrderStatus;
  readonly items: ReadonlyArray<OrderItemSnapshot>;
  readonly totalQuantity: number;
  readonly totalItemCount: number;
  readonly subtotal: number;
  // 💰 FINANCIAL FIELDS
  readonly shippingFee: number;
  readonly tax: number;
  readonly total: number;
  // 📍 SHIPPING INFO
  readonly shippingName?: string;
  readonly shippingPhone?: string;
  readonly shippingAddress?: string;
  readonly shippingCity?: string;
  readonly shippingPostalCode?: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
```

### 1.4 Order (Frontend)

```typescript
// ✅ FRONTEND TYPE - Matches BE response
export interface Order {
  id: number;
  userId: number;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  shippingFee: number;
  tax: number;
  total: number;
  totalQuantity: number;
  totalItemCount: number;
  // 📍 SHIPPING INFO
  shippingName?: string;
  shippingPhone?: string;
  shippingAddress?: string;
  shippingCity?: string;
  shippingPostalCode?: string;
  createdAt: string;
  updatedAt: string;
  payment?: PaymentInfo;
}
```

### 1.5 OrderItem

```typescript
// ✅ FRONTEND TYPE - Handles BE response
export interface OrderItem {
  id?: number; // Optional - BE sends item without id
  productId: number;
  productName: string;
  unitPrice: number; // BE sends 'unitPrice'
  quantity: number;
  subtotal: number;
  // Note: BE does NOT send productImage
  // Use placeholder based on productName.charAt(0)
}
```

---

## 2. Category Types

### 2.1 CategoryWithCount (Backend)

```typescript
// ✅ BACKEND TYPE
export interface CategoryWithCount {
  readonly id: number;
  readonly name: string;
  readonly icon: string;
  readonly description: string;
  readonly productCount: number;
}
```

### 2.2 Category (Frontend)

```typescript
// ✅ FRONTEND TYPE - Matches BE response
export interface Category {
  id: number;
  name: string;
  icon: string;
  description: string;
  productCount: number;
}
```

---

## 3. API Response Types

### 3.1 Standard Success Response

```typescript
// ✅ STANDARD SUCCESS
export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
}
```

### 3.2 Standard Error Response

```typescript
// ✅ STANDARD ERROR
export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
}
```

### 3.3 Orders List Response

```typescript
// ✅ BACKEND RESPONSE
export interface OrdersListResponse {
  success: true;
  data: {
    items: Array<{
      id: number;
      userId: number;
      status: OrderStatus;
      items: OrderItemSnapshot[];
      totalQuantity: number;
      totalItemCount: number;
      subtotal: number;
      shippingFee: number;
      tax: number;
      total: number;
      shippingName?: string;
      shippingPhone?: string;
      shippingAddress?: string;
      shippingCity?: string;
      shippingPostalCode?: string;
      createdAt: string; // ISO string
      updatedAt: string; // ISO string
    }>;
    pagination: {
      page: number;
      limit: number;
      totalItems: number;
      totalPages: number;
    };
  };
}
```

### 3.4 Order Detail Response

```typescript
// ✅ BACKEND RESPONSE
export interface OrderDetailResponse {
  success: true;
  data: {
    order: {
      id: number;
      userId: number;
      status: OrderStatus;
      items: OrderItemSnapshot[];
      totalQuantity: number;
      totalItemCount: number;
      subtotal: number;
      shippingFee: number;
      tax: number;
      total: number;
      shippingName?: string;
      shippingPhone?: string;
      shippingAddress?: string;
      shippingCity?: string;
      shippingPostalCode?: string;
      createdAt: string;
      updatedAt: string;
    };
  };
}
```

### 3.5 Categories List Response

```typescript
// ✅ BACKEND RESPONSE
export interface CategoriesListResponse {
  success: true;
  data: {
    items: CategoryWithCount[];
  };
}
```

### 3.6 Single Category Response

```typescript
// ✅ BACKEND RESPONSE
export interface CategoryDetailResponse {
  success: true;
  data: {
    category: CategoryWithCount;
  };
}
```

---

## 4. Frontend Request Types

### 4.1 Get Orders Query Parameters

```typescript
// ✅ FRONTEND → BACKEND
export interface GetOrdersQuery {
  page?: number;
  limit?: number;
  status?: string; // Comma-separated: "DRAFT,WAITING_PAYMENT"
}
```

### 4.2 Frontend Order Service Response

```typescript
// ✅ FRONTEND INTERNAL
export interface OrdersServiceResponse {
  items: Order[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
}
```

---

## 5. Status Mapping Reference

### 5.1 Tab to Backend Status Mapping

```typescript
// ✅ FRONTEND TAB → BACKEND STATUS
export const TAB_STATUS_MAP: Record<string, OrderStatus[] | undefined> = {
  all: undefined,
  pending: ['DRAFT', 'WAITING_PAYMENT'],
  processing: ['PAID'],
  shipped: ['PROCESSING', 'SHIPPING'],
  completed: ['DELIVERED', 'COMPLETED'],
  cancelled: ['EXPIRED', 'CANCELLED'],
};
```

### 5.2 Status to Label Mapping

```typescript
// ✅ FRONTEND & BACKEND AGREED LABELS
export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  DRAFT: 'Draft',
  WAITING_PAYMENT: 'Menunggu Pembayaran',
  PAID: 'Sudah Dibayar',
  PROCESSING: 'Sedang Diproses',
  SHIPPING: 'Sedang Dikirim',
  DELIVERED: 'Pesanan Tiba',
  COMPLETED: 'Selesai',
  EXPIRED: 'Kedaluwarsa',
  CANCELLED: 'Dibatalkan',
};
```

### 5.3 Status to Color Mapping

```typescript
// ✅ FRONTEND UI COLORS
export const ORDER_STATUS_COLORS: Record<
  OrderStatus,
  { bg: string; text: string }
> = {
  DRAFT: { bg: 'bg-secondary-300', text: 'text-white' },
  WAITING_PAYMENT: { bg: 'bg-amber-500', text: 'text-white' },
  PAID: { bg: 'bg-blue-500', text: 'text-white' },
  PROCESSING: { bg: 'bg-blue-600', text: 'text-white' },
  SHIPPING: { bg: 'bg-purple-500', text: 'text-white' },
  DELIVERED: { bg: 'bg-indigo-500', text: 'text-white' },
  COMPLETED: { bg: 'bg-green-600', text: 'text-white' },
  EXPIRED: { bg: 'bg-secondary-400', text: 'text-white' },
  CANCELLED: { bg: 'bg-red-100', text: 'text-red-600' },
};
```

---

## 6. Timeline Steps

### 6.1 Complete Timeline

```typescript
// ✅ FRONTEND ORDER TIMELINE
export const ORDER_TIMELINE_STEPS: readonly {
  status: OrderStatus;
  label: string;
}[] = [
  { status: 'DRAFT', label: 'Pesanan Dibuat' },
  { status: 'WAITING_PAYMENT', label: 'Menunggu Pembayaran' },
  { status: 'PAID', label: 'Pembayaran Diterima' },
  { status: 'PROCESSING', label: 'Sedang Diproses' },
  { status: 'SHIPPING', label: 'Sedang Dikirim' },
  { status: 'DELIVERED', label: 'Pesanan Tiba' },
  { status: 'COMPLETED', label: 'Selesai' },
];
```

### 6.2 Terminal States

```typescript
// ✅ STATES WITH NO MORE TRANSITIONS
export const TERMINAL_STATES: readonly OrderStatus[] = [
  'COMPLETED',
  'EXPIRED',
  'CANCELLED',
] as const;
```

### 6.3 Payable States

```typescript
// ✅ STATES WHERE PAYMENT CAN BE INITIATED
export const PAYABLE_STATES: readonly OrderStatus[] = ['DRAFT'] as const;
```

---

## 7. State Transitions

### 7.1 Valid Transitions Map

```typescript
// ✅ BACKEND STATE MACHINE
export const ORDER_STATE_TRANSITIONS: Readonly<
  Record<OrderStatus, readonly OrderStatus[]>
> = {
  DRAFT: ['WAITING_PAYMENT', 'CANCELLED'],
  WAITING_PAYMENT: ['PAID', 'EXPIRED', 'CANCELLED'],
  PAID: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['SHIPPING', 'CANCELLED'],
  SHIPPING: ['DELIVERED', 'CANCELLED'],
  DELIVERED: ['COMPLETED'],
  COMPLETED: [],
  EXPIRED: [],
  CANCELLED: [],
};
```

---

## 8. Type Validation

### 8.1 Type Guard for OrderStatus

```typescript
// ✅ FRONTEND
export function isOrderStatus(value: unknown): value is OrderStatus {
  return (
    typeof value === 'string' &&
    [
      'DRAFT',
      'WAITING_PAYMENT',
      'PAID',
      'PROCESSING',
      'SHIPPING',
      'DELIVERED',
      'COMPLETED',
      'EXPIRED',
      'CANCELLED',
    ].includes(value)
  );
}
```

### 8.2 Type Guard for Order

```typescript
// ✅ FRONTEND
export function isOrder(obj: unknown): obj is Order {
  if (typeof obj !== 'object' || obj === null) return false;
  const order = obj as Record<string, unknown>;
  return (
    typeof order.id === 'number' &&
    typeof order.userId === 'number' &&
    isOrderStatus(order.status) &&
    Array.isArray(order.items)
  );
}
```

---

## 9. Complete File Structure

### 9.1 Backend Types Location

```
backend/
├── modules/
│   └── order/
│       ├── order-lifecycle.types.ts  ← OrderStatus, TRANSITIONS, TERMINAL_STATES
│       └── order.types.ts           ← OrderDraft, OrderItemSnapshot, CreateDraftInput
│   └── category/
│       └── category.types.ts         ← CategoryWithCount
└── shared/
    └── types/
        └── api-response.types.ts     ← ApiSuccessResponse, ApiErrorResponse
```

### 9.2 Frontend Types Location

```
frontend/src/
├── types/
│   └── api/
│       ├── order.types.ts           ← Order, OrderItem, OrderStatus
│       ├── category.types.ts         ← Category, CategoriesResponse
│       └── index.ts                 ← Re-exports
├── services/
│   ├── order.service.ts             ← Uses types
│   └── category.service.ts          ← Uses types
└── lib/
    └── constants/
        └── order.constants.ts       ← TAB_STATUS_MAP, LABELS, COLORS
```

---

## 10. Migration Notes

### 10.1 Field Name Mapping

| Backend Field      | Frontend Field       | Notes                                   |
| ------------------ | -------------------- | --------------------------------------- |
| `unitPrice`        | `unitPrice`          | ✅ Same                                 |
| `snapshotPrice`    | N/A                  | ❌ Don't use - not in BE response       |
| `productImage`     | N/A                  | ❌ Not in BE response - use placeholder |
| `createdAt` (Date) | `createdAt` (string) | ✅ Converted to ISO string              |
| `updatedAt` (Date) | `updatedAt` (string) | ✅ Converted to ISO string              |

### 10.2 Null Safety

```typescript
// ✅ ALWAYS PROVIDE FALLBACKS
const shippingFee = order.shippingFee ?? 0;
const tax = order.tax ?? 0;
const total = order.total ?? order.subtotal;
```

---

**Next:** See `05-API.md` for complete API contract
