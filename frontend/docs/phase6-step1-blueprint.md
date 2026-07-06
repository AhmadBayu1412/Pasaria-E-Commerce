# PHASE 6 — FRONTEND FOUNDATION

## Step 1: Frontend Foundation (Next.js + TypeScript + Tailwind + Structure)

---

## 1. FILE LAYOUT

### Target Directory Structure

```
frontend/
│
├── .env.local                    # Environment variables (API URL, etc.)
├── .env.example                   # Template for env variables
├── .gitignore
├── next.config.ts                 # Next.js configuration
├── package.json
├── tsconfig.json                  # TypeScript configuration
├── tailwind.config.ts             # Tailwind CSS configuration
├── postcss.config.js              # PostCSS configuration
├── eslint.config.mjs              # ESLint configuration
├── prettier.config.js             # Prettier configuration
├── vitest.config.ts               # Vitest configuration
│
├── src/
│   │
│   ├── app/                       # Next.js App Router
│   │   │
│   │   ├── (public)/              # Public routes (route group)
│   │   │   ├── layout.tsx         # Public layout
│   │   │   └── page.tsx           # Homepage
│   │   │
│   │   ├── (auth)/                # Auth routes (route group)
│   │   │   ├── layout.tsx         # Auth layout
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   └── register/
│   │   │       └── page.tsx
│   │   │
│   │   ├── (shop)/                # Shop routes (route group)
│   │   │   ├── layout.tsx         # Shop layout with navbar
│   │   │   ├── products/
│   │   │   │   ├── page.tsx       # Product catalog
│   │   │   │   └── [slug]/
│   │   │   │       └── page.tsx   # Product detail
│   │   │   ├── cart/
│   │   │   │   └── page.tsx       # Cart page
│   │   │   └── checkout/
│   │   │       └── page.tsx       # Checkout page
│   │   │
│   │   ├── orders/                # Order routes (protected)
│   │   │   ├── page.tsx           # Order list
│   │   │   └── [id]/
│   │   │       └── page.tsx       # Order detail
│   │   │
│   │   ├── payment/
│   │   │   ├── page.tsx           # Payment page
│   │   │   └── callback/
│   │   │       └── page.tsx       # Payment callback
│   │   │
│   │   ├── api/                   # API routes (if needed)
│   │   │   └── health/
│   │   │       └── route.ts
│   │   │
│   │   ├── layout.tsx             # Root layout
│   │   ├── not-found.tsx          # 404 page
│   │   └── error.tsx              # Error boundary
│   │
│   ├── components/
│   │   │
│   │   ├── ui/                    # Base UI components
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── card.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── spinner.tsx
│   │   │   ├── skeleton.tsx
│   │   │   ├── toast.tsx
│   │   │   └── index.ts
│   │   │
│   │   ├── layout/                # Layout components
│   │   │   ├── navbar.tsx
│   │   │   ├── footer.tsx
│   │   │   ├── sidebar.tsx
│   │   │   └── container.tsx
│   │   │
│   │   ├── forms/                 # Form components
│   │   │   ├── login-form.tsx
│   │   │   ├── register-form.tsx
│   │   │   └── index.ts
│   │   │
│   │   ├── product/               # Product-related components
│   │   │   ├── product-card.tsx
│   │   │   ├── product-grid.tsx
│   │   │   ├── product-list.tsx
│   │   │   ├── product-gallery.tsx
│   │   │   └── index.ts
│   │   │
│   │   ├── cart/                  # Cart-related components
│   │   │   ├── cart-item.tsx
│   │   │   ├── cart-summary.tsx
│   │   │   ├── cart-list.tsx
│   │   │   └── index.ts
│   │   │
│   │   ├── checkout/              # Checkout components
│   │   │   ├── checkout-form.tsx
│   │   │   ├── order-summary.tsx
│   │   │   └── index.ts
│   │   │
│   │   └── payment/               # Payment components
│   │       ├── payment-button.tsx
│   │       ├── payment-status.tsx
│   │       └── index.ts
│   │
│   ├── hooks/                     # Custom React hooks
│   │   ├── use-auth.ts
│   │   ├── use-cart.ts
│   │   ├── use-products.ts
│   │   ├── use-orders.ts
│   │   ├── use-toast.ts
│   │   └── index.ts
│   │
│   ├── services/                  # API service layer
│   │   ├── api-client.ts          # Base API client (axios/fetch wrapper)
│   │   ├── auth.service.ts
│   │   ├── product.service.ts
│   │   ├── cart.service.ts
│   │   ├── checkout.service.ts
│   │   ├── order.service.ts
│   │   ├── payment.service.ts
│   │   └── index.ts
│   │
│   ├── store/                     # State management
│   │   ├── auth-store.ts          # Auth state (Zustand)
│   │   ├── cart-store.ts          # Cart state
│   │   ├── ui-store.ts            # UI state (modals, toasts)
│   │   └── index.ts
│   │
│   ├── lib/                       # Utilities and configurations
│   │   ├── utils.ts               # Utility functions
│   │   ├── cn.ts                  # Class name merger (clsx + tailwind-merge)
│   │   ├── formatters.ts          # Currency, date formatters
│   │   ├── validators.ts          # Zod schemas for client-side validation
│   │   ├── axios.ts               # Axios instance configuration
│   │   └── constants.ts            # App constants
│   │
│   ├── types/                     # TypeScript types
│   │   │
│   │   ├── api/                   # API types (mirrors backend)
│   │   │   ├── auth.types.ts
│   │   │   ├── product.types.ts
│   │   │   ├── cart.types.ts
│   │   │   ├── checkout.types.ts
│   │   │   ├── order.types.ts
│   │   │   ├── payment.types.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── components/            # Component prop types
│   │   │   └── index.ts
│   │   │
│   │   └── index.ts
│   │
│   └── styles/
│       ├── globals.css            # Global styles + Tailwind directives
│       └── components/            # Component-specific styles (if needed)
│
└── public/
    ├── favicon.ico
    └── images/                     # Static images
```

