# PHASE 6 — FRONTEND OVERVIEW

## 📋 Table of Contents

1. [Phase Overview](#1-phase-overview)
2. [Philosophy](#2-philosophy)
3. [Data Flow](#3-data-flow)
4. [10-Step Roadmap](#4-10-step-roadmap)
5. [Step Details](#5-step-details)
6. [Dependency Graph](#6-dependency-graph)
7. [Integration Points](#7-integration-points)
8. [Milestones](#8-milestones)
9. [Progressive Complexity](#9-progressive-complexity)

---

## 1. PHASE OVERVIEW

### Purpose

```
Phase 6 = User Experience Layer

Backend Phase 1-5 (Mesin Mobil)
         ↓
Phase 6 (Dashboard, Setir, Pedal)
         ↓
User bisa mengemudikan aplikasi
```

### Goal

```
Phase 6 bukan membuat UI cantik.

Phase 6 membuat frontend yang:
✓ scalable      — architecture yang bisa grow
✓ maintainable  — mudah di-maintain tim
✓ reusable      — komponen bisa reuse
✓ predictable   — behavior bisa ditebak
✓ testable      — mudah di-test
```

### Scope

```
INCLUDE:
- Next.js 14 App Router
- TypeScript strict mode
- Tailwind CSS
- Zustand (state management)
- API service layer
- Responsive design (mobile, tablet, desktop)
- Error handling
- Loading states

EXCLUDE:
- Seller Portal (Future Phase)
- Admin Dashboard (Future Phase)
- PWA features (Phase 8+)
- Real-time features
- Mobile native apps (Phase 8+)
```

### Phase Focus

```
Phase 6 is CUSTOMER-FACING frontend only.

Target users:
├── Guest (unauthenticated browse)
└── Authenticated Customer (full shopping flow)

Note: Seller Portal and Admin Dashboard are Future Phases.
```

---

## 2. PHILOSOPHY

### Common Learning Pattern (Yang Sering Terjadi)

```
Button
↓
Navbar
↓
Card
↓
Halaman
```

**Masalah:** Tidak mencerminkan realitas production.

### Production Pattern (Yang Kita Gunakan)

```
Business Flow
↓
UI Flow
↓
Component
↓
Styling
```

**Alasan:** User tidak peduli ada Button yang cantik. User peduli:

> "Saya bisa checkout atau tidak?"

### Kenapa Frontend Setelah Backend?

```
Backend Phase 1-5 sudah memiliki:

✓ Auth          → Login, Register, Session
✓ Product       → Catalog, Search, Detail
✓ Cart         → Add, Update, Remove
✓ Checkout     → Preview, Initiate
✓ Inventory    → Stock validation
✓ Order        → Create, Track, History
✓ Payment      → Intent, Webhook
✓ Email        → Notifications
✓ Queue        → Background jobs
✓ Logging      → Audit trail
✓ Cache        → Redis
✓ Health Check → Monitoring
✓ Metrics      → Observability
✓ Tracing      → Debugging

Artinya frontend tinggal menjadi CONSUMER API.
Bukan sebaliknya.
```

### Frontend sebagai Consumer API

```
┌─────────────────────────────────────────────────────────┐
│                      FRONTEND                            │
│  ┌──────────────────────────────────────────────────┐   │
│  │                   UI Layer                       │   │
│  │  Page, Components, Layout                        │   │
│  └──────────────────────────────────────────────────┘   │
│                         ↓                                │
│  ┌──────────────────────────────────────────────────┐   │
│  │                Service Layer                     │   │
│  │  auth.service, product.service, cart.service     │   │
│  └──────────────────────────────────────────────────┘   │
│                         ↓                                │
│  ┌──────────────────────────────────────────────────┐   │
│  │                  API Client                      │   │
│  │  axios instance, interceptors, retry logic       │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                          ↓ HTTP/JSON
┌─────────────────────────────────────────────────────────┐
│                      BACKEND                            │
│  ┌──────────────────────────────────────────────────┐   │
│  │               Controller Layer                    │   │
│  │  auth.controller, product.controller             │   │
│  └──────────────────────────────────────────────────┘   │
│                         ↓                                │
│  ┌──────────────────────────────────────────────────┐   │
│  │               Service Layer                      │   │
│  │  auth.service, product.service, cart.service    │   │
│  └──────────────────────────────────────────────────┘   │
│                         ↓                                │
│  ┌──────────────────────────────────────────────────┐   │
│  │              Repository Layer                    │   │
│  │  Prisma queries                                 │   │
│  └──────────────────────────────────────────────────┘   │
│                         ↓                                │
│  ┌──────────────────────────────────────────────────┐   │
│  │               Database Layer                     │   │
│  │  PostgreSQL                                     │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

---

## 3. DATA FLOW

### Complete Data Flow

```
User Click
    ↓
Page (Server/Client Component)
    ↓
Service (API logic)
    ↓
API Client (HTTP request)
    ↓
Backend Express API
    ↓
Database (PostgreSQL + Prisma)
    ↓
Response (JSON)
    ↓
Store (Zustand - state update)
    ↓
Component (re-render)
    ↓
Screen (user sees result)
```

### Never Do This

```
❌ Component → Direct DB query
❌ Component → Business logic
❌ Component → Backend directly
❌ Component → Redis directly
```

### Always Do This

```
✓ Component → Props → Render
✓ Page → Service → API → Backend
✓ State in Store → Component reads
✓ UI logic in Component
✓ Business logic in Service
```

### Consistent Pattern with Backend

```
BACKEND                          FRONTEND
─────────────────────────────────────────────
Controller                   →    Page
    ↓                              ↓
Service                      →    Service
    ↓                              ↓
Repository                  →    Store
    ↓                              ↓
Prisma                      →    Component
```

---

## 4. 10-STEP ROADMAP

### Overview Table

| Step        | Focus           | Key Deliverables                                                           | Backend Dependencies          |
| ----------- | --------------- | -------------------------------------------------------------------------- | ----------------------------- |
| **Step 1**  | Foundation      | Next.js, TypeScript, Tailwind, folder structure, API client, Zustand setup | All Phase 1-5                 |
| **Step 2**  | Design System   | Button, Input, Card, Modal, Badge, Spinner, Skeleton, Toast, Layout        | Step 1                        |
| **Step 3**  | Auth UI         | Login page, Register page, Session handling, Protected routes              | auth.service                  |
| **Step 4**  | Catalog         | Product grid, Search, Filter, Pagination                                   | product.service               |
| **Step 5**  | Product Detail  | Gallery, Variants, Stock, Add to cart                                      | product.service, cart.service |
| **Step 6**  | Cart            | Cart page, Update quantity, Remove item, Cart drawer                       | cart.service, cart-store      |
| **Step 7**  | Checkout        | Checkout flow, Address, Order summary, Initiate                            | checkout.service              |
| **Step 8**  | Payment         | Payment UI, Status, Redirect handling                                      | payment.service               |
| **Step 9**  | Order Dashboard | Order list, Order detail, Status tracking                                  | order.service                 |
| **Step 10** | UX Polish       | Loading, Skeleton, Error boundary, Empty states, Toasts                    | All above                     |

### Step Sequence Rationale

```
Step 1 (Foundation)
    ↓
Step 2 (Design System) ──────────────┐
    ↓                                │
Step 3 (Auth)                        │ These 3 can be parallelized
    ↓                                │ after Design System
Step 4 (Catalog) ────────────────────┤
    ↓                                │
Step 5 (Product Detail)              │
    ↓                                │
Step 6 (Cart) ───────────────────────┘
    ↓
Step 7 (Checkout)
    ↓
Step 8 (Payment)
    ↓
Step 9 (Order Dashboard)
    ↓
Step 10 (UX Polish)
```

---

## 5. STEP DETAILS

### Step 1: Frontend Foundation

**File:** `STEP/STEP6-1.md`

**Fokus:**

- Next.js 14 App Router setup
- TypeScript configuration
- Tailwind CSS configuration
- Folder structure
- API client (axios)
- Zustand stores (auth, cart, ui)
- Type definitions (mirrors backend)
- Service layer skeleton

**Success Criteria:**

```
□ npm run build succeeds
□ Frontend connects to backend /health
□ Frontend connects to backend /products
□ TypeScript strict passes
□ ESLint passes
```

---

### Step 2: Design System

**Fokus:**

- Base UI components
- Layout components
- Typography system
- Color system
- Spacing system
- Component variants
- Responsive utilities

**Deliverables:**

```
components/ui/
├── button.tsx       # variants: primary, secondary, outline, ghost, danger
├── input.tsx        # text, email, password, number, with validation
├── card.tsx         # product card, feature card
├── badge.tsx        # status badges
├── spinner.tsx      # loading indicator
├── skeleton.tsx     # placeholder loading
├── toast.tsx        # notifications
├── modal.tsx        # dialog overlay
├── select.tsx       # dropdown
├── textarea.tsx     # multiline input
└── index.ts        # barrel export

components/layout/
├── container.tsx   # max-width wrapper
├── navbar.tsx      # top navigation
├── footer.tsx      # bottom section
├── sidebar.tsx     # optional side navigation
└── page-header.tsx # page title + breadcrumb
```

**Success Criteria:**

```
□ All base components implemented
□ Design tokens (colors, spacing) defined
□ Components responsive
□ Dark mode support (optional)
```

---

### Step 3: Authentication UI

**Fokus:**

- Login page
- Register page
- Session management
- Protected routes
- Auth store integration
- Error handling

**Deliverables:**

```
app/(auth)/
├── layout.tsx       # centered layout wrapper
├── login/
│   └── page.tsx     # login form
└── register/
    └── page.tsx     # registration form

components/forms/
├── login-form.tsx
├── register-form.tsx
└── auth-context.tsx # auth provider

hooks/
└── use-auth.ts      # auth hook
```

**Backend Integration:**

```typescript
// auth.service.ts
POST /auth/login     → LoginResponse
POST /auth/register  → RegisterResponse
POST /auth/logout    → { success: true }
GET  /auth/session   → { user }
```

**Success Criteria:**

```
□ Login form functional
□ Register form functional
□ Session persists across pages
□ Protected routes redirect to login
□ Logout clears session
```

---

### Step 4: Catalog

**Fokus:**

- Product listing page
- Search functionality
- Filter sidebar
- Pagination
- Sort options
- Loading states

**Deliverables:**

```
app/(shop)/products/
└── page.tsx         # product catalog

components/product/
├── product-card.tsx  # individual product
├── product-grid.tsx  # grid layout
├── product-list.tsx  # list layout
├── search-bar.tsx   # search input
├── filter-panel.tsx  # filter sidebar
├── sort-select.tsx  # sort dropdown
└── pagination.tsx   # page navigation

hooks/
└── use-products.ts  # product fetching hook
```

**Backend Integration:**

```typescript
// product.service.ts
GET /products                    → PaginatedResponse<ProductListItem>
GET /products/search?q=         → { items[], total }
GET /products/:id               → Product
```

**Success Criteria:**

```
□ Products display in grid
□ Search returns results
□ Filters work correctly
□ Pagination works
□ Loading skeleton shows
□ Empty state shows when no results
```

---

### Step 5: Product Detail

**Fokus:**

- Product detail page
- Image gallery
- Product information
- Stock status
- Add to cart
- Related products

**Deliverables:**

```
app/(shop)/products/[slug]/
└── page.tsx         # product detail

components/product/
├── product-gallery.tsx     # image carousel
├── product-info.tsx        # name, price, description
├── product-variants.tsx    # size, color selection
├── stock-badge.tsx         # in stock, low stock, out of stock
├── quantity-selector.tsx   # +/- quantity
├── add-to-cart-button.tsx  # CTA
└── related-products.tsx    # similar items
```

**Backend Integration:**

```typescript
// product.service.ts
GET /products/:slug          → Product (with images, inventory)
POST /cart/items             → Cart (add to cart)

Or use cart.service.ts:
addToCart(productId, quantity)
```

**Success Criteria:**

```
□ Product images display correctly
□ Price and info display correctly
□ Stock status accurate
□ Add to cart works
□ Cart count updates
```

---

### Step 6: Cart

**Fokus:**

- Cart page
- Cart drawer (slide-out)
- Update quantity
- Remove items
- Cart summary
- Empty cart state

**Deliverables:**

```
app/(shop)/cart/
└── page.tsx         # full cart page

components/cart/
├── cart-drawer.tsx       # slide-out cart
├── cart-item.tsx         # individual item row
├── cart-list.tsx         # list of items
├── cart-summary.tsx       # subtotal, totals
├── cart-badge.tsx         # item count badge
├── quantity-input.tsx     # +/- input
└── empty-cart.tsx         # empty state

hooks/
└── use-cart.ts      # cart management hook

store/
└── cart-store.ts    # Zustand cart state
```

**Backend Integration:**

```typescript
// cart.service.ts
GET  /cart                     → Cart
POST /cart/items               → Cart (add item)
PATCH /cart/items/:itemId       → Cart (update quantity)
DELETE /cart/items/:itemId      → Cart (remove item)
DELETE /cart                   → { success: true }
```

**Success Criteria:**

```
□ Cart displays all items
□ Quantity updates sync with backend
□ Remove item works
□ Cart drawer opens/closes
□ Item count badge updates
□ Empty cart shows empty state
```

---

### Step 7: Checkout

**Fokus:**

- Checkout page
- Order summary
- Shipping address
- Order initiation
- Loading states
- Error handling

**Deliverables:**

```
app/(shop)/checkout/
└── page.tsx         # checkout flow

components/checkout/
├── checkout-form.tsx      # address form
├── order-summary.tsx      # order totals
├── checkout-items.tsx     # items list
├── shipping-form.tsx      # address fields
├── payment-method.tsx     # payment selection (future)
├── place-order-button.tsx # CTA
└── checkout-success.tsx   # success state
```

**Backend Integration:**

```typescript
// checkout.service.ts
GET  /checkout/preview      → CheckoutPreview
POST /checkout              → InitiateCheckoutResponse

// order.service.ts
GET  /orders/:id            → Order (after checkout)
```

**Success Criteria:**

```
□ Checkout page shows order summary
□ Shipping address form works
□ "Place Order" creates draft order
□ Redirect to payment after order
□ Error handling for stock issues
```

---

### Step 8: Payment

**Fokus:**

- Payment page
- Payment gateway redirect
- Callback handling
- Payment status
- Success/Failure pages
- Retry logic

**Deliverables:**

```
app/payment/
├── page.tsx              # payment initiation
└── callback/
    └── page.tsx          # gateway callback

components/payment/
├── payment-button.tsx     # pay now CTA
├── payment-status.tsx     # status indicator
├── payment-processing.tsx  # loading state
├── payment-success.tsx    # success screen
└── payment-failed.tsx    # failure screen

services/
└── payment.service.ts    # payment API calls
```

**Backend Integration:**

```typescript
// payment.service.ts
POST /payments/intent        → PaymentIntent
GET  /payments/:id          → PaymentStatus

Payment gateways:
- Midtrans
- Xendit
- Or mock for testing
```

**Success Criteria:**

```
□ Payment page shows total
□ Redirect to payment gateway
□ Callback processes correctly
□ Success page shows confirmation
□ Failure page shows retry option
□ Order status updates after payment
```

---

### Step 9: Order Dashboard

**Fokus:**

- Order history list
- Order detail page
- Order status tracking
- Payment status
- Reorder functionality

**Deliverables:**

```
app/orders/
├── page.tsx              # order list
└── [id]/
    └── page.tsx          # order detail

components/order/
├── order-list.tsx        # history list
├── order-card.tsx        # individual order
├── order-status.tsx      # status badge
├── order-items.tsx       # items in order
├── order-totals.tsx      # price breakdown
├── order-timeline.tsx    # status history
└── reorder-button.tsx   # add to cart again

hooks/
└── use-orders.ts        # order fetching hook
```

**Backend Integration:**

```typescript
// order.service.ts
GET /orders                 → PaginatedResponse<Order>
GET /orders/:id            → Order (with items, payment)
```

**Success Criteria:**

```
□ Order list shows history
□ Order detail shows all info
□ Status badge accurate
□ Items display correctly
□ Reorder adds items to cart
```

---

### Step 10: UX Polish

**Fokus:**

- Loading skeletons
- Error boundaries
- Empty states
- Toast notifications
- Page transitions
- Accessibility
- Performance

**Deliverables:**

```
components/ui/
├── skeleton/
│   ├── product-skeleton.tsx
│   ├── cart-skeleton.tsx
│   └── order-skeleton.tsx
├── error-boundary.tsx     # error catch
├── error-page.tsx        # error display
└── empty-state.tsx       # no data state

hooks/
├── use-toast.ts           # toast notifications
└── use-error-boundary.ts  # error handling

app/
├── loading.tsx            # loading state
├── error.tsx              # error boundary
└── not-found.tsx          # 404 page

Global polish:
- Page transition animations
- Form validation UX
- Button loading states
- Image lazy loading
- SEO meta tags
```

**Success Criteria:**

```
□ Skeleton shows during loading
□ Errors display gracefully
□ Empty states are helpful
□ Toasts appear for actions
□ No console errors
□ Lighthouse score > 90
```

---

## 6. DEPENDENCY GRAPH

### Step Dependencies

```
Step 1 (Foundation)
    │
    ├── Step 2 (Design System)
    │
    └── Step 3 (Auth UI) ──────────────┐
             │                          │
    ─────────┴─── Step 4 (Catalog)     │
             │                          │
    ─────────┴─── Step 5 (Detail)       │ These 4
             │                          │ depend
    ─────────┴─── Step 6 (Cart)         │ on Step 2
             │                          │ and their
    ─────────┴─── Step 7 (Checkout) ───┘
             │
    ─────────┴── Step 8 (Payment)
             │
    ─────────┴── Step 9 (Orders)
             │
    ─────────┴── Step 10 (UX Polish)
```

### Service Dependencies

```
auth.service.ts ─────┐
                     │
product.service.ts ──┼── All steps use
                     │    these services
cart.service.ts ─────┤
                     │
checkout.service.ts ─┤
                     │
order.service.ts ────┤
                     │
payment.service.ts ──┘
```

### Store Dependencies

```
auth-store.ts    → Used by: Auth UI, Protected routes
cart-store.ts    → Used by: Cart, Checkout, Navbar badge
ui-store.ts      → Used by: All steps (toasts, modals)
```

---

## 7. INTEGRATION POINTS

### Backend Endpoints Map

```
FRONTEND                    BACKEND
───────────────────────────────────────────────
auth.service.ts         →  /auth/*
  login()               →  POST /auth/login
  register()            →  POST /auth/register
  logout()              →  POST /auth/logout
  getSession()          →  GET  /auth/session

product.service.ts      →  /products/*
  getProducts()         →  GET  /products
  getProductById()      →  GET  /products/:id
  searchProducts()      →  GET  /products/search

cart.service.ts         →  /cart/*
  getCart()             →  GET  /cart
  addToCart()           →  POST /cart/items
  updateCartItem()      →  PATCH /cart/items/:itemId
  removeFromCart()      →  DELETE /cart/items/:itemId
  clearCart()           →  DELETE /cart

checkout.service.ts     →  /checkout/*
  getPreview()          →  GET  /checkout/preview
  initiate()            →  POST /checkout

order.service.ts        →  /orders/*
  getOrders()           →  GET  /orders
  getOrderById()         →  GET  /orders/:id

payment.service.ts      →  /payments/*
  createIntent()        →  POST /payments/intent
  getStatus()           →  GET  /payments/:id
```

### Type Contracts

```
BACKEND TYPES              FRONTEND TYPES
───────────────────────────────────────────────
modules/user/types/    →   types/api/user.types.ts
modules/auth/types/    →   types/api/auth.types.ts
modules/product/types/ →   types/api/product.types.ts
modules/cart/types/    →   types/api/cart.types.ts
modules/order/types/   →   types/api/order.types.ts
modules/payment/types/ →   types/api/payment.types.ts
```

---

## 8. MILESTONES

### Milestone 1: Foundation Ready

```
After Step 1:
✓ Next.js project running
✓ TypeScript configured
✓ API client working
✓ Can connect to backend
✓ Can list products
```

### Milestone 2: Design System Complete

```
After Step 2:
✓ All base components built
✓ Layout system ready
✓ Responsive design works
✓ Theme configured
```

### Milestone 3: Auth Flow Complete

```
After Step 3:
✓ Users can login
✓ Users can register
✓ Protected routes work
✓ Session persists
```

### Milestone 4: Shopping Flow Complete

```
After Step 5-6:
✓ Browse products
✓ Search products
✓ View product details
✓ Add to cart
✓ Update cart
```

### Milestone 5: Checkout Complete

```
After Step 7-8:
✓ Checkout flow works
✓ Payment integration
✓ Order created
✓ Payment processed
```

### Milestone 6: Full E-commerce Ready

```
After Step 9-10:
✓ Order history works
✓ UX polished
✓ Errors handled
✓ Ready for production
```

---

## 9. PROGRESSIVE COMPLEXITY

### Complexity Curve

```
Step 1:   ██████████  Foundation setup (Medium)
Step 2:   ██████████  Design system (Medium-High)
Step 3:   ████████    Auth UI (Medium)
Step 4:   ████████    Catalog (Medium)
Step 5:   █████████   Product detail (Medium-High)
Step 6:   ██████████  Cart (High)
Step 7:   ██████████  Checkout (High)
Step 8:   ███████████ Payment (Very High)
Step 9:   ████████    Order dashboard (Medium)
Step 10:  █████████   UX polish (Medium)
```

### Concept Density Per Step

```
Step 1:
- Next.js App Router
- TypeScript strict mode
- Tailwind configuration
- Zustand state management
- Axios interceptors

Step 2:
- Component variants
- Composition patterns
- Responsive design
- CSS custom properties
- Component API design

Step 3:
- Form handling
- Protected routes
- Session management
- Error handling
- Auth flow

Step 4:
- Data fetching
- Search implementation
- Filter logic
- Pagination
- Skeleton loading

Step 5:
- Image gallery
- State management
- Optimistic updates
- Stock validation
- Add to cart flow

Step 6:
- Complex state sync
- Optimistic UI
- Cart persistence
- Real-time updates
- Empty states

Step 7:
- Multi-step form
- Order calculation
- Validation
- Error recovery
- Confirmation flow

Step 8:
- Payment gateway integration
- Redirect handling
- Webhook simulation
- Status polling
- Error handling

Step 9:
- Data visualization
- Status history
- Timeline component
- Pagination
- Filtering

Step 10:
- Error boundaries
- Loading states
- Performance optimization
- Accessibility
- SEO
```

---

## APPENDIX: Quick Reference

### File Structure Summary

```
frontend/
├── src/
│   ├── app/                  # Pages (Next.js Router)
│   ├── components/           # React components
│   │   ├── ui/              # Base components
│   │   ├── layout/          # Layout components
│   │   ├── forms/           # Form components
│   │   ├── product/         # Product components
│   │   ├── cart/            # Cart components
│   │   ├── checkout/        # Checkout components
│   │   └── payment/         # Payment components
│   ├── hooks/               # Custom React hooks
│   ├── services/            # API service layer
│   ├── store/               # Zustand stores
│   ├── lib/                 # Utilities
│   └── types/               # TypeScript types
└── public/                  # Static assets
```

### Technology Stack

```
Framework:      Next.js 14+
Language:       TypeScript
Styling:        Tailwind CSS
State:          Zustand
HTTP Client:    Axios
Validation:     Zod
Testing:        Vitest + React Testing Library
Linting:        ESLint
Formatting:     Prettier
```

### Next Steps

```
1. Read STEP/STEP6-1.md (Step 1 blueprint)
2. Toggle to Act mode
3. Implement Step 1
4. After Step 1 complete → Read STEP/STEP6-2.md (Step 2 blueprint)
5. Continue until Step 10
```

---

_Phase 6 Overview Document_
_For implementation details, see STEP/STEP6-1.md through STEP/STEP6-10.md_
