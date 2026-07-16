# 🚀 IMPLEMENTATION GUIDE

**Based on:** `01-OVERVIEW.md`, `02-BACKEND.md`, `03-FRONTEND.md`, `04-TYPES.md`, `05-API.md`  
**Focus:** Step-by-step Implementation with Error Prevention

---

## 📋 Implementation Order

```
┌─────────────────────────────────────────────────────────────┐
│  PHASE 1: BACKEND FOUNDATION                              │
│  ├─ 1.1 Database Migration                                 │
│  ├─ 1.2 Update Order Lifecycle Types                      │
│  ├─ 1.3 Update Order Types & Mapper                       │
│  ├─ 1.4 Update Order Service                              │
│  ├─ 1.5 Update Order Controller                           │
│  ├─ 1.6 Create Category Service & Controller              │
│  └─ 1.7 Test All Backend Endpoints                        │
│                                                             │
│  PHASE 2: FRONTEND FOUNDATION                             │
│  ├─ 2.1 Update Type Definitions                           │
│  ├─ 2.2 Create Category Types & Service                  │
│  ├─ 2.3 Update Order Service                             │
│  └─ 2.4 Test All Frontend Services                       │
│                                                             │
│  PHASE 3: COMPONENT UPDATES                               │
│  ├─ 3.1 Update Orders Page                               │
│  ├─ 3.2 Update Order Components                          │
│  ├─ 3.3 Update Categories Page                            │
│  └─ 3.4 Rebuild Home Page                                │
│                                                             │
│  PHASE 4: INTEGRATION TESTING                             │
│  └─ 4.1 Full Integration Test                            │
└─────────────────────────────────────────────────────────────┘
```

---

## PHASE 1: BACKEND FOUNDATION

### Step 1.1: Database Migration

**Files:** `backend/prisma/schema.prisma`

#### 1.1.1 Update Schema

```bash
# Navigate to backend
cd backend
```

**Edit `backend/prisma/schema.prisma`:**

```prisma
// Add to Order model (after subtotal field)
model Order {
  // ... existing fields ...

  totalQuantity  Int         @default(0)
  totalItemCount Int         @default(0)
  subtotal       Decimal     @default(0)

  // 💰 FINANCIAL FIELDS - Fixes NaN issue
  shippingFee    Decimal     @default(0)
  tax            Decimal     @default(0)
  total          Decimal     @default(0)

  // ... rest of model ...
}

// Extend OrderStatus enum
enum OrderStatus {
  DRAFT
  WAITING_PAYMENT
  PAID
  PROCESSING      // 🆕 Added
  SHIPPING        // 🆕 Added
  DELIVERED       // 🆕 Added
  COMPLETED       // 🆕 Added
  EXPIRED
  CANCELLED
}
```

#### 1.1.2 Run Migration

```bash
# 1. Backup database (IMPORTANT!)
pg_dump -U postgres pasaria > backup_before_fix_$(date +%Y%m%d).sql

# 2. Validate schema
npx prisma validate

# 3. Create migration
npx prisma migrate dev --name add_order_financial_fields_and_extend_status

# 4. Generate client
npx prisma generate

# 5. Apply migration
npx prisma migrate deploy
```

#### 1.1.3 Verify Migration

```bash
# Check migration status
npx prisma migrate status

# Verify tables
psql -U postgres -d pasaria -c "\d Order"
```

**Expected Output:** Should show `shipping_fee`, `tax`, `total` columns

---

### Step 1.2: Update Order Lifecycle Types

**File:** `backend/modules/order/order-lifecycle.types.ts`

```typescript
// REPLACE entire file content with:

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

export const OrderStateTransitions = {
  DRAFT: {
    canTransitionTo: ['WAITING_PAYMENT', 'CANCELLED'] as const,
  },
  WAITING_PAYMENT: {
    canTransitionTo: ['PAID', 'EXPIRED', 'CANCELLED'] as const,
  },
  PAID: {
    canTransitionTo: ['PROCESSING', 'CANCELLED'] as const,
  },
  PROCESSING: {
    canTransitionTo: ['SHIPPING', 'CANCELLED'] as const,
  },
  SHIPPING: {
    canTransitionTo: ['DELIVERED', 'CANCELLED'] as const,
  },
  DELIVERED: {
    canTransitionTo: ['COMPLETED'] as const,
  },
  COMPLETED: {
    canTransitionTo: [] as const,
  },
  EXPIRED: {
    canTransitionTo: [] as const,
  },
  CANCELLED: {
    canTransitionTo: [] as const,
  },
} as const satisfies Record<
  OrderStatus,
  { canTransitionTo: readonly OrderStatus[] }
>;

export const TERMINAL_STATES: readonly OrderStatus[] = [
  'COMPLETED',
  'EXPIRED',
  'CANCELLED',
] as const;

export const PAYABLE_STATES: readonly OrderStatus[] = ['DRAFT'] as const;
```

