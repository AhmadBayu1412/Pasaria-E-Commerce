# Phase 6 Step 7 - Blueprint

## Order Management UI

### Tanggal: 7 Juli 2026

### Status: ✅ Ready for Implementation

---

## 📋 Executive Summary

Step 7 membangun **Order Lifecycle Visualization** - memungkinkan user selalu tahu posisi pesanan mereka. Ini melengkapi customer journey dari browse hingga post-purchase.

**Target:** User dapat melihat daftar order, detail order, dan memahami status pesanan melalui timeline visual.

**Architecture:** Frontend sebagai consumer dari backend Express, dengan Zustand untuk state management dan komponen reusable.

---

## 🎯 Purpose & Goals

### Primary Goal

Membuat user selalu tahu: **"Pesanan saya sekarang ada di mana?"**

```
Checkout Success
    ↓
Lihat Pesanan
    ↓
Orders Page
    ↓
Order Detail
    ↓
Timeline Status
```

### Secondary Goals

- Loading, empty, error states yang baik
- Pagination untuk daftar order
- Status badge yang konsisten
- Timeline visual yang jelas
- Integration dari checkout success

---

## 🔴 Order Status Machine ( dari Backend )

```
┌─────────┐
│  DRAFT  │ ← Order dibuat, belum checkout
└────┬────┘
     ↓
┌────┴────┐
│ PENDING │ ← Menunggu pembayaran
└────┬────┘
     ↓
┌────┴────┐     ┌──────────┐
│  PAID   │ ──▶ │ EXPIRED  │ ← Pembayaran expired
└────┬────┘     └──────────┘
     ↓
┌────┴────┐     ┌───────────┐
│CANCELLED│ ──▶ │ EXPIRED   │
└─────────┘     └───────────┘
     ↓
  (Terminal states: PAID, CANCELLED, EXPIRED)
```

**Catatan:** Backend Phase 4-5 sudah memiliki status ini. Frontend hanya perlu menerjemahkan dengan benar.

---

## 📦 Scope

### 7 Core Parts

```
┌─────────────────────────────────────────────┐
│ 1. Order Status Definition                  │
│    - Single source of truth                 │
│    - Label, color, icon, order            │
├─────────────────────────────────────────────┤
│ 2. Order Store (Zustand)                   │
│    - orders[], selectedOrder               │
│    - loading, error, pagination           │
├─────────────────────────────────────────────┤
│ 3. Order Components                        │
│    - OrderCard                            │
│    - OrderList                           │
│    - OrderDetail                          │
│    - OrderStatusBadge                     │
│    - OrderTimeline                        │
│    - OrderEmpty                           │
│    - OrderLoading                         │
├─────────────────────────────────────────────┤
│ 4. Order Pages                            │
│    - /orders (list)                      │
│    - /orders/[id] (detail)               │
├─────────────────────────────────────────────┤
│ 5. Integration                            │
│    - Checkout success → orders           │
│    - Protected route                     │
└─────────────────────────────────────────────┘
```

---

## 📁 File Structure

```
src/
├── lib/
│   └── orders/
│       └── order-status.ts    ← SINGLE SOURCE OF TRUTH
├── components/features/orders/
│   ├── order-card.tsx
│   ├── order-list.tsx
│   ├── order-detail.tsx
│   ├── order-item.tsx
│   ├── order-summary.tsx
│   ├── order-status-badge.tsx
│   ├── order-timeline.tsx
│   ├── order-empty.tsx
│   ├── order-loading.tsx
│   └── index.ts
├── store/
│   └── order.store.ts
├── services/
│   └── order.service.ts       ← ALREADY EXISTS
├── app/(main)/
│   ├── orders/
│   │   ├── page.tsx          ← Order list
│   │   ├── loading.tsx
│   │   └── [id]/
│   │       ├── page.tsx      ← Order detail
│   │       └── loading.tsx
│   └── checkout/
│       └── success/
│           └── page.tsx       ← Add "Lihat Pesanan" button
└── app/auth/
    └── (already has login/register)
```