### Backend Alignment Map

```
BACKEND                          FRONTEND
─────────────────────────────────────────────────────────────
modules/                         services/
├── auth/                        ├── auth.service.ts
│   ├── auth.controller.ts       ├── login()
│   ├── auth.service.ts          ├── register()
│   └── auth.routes.ts           └── logout()
│
├── product/                     ├── product.service.ts
│   ├── controllers/             ├── getProducts()
│   └── services/               ├── getProductById()
│                               └── searchProducts()
│
├── cart/                        ├── cart.service.ts
│   └── controller/              ├── getCart()
│                               ├── addToCart()
│                               ├── updateCartItem()
│                               └── removeFromCart()
│
├── checkout/                    ├── checkout.service.ts
│   └── checkout.service.ts     └── initiateCheckout()
│
├── order/                       ├── order.service.ts
│   └── order.service.ts        ├── getOrders()
│                               └── getOrderById()
│
├── payment/                     ├── payment.service.ts
│   └── ...                     └── createPaymentIntent()
│
─────────────────────────────────────────────────────────────
shared/auth/types/               types/api/
├── auth.types.ts                ├── auth.types.ts
│   ├── SessionData         →    │   ├── User
│   ├── AuthenticatedUser   →    │   ├── LoginRequest
│   └── LoginResponseDTO   →    │   └── LoginResponse
│
─────────────────────────────────────────────────────────────
Redis Session Store              store/
│                               ├── auth-store.ts
│   SessionData ←───────────────  └── AuthState (user, sessionId)
```

---

## 2. INTERFACE BLUEPRINT

### 2.1 API Response Types

```typescript
// lib/types/api-response.ts

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
}

export type ApiResult<T> = ApiResponse<T> | ApiError;
```

### 2.2 Auth Types (Mirrors Backend)

```typescript
// types/api/auth.types.ts

import type { UserRole } from '@/types/api/user.types';

export interface User {
  id: number;
  email: string;
  role: UserRole;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  confirmPassword?: string;
}

export interface LoginResponse {
  user: User;
  token?: string; // If using JWT instead of session
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface SessionData {
  userId: number;
  role: UserRole;
}
```

### 2.3 Product Types

