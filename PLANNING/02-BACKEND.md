# 📦 PERENCANAAN PERUBAHAN BACKEND

**Based on:** `01-OVERVIEW.md`  
**Focus:** Schema, Service, Controller Changes

---

## 1. Database Schema Changes

### File: `backend/prisma/schema.prisma`

#### 1.1 Tambahkan Field Financial ke Order Model

**Lokasi:** Baris 167-193

**Sebelum:**

```prisma
model Order {
  id             Int         @id @default(autoincrement())
  userId         Int
  user           User        @relation(fields: [userId], references: [id])
  status         OrderStatus @default(DRAFT)

  totalQuantity  Int         @default(0)
  totalItemCount Int        @default(0)
  subtotal       Decimal     @default(0)

  // Shipping info snapshot
  shippingName    String?
  shippingPhone   String?
  shippingAddress String?
  shippingCity    String?
  shippingPostalCode String?

  createdAt      DateTime    @default(now())
  updatedAt      DateTime    @updatedAt

  items          OrderItem[]
  payments       Payment[]
  timeline       OrderTimeline[]

  @@index([userId])
  @@index([status])
}
```

**Sesudah:**

```prisma
model Order {
  id             Int         @id @default(autoincrement())
  userId         Int
  user           User        @relation(fields: [userId], references: [id])
  status         OrderStatus @default(DRAFT)

  totalQuantity  Int         @default(0)
  totalItemCount Int         @default(0)
  subtotal       Decimal     @default(0)

  // 💰 FINANCIAL FIELDS - Fixes NaN issue
  shippingFee    Decimal     @default(0)
  tax            Decimal     @default(0)
  total          Decimal     @default(0)

  // Shipping info snapshot
  shippingName    String?
  shippingPhone   String?
  shippingAddress String?
  shippingCity    String?
  shippingPostalCode String?

  createdAt      DateTime    @default(now())
  updatedAt      DateTime    @updatedAt

  items          OrderItem[]
  payments       Payment[]
  timeline       OrderTimeline[]

  @@index([userId])
  @@index([status])
}
```

#### 1.2 Extend OrderStatus Enum

**Lokasi:** Baris 298-304

**Sebelum:**

```prisma
enum OrderStatus {
  DRAFT
  WAITING_PAYMENT
  PAID
  EXPIRED
  CANCELLED
}
```

**Sesudah:**

```prisma
enum OrderStatus {
  DRAFT
  WAITING_PAYMENT
  PAID
  PROCESSING      // 🆕 Added for shipping
  SHIPPING        // 🆕 Added for shipping
  DELIVERED       // 🆕 Added for completion
  COMPLETED       // 🆕 Added for user confirmation
  EXPIRED
  CANCELLED
}
```

---

## 2. Order Lifecycle Types Changes

### File: `backend/modules/order/order-lifecycle.types.ts`

#### 2.1 Extend OrderStatus Type

**Sebelum:**

```typescript
export type OrderStatus =
  | 'DRAFT'
  | 'WAITING_PAYMENT'
  | 'PAID'
  | 'EXPIRED'
  | 'CANCELLED';
```

**Sesudah:**

```typescript
export type OrderStatus =
  | 'DRAFT' // Keranjang → Order draft, awaiting payment
  | 'WAITING_PAYMENT' // Payment initiated, awaiting confirmation
  | 'PAID' // Payment confirmed
  | 'PROCESSING' // Seller preparing items
  | 'SHIPPING' // Package shipped
  | 'DELIVERED' // Package delivered to customer
  | 'COMPLETED' // Customer confirmed delivery
  | 'EXPIRED' // Payment timeout
  | 'CANCELLED'; // Order cancelled
```

#### 2.2 Extend State Transitions

**Sebelum:**

```typescript
export const OrderStateTransitions = {
  DRAFT: {
    canTransitionTo: ['WAITING_PAYMENT', 'CANCELLED'] as const,
  },
  WAITING_PAYMENT: {
    canTransitionTo: ['PAID', 'EXPIRED', 'CANCELLED'] as const,
  },
  PAID: {
    canTransitionTo: [] as const, // Terminal
  },
  EXPIRED: {
    canTransitionTo: [] as const, // Terminal
  },
  CANCELLED: {
    canTransitionTo: [] as const, // Terminal
  },
} as const;
```

**Sesudah:**

```typescript
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
    canTransitionTo: [] as const, // Terminal
  },
  EXPIRED: {
    canTransitionTo: [] as const, // Terminal
  },
  CANCELLED: {
    canTransitionTo: [] as const, // Terminal
  },
} as const satisfies Record<
  OrderStatus,
  { canTransitionTo: readonly OrderStatus[] }
>;
```