---

## 1. Order Status Definition

### Single Source of Truth

```typescript
// src/lib/orders/order-status.ts

import type { OrderStatus, PaymentStatus } from '@/types/api';

/**
 * Order Status Configuration
 *
 * Single source of truth for all order status display.
 * All UI components use this configuration.
 */

export interface StatusConfig {
  label: string;
  color: string; // Tailwind color class
  bgColor: string; // Background color
  textColor: string; // Text color
  icon: string; // Icon name or path
  isFinal: boolean; // Is this a terminal state?
  showTimeline: boolean; // Show in timeline?
  order: number; // Position in timeline
}

export const ORDER_STATUS_CONFIG: Record<OrderStatus, StatusConfig> = {
  DRAFT: {
    label: 'Draft',
    color: 'gray',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-700',
    icon: 'file-text',
    isFinal: false,
    showTimeline: true,
    order: 0,
  },
  PENDING: {
    label: 'Menunggu Pembayaran',
    color: 'yellow',
    bgColor: 'bg-yellow-100',
    textColor: 'text-yellow-700',
    icon: 'clock',
    isFinal: false,
    showTimeline: true,
    order: 1,
  },
  PAID: {
    label: 'Sudah Dibayar',
    color: 'green',
    bgColor: 'bg-green-100',
    textColor: 'text-green-700',
    icon: 'check-circle',
    isFinal: false,
    showTimeline: true,
    order: 2,
  },
  CANCELLED: {
    label: 'Dibatalkan',
    color: 'red',
    bgColor: 'bg-red-100',
    textColor: 'text-red-700',
    icon: 'x-circle',
    isFinal: true,
    showTimeline: true,
    order: 99,
  },
  EXPIRED: {
    label: 'Kedaluwarsa',
    color: 'orange',
    bgColor: 'bg-orange-100',
    textColor: 'text-orange-700',
    icon: 'alert-circle',
    isFinal: true,
    showTimeline: true,
    order: 100,
  },
};

// Helper function
export function getStatusConfig(status: OrderStatus): StatusConfig {
  return ORDER_STATUS_CONFIG[status];
}

// Get timeline steps
export function getTimelineSteps(status: OrderStatus): StatusConfig[] {
  const statuses: OrderStatus[] = ['DRAFT', 'PENDING', 'PAID'];

  // Add cancelled/expired if applicable
  if (status === 'CANCELLED') {
    return [
      ...ORDER_STATUS_CONFIG['PENDING'],
      ORDER_STATUS_CONFIG['CANCELLED'],
    ];
  }
  if (status === 'EXPIRED') {
    return [...ORDER_STATUS_CONFIG['PENDING'], ORDER_STATUS_CONFIG['EXPIRED']];
  }

  // Find current position
  const currentIndex = statuses.indexOf(status);
  if (currentIndex === -1) return [];

  return statuses.slice(0, currentIndex + 1).map((s) => ORDER_STATUS_CONFIG[s]);
}

// Format currency
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}

// Format date
export function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(dateString));
}
```

**Poin penting:** SEMUA komponen menggunakan file ini sebagai single source of truth. Tidak ada hardcoded status di komponen lain.

---

## 2. Order Store (Zustand)

### State Management