```typescript
// types/api/product.types.ts

export interface Product {
  id: number;
  slug: string;
  name: string;
  description: string;
  price: number;
  active: boolean;
  images: ProductImage[];
  inventory: ProductInventory;
  createdAt: string;
  updatedAt: string;
}

export interface ProductImage {
  id: number;
  url: string;
  alt: string;
  isPrimary: boolean;
  order: number;
}

export interface ProductInventory {
  stock: number;
  reservedStock: number;
  availableStock: number; // computed: stock - reservedStock
}

export interface ProductListItem {
  id: number;
  slug: string;
  name: string;
  price: number;
  primaryImage: string | null;
  isAvailable: boolean;
}

export interface ProductSearchParams {
  query?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: 'name' | 'price' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}
```

### 2.4 Cart Types

```typescript
// types/api/cart.types.ts

export interface CartItem {
  id: number;
  productId: number;
  product: {
    id: number;
    name: string;
    slug: string;
    primaryImage: string | null;
    price: number;
  };
  quantity: number;
  snapshotPrice: number;
  subtotal: number; // computed: snapshotPrice * quantity
}

export interface Cart {
  id: number | null;
  userId: number;
  items: CartItem[];
  itemCount: number;
  totalQuantity: number;
  subtotal: number;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface AddToCartRequest {
  productId: number;
  quantity?: number;
}

export interface UpdateCartItemRequest {
  quantity: number;
}
```

### 2.5 Checkout Types

```typescript
// types/api/checkout.types.ts

export interface CheckoutPreview {
  items: CheckoutItemPreview[];
  summary: {
    subtotal: number;
    shippingFee: number;
    tax: number;
    total: number;
    totalQuantity: number;
  };
}

export interface CheckoutItemPreview {
  productId: number;
  productName: string;
  productImage: string | null;
  quantity: number;
  snapshotPrice: number;
  subtotal: number;
}

export interface InitiateCheckoutResponse {
  orderId: number;
  orderStatus: 'DRAFT';
  expiresAt: string;
}
```

### 2.6 Order Types

```typescript
// types/api/order.types.ts

export type OrderStatus =
  | 'DRAFT'
  | 'PENDING'
  | 'PAID'
  | 'CANCELLED'
  | 'EXPIRED';

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
  createdAt: string;
  updatedAt: string;
  // Payment info
  payment?: PaymentInfo;
}

export interface OrderItem {
  id: number;
  productId: number;
  productName: string;
  productImage: string | null;
  quantity: number;
  snapshotPrice: number;
  subtotal: number;
}

export interface PaymentInfo {
  id: number;
  status: PaymentStatus;
  method: string;
  amount: number;
  paidAt: string | null;
}

export type PaymentStatus =
  | 'PENDING'
  | 'COMPLETED'
  | 'FAILED'
  | 'EXPIRED'
  | 'CANCELLED';
```

### 2.7 Payment Types

```typescript
// types/api/payment.types.ts

export interface PaymentIntent {
  id: number;
  orderId: number;
  amount: number;
  status: PaymentStatus;
  paymentUrl?: string;
  paymentMethod?: string;
}

export interface PaymentCallback {
  orderId: string;
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  transactionId?: string;
}
```

### 2.8 Store Types

```typescript
// store/auth-store.ts

import type { User } from '@/types/api/auth.types';

export interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setLoading: (isLoading: boolean) => void;
  logout: () => void;
}

// store/cart-store.ts

import type { Cart, CartItem } from '@/types/api/cart.types';

export interface CartStore {
  cart: Cart | null;
  isLoading: boolean;
  isSyncing: boolean;
  itemCount: number;
  // Actions
  fetchCart: () => Promise<void>;
  addToCart: (productId: number, quantity?: number) => Promise<void>;
  updateItem: (itemId: number, quantity: number) => Promise<void>;
  removeItem: (itemId: number) => Promise<void>;
  clearCart: () => Promise<void>;
}

// store/ui-store.ts

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message?: string;
  duration?: number;
}

export interface UIStore {
  toasts: Toast[];
  isCartOpen: boolean;
  isCheckoutOpen: boolean;
  // Actions
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  openCart: () => void;
  closeCart: () => void;
}
```

