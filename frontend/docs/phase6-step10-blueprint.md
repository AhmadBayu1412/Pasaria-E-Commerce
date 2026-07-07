# Phase 6 Step 10 - Blueprint

## Production Polish

### Tanggal: 7 Juli 2026

### Status: 🔄 Draft for Review

---

## 📋 Executive Summary

Step 10 mengubah frontend dari **"fitur sudah lengkap"** menjadi **"siap dipakai user"**. Fokus bukan fitur baru, tetapi **kualitas**.

---

## 🎯 Tujuan Step 10

```
Before                              After
───────────────────────────────────────────────────────────
Fiture lengkap                  →    Siap production
Skeleton berbeda tiap halaman    →    Skeleton reusable
Empty state tersebar             →    Empty state system
Error handling tidak konsisten  →    Error state system
No loading.tsx                  →    App Router loading boundaries
Performance belum dioptimasi     →    Performance audit
A11y sering dilupakan          →    Accessibility audit
Animasi tidak konsisten         →    Motion token system
UI tidak konsisten             →    UI audit
```

---

## 📊 Scope Step 10

### 1. Global Loading Experience

```
components/ui/skeleton/
├── product-card-skeleton.tsx
├── table-skeleton.tsx
├── list-skeleton.tsx
├── form-skeleton.tsx
└── page-skeleton.tsx
```

**Usage:**

```
Landing         → ProductCardSkeleton
Category        → ProductCardSkeleton
Search          → ProductCardSkeleton
Wishlist       → ProductCardSkeleton
Recommendation  → ProductCardSkeleton
```

**Mengapa?**

- Design berubah → ubah 1 tempat
- Loading experience konsisten
- Maintenance lebih mudah

---

### 2. Empty State System

```
components/ui/empty-state/
└── empty-state.tsx
```

```typescript
interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}
```

**Usage:**

```
Search  → EmptyState
Cart    → EmptyState
Orders  → EmptyState
Admin   → EmptyState
Products→ EmptyState
```

---

### 3. Error State System

```
components/ui/error-state/
└── error-state.tsx
```

```typescript
interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  onHome?: () => void;
  variant?: 'default' | 'critical';
}
```

**Usage:**

```
All pages with data fetching
```

---

### 4. Suspense & Loading.ts

```
app/
├── loading.tsx                    ← Global loading
├── products/
│   └── loading.tsx              ← Products loading
├── search/
│   └── loading.tsx              ← Search loading
├── orders/
│   └── loading.tsx              ← Orders loading
├── cart/
│   └── loading.tsx              ← Cart loading
└── admin/
    └── loading.tsx              ← Admin loading
```

**Contoh loading.tsx:**

```typescript
import { PageSkeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return <PageSkeleton />;
}
```

---

### 5. Performance Optimization

**Checklist:**

- [ ] next/image untuk semua image
- [ ] dynamic() untuk komponen berat
- [ ] memo() untuk component dengan prop kompleks
- [ ] useMemo() untuk computed values
- [ ] useCallback() untuk stable callbacks
- [ ] Bundle size audit

---

### 6. Accessibility Audit ⭐⭐⭐⭐⭐

**Checklist:**

```
Buttons
├── aria-label
└── disabled state

Dialogs
├── role="dialog"
├── aria-modal
├── focus trap
└── escape to close

Inputs
├── label
├── id/for
├── aria-describedby
└── error state

Dropdowns
├── keyboard navigation
├── aria-expanded
└── role="listbox"

Focus
├── focus-visible
├── skip link
└── focus order

Images
├── alt text
└── decorative images → alt=""

Screen Reader
├── semantic HTML
├── heading hierarchy
└── live regions
```

---

### 7. Motion Consistency

```
globals.css
```