---

### Step 1.3: Update Order Types & Mapper

**File:** `backend/modules/order/order.types.ts`

Add to `OrderDraft` interface:

```typescript
// Add these fields
readonly shippingFee: number;
readonly tax: number;
readonly total: number;
readonly shippingName?: string;
readonly shippingPhone?: string;
readonly shippingAddress?: string;
readonly shippingCity?: string;
readonly shippingPostalCode?: string;
```

**File:** `backend/modules/order/order.mapper.ts`

Update `toOrderDraft` method:

```typescript
toOrderDraft(order: OrderWithItems): OrderDraft {
  const items = order.items.map(item => ({
    productId: item.productId,
    productName: item.productName,
    unitPrice: Number(item.unitPrice),
    quantity: item.quantity,
    subtotal: Number(item.subtotal),
  }))

  return {
    id: order.id,
    userId: order.userId,
    status: order.status as OrderStatus,
    items,
    totalQuantity: order.totalQuantity,
    totalItemCount: order.totalItemCount,
    subtotal: Number(order.subtotal),

    // 💰 FINANCIAL FIELDS
    shippingFee: Number(order.shippingFee),
    tax: Number(order.tax),
    total: Number(order.total),

    // 📍 SHIPPING INFO
    shippingName: order.shippingName ?? undefined,
    shippingPhone: order.shippingPhone ?? undefined,
    shippingAddress: order.shippingAddress ?? undefined,
    shippingCity: order.shippingCity ?? undefined,
    shippingPostalCode: order.shippingPostalCode ?? undefined,

    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  }
}
```

---

### Step 1.4: Update Order Service

**File:** `backend/modules/order/order.service.ts`

1. Add `status` parameter to `getOrdersByUser`:

```typescript
async getOrdersByUser(
  userId: number,
  options?: {
    status?: OrderStatus | readonly OrderStatus[];
  }
): Promise<ReadonlyArray<OrderDraft>> {
  const whereClause: Prisma.OrderWhereInput = { userId };

  if (options?.status) {
    if (Array.isArray(options.status)) {
      whereClause.status = { in: options.status };
    } else {
      whereClause.status = options.status;
    }
  }

  const orders = await prisma.order.findMany({
    where: whereClause,
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });

  return orders.map(OrderMapper.toOrderDraft);
}
```

2. Add financial fields to `createDraft`:

```typescript
// Calculate from checkout preview
const shippingFee = checkoutPreview.shipping?.fee ?? 0;
const tax = checkoutPreview.summary.tax ?? 0;
const total = totals.subtotal + shippingFee + tax;

// Add to prisma.order.create data:
{
  subtotal: totals.subtotal,
  shippingFee,
  tax,
  total,
  shippingName: checkoutPreview.shipping?.recipientName,
  shippingPhone: checkoutPreview.shipping?.phone,
  shippingAddress: checkoutPreview.shipping?.address,
  shippingCity: checkoutPreview.shipping?.city,
  shippingPostalCode: checkoutPreview.shipping?.postalCode,
  // ... items
}
```

---

### Step 1.5: Update Order Controller

**File:** `backend/modules/order/order.controller.ts`

Update `getOrders` method with status filter:

```typescript
async getOrders(req: Request, res: Response): Promise<void> {
  try {
    const user = req.user as AuthenticatedUser | undefined;
    if (!user?.id) {
      res.status(401).json({
        success: false,
        error: { code: "UNAUTHORIZED", message: "Authentication required" },
      });
      return;
    }

    // Parse query parameters
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.min(Math.max(1, parseInt(req.query.limit as string, 10) || 10), 100);

    // Parse status filter
    const statusParam = req.query.status as string | undefined;
    let statusFilter: string | string[] | undefined;
    if (statusParam) {
      statusFilter = statusParam.includes(",")
        ? statusParam.split(",").map(s => s.trim().toUpperCase())
        : statusParam.toUpperCase();
    }

    // Get orders with filter
    const { OrderService } = await import("./order.service.js");
    const { OrderStatus } = await import("./order-lifecycle.types.js");

    let validatedStatus: OrderStatus | readonly OrderStatus[] | undefined;
    if (statusFilter) {
      const validStatuses = ['DRAFT', 'WAITING_PAYMENT', 'PAID', 'PROCESSING', 'SHIPPING', 'DELIVERED', 'COMPLETED', 'EXPIRED', 'CANCELLED'];
      if (Array.isArray(statusFilter)) {
        validatedStatus = statusFilter.filter((s): s is OrderStatus => validStatuses.includes(s));
      } else if (validStatuses.includes(statusFilter)) {
        validatedStatus = statusFilter as OrderStatus;
      }
    }

    const orders = await OrderService.getOrdersByUser(user.id, { status: validatedStatus });

    // Pagination
    const skip = (page - 1) * limit;
    const paginatedOrders = orders.slice(skip, skip + limit);

    res.status(200).json({
      success: true,
      data: {
        items: paginatedOrders.map(order => ({
          id: order.id,
          userId: order.userId,
          status: order.status,
          items: order.items,
          totalQuantity: order.totalQuantity,
          totalItemCount: order.totalItemCount,
          subtotal: order.subtotal,
          shippingFee: order.shippingFee,
          tax: order.tax,
          total: order.total,
          shippingName: order.shippingName,
          shippingPhone: order.shippingPhone,
          shippingAddress: order.shippingAddress,
          shippingCity: order.shippingCity,
          shippingPostalCode: order.shippingPostalCode,
          createdAt: order.createdAt instanceof Date ? order.createdAt.toISOString() : order.createdAt,
          updatedAt: order.updatedAt instanceof Date ? order.updatedAt.toISOString() : order.updatedAt,
        })),
        pagination: {
          page,
          limit,
          totalItems: orders.length,
          totalPages: Math.ceil(orders.length / limit),
        },
      },
    });
  } catch (error) {
    OrderController.handleError(error, res);
  }
}
```

---

### Step 1.6: Create Category Service & Controller

**New File:** `backend/modules/category/category.service.ts`

```typescript
import { prisma } from '../../infra/db/prisma.js';

export interface CategoryWithCount {
  id: number;
  name: string;
  icon: string;
  description: string;
  productCount: number;
}

function getIconForCategory(name: string): string {
  const iconMap: Record<string, string> = {
    Elektronik: '📱',
    Fashion: '👕',
    'Rumah Tangga': '🏠',
    Kecantikan: '💄',
    Olahraga: '⚽',
    'Makanan & Minuman': '🍕',
  };
  return iconMap[name] || '📦';
}

function getDescriptionForCategory(name: string): string {
  const descMap: Record<string, string> = {
    Elektronik: 'Smartphone, laptop, dan aksesoris elektronik',
    Fashion: 'Pakaian, sepatu, dan aksesoris fashion',
    'Rumah Tangga': 'Furniture, dekorasi, dan perlengkapan rumah',
    Kecantikan: 'Skincare, makeup, dan parfum',
    Olahraga: 'Alat olahraga dan perlengkapan fitness',
    'Makanan & Minuman': 'Makanan ringan, minuman, dan produk organik',
  };
  return descMap[name] || 'Produk berkualitas';
}

export const CategoryService = {
  async getAllWithProductCount(): Promise<ReadonlyArray<CategoryWithCount>> {
    const categories = await prisma.category.findMany({
      include: { _count: { select: { products: true } } },
      orderBy: { name: 'asc' },
    });

    return categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      icon: getIconForCategory(cat.name),
      description: getDescriptionForCategory(cat.name),
      productCount: cat._count.products,
    }));
  },

  async getByIdWithProductCount(id: number): Promise<CategoryWithCount | null> {
    const category = await prisma.category.findUnique({
      where: { id },
      include: { _count: { select: { products: true } } },
    });

    if (!category) return null;

    return {
      id: category.id,
      name: category.name,
      icon: getIconForCategory(category.name),
      description: getDescriptionForCategory(category.name),
      productCount: category._count.products,
    };
  },
} as const;
```

**New File:** `backend/modules/category/category.controller.ts`

```typescript
import { Request, Response } from 'express';
import { CategoryService } from './category.service.js';

export const CategoryController = {
  async getCategories(req: Request, res: Response): Promise<void> {
    try {
      const categories = await CategoryService.getAllWithProductCount();
      res.status(200).json({
        success: true,
        data: { items: categories },
      });
    } catch (error) {
      console.error('[CategoryController] getCategories error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch categories',
        },
      });
    }
  },

  async getCategoryById(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id) || id <= 0) {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Invalid category ID' },
        });
        return;
      }

      const category = await CategoryService.getByIdWithProductCount(id);
      if (!category) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Category not found' },
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: { category },
      });
    } catch (error) {
      console.error('[CategoryController] getCategoryById error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch category' },
      });
    }
  },
} as const;
```

---