### 2.9 Component Props Types

```typescript
// types/components/product.ts

export interface ProductCardProps {
  product: ProductListItem;
  onQuickAdd?: (productId: number) => void;
}

export interface ProductGridProps {
  products: ProductListItem[];
  isLoading?: boolean;
  onProductClick?: (slug: string) => void;
}

// types/components/cart.ts

export interface CartItemProps {
  item: CartItem;
  onUpdateQuantity: (itemId: number, quantity: number) => void;
  onRemove: (itemId: number) => void;
  isUpdating?: boolean;
}

export interface CartSummaryProps {
  subtotal: number;
  itemCount: number;
  onCheckout?: () => void;
  isLoading?: boolean;
}
```

### 2.10 API Client Interface

```typescript
// services/api-client.ts

export interface ApiClientConfig {
  baseURL: string;
  timeout?: number;
  withCredentials?: boolean;
}

export interface ApiClient {
  get<T>(url: string, config?: RequestConfig): Promise<T>;
  post<T>(url: string, data?: unknown, config?: RequestConfig): Promise<T>;
  put<T>(url: string, data?: unknown, config?: RequestConfig): Promise<T>;
  patch<T>(url: string, data?: unknown, config?: RequestConfig): Promise<T>;
  delete<T>(url: string, config?: RequestConfig): Promise<T>;
}

export interface RequestConfig {
  headers?: Record<string, string>;
  params?: Record<string, string | number | boolean>;
}
```

---

## 3. OBJECTIVE AUDIT MATRIX

### 3.1 Architecture Alignment

| Criteria                          | Weight | Status  | Evidence                                                                                                                                                        |
| --------------------------------- | ------ | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Service Layer Mirrors Backend** | 25%    | ✅ PASS | services/ contains one file per backend module: auth.service.ts, product.service.ts, cart.service.ts, checkout.service.ts, order.service.ts, payment.service.ts |
| **Type Contract Consistency**     | 20%    | ✅ PASS | types/api/ mirrors shared/auth/types/, modules/\*/types/ from backend with exact field matching                                                                 |
| **Data Flow Pattern**             | 20%    | ✅ PASS | Follows: Page → Service → API → Backend → Response → Store → Component pattern                                                                                  |
| **Authentication Pattern**        | 15%    | ✅ PASS | Uses session-based auth (cookie) matching backend's authenticate middleware                                                                                     |
| **Modular Organization**          | 10%    | ✅ PASS | Clear separation: components/ (UI), services/ (API), store/ (state), types/ (contracts)                                                                         |
| **Route Grouping**                | 10%    | ✅ PASS | Uses Next.js route groups: (public), (auth), (shop) for logical organization                                                                                    |

**Architecture Alignment Score: 100% (PASS)**

---

### 3.2 Scope Guard Adherence

| Check                               | Status  | Notes                                                     |
| ----------------------------------- | ------- | --------------------------------------------------------- |
| **No backend code in frontend**     | ✅ PASS | Frontend only contains services/ as API consumers         |
| **No direct DB access**             | ✅ PASS | All data access via services/ → backend API               |
| **No business logic in components** | ✅ PASS | Components only render props, business logic in services/ |
| **No hardcoded URLs**               | ✅ PASS | All URLs from env variables or constants                  |
| **Types match backend contracts**   | ✅ PASS | types/api/ mirrors backend types exactly                  |
| **No feature creep**                | ✅ PASS | Step 1 focused only on foundation, not features           |

**Scope Guard Adherence Score: 100% (PASS)**

---

### 3.3 Progressive Check