```typescript
// src/store/order.store.ts

import { create } from 'zustand';
import type { Order, PaginatedResponse } from '@/types/api';

interface OrderState {
  // Data
  orders: Order[];
  selectedOrder: Order | null;

  // Pagination
  page: number;
  totalPages: number;
  totalItems: number;

  // UI State
  isLoading: boolean;
  error: string | null;
}

interface OrderActions {
  // Fetch
  fetchOrders: (page?: number) => Promise<void>;
  fetchOrderById: (orderId: number) => Promise<void>;

  // Clear
  clearSelectedOrder: () => void;
  clearError: () => void;
}

export const useOrderStore = create<OrderState & OrderActions>()(
  (set, get) => ({
    // Initial state
    orders: [],
    selectedOrder: null,
    page: 1,
    totalPages: 1,
    totalItems: 0,
    isLoading: false,
    error: null,

    fetchOrders: async (page = 1) => {
      set({ isLoading: true, error: null });

      try {
        const response = await orderService.getOrders(page);
        set({
          orders: response.data,
          page: response.page,
          totalPages: response.totalPages,
          totalItems: response.totalItems,
          isLoading: false,
        });
      } catch (error) {
        set({
          error: 'Gagal memuat daftar pesanan',
          isLoading: false,
        });
      }
    },

    fetchOrderById: async (orderId: number) => {
      set({ isLoading: true, error: null });

      try {
        const order = await orderService.getOrderById(orderId);
        set({ selectedOrder: order, isLoading: false });
      } catch (error) {
        set({
          error: 'Gagal memuat detail pesanan',
          isLoading: false,
        });
      }
    },

    clearSelectedOrder: () => set({ selectedOrder: null }),
    clearError: () => set({ error: null }),
  }),
);

// Selectors
export const useOrders = () => useOrderStore((state) => state.orders);
export const useSelectedOrder = () =>
  useOrderStore((state) => state.selectedOrder);
export const useOrderPagination = () =>
  useOrderStore((state) => ({
    page: state.page,
    totalPages: state.totalPages,
    totalItems: state.totalItems,
  }));
```

---

## 3. Order Components

### OrderStatusBadge

```typescript
// src/components/features/orders/order-status-badge.tsx

'use client';

import type { OrderStatus } from '@/types/api';
import { getStatusConfig } from '@/lib/orders/order-status';

interface OrderStatusBadgeProps {
  status: OrderStatus;
  size?: 'sm' | 'md' | 'lg';
}

export function OrderStatusBadge({ status, size = 'md' }: OrderStatusBadgeProps) {
  const config = getStatusConfig(status);

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base',
  };

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 font-medium rounded-full
        ${config.bgColor} ${config.textColor}
        ${sizeClasses[size]}
      `}
    >
      <StatusIcon name={config.icon} className="w-4 h-4" />
      {config.label}
    </span>
  );
}

// Simple icon component
function StatusIcon({ name, className }: { name: string; className?: string }) {
  // Using simple SVG icons based on name
  const icons: Record<string, JSX.Element> = {
    'file-text': <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
    'clock': <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    'check-circle': <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    'x-circle': <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    'alert-circle': <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>,
  };

  return icons[name] || null;
}
```

### OrderTimeline

```typescript
// src/components/features/orders/order-timeline.tsx

'use client';

import type { OrderStatus } from '@/types/api';
import { getStatusConfig, getTimelineSteps } from '@/lib/orders/order-status';

interface OrderTimelineProps {
  currentStatus: OrderStatus;
}