#### 2.3 Update Terminal & Payable States

**Sebelum:**

```typescript
export const TERMINAL_STATES: readonly OrderStatus[] = [
  'PAID',
  'EXPIRED',
  'CANCELLED',
] as const;

export const PAYABLE_STATES: readonly OrderStatus[] = ['DRAFT'] as const;
```

**Sesudah:**

```typescript
// Terminal states are final (no more transitions allowed)
export const TERMINAL_STATES: readonly OrderStatus[] = [
  'COMPLETED',
  'EXPIRED',
  'CANCELLED',
] as const;

// States that can initiate payment
export const PAYABLE_STATES: readonly OrderStatus[] = ['DRAFT'] as const;

// States visible to customer in order list
export const CUSTOMER_VISIBLE_STATES: readonly OrderStatus[] = [
  'DRAFT',
  'WAITING_PAYMENT',
  'PAID',
  'PROCESSING',
  'SHIPPING',
  'DELIVERED',
  'COMPLETED',
  'EXPIRED',
  'CANCELLED',
] as const;
```

---

## 3. Order Types Changes

### File: `backend/modules/order/order.types.ts`

#### 3.1 Extend OrderDraft Interface

**Sebelum:**

```typescript
export interface OrderDraft {
  readonly id: number;
  readonly userId: number;
  readonly status: OrderStatus;
  readonly items: ReadonlyArray<OrderItemSnapshot>;
  readonly totalQuantity: number;
  readonly totalItemCount: number;
  readonly subtotal: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
```

**Sesudah:**

```typescript
export interface OrderDraft {
  readonly id: number;
  readonly userId: number;
  readonly status: OrderStatus;
  readonly items: ReadonlyArray<OrderItemSnapshot>;
  readonly totalQuantity: number;
  readonly totalItemCount: number;
  readonly subtotal: number;

  // 💰 FINANCIAL FIELDS - Fixes NaN issue
  readonly shippingFee: number;
  readonly tax: number;
  readonly total: number;

  readonly createdAt: Date;
  readonly updatedAt: Date;
}
```

#### 3.2 Add Optional Shipping Fields

```typescript
export interface OrderDraft {
  // ... existing fields

  // 📍 SHIPPING INFO (optional, filled during checkout)
  readonly shippingName?: string;
  readonly shippingPhone?: string;
  readonly shippingAddress?: string;
  readonly shippingCity?: string;
  readonly shippingPostalCode?: string;
}
```

---

## 4. Order Mapper Changes

### File: `backend/modules/order/order.mapper.ts`

#### 4.1 Update toOrderDraft Method

**Sebelum:**

```typescript
toOrderDraft(order: OrderWithItems): OrderDraft {
  const items: ReadonlyArray<OrderItemSnapshot> = order.items.map(item => ({
    productId: item.productId,
    productName: item.productName,
    unitPrice: Number(item.unitPrice),
    quantity: item.quantity,
    subtotal: Number(item.subtotal),
  }))

  return {
    id: order.id,
    userId: order.userId,
    status: order.status as "DRAFT",  // ⚠️ HARDCODED!
    items,
    totalQuantity: order.totalQuantity,
    totalItemCount: order.totalItemCount,
    subtotal: Number(order.subtotal),
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  }
}
```

**Sesudah:**

