# 🎨 PERENCANAAN PERUBAHAN FRONTEND

**Based on:** `01-OVERVIEW.md`, `02-BACKEND.md`  
**Focus:** Type Updates, Service Updates, Component Updates

---

## 1. Type Definitions Updates

### File: `frontend/src/types/api/order.types.ts`

#### 1.1 Update OrderStatus Type

**Sebelum:**

```typescript
export type OrderStatus =
  | 'DRAFT'
  | 'PENDING'
  | 'PAID'
  | 'CANCELLED'
  | 'EXPIRED';
```

**Sesudah:**

```typescript
export type OrderStatus =
  | 'DRAFT' // Keranjang → Order draft
  | 'WAITING_PAYMENT' // Menunggu pembayaran
  | 'PAID' // Sudah dibayar
  | 'PROCESSING' // Sedang diproses seller
  | 'SHIPPING' // Sedang dikirim
  | 'DELIVERED' // Pesanan tiba
  | 'COMPLETED' // Selesai (user konfirmasi)
  | 'EXPIRED' // Pembayaran kadaluarsa
  | 'CANCELLED'; // Dibatalkan
```

#### 1.2 Update Order Interface

**Sebelum:**

```typescript
export interface Order {
  id: number;
  userId: number;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  shippingFee: number; // ← Expecting but BE doesn't send
  tax: number; // ← Expecting but BE doesn't send
  total: number; // ← Expecting but BE doesn't send
  totalQuantity: number;
  createdAt: string;
  updatedAt: string;
  payment?: PaymentInfo;
}
```

**Sesudah:**

```typescript
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

#### 1.3 Update OrderItem Interface

**Sebelum:**

```typescript
export interface OrderItem {
  id: number;
  productId: number;
  productName: string;
  productImage: string | null;
  quantity: number;
  snapshotPrice: number;
  subtotal: number;
}
```

**Sesudah:**

```typescript
export interface OrderItem {
  id?: number; // Optional - BE might not send id
  productId: number;
  productName: string;
  unitPrice: number; // ← Renamed from snapshotPrice
  quantity: number;
  subtotal: number;
  // Note: productImage is NOT in BE response
  // Frontend needs to handle missing image
}
```

---

### File: `frontend/src/types/api/category.types.ts` (Buat baru)

```typescript
/**
 * Category with product count (from API)
 */
export interface Category {
  id: number;
  name: string;
  icon: string;
  description: string;
  productCount: number;
}

/**
 * API Response for categories
 */
export interface CategoriesResponse {
  success: boolean;
  data: {
    items: Category[];
  };
}

/**
 * API Response for single category
 */
export interface CategoryResponse {
  success: boolean;
  data: {
    category: Category;
  };
}
```

---

## 2. Service Updates

### File: `frontend/src/services/order.service.ts`

#### 2.1 Update getOrders Method

**Sebelum:**

```typescript
async getOrders(
  page: number = 1,
  limit: number = 10,
): Promise<{ items: Order[]; pagination: {...} }> {
  const response = await apiClient.get<BackendOrdersResponse>('/orders', {
    params: { page, limit },
  });

  return {
    items: response.data.data.items,
    pagination: response.data.data.pagination,
  };
}
```

**Sesudah:**

```typescript
async getOrders(
  page: number = 1,
  limit: number = 10,
  status?: string | string[],  // 🆕 Added status filter
): Promise<{ items: Order[]; pagination: {...} }> {
  const params: Record<string, string | number | undefined> = { page, limit };

  // Handle status filter
  if (status) {
    if (Array.isArray(status)) {
      params.status = status.join(',');
    } else {
      params.status = status;
    }
  }

  const response = await apiClient.get<BackendOrdersResponse>('/orders', {
    params,
  });

  // Transform BE response to FE format
  const items = response.data.data.items.map(transformOrderFromBE);

  return {
    items,
    pagination: response.data.data.pagination,
  };
}
```

#### 2.2 Add Transform Function

```typescript
/**
 * Transform backend order to frontend format
 * Handles field name differences and missing fields
 */