```css
/* Motion Tokens */
:root {
  /* Duration */
  --duration-fast: 150ms;
  --duration-normal: 250ms;
  --duration-slow: 350ms;

  /* Easing */
  --ease-out: cubic-bezier(0.33, 1, 0.68, 1);
  --ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* Usage */
.transition-fast {
  transition: all var(--duration-fast) var(--ease-out);
}

.transition-normal {
  transition: all var(--duration-normal) var(--ease-out);
}

.transition-slow {
  transition: all var(--duration-slow) var(--ease-in-out);
}
```

**NO:**

```css
duration-150
duration-250
duration-350
duration-700
```

**YES:**

```css
transition-fast
transition-normal
transition-slow
```

---

### 8. UI Consistency Audit

```
Landing Page
├── spacing consistent?
├── typography scale?
├── button variants?
├── hover states?
└── mobile responsive?

Product Page
├── card spacing?
├── badge alignment?
├── price formatting?
├── stock indicator?
└── image aspect ratio?

Search Page
├── autocomplete position?
├── loading skeleton?
├── empty state?
├── error state?
└── filter sidebar mobile?

Cart Page
├── item spacing?
├── summary alignment?
├── checkout button?
└── empty state?

Checkout Page
├── form spacing?
├── validation message?
├── order summary?
└── loading overlay?

Admin Dashboard
├── table header?
├── pagination style?
├── stat card?
├── sidebar width?
└── mobile menu?

Orders Page
├── order card?
├── status badge?
├── timeline?
└── action buttons?
```

---

## 📁 File Structure (Target)

```
src/
├── components/
│   └── ui/
│       ├── skeleton/
│       │   ├── skeleton.tsx
│       │   ├── product-card-skeleton.tsx
│       │   ├── table-skeleton.tsx
│       │   ├── list-skeleton.tsx
│       │   ├── form-skeleton.tsx
│       │   ├── page-skeleton.tsx
│       │   └── index.ts
│       ├── empty-state/
│       │   ├── empty-state.tsx
│       │   └── index.ts
│       ├── error-state/
│       │   ├── error-state.tsx
│       │   └── index.ts
│       ├── loading/
│       │   ├── loading-overlay.tsx
│       │   ├── page-transition.tsx
│       │   └── index.ts
│       └── status/
│           ├── status-badge.tsx
│           └── index.ts
└── app/
    ├── loading.tsx              ← Global
    ├── error.tsx                ← Global
    ├── products/
    │   └── loading.tsx
    ├── search/
    │   └── loading.tsx
    ├── orders/
    │   └── loading.tsx
    ├── cart/
    │   └── loading.tsx
    └── admin/
        └── loading.tsx
```

---

## 1. Skeleton Components (Primitive-based)

```typescript
// components/ui/skeleton/skeleton.tsx

/**
 * Base Skeleton Primitive
 * Bisa dirangkai untuk membuat skeleton kompleks
 */
interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
}

export function Skeleton({
  className,
  variant = 'rectangular',
  width,
  height,
}: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse bg-gray-200',
        variant === 'circular' && 'rounded-full',
        variant === 'rectangular' && 'rounded-lg',
        className,
      )}
      style={{ width, height }}
    />
  );
}

/**
 * Primitive Skeletons - bisa reuse untuk berbagai card
 */
export function SkeletonText({ lines = 1, className }: { lines?: number; className?: string }) {
  const widths = ['w-full', 'w-3/4', 'w-1/2', 'w-1/3'];
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={widths[i % widths.length]} height={16} />
      ))}
    </div>
  );
}

export function SkeletonAvatar({ size = 40 }: { size?: number }) {
  return <Skeleton variant="circular" width={size} height={size} />;
}

export function SkeletonImage({ aspectRatio = 'square' }: { aspectRatio?: 'square' | 'video' | 'portrait' }) {
  const aspectClasses = {
    square: 'aspect-square',
    video: 'aspect-video',
    portrait: 'aspect-[3/4]',
  };
  return <Skeleton className={aspectClasses[aspectRatio]} />;
}
```