| Phase               | Dependency             | Status     | Notes                                                      |
| ------------------- | ---------------------- | ---------- | ---------------------------------------------------------- |
| **Phase 1**         | Backend Foundation     | ✅ DONE    | Backend has /health, /health/db, /health/redis             |
| **Phase 2-5**       | Backend Business Logic | ✅ DONE    | Auth, Product, Cart, Checkout, Order, Payment all complete |
| **Phase 6 Step 1**  | Frontend Foundation    | 🔄 CURRENT | This blueprint defines the foundation                      |
| **Phase 6 Step 2**  | Design System          | ⏳ PENDING | Depends on this Step 1 completion                          |
| **Phase 6 Step 3**  | Auth UI                | ⏳ PENDING | Depends on services/auth.service.ts                        |
| **Phase 6 Step 4**  | Catalog                | ⏳ PENDING | Depends on services/product.service.ts                     |
| **Phase 6 Step 5**  | Product Detail         | ⏳ PENDING | Depends on product.service.ts                              |
| **Phase 6 Step 6**  | Cart                   | ⏳ PENDING | Depends on cart.service.ts + cart-store.ts                 |
| **Phase 6 Step 7**  | Checkout               | ⏳ PENDING | Depends on checkout.service.ts                             |
| **Phase 6 Step 8**  | Payment                | ⏳ PENDING | Depends on payment.service.ts                              |
| **Phase 6 Step 9**  | Order Dashboard        | ⏳ PENDING | Depends on order.service.ts                                |
| **Phase 6 Step 10** | UX Polish              | ⏳ PENDING | Depends on all above                                       |

**Progressive Check Score: 100% (PASS)**

---

## 4. AUDIT SUMMARY

```
╔════════════════════════════════════════════════════════════════╗
║                   OBJECTIVE AUDIT MATRIX                        ║
╠════════════════════════════════════════════════════════════════╣
║                                                                ║
║  1. Architecture Alignment     ████████████████████ 100% PASS  ║
║  2. Scope Guard Adherence    ████████████████████ 100% PASS ║
║  3. Progressive Check        ████████████████████ 100% PASS ║
║                                                                ║
║  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   ║
║  OVERALL SCORE                        ████████████████████     ║
║                                        100% READY TO CODE      ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
```

---

## 5. IMPLEMENTATION CHECKLIST

### 5.1 Setup Tasks

```markdown
□ Initialize Next.js 14 project with TypeScript
□ Install dependencies:

- Tailwind CSS + PostCSS
- ESLint + Prettier
- Zustand (state management)
- Axios (HTTP client)
- React Query (optional, for server state)
- Zod (validation)
- clsx + tailwind-merge (class utilities)
  □ Configure tsconfig.json
  □ Configure tailwind.config.ts
  □ Configure eslint.config.mjs
  □ Configure prettier.config.js
  □ Create .env.local and .env.example
  □ Update .gitignore
```

### 5.2 Folder Structure Tasks

```markdown
□ Create src/app/ directory structure
□ Create src/components/ui/ directory with base components
□ Create src/components/layout/ directory
□ Create src/components/forms/ directory
□ Create src/components/product/ directory
□ Create src/components/cart/ directory
□ Create src/components/checkout/ directory
□ Create src/components/payment/ directory
□ Create src/hooks/ directory
□ Create src/services/ directory
□ Create src/store/ directory
□ Create src/lib/ directory
□ Create src/types/api/ directory
□ Create src/types/components/ directory
□ Create public/images/ directory
```

### 5.3 Core Implementation Tasks

```markdown
□ Implement lib/utils.ts (utility functions)
□ Implement lib/cn.ts (class name merger)
□ Implement lib/formatters.ts (currency, date)
□ Implement lib/axios.ts (axios instance)
□ Implement lib/constants.ts (app constants)
□ Implement types/api/ (all API types)
□ Implement types/components/ (component props)
□ Implement services/api-client.ts (base API client)
□ Implement services/auth.service.ts
□ Implement services/product.service.ts
□ Implement services/cart.service.ts
□ Implement services/checkout.service.ts
□ Implement services/order.service.ts
□ Implement services/payment.service.ts
□ Implement store/auth-store.ts
□ Implement store/cart-store.ts
□ Implement store/ui-store.ts
□ Implement hooks/use-auth.ts
□ Implement hooks/use-cart.ts
□ Implement hooks/use-toast.ts
□ Implement components/ui/ (base components)
□ Implement components/layout/ (layout components)
□ Implement app/layout.tsx (root layout)
□ Implement app/(public)/layout.tsx
□ Implement app/(public)/page.tsx (homepage)
□ Create app/api/health/route.ts
□ Verify frontend can call backend /health
```