export function OrderTimeline({ currentStatus }: OrderTimelineProps) {
  const steps = getTimelineSteps(currentStatus);
  const config = getStatusConfig(currentStatus);

  // Check if order is cancelled or expired
  const isTerminalState = config.isFinal;

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-secondary-900">Status Pesanan</h3>

      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-secondary-200" />

        <div className="space-y-6">
          {steps.map((step, index) => (
            <div key={step.label} className="relative flex items-start gap-4">
              {/* Icon circle */}
              <div className={`
                relative z-10 flex items-center justify-center w-8 h-8 rounded-full
                ${step.bgColor} ${step.textColor}
              `}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>

              {/* Content */}
              <div className="pt-1">
                <p className="font-medium text-secondary-900">{step.label}</p>
                {index === steps.length - 1 && (
                  <p className="text-sm text-secondary-500">Status saat ini</p>
                )}
              </div>
            </div>
          ))}

          {/* Show cancelled/expired if applicable */}
          {isTerminalState && (
            <div className="relative flex items-start gap-4">
              <div className={`
                relative z-10 flex items-center justify-center w-8 h-8 rounded-full
                ${config.bgColor} ${config.textColor}
              `}>
                {currentStatus === 'CANCELLED' ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </div>
              <div className="pt-1">
                <p className="font-medium text-secondary-900">{config.label}</p>
                <p className="text-sm text-secondary-500">Status saat ini</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

### OrderCard

```typescript
// src/components/features/orders/order-card.tsx

'use client';

import Link from 'next/link';
import type { Order } from '@/types/api';
import { OrderStatusBadge } from './order-status-badge';
import { formatCurrency, formatDate } from '@/lib/orders/order-status';

interface OrderCardProps {
  order: Order;
}

export function OrderCard({ order }: OrderCardProps) {
  return (
    <Link href={`/orders/${order.id}`}>
      <article className="bg-white rounded-lg border border-secondary-200 p-4 hover:border-primary-300 hover:shadow-md transition-all">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="font-semibold text-secondary-900">
              Pesanan #{order.id}
            </p>
            <p className="text-sm text-secondary-500">
              {formatDate(order.createdAt)}
            </p>
          </div>
          <OrderStatusBadge status={order.status} />
        </div>

        {/* Items preview */}
        <div className="space-y-2 mb-4">
          {order.items.slice(0, 2).map((item) => (
            <div key={item.id} className="flex items-center gap-3">
              {item.productImage && (
                <img
                  src={item.productImage}
                  alt={item.productName}
                  className="w-10 h-10 rounded object-cover"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-secondary-900 truncate">
                  {item.productName}
                </p>
                <p className="text-xs text-secondary-500">
                  {item.quantity}x {formatCurrency(item.snapshotPrice)}
                </p>
              </div>
            </div>
          ))}
          {order.items.length > 2 && (
            <p className="text-sm text-secondary-500">
              +{order.items.length - 2} produk lainnya
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-secondary-100">
          <p className="text-sm text-secondary-600">
            {order.totalQuantity} item
          </p>
          <p className="font-semibold text-secondary-900">
            {formatCurrency(order.total)}
          </p>
        </div>
      </article>
    </Link>
  );
}
```

### OrderList

```typescript
// src/components/features/orders/order-list.tsx

'use client';

import type { Order } from '@/types/api';
import { OrderCard } from './order-card';
import { OrderEmpty } from './order-empty';
import { OrderLoading } from './order-loading';

interface OrderListProps {
  orders: Order[];
  isLoading?: boolean;
}

export function OrderList({ orders, isLoading }: OrderListProps) {
  if (isLoading) {
    return <OrderLoading />;
  }

  if (orders.length === 0) {
    return <OrderEmpty />;
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <OrderCard key={order.id} order={order} />
      ))}
    </div>
  );
}
```

### OrderEmpty

```typescript
// src/components/features/orders/order-empty.tsx

'use client';

import Link from 'next/link';

export function OrderEmpty() {
  return (
    <div className="text-center py-12">
      <div className="w-16 h-16 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg className="w-8 h-8 text-secondary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-secondary-900 mb-2">
        Belum ada pesanan
      </h3>
      <p className="text-secondary-600 mb-6">
        Yuk mulai belanja dan buat pesanan pertamamu!
      </p>
      <Link
        href="/products"
        className="inline-block px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
      >
        Lihat Produk
      </Link>
    </div>
  );
}
```

### OrderLoading

```typescript
// src/components/features/orders/order-loading.tsx

'use client';

export function OrderLoading() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white rounded-lg border border-secondary-200 p-4 animate-pulse">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="h-5 w-24 bg-secondary-200 rounded mb-2" />
              <div className="h-4 w-32 bg-secondary-100 rounded" />
            </div>
            <div className="h-6 w-28 bg-secondary-100 rounded-full" />
          </div>
          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-secondary-100 rounded" />
              <div className="flex-1">
                <div className="h-4 w-3/4 bg-secondary-100 rounded mb-1" />
                <div className="h-3 w-1/2 bg-secondary-100 rounded" />
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between pt-4 border-t border-secondary-100">
            <div className="h-4 w-16 bg-secondary-100 rounded" />
            <div className="h-5 w-20 bg-secondary-100 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}
```

### OrderDetail

```typescript
// src/components/features/orders/order-detail.tsx

'use client';

import type { Order } from '@/types/api';
import { OrderStatusBadge } from './order-status-badge';
import { OrderTimeline } from './order-timeline';
import { formatCurrency, formatDate } from '@/lib/orders/order-status';

interface OrderDetailProps {
  order: Order;
}

export function OrderDetail({ order }: OrderDetailProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg border border-secondary-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-secondary-900">
            Pesanan #{order.id}
          </h2>
          <OrderStatusBadge status={order.status} size="lg" />
        </div>
        <p className="text-secondary-600">
          Dibuat pada {formatDate(order.createdAt)}
        </p>
      </div>

      {/* Timeline */}
      <div className="bg-white rounded-lg border border-secondary-200 p-6">
        <OrderTimeline currentStatus={order.status} />
      </div>

      {/* Items */}
      <div className="bg-white rounded-lg border border-secondary-200 p-6">
        <h3 className="font-semibold text-secondary-900 mb-4">
          Item Pesanan
        </h3>
        <div className="space-y-4">
          {order.items.map((item) => (
            <div key={item.id} className="flex items-center gap-4">
              {item.productImage && (
                <img
                  src={item.productImage}
                  alt={item.productName}
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
        </div>
      </div>

      {/* Summary */}
      <div className="bg-white rounded-lg border border-secondary-200 p-6">
        <h3 className="font-semibold text-secondary-900 mb-4">
          Ringkasan Pembayaran
        </h3>
        <div className="space-y-2">
          <div className="flex justify-between text-secondary-600">
            <span>Subtotal</span>
            <span>{formatCurrency(order.subtotal)}</span>
          </div>
          <div className="flex justify-between text-secondary-600">
            <span>Ongkos Kirim</span>
            <span>{formatCurrency(order.shippingFee)}</span>
          </div>
          <div className="flex justify-between text-secondary-600">
            <span>Pajak</span>
            <span>{formatCurrency(order.tax)}</span>
          </div>
          <div className="flex justify-between font-semibold text-secondary-900 pt-2 border-t border-secondary-200">
            <span>Total</span>
            <span>{formatCurrency(order.total)}</span>
          </div>
        </div>
      </div>

      {/* Payment Info */}
      {order.payment && (
        <div className="bg-white rounded-lg border border-secondary-200 p-6">
          <h3 className="font-semibold text-secondary-900 mb-4">
            Informasi Pembayaran
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-secondary-600">Metode</span>
              <span className="font-medium">{order.payment.method}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-secondary-600">Status</span>
              <span className="font-medium">{order.payment.status}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-secondary-600">Jumlah</span>
              <span className="font-medium">{formatCurrency(order.payment.amount)}</span>
            </div>
            {order.payment.paidAt && (
              <div className="flex justify-between">
                <span className="text-secondary-600">Dibayar pada</span>
                <span className="font-medium">{formatDate(order.payment.paidAt)}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
```

### OrderItem

```typescript
// src/components/features/orders/order-item.tsx

'use client';

import type { OrderItem as OrderItemType } from '@/types/api';
import { formatCurrency } from '@/lib/orders/order-status';

interface OrderItemProps {
  item: OrderItemType;
}

export function OrderItem({ item }: OrderItemProps) {
  return (
    <div className="flex items-center gap-4">
      {item.productImage && (
        <img
          src={item.productImage}
          alt={item.productName}
          className="w-16 h-16 rounded-lg object-cover"
        />
      )}
      <div className="flex-1">
        <p className="font-medium text-secondary-900">{item.productName}</p>
        <p className="text-sm text-secondary-600">
          {item.quantity}x {formatCurrency(item.snapshotPrice)}
        </p>
      </div>
      <p className="font-medium text-secondary-900">
        {formatCurrency(item.subtotal)}
      </p>
    </div>
  );
}
```

### OrderSummary

```typescript
// src/components/features/orders/order-summary.tsx

'use client';

import type { Order } from '@/types/api';
import { formatCurrency } from '@/lib/orders/order-status';

interface OrderSummaryProps {
  order: Order;
}

export function OrderSummary({ order }: OrderSummaryProps) {
  return (
    <div className="bg-secondary-50 rounded-lg p-4 space-y-2">
      <div className="flex justify-between text-secondary-600">
        <span>Subtotal ({order.totalQuantity} item)</span>
        <span>{formatCurrency(order.subtotal)}</span>
      </div>
      <div className="flex justify-between text-secondary-600">
        <span>Ongkos Kirim</span>
        <span>{formatCurrency(order.shippingFee)}</span>
      </div>
      <div className="flex justify-between text-secondary-600">
        <span>Pajak</span>
        <span>{formatCurrency(order.tax)}</span>
      </div>
      <div className="flex justify-between font-semibold text-secondary-900 pt-2 border-t border-secondary-200">
        <span>Total</span>
        <span>{formatCurrency(order.total)}</span>
      </div>
    </div>
  );
}
```

### index.ts

```typescript
// src/components/features/orders/index.ts

export { OrderCard } from './order-card';
export { OrderList } from './order-list';
export { OrderDetail } from './order-detail';
export { OrderItem } from './order-item';
export { OrderSummary } from './order-summary';
export { OrderStatusBadge } from './order-status-badge';
export { OrderTimeline } from './order-timeline';
export { OrderEmpty } from './order-empty';
export { OrderLoading } from './order-loading';
```

---

## 4. Order Pages

### /orders/page.tsx

```typescript
// src/app/(main)/orders/page.tsx

'use client';

import { useEffect } from 'react';
import { useOrderStore } from '@/store/order.store';
import { OrderList } from '@/components/features/orders';
import { Pagination } from '@/components/ui/pagination';

export default function OrdersPage() {
  const {
    orders,
    page,
    totalPages,
    totalItems,
    isLoading,
    fetchOrders,
  } = useOrderStore();

  useEffect(() => {
    fetchOrders(1);
  }, [fetchOrders]);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-secondary-900 mb-6">
        Daftar Pesanan
      </h1>

      <OrderList orders={orders} isLoading={isLoading} />

      {orders.length > 0 && (
        <div className="mt-6">
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={totalItems}
            onPageChange={(newPage) => fetchOrders(newPage)}
          />
        </div>
      )}
    </div>
  );
}
```

### /orders/[id]/page.tsx

```typescript
// src/app/(main)/orders/[id]/page.tsx

'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useOrderStore } from '@/store/order.store';
import { OrderDetail } from '@/components/features/orders';
import { Button } from '@/components/ui/button';

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = Number(params.id);

  const { selectedOrder, isLoading, error, fetchOrderById, clearSelectedOrder } = useOrderStore();

  useEffect(() => {
    if (orderId) {
      fetchOrderById(orderId);
    }

    return () => clearSelectedOrder();
  }, [orderId, fetchOrderById, clearSelectedOrder]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-32 bg-secondary-200 rounded" />
          <div className="h-64 bg-secondary-200 rounded-lg" />
        </div>
      </div>
    );
  }

  if (error || !selectedOrder) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="text-secondary-600 mb-4">
          {error || 'Pesanan tidak ditemukan'}
        </p>
        <Button variant="outline" onClick={() => router.push('/orders')}>
          Kembali ke Daftar Pesanan
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back link */}
      <Link
        href="/orders"
        className="inline-flex items-center gap-2 text-secondary-600 hover:text-secondary-900 mb-6"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Kembali ke Daftar Pesanan
      </Link>

      <OrderDetail order={selectedOrder} />
    </div>
  );
}
```

### /checkout/success/page.tsx (MODIFIED)

```typescript
// src/app/(main)/checkout/success/page.tsx
// Add "Lihat Pesanan" button

'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('order_id');

  return (
    <div className="container mx-auto px-4 py-16 text-center">
      <div className="max-w-md mx-auto">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-secondary-900 mb-4">
          Pesanan Berhasil!
        </h1>
        <p className="text-secondary-600 mb-8">
          Terima kasih atas pesanan Anda. Pesanan Anda sedang diproses.
        </p>

        {orderId && (
          <Link
            href={`/orders/${orderId}`}
            className="inline-block px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors mb-4"
          >
            Lihat Pesanan
          </Link>
        )}

        <div>
          <Link
            href="/orders"
            className="text-primary-600 hover:text-primary-700"
          >
            Lihat Semua Pesanan
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<div>Memuat...</div>}>
      <SuccessContent />
    </Suspense>
  );
}
```

---

## 5. Pagination Component

```typescript
// src/components/ui/pagination.tsx

'use client';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (page: number) => void;
}

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  onPageChange,
}: PaginationProps) {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className="flex items-center justify-between">
      <p className="text-sm text-secondary-600">
        Halaman {currentPage} dari {totalPages}
      </p>

      <div className="flex gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-1 rounded border border-secondary-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-secondary-50"
        >
          Prev
        </button>

        {pages.map((page) => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`
              px-3 py-1 rounded border
              ${page === currentPage
                ? 'bg-primary-600 text-white border-primary-600'
                : 'border-secondary-300 hover:bg-secondary-50'
              }
            `}
          >
            {page}
          </button>
        ))}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 py-1 rounded border border-secondary-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-secondary-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}
```

---

## 6. Protected Route

Order pages harus dilindungi oleh auth:

```typescript
// src/app/(main)/orders/layout.tsx

import { ProtectedRoute } from '@/components/features/auth';

export default function OrdersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}
```

---

## ✅ Definition of Done

### Functional

- [ ] User can view list of orders
- [ ] User can view order detail
- [ ] User can see order timeline
- [ ] User can understand status through badge
- [ ] User can navigate back to list
- [ ] Pagination works correctly
- [ ] Checkout success links to new order

### Technical

- [ ] Build passes
- [ ] TypeScript no errors
- [ ] ESLint no warnings
- [ ] All status definitions in single file
- [ ] HTTP calls in service, not components

### UX

- [ ] Loading state visible
- [ ] Empty state helpful
- [ ] Error state with retry
- [ ] Smooth navigation

### Accessibility

- [ ] Status badges have good contrast
- [ ] Timeline readable by screen reader
- [ ] Keyboard navigation works
- [ ] Focus management correct

---

## 📊 Proposed Review Scores

| Area              | Score |
| ----------------- | ----- |
| Architecture      | /10   |
| Backend Alignment | /10   |
| State Management  | /10   |
| UX                | /10   |
| Error Handling    | /10   |
| Accessibility     | /10   |
| Testing           | /10   |
| Maintainability   | /10   |

**Overall: /80**

---

## 📝 Notes

1. **Single Source of Truth**: `lib/orders/order-status.ts` adalah satu-satunya file yang mendefinisikan status. Komponen lain hanya menggunakan ini.

2. **Order Service**: Sudah ada di `services/order.service.ts`. Tidak perlu diubah.

3. **Backend Alignment**: Status `DRAFT`, `PENDING`, `PAID`, `CANCELLED`, `EXPIRED` berasal dari backend Phase 4-5.

4. **Future Features**: `cancelOrder()`, `reorder()` bisa ditambahkan di kemudian hari.

---

**Status: ✅ READY FOR IMPLEMENTATION**

**Blueprint untuk Step 7 - Order Management UI**