```typescript
// components/ui/skeleton/product-card-skeleton.tsx

/**
 * ProductCardSkeleton - dirangkai dari primitives
 */
export function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <SkeletonImage />
      <div className="p-4">
        <SkeletonText lines={2} className="mb-3" />
        <Skeleton height={24} width="40%" />
      </div>
    </div>
  );
}
```

```typescript
// components/ui/skeleton/page-skeleton.tsx

import { ProductCardSkeleton } from './product-card-skeleton';

export function PageSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton height={32} width={200} />
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
```

```typescript
// components/ui/skeleton/table-skeleton.tsx

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex gap-4 pb-3 border-b">
        <Skeleton width="10%" />
        <Skeleton width="40%" />
        <Skeleton width="20%" />
        <Skeleton width="15%" />
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <SkeletonAvatar size={32} />
          <Skeleton width="40%" />
          <Skeleton width="20%" />
          <Skeleton width="15%" />
        </div>
      ))}
    </div>
  );
}
```

```typescript
// components/ui/skeleton/list-skeleton.tsx

export function ListSkeleton({ items = 5 }: { items?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <SkeletonAvatar size={48} />
          <div className="flex-1">
            <SkeletonText lines={2} />
          </div>
        </div>
      ))}
    </div>
  );
}
```

```typescript
// components/ui/skeleton/form-skeleton.tsx

export function FormSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton height={40} width="100%" />
      <Skeleton height={40} width="100%" />
      <Skeleton height={100} width="100%" />
      <Skeleton height={40} width="50%" />
    </div>
  );
}
```

---

## 2. Empty State Component (Multiple Actions)

```typescript
// components/ui/empty-state/empty-state.tsx

interface EmptyStateAction {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
}

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  actions?: EmptyStateAction[];  // Multiple actions support
}

export function EmptyState({
  icon,
  title,
  description,
  actions,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      {icon && (
        <div className="mb-4 text-gray-400">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {title}
      </h3>
      {description && (
        <p className="text-gray-500 mb-6 max-w-md">
          {description}
        </p>
      )}
      {actions && actions.length > 0 && (
        <div className="flex gap-3 flex-wrap justify-center">
          {actions.map((action, index) => (
            <button
              key={index}
              onClick={action.onClick}
              className={cn(
                'px-6 py-3 rounded-lg font-medium transition-colors',
                action.variant === 'secondary' &&
                  'bg-gray-100 text-gray-700 hover:bg-gray-200',
                action.variant === 'outline' &&
                  'border border-gray-300 text-gray-700 hover:bg-gray-50',
                (!action.variant || action.variant === 'primary') &&
                  'bg-primary-600 text-white hover:bg-primary-700',
              )}
            >
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Empty State Examples:
 *
 * // Single action (back to home)
 * <EmptyState
 *   icon={<SearchX />}
 *   title="No results"
 *   description="Try different keywords"
 *   actions={[{ label: "Back to Home", onClick: () => router.push('/') }]}
 * />
 *
 * // Multiple actions (cart empty)
 * <EmptyState
 *   icon={<CartEmpty />}
 *   title="Your cart is empty"
 *   description="Add items to start shopping"
 *   actions={[
 *     { label: "Browse Products", onClick: () => router.push('/products'), variant: 'primary' },
 *     { label: "View Offers", onClick: () => router.push('/deals'), variant: 'secondary' },
 *   ]}
 * />
 */
```

---

## 3. Error State Component

```typescript
// components/ui/error-state/error-state.tsx

import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  variant?: 'default' | 'critical';
}

export function ErrorState({
  title = 'Terjadi kesalahan',
  message,
  onRetry,
  variant = 'default',
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div
        className={cn(
          'w-16 h-16 rounded-full flex items-center justify-center mb-4',
          variant === 'critical'
            ? 'bg-red-100 text-red-600'
            : 'bg-yellow-100 text-yellow-600',
        )}
      >
        <AlertCircle className="w-8 h-8" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {title}
      </h3>
      <p className="text-gray-500 mb-6 max-w-md">
        {message}
      </p>
      <div className="flex gap-3">
        {onRetry && (
          <button
            onClick={onRetry}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100
                       rounded-lg font-medium hover:bg-gray-200 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Coba Lagi
          </button>
        )}
        <Link
          href="/"
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white
                     rounded-lg font-medium hover:bg-primary-700 transition-colors"
        >
          <Home className="w-4 h-4" />
          Kembali
        </Link>
      </div>
    </div>
  );
}
```