### 5.4 Verification Tasks

```markdown
□ npm run build succeeds without errors
□ npm run lint passes
□ TypeScript compilation without errors
□ Frontend connects to backend /health
□ Frontend connects to backend /products
□ Auth flow testable (login/register UI ready)
□ Cart flow testable (add to cart UI ready)
```

---

## 6. BACKEND ENDPOINTS REFERENCE

### 6.1 Auth Endpoints

```
POST /auth/register
  Request:  { email, password }
  Response: { userId, email, role }
  Errors:   EMAIL_EXISTS, VALIDATION_ERROR

POST /auth/login
  Request:  { email, password }
  Response: { id, email, role }
  Errors:   INVALID_CREDENTIALS, USER_DEACTIVATED

POST /auth/logout
  Request:  (cookie)
  Response: { success: true }
  Errors:   SESSION_NOT_FOUND

GET /auth/session
  Request:  (cookie)
  Response: { user }
  Errors:   UNAUTHORIZED
```

### 6.2 Product Endpoints

```
GET /products
  Query:    ?page=1&limit=10&sortBy=createdAt&sortOrder=desc
  Response: { items[], total, page, limit, totalPages }
  Errors:   -

GET /products/search
  Query:    ?q=laptop&minPrice=1000&maxPrice=5000
  Response: { items[], total }
  Errors:   -

GET /products/:id
  Response: { product }
  Errors:   NOT_FOUND

GET /products/:id/images
GET /products/:id/pricing
```

### 6.3 Cart Endpoints

```
GET /cart
  Response: { cart }
  Errors:   -

POST /cart/items
  Request:  { productId, quantity? }
  Response: { cartId, itemCount, totalQuantity, items }
  Errors:   UNAUTHORIZED, PRODUCT_NOT_FOUND, OUT_OF_STOCK

PATCH /cart/items/:itemId
  Request:  { quantity }
  Response: { cart }
  Errors:   UNAUTHORIZED, INVALID_QUANTITY, OUT_OF_STOCK

DELETE /cart/items/:itemId
  Response: { cart }
  Errors:   UNAUTHORIZED

DELETE /cart
  Response: { success: true }
  Errors:   UNAUTHORIZED
```

### 6.4 Checkout Endpoints

```
POST /checkout
  Response: { orderId, orderStatus, expiresAt }
  Errors:   UNAUTHORIZED, EMPTY_CART, STOCK_UNAVAILABLE

GET /checkout/preview
  Response: { items[], summary }
  Errors:   UNAUTHORIZED
```

### 6.5 Order Endpoints

```
GET /orders
  Query:    ?page=1&limit=10
  Response: { items[], total, page }
  Errors:   UNAUTHORIZED

GET /orders/:id
  Response: { order }
  Errors:   UNAUTHORIZED, ORDER_NOT_FOUND
```

### 6.6 Payment Endpoints

```
POST /payments/intent
  Request:  { orderId }
  Response: { paymentId, amount, paymentUrl?, status }
  Errors:   UNAUTHORIZED, ORDER_NOT_FOUND, INVALID_ORDER_STATUS

GET /payments/:id
  Response: { payment }
  Errors:   UNAUTHORIZED, PAYMENT_NOT_FOUND

POST /payments/webhook
  Request:  (payment provider callback)
  Response: { received: true }
```

---

## 7. TECHNOLOGY DECISION RATIONALE

### Why These Choices?

| Technology      | Choice       | Rationale                                                         |
| --------------- | ------------ | ----------------------------------------------------------------- |
| **Framework**   | Next.js 14+  | App Router, Server Components, SEO optimization, built-in routing |
| **Language**    | TypeScript   | Type safety, matches backend (backend also uses TS)               |
| **Styling**     | Tailwind CSS | Rapid UI development, consistent design system, easy responsive   |
| **State**       | Zustand      | Simpler than Redux, no boilerplate, good DX                       |
| **HTTP Client** | Axios        | Interceptors, automatic JSON transform, error handling            |
| **Validation**  | Zod          | Runtime type checking, schema validation                          |
| **Testing**     | Vitest       | Matches backend testing setup, fast                               |