### Step 1.7: Test Backend Endpoints

```bash
# Start backend
npm run dev

# Test in new terminal:
# 1. Health check
curl http://localhost:3000/health

# 2. Get categories
curl http://localhost:3000/categories

# 3. Get orders (requires auth - use saved cookie)
curl -b cookies_customer.txt http://localhost:3000/orders

# 4. Get orders with status filter
curl -b cookies_customer.txt "http://localhost:3000/orders?status=DRAFT,WAITING_PAYMENT"
```

---

## PHASE 2: FRONTEND FOUNDATION

### Step 2.1: Update Type Definitions

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

export interface OrderItem {
  id?: number;
  productId: number;
  productName: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}

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

---

### Step 2.2: Create Category Types & Service

**New File:** `frontend/src/types/api/category.types.ts`

```typescript
export interface Category {
  id: number;
  name: string;
  icon: string;
  description: string;
  productCount: number;
}

export interface CategoriesResponse {
  success: boolean;
  data: { items: Category[] };
}

export interface CategoryResponse {
  success: boolean;
  data: { category: Category };
}
```

**New File:** `frontend/src/services/category.service.ts`

```typescript
import apiClient from './api-client';
import type {
  Category,
  CategoriesResponse,
  CategoryResponse,
} from '@/types/api/category.types';

export const categoryService = {
  async getCategories(): Promise<Category[]> {
    const response = await apiClient.get<CategoriesResponse>('/categories');
    if (!response.data.success) {
      throw new Error(
        response.data.error?.message || 'Failed to fetch categories',
      );
    }
    return response.data.data.items;
  },

  async getCategoryById(id: number): Promise<Category> {
    const response = await apiClient.get<CategoryResponse>(`/categories/${id}`);
    if (!response.data.success) {
      throw new Error(
        response.data.error?.message || 'Failed to fetch category',
      );
    }
    return response.data.data.category;
  },
} as const;

export enum CategoryError {
  NETWORK = 'NETWORK',
  NOT_FOUND = 'NOT_FOUND',
  UNKNOWN = 'UNKNOWN',
}

export function handleCategoryError(error: unknown): CategoryError {
  if (error instanceof Error) {
    if (error.message.includes('404')) return CategoryError.NOT_FOUND;
    if (error.message.includes('network') || error.message.includes('fetch')) {
      return CategoryError.NETWORK;
    }
  }
  return CategoryError.UNKNOWN;
}
```

---

### Step 2.3: Update Order Service

**File:** `frontend/src/services/order.service.ts`

Add transform function and update methods:

```typescript
function transformOrderFromBE(beOrder: any): Order {
  return {
    id: beOrder.id,
    userId: beOrder.userId,
    status: beOrder.status,
    items: beOrder.items.map((item: any) => ({
      productId: item.productId,
      productName: item.productName,
      unitPrice: item.unitPrice ?? item.snapshotPrice ?? 0,
      quantity: item.quantity,
      subtotal: item.subtotal,
    })),
    subtotal: beOrder.subtotal,
    shippingFee: beOrder.shippingFee ?? 0,
    tax: beOrder.tax ?? 0,
    total: beOrder.total ?? beOrder.subtotal,
    totalQuantity: beOrder.totalQuantity,
    totalItemCount: beOrder.totalItemCount ?? beOrder.items.length,
    shippingName: beOrder.shippingName,
    shippingPhone: beOrder.shippingPhone,
    shippingAddress: beOrder.shippingAddress,
    shippingCity: beOrder.shippingCity,
    shippingPostalCode: beOrder.shippingPostalCode,
    createdAt: beOrder.createdAt,
    updatedAt: beOrder.updatedAt,
    payment: beOrder.payment,
  };
}

export const orderService = {
  async getOrders(
    page: number = 1,
    limit: number = 10,
    status?: string | string[],
  ): Promise<{ items: Order[]; pagination: {...} }> {
    const params: Record<string, string | number | undefined> = { page, limit };
    if (status) {
      params.status = Array.isArray(status) ? status.join(',') : status;
    }
    const response = await apiClient.get<BackendOrdersResponse>('/orders', { params });
    return {
      items: response.data.data.items.map(transformOrderFromBE),
      pagination: response.data.data.pagination,
    };
  },

  async getOrderById(orderId: number): Promise<Order> {
    const response = await apiClient.get<BackendOrderDetailResponse>(`/orders/${orderId}`);
    return transformOrderFromBE(response.data.data.order);
  },
};
```

---

## PHASE 3: COMPONENT UPDATES

### Step 3.1: Update Orders Page

**File:** `frontend/src/app/(main)/orders/page.tsx`