---

## 4. Loading Overlay

```typescript
// components/ui/loading/loading-overlay.tsx

interface LoadingOverlayProps {
  isLoading: boolean;
  children: ReactNode;
  message?: string;
}

export function LoadingOverlay({
  isLoading,
  children,
  message,
}: LoadingOverlayProps) {
  return (
    <div className="relative">
      {children}
      {isLoading && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm
                        flex flex-col items-center justify-center z-10">
          <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent
                          rounded-full animate-spin mb-4" />
          {message && (
            <p className="text-gray-600">{message}</p>
          )}
        </div>
      )}
    </div>
  );
}
```

---

## 5. Motion Tokens

```css
/* globals.css */

:root {
  /* Duration */
  --duration-fast: 150ms;
  --duration-normal: 250ms;
  --duration-slow: 350ms;
  --duration-slower: 500ms;

  /* Easing */
  --ease-out: cubic-bezier(0.33, 1, 0.68, 1);
  --ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);

  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);

  /* Radius */
  --radius-sm: 0.25rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
  --radius-xl: 1rem;
  --radius-2xl: 1.5rem;
}

/* Transition Classes */
.transition-fast {
  transition-duration: var(--duration-fast);
  transition-timing-function: var(--ease-out);
}

.transition-normal {
  transition-duration: var(--duration-normal);
  transition-timing-function: var(--ease-out);
}

.transition-slow {
  transition-duration: var(--duration-slow);
  transition-timing-function: var(--ease-in-out);
}

/* Animation Classes */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in {
  animation: fadeIn var(--duration-normal) var(--ease-out);
}

.animate-slide-up {
  animation: slideUp var(--duration-normal) var(--ease-out);
}
```

---

## ✅ Definition of Done

### Functional

- [ ] Semua halaman memiliki loading skeleton yang konsisten
- [ ] Semua halaman menggunakan EmptyState reusable
- [ ] Semua halaman menggunakan ErrorState reusable
- [ ] Route utama memiliki loading.tsx dan error.tsx
- [ ] Skeleton seragam untuk ProductCard, Search, Cart, Orders, Admin

### Technical

- [ ] Tidak ada duplikasi skeleton atau empty state
- [ ] Bundle tetap efisien
- [ ] Motion token konsisten
- [ ] Tidak ada regresi pada fitur Step 1-9
- [ ] Performance audit complete

### Accessibility

- [ ] Semua button memiliki aria-label
- [ ] Semua dialog memiliki role="dialog"
- [ ] Semua input memiliki label
- [ ] Semua dropdown memiliki keyboard support
- [ ] Focus management audit complete
- [ ] Screen reader testing complete

### UX

- [ ] Navigasi terasa mulus
- [ ] Loading memberikan feedback jelas
- [ ] Error mudah dipahami dan recoverable
- [ ] Empty state memberikan next action
- [ ] Desktop dan mobile experience konsisten

---

## 📊 Target Scores

| Area            | Target |
| --------------- | ------ |
| Architecture    | 10/10  |
| UX Consistency  | 10/10  |
| Accessibility   | 10/10  |
| Performance     | 9.8/10 |
| Reusability     | 10/10  |
| Maintainability | 10/10  |

**Target Overall: 9.9-10.0/10**

---

## 📝 Notes

### Checklist per Area

**1. Loading Experience:**

- [ ] Create skeleton folder structure
- [ ] ProductCardSkeleton
- [ ] TableSkeleton
- [ ] ListSkeleton
- [ ] FormSkeleton
- [ ] PageSkeleton
- [ ] loading.tsx for each route