```typescript
toOrderDraft(order: OrderWithItems): OrderDraft {
  const items: ReadonlyArray<OrderItemSnapshot> = order.items.map(item => ({
    productId: item.productId,
    productName: item.productName,
    unitPrice: Number(item.unitPrice),
    quantity: item.quantity,
    subtotal: Number(item.subtotal),
  }))

  return {
    id: order.id,
    userId: order.userId,
    status: order.status as OrderStatus,  // ✅ Dynamically mapped
    items,
    totalQuantity: order.totalQuantity,
    totalItemCount: order.totalItemCount,
    subtotal: Number(order.subtotal),

    // 💰 FINANCIAL FIELDS - Fixes NaN issue
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

## 5. Order Service Changes

### File: `backend/modules/order/order.service.ts`

#### 5.1 Update createDraft Method

**Sebelum:**

```typescript
async createDraft(input: CreateDraftInput): Promise<OrderDraft> {
  // ... validation ...

  const order = await prisma.order.create({
    data: {
      userId: checkoutPreview.summary.userId,
      status: "DRAFT",
      totalQuantity: totals.totalQuantity,
      totalItemCount: totals.totalItemCount,
      subtotal: totals.subtotal,
      // ... items ...
    },
    include: { items: true },
  })

  return OrderMapper.toOrderDraft(order)
}
```

**Sesudah:**

```typescript
async createDraft(input: CreateDraftInput): Promise<OrderDraft> {
  // ... validation ...

  // Calculate financial fields from checkout
  const shippingFee = checkoutPreview.shipping?.fee ?? 0
  const tax = checkoutPreview.summary.tax ?? 0
  const total = totals.subtotal + shippingFee + tax

  const order = await prisma.order.create({
    data: {
      userId: checkoutPreview.summary.userId,
      status: "DRAFT",
      totalQuantity: totals.totalQuantity,
      totalItemCount: totals.totalItemCount,
      subtotal: totals.subtotal,

      // 💰 FINANCIAL FIELDS
      shippingFee,
      tax,
      total,

      // 📍 SHIPPING INFO (from checkout)
      shippingName: checkoutPreview.shipping?.recipientName,
      shippingPhone: checkoutPreview.shipping?.phone,
      shippingAddress: checkoutPreview.shipping?.address,
      shippingCity: checkoutPreview.shipping?.city,
      shippingPostalCode: checkoutPreview.shipping?.postalCode,

      items: {
        create: orderItems.map((item) => ({
          productId: item.productId,
          productName: item.productName,
          unitPrice: item.unitPrice,
          quantity: item.quantity,
          subtotal: item.subtotal,
        })),
      },
    },
    include: { items: true },
  })

  return OrderMapper.toOrderDraft(order)
}
```

#### 5.2 Add Status Filter to getOrdersByUser

**Sebelum:**

```typescript
async getOrdersByUser(userId: number): Promise<ReadonlyArray<OrderDraft>> {
  const orders = await prisma.order.findMany({
    where: { userId },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  })

  return orders.map((order) => OrderMapper.toOrderDraft(order))
}
```

**Sesudah:**

```typescript
async getOrdersByUser(
  userId: number,
  options?: {
    status?: OrderStatus | readonly OrderStatus[];
  }
): Promise<ReadonlyArray<OrderDraft>> {
  const whereClause: Prisma.OrderWhereInput = {
    userId,
  };

  // Apply status filter if provided
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

  return orders.map((order) => OrderMapper.toOrderDraft(order));
}
```

---

## 6. Order Controller Changes

### File: `backend/modules/order/order.controller.ts`

#### 6.1 Update getOrders Method

**Sebelum:**

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

    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit as string, 10) || 10, 100);
    const skip = (page - 1) * limit;

    const { OrderService } = await import("./order.service.js");
    const allOrders = await OrderService.getOrdersByUser(user.id);

    const paginatedOrders = allOrders.slice(skip, skip + limit);

    res.status(200).json({
      success: true,
      data: {
        items: paginatedOrders,
        pagination: { page, limit, totalItems: allOrders.length, totalPages: Math.ceil(allOrders.length / limit) },
      },
    });
  } catch (error) {
    OrderController.handleError(error, res);
  }
}
```

**Sesudah:**

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
    const skip = (page - 1) * limit;

    // Parse status filter
    const statusParam = req.query.status as string | undefined;
    let statusFilter: string | string[] | undefined;

    if (statusParam) {
      // Support comma-separated values: ?status=DRAFT,WAITING_PAYMENT
      statusFilter = statusParam.includes(",")
        ? statusParam.split(",").map(s => s.trim().toUpperCase())
        : statusParam.toUpperCase();
    }

    // Get orders with filter
    const { OrderService } = await import("./order.service.js");
    const { OrderStatus } = await import("./order-lifecycle.types.js");

    // Validate status values
    let validatedStatus: OrderStatus | readonly OrderStatus[] | undefined;
    if (statusFilter) {
      if (Array.isArray(statusFilter)) {
        validatedStatus = statusFilter.filter((s): s is OrderStatus =>
          ['DRAFT', 'WAITING_PAYMENT', 'PAID', 'PROCESSING', 'SHIPPING', 'DELIVERED', 'COMPLETED', 'EXPIRED', 'CANCELLED'].includes(s)
        );
      } else {
        if (['DRAFT', 'WAITING_PAYMENT', 'PAID', 'PROCESSING', 'SHIPPING', 'DELIVERED', 'COMPLETED', 'EXPIRED', 'CANCELLED'].includes(statusFilter)) {
          validatedStatus = statusFilter as OrderStatus;
        }
      }
    }

    const orders = await OrderService.getOrdersByUser(user.id, {
      status: validatedStatus,
    });

    // Apply pagination
    const totalItems = orders.length;
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
          totalItems,
          totalPages: Math.ceil(totalItems / limit),
        },
      },
    });
  } catch (error) {
    OrderController.handleError(error, res);
  }
}
```

---

## 7. Category Service & Controller

### File: `backend/modules/category/category.service.ts` (Buat baru jika tidak ada)

```typescript
import { prisma } from '../../infra/db/prisma.js';