function transformOrderFromBE(beOrder: any): Order {
  return {
    id: beOrder.id,
    userId: beOrder.userId,
    status: beOrder.status,
    items: beOrder.items.map((item: any) => ({
      productId: item.productId,
      productName: item.productName,
      unitPrice: item.unitPrice ?? item.snapshotPrice ?? 0, // Fallback
      quantity: item.quantity,
      subtotal: item.subtotal,
      // productImage might not be in BE response - handled elsewhere
    })),
    subtotal: beOrder.subtotal,
    shippingFee: beOrder.shippingFee ?? 0, // Default if missing
    tax: beOrder.tax ?? 0, // Default if missing
    total: beOrder.total ?? beOrder.subtotal, // Fallback to subtotal
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
```

#### 2.3 Update getOrderById Method

**Sebelum:**

```typescript
async getOrderById(orderId: number): Promise<Order> {
  const response = await apiClient.get<BackendOrderDetailResponse>(
    `/orders/${orderId}`
  );
  return response.data.data.order;
}
```

**Sesudah:**

```typescript
async getOrderById(orderId: number): Promise<Order> {
  const response = await apiClient.get<BackendOrderDetailResponse>(
    `/orders/${orderId}`
  );
  return transformOrderFromBE(response.data.data.order);
}
```

---

### File: `frontend/src/services/category.service.ts` (Buat baru)

```typescript
/**
 * Category Service
 * Handles all category-related API calls
 */

import apiClient from './api-client';
import type {
  Category,
  CategoriesResponse,
  CategoryResponse,
} from '@/types/api/category.types';

export const categoryService = {
  /**
   * Get all categories with product count
   * Endpoint: GET /categories
   */
  async getCategories(): Promise<Category[]> {
    const response = await apiClient.get<CategoriesResponse>('/categories');

    if (!response.data.success) {
      throw new Error(
        response.data.error?.message || 'Failed to fetch categories',
      );
    }

    return response.data.data.items;
  },

  /**
   * Get category by ID with product count
   * Endpoint: GET /categories/:id
   */
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

// Export error types
export enum CategoryError {
  NETWORK = 'NETWORK',
  NOT_FOUND = 'NOT_FOUND',
  UNKNOWN = 'UNKNOWN',
}

export const CATEGORY_ERROR_MESSAGES: Record<CategoryError, string> = {
  [CategoryError.NETWORK]: 'Koneksi terputus. Periksa internet Anda.',
  [CategoryError.NOT_FOUND]: 'Kategori tidak ditemukan.',
  [CategoryError.UNKNOWN]: 'Terjadi kesalahan. Silakan coba lagi.',
};

export function handleCategoryError(error: unknown): CategoryError {
  if (error instanceof Error) {
    if (error.message.includes('404')) return CategoryError.NOT_FOUND;
    if (
      error.message.includes('network') ||
      error.message.includes('fetch') ||
      error.message.includes('Failed to fetch')
    ) {
      return CategoryError.NETWORK;
    }
  }
  return CategoryError.UNKNOWN;
}
```

---

## 3. Orders Page Updates

### File: `frontend/src/app/(main)/orders/page.tsx`

#### 3.1 Add Status Filter Logic

**Sebelum:**

```typescript
// Map tab to backend status filter (for future use when backend supports it)
const getStatusFilter = (tab: OrderTab): string | undefined => {
  // Backend doesn't support status filtering yet, so return undefined
  // When backend is updated, uncomment this:
  // switch (tab) {
  //   case 'pending': return 'PENDING';
  //   case 'processing': return 'PROCESSING';
  //   case 'shipped': return 'SHIPPING';
  //   case 'completed': return 'COMPLETED';
  //   case 'cancelled': return 'CANCELLED';
  //   default: return undefined;
  // }
  return undefined;
};
```

**Sesudah:**

```typescript
// ✅ Map tab to backend status filter
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
```

#### 3.2 Update fetchOrders Function

**Sebelum:**

```typescript
const fetchOrders = async (pageNum: number = 1) => {
  orderStoreActions.setLoading(true);
  orderStoreActions.clearError();

  try {
    // Get orders (backend doesn't support status filtering yet)
    const response = await orderService.getOrders(pageNum);

    // Filter orders locally by status based on active tab
    let filteredOrders = response.items;
    const status = getStatusFilter(activeTab);
    if (status) {
      filteredOrders = response.items.filter(
        (order) => order.status === status,
      );
    }

    orderStoreActions.setOrders(filteredOrders, {
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

**Sesudah:**

```typescript
const fetchOrders = async (pageNum: number = 1) => {
  orderStoreActions.setLoading(true);
  orderStoreActions.clearError();

  try {
    // Get status filter based on active tab
    const statusFilter = getStatusFilter(activeTab);

    // Fetch orders with status filter
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

## 4. Order Components Updates

### File: `frontend/src/components/features/orders/order-card.tsx`

#### 4.1 Update Status Configuration

**Sebelum:**

```typescript
function OrderStatusButton({ status }: { status: string }) {
  const statusConfig: Record<
    string,
    { bg: string; text: string; label: string }
  > = {
    PENDING: {
      bg: 'bg-amber-500',
      text: 'text-white',
      label: 'Menunggu Pembayaran',
    },
    PROCESSING: {
      bg: 'bg-blue-500',
      text: 'text-white',
      label: 'Sedang Diproses',
    },
    SHIPPED: {
      bg: 'bg-purple-500',
      text: 'text-white',
      label: 'Sedang Dikirim',
    },
    DELIVERED: {
      bg: 'bg-green-500',
      text: 'text-white',
      label: 'Pesanan Tiba',
    },
    COMPLETED: { bg: 'bg-green-600', text: 'text-white', label: 'Selesai' },
    CANCELLED: { bg: 'bg-red-100', text: 'text-red-600', label: 'Dibatalkan' },
    EXPIRED: {
      bg: 'bg-secondary-200',
      text: 'text-secondary-600',
      label: 'Kedaluwarsa',
    },
    DRAFT: { bg: 'bg-secondary-300', text: 'text-white', label: 'Draft' },
    PAID: { bg: 'bg-green-500', text: 'text-white', label: 'Sudah Dibayar' },
  };
  // ...
}
```

**Sesudah:**

```typescript
function OrderStatusButton({ status }: { status: string }) {
  const statusConfig: Record<
    string,
    { bg: string; text: string; label: string }
  > = {
    // ✅ Complete status mapping matching backend
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
    DELIVERED: {
      bg: 'bg-indigo-500',
      text: 'text-white',
      label: 'Pesanan Tiba',
    },
    COMPLETED: { bg: 'bg-green-600', text: 'text-white', label: 'Selesai' },
    EXPIRED: {
      bg: 'bg-secondary-400',
      text: 'text-white',
      label: 'Kedaluwarsa',
    },
    CANCELLED: { bg: 'bg-red-100', text: 'text-red-600', label: 'Dibatalkan' },
    // Legacy fallback
    PENDING: {
      bg: 'bg-amber-500',
      text: 'text-white',
      label: 'Menunggu Pembayaran',
    },
    SHIPPED: {
      bg: 'bg-purple-500',
      text: 'text-white',
      label: 'Sedang Dikirim',
    },
  };
  // ...
}
```

#### 4.2 Update Item Rendering

**Sebelum:**

```typescript
{item.productImage ? (
  <Image
    src={item.productImage}
    alt={item.productName}
    // ...
  />
) : (
  <div className="w-full h-full flex items-center justify-center text-secondary-400 text-lg font-semibold">
    {item.productName.charAt(0)}
  </div>
)}
```

**Sesudah:**

```typescript
{/* Note: productImage may not be in BE response - use placeholder */}
<div className="w-20 h-20 rounded-lg bg-secondary-100 overflow-hidden relative flex-shrink-0 flex items-center justify-center">
  {item.productName.charAt(0).toUpperCase()}
</div>
```

#### 4.3 Update Price Display

**Sebelum:**

```typescript
<p className="text-sm text-secondary-500 mt-1">
  {item.quantity}x {formatCurrency(item.snapshotPrice)}
</p>
```

**Sesudah:**

```typescript
<p className="text-sm text-secondary-500 mt-1">
  {item.quantity}x {formatCurrency(item.unitPrice)}
</p>
```

---

### File: `frontend/src/components/features/orders/order-detail.tsx`

#### 5.1 Update Item Rendering

**Sebelum:**

```typescript
{order.items.map((item, index) => (
  <div key={item.id || `item-${index}`} className="flex items-center gap-4">
    {item.productImage && (
      <Image
        src={item.productImage}
        alt={item.productName}
        width={64}
        height={64}
        className="w-16 h-16 rounded-lg object-cover"
      />
    )}
    <div className="flex-1">
      <p className="font-medium text-secondary-900">
        {item.productName}
      </p>
      <p className="text-sm text-secondary-600">
        {item.quantity}x {formatCurrency(item.snapshotPrice)}
      </p>
    </div>
    <p className="font-medium text-secondary-900">
      {formatCurrency(item.subtotal)}
    </p>
  </div>
))}
```

**Sesudah:**

```typescript
{order.items.map((item, index) => (
  <div key={item.id || `item-${index}`} className="flex items-center gap-4">
    {/* Placeholder if no image - BE doesn't send productImage */}
    <div className="w-16 h-16 rounded-lg bg-secondary-100 flex items-center justify-center text-secondary-400 text-xl font-bold">
      {item.productName.charAt(0).toUpperCase()}
    </div>
    <div className="flex-1">
      <p className="font-medium text-secondary-900">
        {item.productName}
      </p>
      <p className="text-sm text-secondary-600">
        {item.quantity}x {formatCurrency(item.unitPrice)}
      </p>
    </div>
    <p className="font-medium text-secondary-900">
      {formatCurrency(item.subtotal)}
    </p>
  </div>
))}
```

#### 5.2 Fix Financial Fields

**Sebelum:**

```typescript
<div className="flex justify-between text-secondary-600">
  <span>Ongkos Kirim</span>
  <span>{formatCurrency(order.shippingFee)}</span>  {/* ✅ Already correct */}
</div>
<div className="flex justify-between text-secondary-600">
  <span>Pajak</span>
  <span>{formatCurrency(order.tax)}</span>  {/* ✅ Already correct */}
</div>
<div className="flex justify-between font-semibold text-secondary-900 pt-2 border-t border-secondary-200">
  <span>Total</span>
  <span>{formatCurrency(order.total)}</span>  {/* ✅ Already correct */}
</div>
```

**Sesudah:**

```typescript
{/* Financial fields are now populated from backend - no changes needed */}
<div className="flex justify-between text-secondary-600">
  <span>Subtotal</span>
  <span>{formatCurrency(order.subtotal)}</span>
</div>
<div className="flex justify-between text-secondary-600">
  <span>Ongkos Kirim</span>
  <span>{formatCurrency(order.shippingFee ?? 0)}</span>  {/* ✅ Safe fallback */}
</div>
<div className="flex justify-between text-secondary-600">
  <span>Pajak</span>
  <span>{formatCurrency(order.tax ?? 0)}</span>  {/* ✅ Safe fallback */}
</div>
<div className="flex justify-between font-semibold text-secondary-900 pt-2 border-t border-secondary-200">
  <span>Total</span>
  <span className="text-primary-600">{formatCurrency(order.total ?? order.subtotal)}</span>  {/* ✅ Safe fallback */}
</div>
```

---

### File: `frontend/src/components/features/orders/order-timeline.tsx`

#### 6.1 Update Timeline Steps

**Sebelum:**

```typescript
const TIMELINE_STEPS = [
  { status: 'PENDING', label: 'Pesanan Dibuat' },
  { status: 'PROCESSING', label: 'Sedang Diproses' },
  { status: 'SHIPPED', label: 'Sedang Dikirim' },
  { status: 'COMPLETED', label: 'Selesai' },
];
```

**Sesudah:**

```typescript
const TIMELINE_STEPS = [
  { status: 'DRAFT', label: 'Pesanan Dibuat' },
  { status: 'WAITING_PAYMENT', label: 'Menunggu Pembayaran' },
  { status: 'PAID', label: 'Pembayaran Diterima' },
  { status: 'PROCESSING', label: 'Sedang Diproses' },
  { status: 'SHIPPING', label: 'Sedang Dikirim' },
  { status: 'DELIVERED', label: 'Pesanan Tiba' },
  { status: 'COMPLETED', label: 'Selesai' },
] as const;

// Terminal states (no more steps)
const TERMINAL_STEPS = ['EXPIRED', 'CANCELLED'];
```

---

## 6. Categories Page Updates

### File: `frontend/src/app/(main)/categories/page.tsx`

#### 7.1 Add API Integration

**Sebelum:**

```typescript
const categories = [
  { id: 'electronics', name: 'Elektronik', icon: '📱', count: 156, ... },
  // ... hardcoded data
];
```

**Sesudah:**

```typescript
'use client';

import { useEffect, useState } from 'react';
import { Container } from '@/components/layout/container';
import Link from 'next/link';
import { categoryService, handleCategoryError, CategoryError } from '@/services/category.service';
import type { Category } from '@/types/api/category.types';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCategories() {
      try {
        const data = await categoryService.getCategories();
        setCategories(data);
      } catch (err) {
        const errorCode = handleCategoryError(err);
        setError(
          errorCode === CategoryError.NETWORK
            ? 'Koneksi terputus. Periksa internet Anda.'
            : 'Gagal memuat kategori.'
        );
      } finally {
        setIsLoading(false);
      }
    }
    fetchCategories();
  }, []);

  if (isLoading) {
    return (
      <div className="bg-secondary-50 min-h-screen">
        <Container>
          <div className="py-8">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-secondary-200 rounded w-48" />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-32 bg-secondary-200 rounded-xl" />
                ))}
              </div>
            </div>
          </div>
        </Container>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-secondary-50 min-h-screen">
        <Container>
          <div className="py-8 text-center">
            <p className="text-red-500 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg"
            >
              Coba Lagi
            </button>
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div className="bg-secondary-50 min-h-screen">
      <Container>
        <div className="py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-secondary-900">
              Kategori Produk
            </h1>
            <p className="text-secondary-600 mt-1">
              Jelajahi {categories.length} kategori produk
            </p>
          </div>

          {/* Categories Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/products?category=${category.id}`}
                className="group bg-white rounded-xl border border-secondary-200 p-6 hover:border-primary-300 hover:shadow-lg transition-all duration-200"
              >
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 bg-primary-50 rounded-xl flex items-center justify-center text-3xl group-hover:bg-primary-100 transition-colors">
                    {category.icon}
                  </div>
                  <div className="flex-1">
                    <h2 className="font-semibold text-secondary-900 group-hover:text-primary-600 transition-colors">
                      {category.name}
                    </h2>
                    <p className="text-sm text-secondary-500 mt-1">
                      {category.description}
                    </p>
                    <p className="text-xs text-secondary-400 mt-2">
                      {category.productCount} produk
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </Container>
    </div>
  );
}
```

---

## 7. Home Page Updates

### File: `frontend/src/app/(main)/page.tsx`

#### 8.1 Create Full Home Page

```typescript
'use client';

/**
 * Home Page - Full Redesign
 * Features:
 * - Hero Section with CTA
 * - Featured Categories
 * - Featured Products
 * - Footer
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronRight, Star, ShoppingCart } from 'lucide-react';
import { categoryService } from '@/services/category.service';
import { productService } from '@/services/product.service';
import type { Category } from '@/types/api/category.types';
import type { Product } from '@/types/api/product.types';
import { formatCurrency } from '@/lib/utils/currency';

export default function HomePage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [cats, prods] = await Promise.all([
          categoryService.getCategories(),
          productService.getFeaturedProducts?.() ?? Promise.resolve([]),
        ]);
        setCategories(cats);
        setFeaturedProducts(prods.slice(0, 8)); // Limit to 8 products
      } catch (error) {
        console.error('Failed to fetch home data:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-secondary-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary-600 to-primary-700 text-white">
        <div className="max-w-6xl mx-auto px-4 py-16 md:py-24">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Selamat Datang di Pasaria
            </h1>
            <p className="text-xl text-primary-100 mb-8">
              Pasar Indonesia Online. Belanja mudah, aman, dan terpercaya.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/products"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-primary-600 font-semibold rounded-lg hover:bg-primary-50 transition-colors"
              >
                Belanja Sekarang
                <ChevronRight className="w-5 h-5" />
              </Link>
              <Link
                href="/categories"
                className="inline-flex items-center gap-2 px-6 py-3 border-2 border-white text-white font-semibold rounded-lg hover:bg-white/10 transition-colors"
              >
                Jelajahi Kategori
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-secondary-900">
              Kategori Populer
            </h2>
            <Link
              href="/categories"
              className="text-primary-600 font-medium hover:text-primary-700 flex items-center gap-1"
            >
              Lihat Semua
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-32 bg-secondary-200 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {categories.slice(0, 6).map((category) => (
                <Link
                  key={category.id}
                  href={`/products?category=${category.id}`}
                  className="group bg-white rounded-xl border border-secondary-200 p-4 text-center hover:border-primary-300 hover:shadow-md transition-all"
                >
                  <div className="text-4xl mb-2">{category.icon}</div>
                  <h3 className="font-medium text-secondary-900 group-hover:text-primary-600">
                    {category.name}
                  </h3>
                  <p className="text-xs text-secondary-500 mt-1">
                    {category.productCount} produk
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Products Section */}
      {featuredProducts.length > 0 && (
        <section className="py-12 bg-white">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-secondary-900">
                Produk Unggulan
              </h2>
              <Link
                href="/products"
                className="text-primary-600 font-medium hover:text-primary-700 flex items-center gap-1"
              >
                Lihat Semua
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {featuredProducts.map((product) => (
                <Link
                  key={product.id}
                  href={`/products/${product.slug}`}
                  className="group bg-secondary-50 rounded-xl border border-secondary-200 overflow-hidden hover:shadow-lg transition-all"
                >
                  <div className="aspect-square bg-secondary-100 relative">
                    {product.images?.[0] ? (
                      <Image
                        src={product.images[0]}
                        alt={product.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 50vw, 25vw"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-secondary-400 text-4xl font-bold">
                        {product.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-medium text-secondary-900 line-clamp-2 group-hover:text-primary-600">
                      {product.name}
                    </h3>
                    <p className="text-lg font-bold text-primary-600 mt-2">
                      {formatCurrency(product.price)}
                    </p>
                    {product.rating && (
                      <div className="flex items-center gap-1 mt-2">
                        <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                        <span className="text-sm text-secondary-500">
                          {product.rating.toFixed(1)}
                        </span>
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="bg-secondary-900 text-secondary-300 py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-white font-bold text-lg mb-4">Pasaria</h3>
              <p className="text-sm">
                Pasar Indonesia Online. Belanja mudah, aman, dan terpercaya.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Tautan</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/products" className="hover:text-white">Produk</Link></li>
                <li><Link href="/categories" className="hover:text-white">Kategori</Link></li>
                <li><Link href="/about" className="hover:text-white">Tentang Kami</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Bantuan</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/faq" className="hover:text-white">FAQ</Link></li>
                <li><Link href="/contact" className="hover:text-white">Kontak</Link></li>
                <li><Link href="/shipping" className="hover:text-white">Pengiriman</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Ikuti Kami</h4>
              <div className="flex gap-4">
                <a href="#" className="hover:text-white text-xl">📘</a>
                <a href="#" className="hover:text-white text-xl">📸</a>
                <a href="#" className="hover:text-white text-xl">🐦</a>
              </div>
            </div>
          </div>
          <div className="border-t border-secondary-700 mt-8 pt-8 text-center text-sm">
            <p>&copy; 2026 Pasaria. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
```

---

## 8. Files Summary

### Files to Modify

| File                                                         | Changes                               |
| ------------------------------------------------------------ | ------------------------------------- |
| `frontend/src/types/api/order.types.ts`                      | Update OrderStatus, Order, OrderItem  |
| `frontend/src/services/order.service.ts`                     | Add status filter, transform function |
| `frontend/src/app/(main)/orders/page.tsx`                    | Fix tab status mapping                |
| `frontend/src/components/features/orders/order-card.tsx`     | Update status config, fix field names |
| `frontend/src/components/features/orders/order-detail.tsx`   | Fix item rendering, add fallbacks     |
| `frontend/src/components/features/orders/order-timeline.tsx` | Update timeline steps                 |
| `frontend/src/app/(main)/categories/page.tsx`                | Full API integration                  |
| `frontend/src/app/(main)/page.tsx`                           | Full rebuild with sections            |

### Files to Create

| File                                        | Purpose                   |
| ------------------------------------------- | ------------------------- |
| `frontend/src/types/api/category.types.ts`  | Category type definitions |
| `frontend/src/services/category.service.ts` | Category API service      |

---

## 9. Testing Checklist

### Frontend Testing

- [ ] Home page loads with categories from API
- [ ] Home page shows featured products (if endpoint exists)
- [ ] Categories page loads from API
- [ ] Categories page shows product count from API
- [ ] Categories page handles error state
- [ ] Orders page shows tabs correctly
- [ ] Orders page filter works by tab
- [ ] Order card displays correct status
- [ ] Order detail shows financial fields (no NaN)
- [ ] Order timeline shows correct steps

### Browser Console

- [ ] No errors on home page load
- [ ] No errors on categories page load
- [ ] No errors on orders page load
- [ ] No NaN values displayed

---

**Next:** See `04-TYPES.md` for complete type definitions