**2. Empty State:**

- [ ] EmptyState component
- [ ] Apply to Search, Cart, Orders, Admin, Products
- [ ] Consistent icons and copy

**3. Error State:**

- [ ] ErrorState component
- [ ] Retry functionality
- [ ] Apply to all data fetching pages

**4. Suspense:**

- [ ] loading.tsx global
- [ ] loading.tsx for products, search, orders, cart, admin
- [ ] error.tsx global
- [ ] error.tsx for routes

**5. Performance:**

- [ ] Image optimization audit
- [ ] Bundle size check
- [ ] Memoization audit
- [ ] Dynamic imports

**6. Accessibility:**

- [ ] Button aria-labels
- [ ] Dialog roles
- [ ] Input labels
- [ ] Keyboard navigation
- [ ] Focus management
- [ ] Screen reader testing

**7. Motion:**

- [ ] Define duration tokens
- [ ] Define easing tokens
- [ ] Audit all transitions
- [ ] Remove inconsistent durations

**8. UI Audit:**

- [ ] Landing page spacing
- [ ] Product page consistency
- [ ] Search page polish
- [ ] Cart/Checkout polish
- [ ] Admin polish

---

## 📚 Design System Documentation

### docs/design-system/

Setelah implementasi, dokumentasi komponen reusable akan dibuat di folder ini.

```
docs/
└── design-system/
    ├── README.md                    ← Overview
    ├── button.md                   ← Button usage
    ├── skeleton.md                 ← Skeleton usage
    ├── empty-state.md             ← EmptyState usage
    ├── error-state.md             ← ErrorState usage
    ├── status-badge.md            ← StatusBadge usage
    └── motion.md                  ← Motion tokens
```

### Contoh: Design System Components

#### Button Component

```markdown
# Button

Komponen tombol serbaguna untuk berbagai keperluan.

## Variants

- `primary` - Tombol utama (CTA)
- `secondary` - Tombol sekunder
- `outline` - Tombol dengan border
- `ghost` - Tombol tanpa background

## Sizes

- `sm` - Small (32px)
- `md` - Medium (40px)
- `lg` - Large (48px)

## Usage

✅ DO:

- Gunakan `primary` untuk CTA utama
- Gunakan `secondary` untuk aksi sekunder
- Gunakan `outline` untuk aksi alternatif

❌ DON'T:

- Jangan gunakan lebih dari 1 `primary` per section
- Jangan gunakan `ghost` untuk aksi penting

## Props

| Prop     | Type                                             | Default   | Description        |
| -------- | ------------------------------------------------ | --------- | ------------------ |
| variant  | 'primary' \| 'secondary' \| 'outline' \| 'ghost' | 'primary' | Visual style       |
| size     | 'sm' \| 'md' \| 'lg'                             | 'md'      | Button size        |
| loading  | boolean                                          | false     | Show loading state |
| disabled | boolean                                          | false     | Disable button     |
```

#### Skeleton Component

````markdown
# Skeleton

Komponen loading placeholder.

## Primitives

- `Skeleton` - Base skeleton
- `SkeletonText` - Text lines
- `SkeletonAvatar` - Avatar placeholder
- `SkeletonImage` - Image placeholder

## Usage

✅ DO:

- Gunakan `Skeleton` primitives untuk custom layouts
- Gunakan `ProductCardSkeleton` untuk product grids
- Gunakan `TableSkeleton` untuk tables
- Gunakan `ListSkeleton` untuk lists

❌ DON'T:

- Jangan buat skeleton baru jika sudah ada yang cocok
- Jangan gunakan skeleton untuk error states

## Custom Skeleton

```tsx
// Combine primitives
<div>
  <SkeletonAvatar size={48} />
  <SkeletonText lines={2} />
</div>
```
````

````

#### EmptyState Component