Replace `getStatusFilter` function:

```typescript
const TAB_STATUS_MAP: Record<OrderTab, string | string[] | undefined> = {
  all: undefined,
  pending: ['DRAFT', 'WAITING_PAYMENT'],
  processing: ['PAID'],
  shipped: ['PROCESSING', 'SHIPPING'],
  completed: ['DELIVERED', 'COMPLETED'],
  cancelled: ['EXPIRED', 'CANCELLED'],
};

const getStatusFilter = (tab: OrderTab): string | string[] | undefined => {
  return TAB_STATUS_MAP[tab];
};

const fetchOrders = async (pageNum: number = 1) => {
  orderStoreActions.setLoading(true);
  orderStoreActions.clearError();
  try {
    const statusFilter = getStatusFilter(activeTab);
    const response = await orderService.getOrders(pageNum, 10, statusFilter);
    orderStoreActions.setOrders(response.items, {
      page: response.pagination.page,
      totalPages: response.pagination.totalPages,
      totalItems: response.pagination.totalItems,
    });
  } catch (err) {
    orderStoreActions.setError(handleOrderError(err));
  } finally {
    orderStoreActions.setLoading(false);
  }
};
```

---

### Step 3.2: Update Order Components

**File:** `frontend/src/components/features/orders/order-card.tsx`

Update `OrderStatusButton` config:

```typescript
const statusConfig = {
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

Update price display:

```typescript
// Change: item.snapshotPrice → item.unitPrice
<p>{item.quantity}x {formatCurrency(item.unitPrice)}</p>
```

**File:** `frontend/src/components/features/orders/order-detail.tsx`

Add fallback for financial fields:

```typescript
<span>{formatCurrency(order.shippingFee ?? 0)}</span>
<span>{formatCurrency(order.tax ?? 0)}</span>
<span>{formatCurrency(order.total ?? order.subtotal)}</span>
```

---

### Step 3.3: Update Categories Page

**File:** `frontend/src/app/(main)/categories/page.tsx`

Convert to client component with API fetch - see `03-FRONTEND.md` section 6.

---

### Step 3.4: Rebuild Home Page

**File:** `frontend/src/app/(main)/page.tsx`

Full rebuild - see `03-FRONTEND.md` section 7.

---

## PHASE 4: INTEGRATION TESTING

### Step 4.1: Full Integration Test

#### Backend Tests

```bash
# Terminal 1 - Start backend
cd backend && npm run dev

# Terminal 2 - Run tests
# Test 1: Categories
curl http://localhost:3000/categories | jq

# Test 2: Orders with auth
curl -b cookies_customer.txt http://localhost:3000/orders | jq

# Test 3: Order detail
curl -b cookies_customer.txt http://localhost:3000/orders/1 | jq
```

#### Frontend Tests

```bash
# Start frontend
cd frontend && npm run dev

# Browser tests:
# 1. Home page loads with categories
# 2. Categories page shows data from API
# 3. Orders page shows tabs with correct data
# 4. Order detail shows financial fields (no NaN)
```

---

## 🛡️ Error Prevention Checklist

### Before Migration

- [ ] Backup database
- [ ] Review migration script
- [ ] Test on local database first

### During Development

- [ ] Run `npx prisma validate` after schema changes
- [ ] Run `npx prisma generate` after schema changes
- [ ] Check TypeScript errors: `npm run type-check`

### After Changes

- [ ] Test backend endpoints with curl/httpie
- [ ] Test frontend with network tab open
- [ ] Check for console errors
- [ ] Verify no NaN values in order display

---

## 🔄 Rollback Plan

### If Backend Migration Fails

```bash
# Restore from backup
psql -U postgres -d pasaria -f backup_before_fix_YYYYMMDD.sql
```

### If Frontend Type Errors

```bash
# Clear cache and rebuild
rm -rf frontend/node_modules/.cache
cd frontend && npm run type-check
```

---

## 📊 Success Metrics

| Metric            | Target                | How to Verify   |
| ----------------- | --------------------- | --------------- |
| Order detail page | No NaN values         | Visual check    |
| Orders page       | Correct tab filtering | Click each tab  |
| Categories page   | Shows real counts     | Compare with DB |
| Home page         | Loads in <3s          | Network tab     |
| No console errors | 0 errors              | Browser console |

---

**End of Implementation Guide**

For questions, refer to:

- `01-OVERVIEW.md` - Problem analysis
- `02-BACKEND.md` - Backend changes detail
- `03-FRONTEND.md` - Frontend changes detail
- `04-TYPES.md` - Type definitions
- `05-API.md` - API contract