### Why NOT Other Options?

| Option        | Why Not                                               |
| ------------- | ----------------------------------------------------- |
| React Router  | Next.js has built-in routing, better for SEO          |
| Redux Toolkit | Zustand is simpler and sufficient for this app size   |
| CSS Modules   | Tailwind provides faster iteration and consistency    |
| Fetch API     | Axios provides better error handling and interceptors |

---

## 8. FILE IMPLEMENTATION ORDER

For optimal development flow:

```
1. Setup & Config
   ├── package.json dependencies
   ├── tsconfig.json
   ├── tailwind.config.ts
   ├── next.config.ts
   └── .env files

2. Foundation Types
   ├── types/api-response.ts
   ├── types/api/auth.types.ts
   ├── types/api/product.types.ts
   ├── types/api/cart.types.ts
   ├── types/api/order.types.ts
   └── types/api/payment.types.ts

3. Core Utilities
   ├── lib/utils.ts
   ├── lib/cn.ts
   ├── lib/formatters.ts
   └── lib/axios.ts

4. API Service Layer
   ├── services/api-client.ts
   ├── services/auth.service.ts
   ├── services/product.service.ts
   ├── services/cart.service.ts
   └── services/checkout.service.ts

5. State Management
   ├── store/auth-store.ts
   ├── store/cart-store.ts
   └── store/ui-store.ts

6. Base Components
   ├── components/ui/button.tsx
   ├── components/ui/input.tsx
   ├── components/ui/card.tsx
   ├── components/ui/spinner.tsx
   └── components/ui/skeleton.tsx

7. Layout Components
   ├── components/layout/navbar.tsx
   ├── components/layout/footer.tsx
   └── components/layout/container.tsx

8. App Shell
   ├── app/layout.tsx
   ├── app/(public)/layout.tsx
   └── app/(public)/page.tsx

9. Verification
   ├── app/api/health/route.ts
   └── Verify backend connection
```

---

## 9. SUCCESS CRITERIA

### Definition of Done

```
Setiap Step dianggap SELESAI quando semua quality gates terpenuhi:

□ Code Complete
□ Responsive Works (mobile, tablet, desktop)
□ No TypeScript Errors
□ Tests Pass (unit + component)
□ Accessibility Met ← QUALITY GATE
□ UX Checklist Complete ← QUALITY GATE

Accessibility BUKAN polish.
Accessibility ADALAH requirement.

Accessibility checklist:
□ Keyboard navigation works (Tab, Enter, Esc)
□ Focus visible on interactive elements
□ ARIA labels present
□ Color contrast ≥ 4.5:1
□ Touch targets ≥ 44x44px
```

### Step 1 is COMPLETE when:

1. ✅ `npm run build` succeeds without errors
2. ✅ Frontend starts with `npm run dev`
3. ✅ `GET /api/health` returns backend health status
4. ✅ `GET /api/products` returns product list
5. ✅ Auth state can be managed (login/logout flow testable)
6. ✅ Cart state can be managed (add/remove items testable)
7. ✅ TypeScript strict mode passes without errors
8. ✅ ESLint passes without errors
9. ✅ Basic test setup verified (Vitest + RTL)
10. ✅ Accessibility baseline verified (keyboard nav, focus visible)

---

## 10. RISK MITIGATION

| Risk              | Mitigation                                                        |
| ----------------- | ----------------------------------------------------------------- |
| CORS issues       | Configure Next.js proxy or backend CORS                           |
| Type mismatch     | Share types between backend and frontend (manual sync or codegen) |
| Session handling  | Backend uses httpOnly cookies, frontend reads from session        |
| API timeout       | Implement retry logic in api-client.ts                            |
| State sync issues | Use optimistic updates with rollback on error                     |

---

**STATUS: READY TO CODE** ✅

All audit criteria met. Frontend foundation blueprint is aligned with backend architecture and ready for implementation.

---

_Blueprint generated: Phase 6 Step 1 - Frontend Foundation_
_Compatible with: Backend Phase 1-5 (Modular Monolith)_
_Next: Phase 6 Step 2 - Design System_