```markdown
# EmptyState

Komponen untuk menampilkan state kosong.

## Usage

✅ DO:
- Gunakan untuk hasil pencarian kosong
- Gunakan untuk cart kosong
- Gunakan untuk data tidak ditemukan
- Selalu berikan next action

❌ DON'T:
- Jangan gunakan untuk error states
- Jangan biarkan tanpa actions jika memungkinkan

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| icon | ReactNode | No | Custom icon |
| title | string | Yes | Judul state |
| description | string | No | Deskripsi |
| actions | Action[] | No | Array of CTAs |

## Examples

```tsx
// Cart empty
<EmptyState
  icon={<CartEmpty />}
  title="Keranjang kosong"
  description="Yuk mulai belanja"
  actions={[
    { label: "Belanja Sekarang", onClick: () => {}, variant: 'primary' },
    { label: "Lihat Promo", onClick: () => {}, variant: 'secondary' },
  ]}
/>

// Search no results
<EmptyState
  icon={<SearchX />}
  title="Tidak ditemukan"
  description="Coba kata kunci lain"
  actions={[
    { label: "Kembali", onClick: () => {}, variant: 'outline' },
  ]}
/>
````

````

#### ErrorState Component

```markdown
# ErrorState

Komponen untuk menampilkan error.

## Variants

- `default` - Error umum (yellow)
- `critical` - Error kritis (red)

## Usage

✅ DO:
- Gunakan untuk error yang bisa di-retry
- Gunakan untuk error yang butuh action
- Berikan pesan yang informatif

❌ DON'T:
- Jangan gunakan untuk "not found" (gunakan EmptyState)
- Jangan tampilkan technical error details ke user

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| title | string | 'Terjadi kesalahan' | Error title |
| message | string | Yes | Error description |
| onRetry | () => void | No | Retry callback |
| variant | 'default' \| 'critical' | 'default' | Visual style |

## Examples

```tsx
// Network error
<ErrorState
  message="Tidak dapat terhubung ke server"
  onRetry={refetch}
/>

// Critical error
<ErrorState
  title="Gagal memuat data"
  message="Terjadi kesalahan yang tidak terduga"
  variant="critical"
  onRetry={refetch}
/>
````

````

#### StatusBadge Component

```markdown
# StatusBadge

Komponen badge untuk status.

## Variants

```typescript
type StatusVariant =
  | 'pending'    // Yellow - Menunggu
  | 'processing' // Blue - Diproses
  | 'paid'       // Green - Dibayar
  | 'shipped'    // Purple - Dikirim
  | 'completed'  // Green - Selesai
  | 'cancelled'  // Red - Dibatalkan
  | 'refunded'   // Orange - Dikembalikan
  | 'success'    // Green - Sukses
  | 'warning'    // Yellow - Peringatan
  | 'error'      // Red - Error
  | 'info';      // Blue - Info
````

## Usage

✅ DO:

- Gunakan warna yang sesuai dengan makna status
- Gunakan label yang singkat dan jelas

❌ DON'T:

- Jangan buat badge baru untuk status yang sudah ada
- Jangan gunakan warna yang confusing

## Examples

```tsx
<OrderStatusBadge status="pending" />
<PaymentStatusBadge status="paid" />
<StockBadge stock={5} />
```

```

---

## 🔄 Future Enhancements

After Step 10, Phase 6 is complete:

1. **Backend Integration** - Connect frontend to backend
2. **Testing** - Unit tests, integration tests
3. **Monitoring** - Error tracking, analytics
4. **CI/CD** - Automated deployment

---

## ✅ Revisions Applied

1. ✅ **Skeleton Primitives** - SkeletonText, SkeletonAvatar, SkeletonImage sebagai base
2. ✅ **EmptyState actions[]** - Support multiple actions dengan variant
3. ✅ **Design System Documentation** - docs/design-system/ structure

---

**Status: 🔄 READY FOR REVIEW**

**Next: Toggle to Act mode untuk implementasi**

**Target: Phase 6 Frontend Complete**
```