/**
 * Category with product count
 */
export interface CategoryWithCount {
  id: number;
  name: string;
  icon: string;
  description: string;
  productCount: number;
}

/**
 * Helper to get icon for category
 */
function getIconForCategory(name: string): string {
  const iconMap: Record<string, string> = {
    Elektronik: '📱',
    Fashion: '👕',
    'Rumah Tangga': '🏠',
    Kecantikan: '💄',
    Olahraga: '⚽',
    'Makanan & Minuman': '🍕',
    default: '📦',
  };
  return iconMap[name] || iconMap['default'];
}

/**
 * Helper to get description for category
 */
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
  /**
   * Get all categories with product count
   */
  async getAllWithProductCount(): Promise<ReadonlyArray<CategoryWithCount>> {
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: { products: true },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    return categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      icon: getIconForCategory(cat.name),
      description: getDescriptionForCategory(cat.name),
      productCount: cat._count.products,
    }));
  },

  /**
   * Get category by ID with product count
   */
  async getByIdWithProductCount(id: number): Promise<CategoryWithCount | null> {
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: { products: true },
        },
      },
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

### File: `backend/modules/category/category.controller.ts` (Update/Add)

```typescript
import { Request, Response } from 'express';
import { CategoryService } from './category.service.js';

export const CategoryController = {
  /**
   * GET /categories
   *
   * Get all categories with product count
   *
   * Response: 200 OK with categories array
   */
  async getCategories(req: Request, res: Response): Promise<void> {
    try {
      const categories = await CategoryService.getAllWithProductCount();

      res.status(200).json({
        success: true,
        data: {
          items: categories,
        },
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

  /**
   * GET /categories/:id
   *
   * Get category by ID with product count
   *
   * Response: 200 OK with category, 404 if not found
   */
  async getCategoryById(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);

      if (isNaN(id) || id <= 0) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid category ID',
          },
        });
        return;
      }

      const category = await CategoryService.getByIdWithProductCount(id);

      if (!category) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Category not found',
          },
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          category,
        },
      });
    } catch (error) {
      console.error('[CategoryController] getCategoryById error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch category',
        },
      });
    }
  },
} as const;
```

---

## 8. File Changes Summary

### Files to Modify

| File                                             | Action | Changes                                   |
| ------------------------------------------------ | ------ | ----------------------------------------- |
| `backend/prisma/schema.prisma`                   | Modify | Add financial fields + extend OrderStatus |
| `backend/modules/order/order-lifecycle.types.ts` | Modify | Extend status + transitions               |
| `backend/modules/order/order.types.ts`           | Modify | Extend OrderDraft interface               |
| `backend/modules/order/order.mapper.ts`          | Modify | Map new fields                            |
| `backend/modules/order/order.service.ts`         | Modify | Add financial fields + status filter      |
| `backend/modules/order/order.controller.ts`      | Modify | Handle status query param                 |

### Files to Create

| File                                              | Purpose                             |
| ------------------------------------------------- | ----------------------------------- |
| `backend/modules/category/category.service.ts`    | Category queries with product count |
| `backend/modules/category/category.controller.ts` | Category endpoints                  |

### Files to Update (Routes)

| File                                          | Action                                      |
| --------------------------------------------- | ------------------------------------------- |
| `backend/modules/category/category.routes.ts` | Add GET /categories and GET /categories/:id |

---

## 9. Migration Steps

```bash
# 1. Backup database
pg_dump -U postgres pasaria > backup_before_fix_$(date +%Y%m%d).sql

# 2. Update schema
npx prisma format

# 3. Create migration
npx prisma migrate dev --name add_order_financial_fields_and_extend_status

# 4. Generate client
npx prisma generate

# 5. Test migration
npx prisma migrate deploy

# 6. Restart backend
npm run dev
```

---

## 10. Testing Checklist

### Backend Testing

- [ ] GET /health still returns UP
- [ ] GET /orders returns orders with financial fields
- [ ] GET /orders?status=DRAFT returns only DRAFT orders
- [ ] GET /orders?status=DRAFT,WAITING_PAYMENT returns matching orders
- [ ] GET /orders/:id returns order with financial fields
- [ ] POST /orders/draft creates order with financial fields
- [ ] GET /categories returns categories with productCount
- [ ] GET /categories/:id returns category with productCount

### Error Cases

- [ ] GET /orders with invalid status param returns 400
- [ ] GET /orders/:id with non-existent ID returns 404
- [ ] GET /categories/:id with non-existent ID returns 404
- [ ] GET /orders without auth returns 401

---

**Next:** See `03-FRONTEND.md` for frontend changes
