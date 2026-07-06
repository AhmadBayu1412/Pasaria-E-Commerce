# PHASE 6 — UX BLUEPRINT

## User Experience Design for Pasaria E-Commerce

---

## Table of Contents

1. [UX Philosophy](#1-ux-philosophy)
2. [Design Principles](#2-design-principles)
3. [User Flows](#3-user-flows)
4. [Screen Specifications](#4-screen-specifications)
5. [Interaction Patterns](#5-interaction-patterns)
6. [State Behaviors](#6-state-behaviors)
7. [Navigation Structure](#7-navigation-structure)
8. [Feedback Systems](#8-feedback-systems)
9. [Responsive Strategy](#9-responsive-strategy)
10. [Component Behaviors](#10-component-behaviors)
11. [Session & State Recovery](#11-session--state-recovery)
12. [Error Handling & HTTP Mapping](#12-error-handling--http-mapping)
13. [Retry Strategy](#13-retry-strategy)
14. [Offline Behavior](#14-offline-behavior)
15. [Performance Budget](#15-performance-budget)
16. [Animation Guidelines](#16-animation-guidelines)
17. [Search Experience](#17-search-experience)
18. [Permission & Access Control UX](#18-permission--access-control-ux)

---

## 1. UX PHILOSOPHY

### Core Philosophy

```
User tidak datang untuk melihat UI yang cantik.

User datang untuk menyelesaikan TUGAS.

UI yang bagus = UI yang membuat tugas terasa mudah.
```

### User Tasks Hierarchy

```
PRIMARY:   Beli produk
    ↓
SECONDARY: Cari produk
           Bandingkan produk
           Lihat status pesanan
    ↓
TERTIARY:  Login/Register
           Update profil
           Lihat history
```

### Design Philosophy

```
1. Reduce Cognitive Load
   → Jangan tampilkan semua sekaligus
   → Satu tugas per layar

2. Progressive Disclosure
   → Informasi muncul saat dibutuhkan
   → Detail tambahan di-expand, bukan default visible

3. Predictable Behavior
   → Interaksi yang sama menghasilkan hasil yang sama
   → Tidak ada惊喜 (surprise)

4. Graceful Degradation
   → App tetap usable meskipun kondisi tidak ideal
   → Offline, slow network, error states

5. Accessibility First
   → Keyboard navigation
   → Screen reader support
   → Color contrast compliance
```

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

Accessibility checklist per komponen:
□ Keyboard navigation works (Tab, Enter, Esc)
□ Focus visible on interactive elements
□ ARIA labels present
□ Color contrast ≥ 4.5:1
□ Touch targets ≥ 44x44px
```

---

## 2. DESIGN PRINCIPLES

### Visual Hierarchy

```
PRIORITY 1: Primary Action (CTA)
    ↓
PRIORITY 2: Key Information (Harga, Nama Produk)
    ↓
PRIORITY 3: Supporting Information (Deskripsi, Detail)
    ↓
PRIORITY 4: Secondary Actions (Share, Wishlist)
```

### Spacing System

```
xs: 4px   → inline elements, tight spacing
sm: 8px   → between related elements
md: 16px  → between groups of elements
lg: 24px  → between sections
xl: 32px  → major section separation
2xl: 48px → page sections
```

### Typography Scale

```
xs:   12px → captions, timestamps
sm:   14px → secondary text, metadata
base: 16px → body text (default)
lg:   18px → emphasized body
xl:   20px → card titles
2xl:  24px → page section titles
3xl:  30px → page titles
4xl:  36px → hero headlines
```

### Color Usage

```
Primary:    Pembelian, aksi utama
Secondary:  Navigasi, supporting actions
Success:    Konfirmasi, berhasil
Warning:    Peringatan, attention needed
Error:      Kesalahan, validation failed
Neutral:    Background, text, borders
```

---

## 3. USER FLOWS

### 3.1 Guest Browse Flow

```
[Homepage]
    ↓
[Product Catalog] ←── Browse / Search / Filter
    ↓
[Product Detail] ←── Click product
    ↓
[Add to Cart] ←── Quantity selector + Add button
    ↓
[Continue Shopping] ───────────┐
    or                              │
[Cart Drawer opens]                │
    ↓                              │
[Checkout] ────────────────────────┘
    ↓
[Login/Register Prompt]
    ↓
[Checkout as Guest] or [Login First]
    ↓
[Order Summary]
    ↓
[Payment Gateway]
    ↓
[Order Confirmation]
```

### 3.2 Registered User Flow

```
[Login]
    ↓
[Homepage]
    ↓
[Product Catalog]
    ↓
[Product Detail]
    ↓
[Add to Cart]
    ↓
[Cart Page / Checkout]
    ↓
[Order Summary]
    ↓
[Payment Gateway]
    ↓
[Order Confirmation]
    ↓
[Order Dashboard]
```

### 3.3 Cart Interaction Flow

```
[Product Detail Page]
    ↓
[Click "Add to Cart"]
    ↓
[Cart Badge updates immediately]
    ↓
[Toast notification: "Added to cart"]
    ↓
[Option A: Continue Shopping] → [Catalog]
    ↓
[Option B: View Cart] → [Cart Drawer opens]
    ↓
[In Cart Drawer]
    ├── Update quantity → [Debounced API call]
    ├── Remove item → [Confirmation]
    └── Proceed to Checkout → [Checkout Page]
```

### 3.4 Checkout Flow

```
[Cart Page]
    ↓
[Click "Proceed to Checkout"]
    ↓
[Checkout Page]
    ├── Shipping Address Form
    │   ├── Full Name
    │   ├── Phone Number
    │   ├── Address Line 1
    │   ├── Address Line 2 (Optional)
    │   ├── City
    │   ├── Province
    │   └── Postal Code
    ↓
[Order Summary]
    ├── Items list (collapsible)
    ├── Subtotal
    ├── Shipping fee
    ├── Tax
    └── Grand Total
    ↓
[Click "Place Order"]
    ↓
[Loading State: "Creating your order..."]
    ↓
[Order Created]
    ↓
[Redirect to Payment Page]
```

### 3.5 Payment Flow

```
[Checkout Complete - Order Created]
    ↓
[Payment Page]
    ├── Order Summary
    ├── Total Amount
    └── [Payment Method Selection]
        ├── Credit/Debit Card
        ├── Bank Transfer
        ├── E-Wallet
        └── [Continue to Payment]
    ↓
[Loading: "Connecting to payment gateway..."]
    ↓
[Redirect to Gateway]
    ↓
[User completes payment on gateway]
    ↓
[Callback to our app]
    ↓
[Payment Status Page]
    ├── SUCCESS → [Show confirmation, redirect to orders]
    ├── FAILED → [Show error, offer retry]
    └── PENDING → [Show "processing", poll for status]
```

### 3.6 Order Tracking Flow

```
[Order Dashboard]
    ↓
[List of Orders]
    ├── Order Card: ID, Date, Status, Total
    └── Click to view detail
    ↓
[Order Detail Page]
    ├── Order Status Timeline
    │   ├── 📦 Order Placed
    │   ├── 💳 Payment Confirmed
    │   ├── 📋 Processing
    │   ├── 🚚 Shipped
    │   └── ✅ Delivered
    │
    ├── Items Purchased
    ├── Shipping Address
    ├── Payment Info
    └── [Reorder Button]
```

---

## 4. SCREEN SPECIFICATIONS

### 4.1 Homepage

```
┌─────────────────────────────────────────────────────────────┐
│ [Logo]  [Search Bar_________________]  [Wish] [Cart] [👤] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                 HERO SECTION                         │   │
│  │           Modern Gradient Background                 │   │
│  │                                                     │   │
│  │    "Selamat Datang di Pasaria"                      │   │
│  │    Marketplace tagline...                            │   │
│  │                                                     │   │
│  │    [Mulai Belanja →]  [Masuk / Daftar]            │   │
│  │                                                     │   │
│  │    🛡️ 100% Aman | 🚚 Pengiriman Cepat | 💬 24/7  │   │
│  └─────────────────────────────────────────────────────┘   │
│  ~~~~~~~~~~~~~~ Wave Divider ~~~~~~~~~~~~~~~~~~~~~~~~~~~~   │
│                                                             │
│  KATEGORI POPULER                                          │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ │
│  │  Icon  │ │  Icon  │ │  Icon  │ │  Icon  │ │  Icon  │ │
│  │  Cat   │ │  Cat   │ │  Cat   │ │  Cat   │ │  Cat   │ │
│  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘ │
│  [Lihat Semua Kategori →]                                  │
│                                                             │
│  MENGAPA PASARIA?                                          │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐       │
│  │  🛡️ Icon    │ │  🚚 Icon    │ │  💬 Icon    │       │
│  │  Aman &     │ │  Pengiriman │ │  Layanan    │       │
│  │  Terpercaya │ │  Cepat      │ │  24/7      │       │
│  └──────────────┘ └──────────────┘ └──────────────┘       │
│                                                             │
│  STATISTICS                                                │
│  ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐                    │
│  │ 1M+ │  │ 10K+│  │100K+│  │ 4.9 │                    │
│  │User │  │Toko │  │Produk│  │Rating│                   │
│  └─────┘  └─────┘  └─────┘  └─────┘                    │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              CTA SECTION                            │   │
│  │        Modern Gradient + Badge                      │   │
│  │                                                     │   │
│  │    "Mulai Belanja Sekarang"                        │   │
│  │    [Lihat Produk →]                               │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│ [Logo] Contact Info | Social | Links | Company | Support  │
│ Copyright © 2026 Pasaria                                  │
└─────────────────────────────────────────────────────────────┘
```

**Behaviors:**

- Hero section: Decorative blur elements, gradient background, wave divider
- Category cards: Hover effects (shadow elevation, gradient background, icon scale)
- Features cards: Gradient hover, shadow transitions, decorative elements
- Stats section: Real-time impressive numbers
- CTA section: Modern gradient with pattern overlay
- Footer: 5-column layout, contact icons, hover arrow animations

**Design System:**

```
HERO:
├── Background: gradient from-primary-600 via-primary-700 to-primary-900
├── Decorative: blur circles, pattern overlay
├── Wave: SVG divider (white fill)
└── Trust badges: icon + text layout

CATEGORIES:
├── Cards: rounded-2xl, shadow-sm, border-secondary-100
├── Hover: shadow-xl, border-primary-200, -translate-y-1
├── Icon container: w-14 h-14, rounded-xl, bg-secondary-100
└── Label: text-sm font-semibold

FEATURES:
├── Cards: rounded-3xl, p-8, shadow-sm
├── Hover: shadow-2xl, border-primary-100
├── Icon: w-16 h-16, gradient container, shadow
└── Decorative: corner circles

CTA:
├── Background: gradient from-primary-600 via-primary-700 to-primary-900
├── Badge: "Promo Spesial" with trophy icon
└── Wave top: SVG divider (secondary-50 fill)
```

---

### 4.1.1 Homepage Color System

```
PRIMARY PALETTE (Trust Blue):
--primary-50:   #eff6ff
--primary-100:  #dbeafe
--primary-200:  #bfdbfe
--primary-300:  #93c5fd
--primary-400:  #60a5fa
--primary-500:  #3b82f6
--primary-600:  #2563eb  ← Primary action
--primary-700:  #1d4ed8
--primary-800:  #1e40af
--primary-900:  #1e3a8a

ACCENT PALETTE (Orange):
--accent-orange-50:  #fff7ed
--accent-orange-100: #ffedd5
--accent-orange-400: #fb923c  ← Badge highlights
--accent-orange-500: #f97316  ← Cart badge
--accent-orange-600: #ea580c
--accent-orange-700: #c2410c

SEMANTIC TOKENS:
--success:    #22c55e
--warning:    #f59e0b
--error:      #ef4444
--info:       #3b82f6
```

---

### 4.1.2 Homepage Animation Tokens

```
MICRO-INTERACTIONS:
├── Button hover: scale + shadow (300ms ease)
├── Icon scale: transform scale-110 (300ms)
├── Card lift: -translate-y-1 (300ms ease)
└── Arrow translate: translate-x-1 (200ms)

GRADIENT ANIMATIONS:
├── Card hover: opacity 0→100 for gradient background (300ms)
├── Icon container: bg-secondary-100 → bg-primary-100 (300ms)
└── Shadow: shadow-sm → shadow-xl (500ms)

WAVE ANIMATIONS:
├── Hero wave: fixed at bottom
└── CTA wave: fixed at top (rotated)

RESPECT prefers-reduced-motion:
├── Disable blur animations
├── Disable translate animations
└── Keep opacity transitions only
```

---

### 4.2 Product Catalog

```
┌─────────────────────────────────────────────────────────────┐
│ [Logo]          [Search Bar            ]  [Cart Badge] [👤] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Breadcrumb: Home > Category > Subcategory                 │
│                                                             │
│  ┌──────────────┐ ┌────────────────────────────────────┐  │
│  │              │ │                                    │  │
│  │   FILTERS    │ │  Sort: [Newest        ▼]          │  │
│  │              │ │                                    │  │
│  │ □ Category   │ │  Showing 1-20 of 156 products      │  │
│  │   ☑ Elektron│ │                                    │  │
│  │   ☐ Fashion │ │  ┌──────────┐ ┌──────────┐         │  │
│  │   ☐ Rumah   │ │  │ Product  │ │ Product  │         │  │
│  │              │ │  │   Card   │ │   Card   │         │  │
│  │ □ Price      │ │  └──────────┘ └──────────┘         │  │
│  │   [$___ - $] │ │  ┌──────────┐ ┌──────────┐         │  │
│  │              │ │  │ Product  │ │ Product  │         │  │
│  │ □ Rating     │ │  │   Card   │ │   Card   │         │  │
│  │   ★★★★☆     │ │  └──────────┘ └──────────┘         │  │
│  │              │ │                                    │  │
│  │ [Clear All]  │ │  < 1 2 3 ... 8 >                  │  │
│  └──────────────┘ └────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Behaviors:**

- Filter sidebar sticky on desktop, drawer on mobile
- Filters apply immediately (debounced 300ms)
- URL updates with filter state (shareable links)
- Sort dropdown with options: Newest, Price Low-High, Price High-Low, Popular
- Pagination with page numbers
- Product card hover: show quick-add button

---

### 4.3 Product Detail

```
┌─────────────────────────────────────────────────────────────┐
│ [Logo]          [Search Bar            ]  [Cart Badge] [👤] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Breadcrumb: Home > Category > Product Name               │
│                                                             │
│  ┌───────────────────────┐ ┌────────────────────────────┐ │
│  │                       │ │ PRODUCT NAME                │ │
│  │                       │ │ SKU: ABC123                 │ │
│  │    IMAGE GALLERY      │ │                            │ │
│  │                       │ │ ★★★★☆ (128 reviews)        │ │
│  │  [Main Image]         │ │                            │ │
│  │                       │ │ Rp 1.299.000                │ │
│  │  ○ ○ ○ ○             │ │                            │ │
│  │  [thumb1][thumb2]     │ │ Stock: 15 items             │ │
│  │  [thumb3][thumb4]     │ │                            │ │
│  │                       │ │ ┌────────────────────────┐ │ │
│  │                       │ │ │Quantity: [-] [+ ]       │ │ │
│  │                       │ │ └────────────────────────┘ │ │
│  │                       │ │                            │ │
│  │                       │ │ [  ADD TO CART  ]          │ │
│  │                       │ │ [  BUY NOW      ]          │ │
│  └───────────────────────┘ └────────────────────────────┘ │
│                                                             │
│  DESCRIPTION                                                │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Lorem ipsum dolor sit amet, consectetur adipiscing  │   │
│  │ elit. Sed do eiusmod tempor incididunt ut labore.    │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  REVIEWS (128)                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ ★★★★★ John D. - 2 days ago                          │   │
│  │ "Great product, fast delivery!"                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  RELATED PRODUCTS                                           │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │ Related  │ │ Related  │ │ Related  │ │ Related  │       │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Behaviors:**

- Image gallery: click thumbnail to change main image
- Image zoom on hover (desktop)
- Quantity selector: min 1, max based on stock
- Add to Cart: shows loading, then toast, then cart badge updates
- Buy Now: adds to cart and immediately navigates to checkout
- Out of stock: button disabled, shows "Notify Me" option
- Reviews lazy-load (show first 3, "Load More" button)

---

### 4.4 Cart Page (Full Page)

```
┌─────────────────────────────────────────────────────────────┐
│ [Logo]          [Search Bar            ]  [Cart Badge] [👤] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  YOUR CART (3 items)                                       │
│                                                             │
│  ┌─────────────────────────────────────┐ ┌───────────────┐ │
│  │                                     │ │ ORDER SUMMARY │ │
│  │ ┌─────────┐ Product Name            │ │               │ │
│  │ │  Image  │ Rp 1.299.000            │ │ Items: 3      │ │
│  │ │         │ [-] 2 [+]   [Remove]    │ │               │ │
│  │ └─────────┘                         │ │ Subtotal:     │ │
│  │─────────────────────────────────────│ │ Rp 2.598.000  │ │
│  │                                     │ │               │ │
│  │ ┌─────────┐ Product Name 2         │ │ Shipping:     │ │
│  │ │  Image  │ Rp 599.000              │ │ Rp 25.000     │ │
│  │ │         │ [-] 1 [+]   [Remove]    │ │               │ │
│  │ └─────────┘                         │ │ Total:        │ │
│  │─────────────────────────────────────│ │ Rp 2.623.000  │ │
│  │                                     │ │               │ │
│  │ ┌─────────┐ Product Name 3          │ │               │ │
│  │ │  Image  │ Rp 899.000              │ │               │ │
│  │ │         │ [-] 1 [+]   [Remove]    │ │               │ │
│  │ └─────────┘                         │ │               │ │
│  │                                     │ │ [CHECKOUT → ] │ │
│  └─────────────────────────────────────┘ └───────────────┘ │
│                                                             │
│  [← Continue Shopping]                                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Behaviors:**

- Quantity change: debounced API call (500ms), optimistic UI
- Remove: confirmation modal, then remove with animation
- Subtotal updates in real-time
- Empty cart: shows illustration + "Continue Shopping" CTA
- Checkout button disabled if cart is empty
- Shipping cost shown as estimate (actual calculated at checkout)

---

### 4.5 Cart Drawer (Slide-out)

```
┌─────────────────────────────────────────────────────────────┐
│                                              ┌────────────┐ │
│                                              │ YOUR CART   │ │
│        [MAIN CONTENT VISIBLE]                │            │ │
│                                              │ [X Close]   │ │
│                                              │            │ │
│                                              │ Item 1     │ │
│                                              │ Qty: 2     │ │
│                                              │ Rp xxx     │ │
│                                              │            │ │
│                                              │ Item 2     │ │
│                                              │ Qty: 1     │ │
│                                              │ Rp xxx     │ │
│                                              │            │ │
│                                              │────────────│ │
│                                              │ Subtotal:  │ │
│                                              │ Rp xxx     │ │
│                                              │            │ │
│                                              │[VIEW CART] │ │
│                                              │[CHECKOUT ] │ │
│                                              └────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

**Behaviors:**

- Opens from right side with slide animation (300ms)
- Background dims (semi-transparent overlay)
- Close on: X button, click outside, ESC key
- Shows first 3-4 items, scrollable if more
- "View Cart" opens full cart page
- "Checkout" navigates to checkout

---

### 4.6 Checkout Page

```
┌─────────────────────────────────────────────────────────────┐
│ [Logo]          [Search Bar            ]  [Cart Badge] [👤] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  CHECKOUT                                                   │
│                                                             │
│  ┌───────────────────────────────┐ ┌────────────────────┐ │
│  │                               │ │ ORDER SUMMARY       │ │
│  │ SHIPPING ADDRESS              │ │                    │ │
│  │                               │ │ [Expandable items]  │ │
│  │ Full Name: [_______________] │ │                    │ │
│  │ Phone:      [_______________] │ │ Subtotal: Rp xxx   │ │
│  │ Address 1:  [_______________] │ │ Shipping:  Rp xxx  │ │
│  │ Address 2:  [_______________] │ │ Tax:       Rp xxx  │ │
│  │ City:        [_______________] │ │ ──────────────────  │ │
│  │ Province:    [▼ Select     ] │ │ TOTAL:    Rp xxx   │ │
│  │ Postal Code: [_______________] │ │                    │ │
│  │                               │ │                    │ │
│  │                               │ │ [PLACE ORDER    ]  │ │
│  └───────────────────────────────┘ └────────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Behaviors:**

- Form fields: auto-focus on load
- Real-time validation (on blur)
- Error messages inline below field
- Province dropdown populated from static list
- Postal code: numeric only, max 5 digits
- "Place Order" button shows loading state
- Disabled until form is valid
- Success: redirect to payment page

---

### 4.7 Payment Page

```
┌─────────────────────────────────────────────────────────────┐
│ [Logo]          [Search Bar            ]  [Cart Badge] [👤] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  PAYMENT                                                    │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Order #12345 • Total: Rp 2.623.000                 │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  SELECT PAYMENT METHOD                                       │
│                                                             │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐│
│  │  💳             │ │  🏦             │ │  📱             ││
│  │ Credit/Debit   │ │  Bank Transfer │ │  E-Wallet      ││
│  │ Card           │ │                 │ │                 ││
│  │     ○          │ │     ○          │ │     ○          ││
│  └─────────────────┘ └─────────────────┘ └─────────────────┘│
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ PAYMENT DETAILS                                     │   │
│  │                                                      │   │
│  │ Card Number: [________________________________]    │   │
│  │ Expiry: [MM/YY]    CVV: [___]                      │   │
│  │ Name on Card: [____________________________]       │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  [← Back to Checkout]              [PAY Rp 2.623.000 →]    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Behaviors:**

- Payment method selection required before details shown
- Card details: real-time formatting (spaces every 4 digits)
- Expiry: MM/YY auto-slash
- CVV: masked, numeric only
- "Pay" button shows spinner during processing
- Redirect to payment gateway (external)
- Return to callback page for status

---

### 4.8 Payment Callback / Status

```
SUCCESS:
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                    ✓ PAYMENT SUCCESS                        │
│                                                             │
│              Your order #12345 has been confirmed           │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Order Details                                        │   │
│  │ Items: 3 products                                    │   │
│  │ Total Paid: Rp 2.623.000                            │   │
│  │ Payment Method: Credit Card                         │   │
│  │ Transaction ID: TRX-123456789                       │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  [VIEW ORDER DETAILS]        [CONTINUE SHOPPING]           │
│                                                             │
└─────────────────────────────────────────────────────────────┘

FAILED:
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                    ✗ PAYMENT FAILED                         │
│                                                             │
│              We couldn't process your payment               │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Possible reasons:                                   │   │
│  │ • Insufficient funds                                │   │
│  │ • Card declined                                      │   │
│  │ • Connection timeout                                │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Your order #12345 is still pending.                        │
│  Please try again or use a different payment method.       │
│                                                             │
│  [TRY AGAIN]              [USE DIFFERENT METHOD]           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

### 4.9 Order Dashboard

```
┌─────────────────────────────────────────────────────────────┐
│ [Logo]          [Search Bar            ]  [Cart Badge] [👤] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  MY ORDERS                                                 │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ ┌─────────────────────────────────────────────────┐ │   │
│  │ │ Order #12345           📦 Delivered              │ │   │
│  │ │ Dec 15, 2024           Rp 1.299.000              │ │   │
│  │ │ 3 items                                       │ │   │
│  │ │                                         [VIEW] │ │   │
│  │ └─────────────────────────────────────────────────┘ │   │
│  │ ┌─────────────────────────────────────────────────┐ │   │
│  │ │ Order #12344           🚚 Shipping              │ │   │
│  │ │ Dec 14, 2024           Rp 599.000               │ │   │
│  │ │ 1 item                                        │ │   │
│  │ │                          [TRACK] [VIEW]        │ │   │
│  │ └─────────────────────────────────────────────────┘ │   │
│  │ ┌─────────────────────────────────────────────────┐ │   │
│  │ │ Order #12343           💳 Processing            │ │   │
│  │ │ Dec 13, 2024           Rp 899.000               │ │   │
│  │ │ 2 items                                       │ │   │
│  │ │                                         [VIEW] │ │   │
│  │ └─────────────────────────────────────────────────┘ │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Behaviors:**

- Orders sorted by date (newest first)
- Status badge with icon and color
- "Track" button for shipped orders (future: tracking link)
- Click row or VIEW button for detail
- Pagination for order history
- Empty state if no orders

---

### 4.10 Order Detail

```
┌─────────────────────────────────────────────────────────────┐
│ [Logo]          [Search Bar            ]  [Cart Badge] [👤] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ← Back to Orders                                          │
│                                                             │
│  ORDER #12345                                              │
│  Placed on December 15, 2024 at 14:30                      │
│                                                             │
│  ORDER STATUS                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  ●────────●────────●────────●────────○             │   │
│  │  Order    Pay     Process  Ship    Delivered       │   │
│  │  Placed   Conf.                                 ✓    │   │
│  │   ✓        ✓        ✓        ✓                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ITEMS                                                     │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ [img] Product Name                     Rp 1.299.000  │   │
│  │        Qty: 2 x Rp 599.000                        │   │
│  │        Subtotal: Rp 1.298.000                      │   │
│  │────────────────────────────────────────────────────│   │
│  │ [img] Product Name 2                  Rp 599.000   │   │
│  │        Qty: 1                                            │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  SHIPPING ADDRESS                                           │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ John Doe                                              │   │
│  │ +62 812 3456 7890                                    │   │
│  │ Jl. Sudirman No. 123                                 │   │
│  │ Jakarta Selatan, 12345                              │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  PAYMENT SUMMARY                                            │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Subtotal:                          Rp 1.897.000     │   │
│  │ Shipping:                            Rp  25.000     │   │
│  │ Tax:                                 Rp  189.700    │   │
│  │ ───────────────────────────────────────────────────│   │
│  │ TOTAL:                              Rp 2.111.700    │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  [REORDER THIS ORDER]                                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Behaviors:**

- Status timeline shows all states, completed ones marked
- Current state highlighted
- Reorder adds all items to current cart
- Confirmation before reorder if cart has items
- Print button for invoice (future)

---

## 5. INTERACTION PATTERNS

### 5.1 Add to Cart

```
User clicks "Add to Cart"
    ↓
Button shows loading spinner
    ↓
API call to POST /cart/items
    ↓
On success:
    ├── Cart badge count updates (+1)
    ├── Toast: "Added to cart"
    └── Button returns to normal
    ↓
On error:
    ├── Toast: Error message
    └── Button returns to normal
```

### 5.2 Quantity Update

```
User changes quantity
    ↓
Debounce 500ms
    ↓
Show subtle loading indicator on item row
    ↓
API call to PATCH /cart/items/:itemId
    ↓
On success:
    ├── Update item subtotal
    ├── Update cart subtotal
    └── Remove loading indicator
    ↓
On error:
    ├── Revert quantity to previous value
    ├── Toast: Error message
    └── Remove loading indicator
```

### 5.3 Search

```
User types in search bar
    ↓
Debounce 300ms
    ↓
API call to GET /products/search?q=
    ↓
Show results dropdown (max 5 items)
    ↓
User selects item → Navigate to detail
    ↓
Or user presses Enter → Navigate to catalog with search
```

### 5.4 Form Validation

```
On blur (field loses focus):
    ↓
Validate field
    ↓
If valid: green checkmark (optional)
    ↓
If invalid:
    ├── Show error message below field
    ├── Red border on field
    └── Focus stays on field

On submit:
    ↓
Validate all fields
    ↓
If any invalid:
    ├── Scroll to first error
    └── Focus on first error field
```

### 5.5 Modal / Dialog

```
Trigger action
    ↓
Modal fades in (200ms)
    ↓
Background dims (click to close = ESC key + click outside)
    ↓
Focus trapped inside modal
    ↓
Close:
    ├── Click X button
    ├── Press ESC
    ├── Click outside
    └── Complete action
    ↓
Modal fades out (200ms)
```

---

## 6. STATE BEHAVIORS

### 6.1 Loading States

```
Full page load:
    → Show skeleton screens (not spinners)
    → Match layout of actual content

Inline loading:
    → Show spinner inside button or component
    → Disable interaction during load

Background loading:
    → No visual indicator needed
    → Just update when complete
```

### 6.2 Empty States

```
No products found:
    → Illustration
    → "No products match your search"
    → Suggestions: "Try different keywords" or "Browse categories"

Empty cart:
    → Illustration
    → "Your cart is empty"
    → [Continue Shopping] button

No orders:
    → Illustration
    → "You haven't placed any orders yet"
    → [Start Shopping] button
```

### 6.3 Error States

```
Network error:
    → Toast: "Connection error. Please try again."
    → Retry button where applicable

Server error (5xx):
    → Toast: "Something went wrong. We're working on it."
    → Log error for debugging

Not found (404):
    → Friendly message
    → [Go Home] or [Go Back] buttons

Out of stock:
    → Badge: "Out of Stock"
    → Disable "Add to Cart"
    → Option: "Notify Me" (future)
```

### 6.4 Optimistic Updates

```
Cart quantity change:
    → Update UI immediately
    → Send API request
    → If API fails, revert UI
    → Show error toast

Add to cart:
    → Update cart badge immediately
    → Send API request
    → If API fails, decrement badge
    → Show error toast
```

---

## 7. NAVIGATION STRUCTURE

### 7.1 Header Navigation

```
┌─────────────────────────────────────────────────────────────┐
│ [Logo]  |  [Search Bar_________________]  | [Notif] [👤]  │
└─────────────────────────────────────────────────────────────┘

Desktop: Always visible, sticky on scroll
Mobile:
    ├── Logo (left)
    ├── Search icon (taps to search)
    ├── Cart badge (taps to cart)
    └── User icon (taps to menu)
```

### 7.2 Main Navigation (Desktop)

```
┌─────────────────────────────────────────────────────────────┐
│ Home | Products | Categories ▼ | About | Contact            │
└─────────────────────────────────────────────────────────────┘

Hover on "Categories" shows dropdown:
├── Electronics
├── Fashion
├── Home & Living
├── Sports
└── Books
```

### 7.3 User Menu (Logged In)

```
Click user icon → Dropdown:
├── My Account
├── My Orders
├── Wishlist (future)
├── Settings
├── ─────────────
└── Logout
```

### 7.4 Mobile Navigation

```
Bottom tab bar:
┌─────┬─────┬─────┬─────┬─────┐
│ 🏠  │ 🔍  │ 🛒  │ 📦  │  👤  │
│Home │Search│Cart │Orders│Account│
└─────┴─────┴─────┴─────┴─────┘

Current tab highlighted
Badge on Cart tab if items > 0
```

### 7.5 Breadcrumb

```
Format: Home > Category > Subcategory > Product Name

Clickable links
Last item (current page) not linked
Responsive: collapse to "..." on mobile if too long
```

---

## 8. FEEDBACK SYSTEMS

### 8.1 Toast Notifications

```
Position: Bottom-right (desktop), Bottom-center (mobile)
Duration: 4 seconds (auto-dismiss)
Types:
├── Success: Green background, checkmark icon
├── Error: Red background, X icon
├── Warning: Yellow background, exclamation icon
├── Info: Blue background, info icon

Max visible: 3 toasts
Queue additional toasts
Dismiss: Click X or swipe (mobile)
```

### 8.2 Inline Messages

```
Form errors:
    → Below input field
    → Red text, red border
    → Icon prefix

Success messages:
    → Above form or below relevant section
    → Green text, checkmark icon

Warnings:
    → Yellow background, warning icon
    → Dismissible or auto-dismiss after 10s
```

### 8.3 Confirmation Dialogs

```
Used for:
├── Delete item from cart
├── Cancel order
├── Logout with pending cart
└── Important irreversible actions

Format:
┌─────────────────────────────────────┐
│ Confirm Action                     │
│                                     │
│ Are you sure you want to remove    │
│ "Product Name" from your cart?     │
│                                     │
│        [Cancel]  [Remove]           │
└─────────────────────────────────────┘

Primary action on right
Destructive actions use red/danger styling
```

---

## 9. RESPONSIVE STRATEGY

### 9.1 Breakpoints

```
Mobile:      < 640px
Tablet:      640px - 1024px
Desktop:     > 1024px
Large:       > 1280px (optional)
```

### 9.2 Mobile-First Approach

```
Start with mobile design
    ↓
Scale up for tablet
    ↓
Scale up for desktop
    ↓
Enhance for large screens
```

### 9.3 Responsive Patterns

```
Product Grid:
├── Mobile:  1 column
├── Tablet:  2 columns
├── Desktop: 3-4 columns
└── Large:   5 columns

Cart:
├── Mobile:  Full page (default)
├── Desktop: Side-by-side (2 columns)

Checkout:
├── Mobile:  Stacked layout
├── Desktop: 2-column layout (form + summary)
```

### 9.4 Touch Targets

```
Minimum size: 44x44px
Spacing between: 8px minimum
Buttons: Full width on mobile
```

---

## 10. COMPONENT BEHAVIORS

### 10.1 Button

```
States:
├── Default: Base styling
├── Hover: Slight darken (desktop only)
├── Active/Pressed: Darker, slight scale down
├── Loading: Spinner replaces text, disabled
├── Disabled: 50% opacity, cursor not-allowed
└── Focus: Visible focus ring (keyboard nav)

Variants:
├── Primary: Filled, main actions
├── Secondary: Outlined, secondary actions
├── Ghost: Text only, tertiary actions
├── Danger: Red, destructive actions
└── Link: Underlined text
```

### 10.2 Input Field

```
States:
├── Default: Base border
├── Focus: Primary color border, shadow
├── Filled: Has value
├── Error: Red border, error message below
├── Disabled: Gray background, not editable
└── Read-only: Gray background, selectable

Optional:
├── Left icon (search, calendar, etc.)
├── Right icon (clear, validation)
├── Character counter
└── Helper text
```

### 10.3 Card

```
Product Card:
├── Image (aspect ratio 1:1)
├── Product name (2 lines max, ellipsis)
├── Price (formatted)
├── Original price (if discounted, strikethrough)
├── Discount badge (if applicable)
├── Rating (stars + count)
├── Stock status (if low/out)
└── Quick actions (hover on desktop)

Behavior:
├── Hover: Shadow elevation, quick-add button appears
├── Click: Navigate to detail
└── Image lazy-load with blur placeholder
```

### 10.4 Badge

```
Status Badges:
├── Pending: Yellow
├── Processing: Blue
├── Shipped: Purple
├── Delivered: Green
├── Cancelled: Red
└── Refunded: Gray

Other Badges:
├── Cart count: Circle, primary color
├── Sale: Red, "SALE" text
├── New: Green, "NEW" text
├── Out of Stock: Gray, strikethrough
```

### 10.5 Skeleton

```
Match exact dimensions of content
Subtle shimmer animation
Gray base color
Used for:
├── Product cards (image + text lines)
├── Text content (heading + paragraphs)
├── Tables (rows + cells)
└── Lists (list items)
```

### 10.6 Modal/Dialog

```
Overlay: Semi-transparent black (40% opacity)
Modal: White background, rounded corners, shadow
Animation: Fade + scale (200ms)
Close: X button (top-right), ESC key, click outside
Focus: Trapped inside modal
Scroll: Content scrollable, header/footer fixed
```

### 10.7 Toast

```
Position: Bottom-right (desktop), bottom-center (mobile)
Animation: Slide in from right, fade out
Auto-dismiss: 4 seconds
Action: Optional "Undo" or "View" button
Stacking: Max 3 visible
Dismiss: Click X or swipe
```

---

## 11. DESIGN TOKENS

### Overview

```
Design Tokens are the SINGLE SOURCE OF TRUTH for visual design.

All components reference these tokens, not hardcoded values.

This ensures consistency across the entire application.
```

### Color Tokens

```
PRIMARY TOKENS:
--color-primary:          #3B82F6 (blue-500)
--color-primary-hover:     #2563EB (blue-600)
--color-primary-active:     #1D4ED8 (blue-700)

SECONDARY TOKENS:
--color-secondary:         #64748B (slate-500)
--color-secondary-hover:    #475569 (slate-600)

SEMANTIC TOKENS:
--color-success:           #22C55E (green-500)
--color-warning:           #F59E0B (amber-500)
--color-error:             #EF4444 (red-500)
--color-info:              #3B82F6 (blue-500)

NEUTRAL TOKENS:
--color-background:        #FFFFFF
--color-surface:           #F8FAFC (slate-50)
--color-border:             #E2E8F0 (slate-200)
--color-text-primary:      #0F172A (slate-900)
--color-text-secondary:    #64748B (slate-500)
--color-text-muted:        #94A3B8 (slate-400)
```

### Spacing Tokens

```
--spacing-xs:   4px
--spacing-sm:   8px
--spacing-md:   16px
--spacing-lg:   24px
--spacing-xl:   32px
--spacing-2xl:  48px
--spacing-3xl:  64px
```

### Border Radius Tokens

```
--radius-sm:     4px
--radius-md:     8px
--radius-lg:     12px
--radius-xl:     16px
--radius-2xl:    24px
--radius-full:   9999px
```

### Shadow Tokens

```
--shadow-sm:   0 1px 2px 0 rgb(0 0 0 / 0.05)
--shadow-md:   0 4px 6px -1px rgb(0 0 0 / 0.1)
--shadow-lg:   0 10px 15px -3px rgb(0 0 0 / 0.1)
--shadow-xl:   0 20px 25px -5px rgb(0 0 0 / 0.1)
```

### Z-Index Tokens

```
--z-dropdown:    1000
--z-sticky:     1020
--z-fixed:      1030
--z-modal-backdrop: 1040
--z-modal:       1050
--z-popover:     1060
--z-tooltip:      1070
--z-toast:        1080
```

### Motion Tokens

```
--duration-fast:    150ms
--duration-normal:   200ms
--duration-slow:    300ms
--duration-slower:  400ms

--ease-out:     cubic-bezier(0, 0, 0.2, 1)
--ease-in:      cubic-bezier(0.4, 0, 1, 1)
--ease-in-out:  cubic-bezier(0.4, 0, 0.2, 1)
--ease-spring:  cubic-bezier(0.34, 1.56, 0.64, 1)
```

### Typography Tokens

```
FONT FAMILIES:
--font-sans:      system-ui, -apple-system, sans-serif
--font-mono:      ui-monospace, monospace

FONT SIZES:
--text-xs:      12px
--text-sm:      14px
--text-base:    16px
--text-lg:      18px
--text-xl:      20px
--text-2xl:     24px
--text-3xl:     30px
--text-4xl:     36px

FONT WEIGHTS:
--font-normal:    400
--font-medium:    500
--font-semibold:  600
--font-bold:      700
```

### Component Token Usage

```
BUTTON:
--button-border-radius:  var(--radius-md)
--button-padding-x:      var(--spacing-md)
--button-padding-y:      var(--spacing-sm)

CARD:
--card-border-radius:    var(--radius-lg)
--card-padding:          var(--spacing-md)
--card-shadow:           var(--shadow-sm)

INPUT:
--input-border-radius:   var(--radius-md)
--input-padding-x:       var(--spacing-md)
--input-padding-y:       var(--spacing-sm)
--input-border:          1px solid var(--color-border)

MODAL:
--modal-border-radius:   var(--radius-xl)
--modal-padding:        var(--spacing-lg)
--modal-shadow:          var(--shadow-xl)
```

---

## 12. SESSION & STATE RECOVERY

### 11.1 Session Recovery Strategy

```
User in checkout process
    ↓
Browser refresh / tab close / crash
    ↓
On return to app:
    ├── Check session validity
    ├── Check cart contents (Redis TTL)
    └── Restore user position if possible
```

### 11.2 Cart Persistence

```
Cart data stored in:
├── Server: Redis (TTL 7 days)
├── Client: localStorage (fallback)
└── Session: httpOnly cookie (auth)

Recovery priority:
1. Server cart (source of truth)
2. localStorage (offline recovery)
3. Empty cart (last resort)
```

### 11.3 Form State Recovery

```
Checkout form fields:
├── Full Name: sessionStorage
├── Phone: sessionStorage
├── Address: sessionStorage
└── City/Province: sessionStorage

Behavior:
├── Auto-save every 2 seconds during typing
├── Clear on successful order
├── Preserve on browser refresh
├── Expire after 1 hour
```

### 11.4 Recovery Scenarios

| Scenario                    | Behavior                         |
| --------------------------- | -------------------------------- |
| Browser refresh in checkout | Restore form, keep cart          |
| Tab close and reopen        | Restore form if same session     |
| App crash                   | Restore from localStorage        |
| Session expired             | Redirect to login, preserve cart |
| Network reconnect           | Sync localStorage with server    |

---

## 12. ERROR HANDLING & HTTP MAPPING

### 12.1 HTTP Status to UX Mapping

```
400 BAD REQUEST
├── UX: Inline form error
├── Message: "Please check your input"
└── Action: Highlight field, scroll to error

401 UNAUTHORIZED
├── UX: Redirect to login
├── Message: "Please login to continue"
└── Action: Preserve intended destination

403 FORBIDDEN
├── UX: Permission denied message
├── Message: "You don't have access"
└── Action: Show back button, log event

404 NOT FOUND
├── UX: Friendly 404 page
├── Message: "Page not found"
└── Action: [Go Home] button

409 CONFLICT
├── UX: Conflict resolution modal
├── Message: "Item changed by another user"
└── Action: Refresh data, show changes

422 VALIDATION ERROR
├── UX: Field-level errors
├── Message: Specific validation message
└── Action: Highlight invalid fields

429 RATE LIMIT
├── UX: Cooldown message
├── Message: "Please wait before trying again"
└── Action: Show countdown timer

500 SERVER ERROR
├── UX: Generic error with retry
├── Message: "Something went wrong"
└── Action: [Try Again] button, log error

503 SERVICE UNAVAILABLE
├── UX: Maintenance mode
├── Message: "Under maintenance"
└── Action: Show estimated downtime
```

### 12.2 Error Context Mapping

```
Cart Errors:
├── OUT_OF_STOCK → "This item is out of stock"
├── INVALID_QUANTITY → "Please enter a valid quantity"
├── CART_EXPIRED → "Your cart has expired. Please refresh."
└── MAX_CART_ITEMS → "Maximum items in cart reached"

Checkout Errors:
├── EMPTY_CART → "Your cart is empty"
├── STOCK_UNAVAILABLE → "Some items are no longer available"
├── ADDRESS_INVALID → "Please check your shipping address"
└── ORDER_EXPIRED → "Your checkout session expired"

Payment Errors:
├── PAYMENT_DECLINED → "Payment declined. Please try another method."
├── PAYMENT_TIMEOUT → "Payment timed out. Please try again."
├── AMOUNT_MISMATCH → "Payment amount mismatch"
└── GATEWAY_ERROR → "Payment service unavailable"
```

---

## 13. RETRY STRATEGY

### 13.1 Retry Decision Matrix

```
NETWORK ERROR (timeout, connection refused)
├── Retry: Yes
├── Strategy: Exponential backoff
├── Max attempts: 3
└── Delays: 1s, 2s, 4s

500 SERVER ERROR
├── Retry: Yes
├── Strategy: Exponential backoff
├── Max attempts: 2
└── Delays: 1s, 2s

429 RATE LIMIT
├── Retry: Yes
├── Strategy: Linear wait
├── Max attempts: 1
└── Delay: Respect Retry-After header

400/401/403/404 ERROR
├── Retry: No
├── Strategy: Show error immediately
└── Action: User intervention required

PAYMENT GATEWAY ERROR
├── Retry: Yes (max 1)
├── Strategy: Wait 5s then retry
└── Delays: 5s

CRITICAL TRANSACTION (checkout, payment)
├── Retry: Yes
├── Strategy: Manual retry option
├── Max attempts: 3
└── Action: Show "Try Again" button
```

### 13.2 Retry Implementation

```
Automatic Retry Flow:
1. Initial request fails
2. Wait (delay) milliseconds
3. Increment attempt counter
4. Retry request
5. If success, continue
6. If fail and attempts < max, goto step 2
7. If fail and attempts >= max, show error
```

### 13.3 User-Facing Retry

```
After automatic retries exhausted:
├── Show error toast with details
├── Provide [Try Again] button
├── Log for debugging
└── Optionally show support contact
```

---

## 14. OFFLINE BEHAVIOR

### 14.1 Offline Detection

```
Network status monitoring:
├── Online: Full functionality
├── Offline: Graceful degradation
└── Reconnecting: Sync indicator

User notification:
├── Show banner when offline
├── "You're offline. Some features unavailable."
└── Auto-dismiss when online
```

### 14.2 Offline Capabilities

```
STILL AVAILABLE:
├── Browse cached product catalog
├── View previously loaded pages
├── Read order history (cached)
└── See cart contents (localStorage)

NOT AVAILABLE:
├── Add to cart (requires server)
├── Checkout (requires server)
├── Payment (requires gateway)
├── Real-time search
└── Place new order

PRESERVED FOR SYNC:
├── Cart items (localStorage)
├── Form data (sessionStorage)
└── User preferences (localStorage)
```

### 14.3 Offline Add to Cart

```
User taps "Add to Cart" while offline:
    ↓
Check localStorage for cached product
    ↓
If cached:
    ├── Show offline indicator
    ├── Save to pending actions queue
    └── Toast: "Will sync when online"
    ↓
When back online:
    ├── Process pending queue
    ├── Update UI with results
    └── Toast: "Cart synced"
```

### 14.4 Offline Queue

```
Pending Actions Queue:
├── Stored in localStorage
├── Format: [{ action, payload, timestamp }]
├── Max queue size: 10 actions
├── Process on reconnect (FIFO)
└── Clear on successful sync
```

---

## 15. PERFORMANCE BUDGET

### 15.1 Page Load Targets

```
Homepage:
├── FCP: < 1.5s
├── LCP: < 2.5s
├── TTI: < 3.5s
└── CLS: < 0.1

Catalog Page:
├── FCP: < 1.0s
├── LCP: < 2.0s
├── TTI: < 3.0s
└── CLS: < 0.1

Product Detail:
├── FCP: < 1.0s
├── LCP: < 2.0s
├── TTI: < 2.5s
└── CLS: < 0.1

Checkout:
├── FCP: < 1.0s
├── LCP: < 1.5s
├── TTI: < 2.0s
└── CLS: < 0.05

Cart:
├── FCP: < 0.8s
├── LCP: < 1.5s
├── TTI: < 2.0s
└── CLS: < 0.05
```

### 15.2 Interaction Timing

```
Search debounce: 300ms
Filter debounce: 300ms
Quantity debounce: 500ms
Form auto-save: 2000ms
Page transition: < 250ms
Modal open: < 200ms
Toast appear: < 100ms
Cart drawer: < 300ms
```

### 15.3 Asset Budget

```
Images:
├── Product thumbnail: < 50KB
├── Product gallery: < 200KB
├── Hero banner: < 300KB
├── Category icon: < 10KB
└── Avatar: < 20KB

JavaScript:
├── Initial bundle: < 150KB (gzipped)
├── Route chunks: < 50KB each
└── Total JS: < 500KB

Fonts:
├── Primary font: < 30KB (subset)
├── Icons: SVG sprite preferred
└── Total fonts: < 50KB
```

### 15.4 Network Budget

```
API Response:
├── Product list: < 50KB
├── Product detail: < 100KB
├── Cart: < 20KB
├── Order history: < 30KB
└── Max API payload: < 200KB

Image Loading:
├── Lazy load below fold
├── Progressive JPEG for photos
├── WebP with fallback
└── srcset for responsive images
```

---

## 16. ANIMATION GUIDELINES

### 16.1 Animation Philosophy

```
Animation Rules:
├── Duration: Max 250ms for micro-interactions
├── Duration: Max 400ms for transitions
├── Easing: Use natural easing (ease-out, ease-in-out)
├── Respect: prefers-reduced-motion
└── Performance: GPU-accelerated properties only
```

### 16.2 Animation Duration Matrix

```
MICRO-INTERACTIONS (< 150ms):
├── Button hover: 100ms
├── Button press: 50ms
├── Icon change: 100ms
├── Badge update: 150ms
└── Focus ring: 100ms

FEEDBACK (< 250ms):
├── Toast enter: 200ms
├── Toast exit: 150ms
├── Checkbox toggle: 150ms
├── Dropdown expand: 200ms
└── Tooltip show: 150ms

LAYOUT CHANGES (< 400ms):
├── Modal open: 200ms
├── Modal close: 150ms
├── Drawer slide: 300ms
├── Accordion: 250ms
├── Tabs switch: 200ms
└── Page transition: 300ms

LOADING (< 500ms):
├── Skeleton shimmer: continuous
├── Spinner: continuous
├── Progress bar: duration-based
└── Loading overlay: instant to 200ms
```

### 16.3 Easing Curves

```
STANDARD EASING:
ease-out:    cubic-bezier(0, 0, 0.2, 1)   → Elements entering
ease-in:     cubic-bezier(0.4, 0, 1, 1)   → Elements leaving
ease-in-out: cubic-bezier(0.4, 0, 0.2, 1) → Elements moving

SPECIAL CASES:
spring:      cubic-bezier(0.34, 1.56, 0.64, 1) → Bouncy feedback
smooth:      cubic-bezier(0.65, 0, 0.35, 1)   → Smooth slides
```

### 16.4 Loading State Guidelines

```
Use skeleton for:
├── Initial page load
├── Data fetching (catalog, search)
├── Card grid loading
└── List loading

Use spinner for:
├── Button actions (submit, confirm)
├── Inline operations (add to cart)
├── Short waits (< 1 second)
└── Processing states

Use progress for:
├── File uploads
├── Multi-step processes
├── Long operations (> 2 seconds)
└── Download progress
```

---

## 17. SEARCH EXPERIENCE

### 17.1 Search Architecture

```
SEARCH FEATURES BY PHASE:

MVP (Phase 4):
├── Basic text search
├── Debounced input (300ms)
├── Results dropdown (max 5 items)
├── Enter to see all results
└── Clear search button

PHASE 7+ (Future):
├── Recent searches (localStorage)
├── Popular searches
├── Search suggestions
├── Voice search
└── Barcode/QR search
```

### 17.2 Search UX Flow

```
USER TYPES:
    ↓
Wait 300ms (debounce)
    ↓
SHOW LOADING INDICATOR
    ↓
FETCH RESULTS
    ↓
If results > 0:
    ├── Show dropdown (max 5)
    ├── Highlight matching text
    └── Show "See all results"
    ↓
If results = 0:
    ├── Show "No results"
    └── Show suggestions
    ↓
USER SELECTS:
    ├── Click item → Navigate to detail
    ├── Click "See all" → Navigate to catalog
    └── Click away → Close dropdown
```

### 17.3 Search States

```
EMPTY (no input):
├── Show recent searches (if any)
├── Show popular searches
└── Show search suggestions

LOADING:
├── Show subtle loading indicator
└── Keep previous results visible

RESULTS:
├── Show max 5 items in dropdown
├── Highlight matching text
├── Show result count
└── Show "See all X results"

NO RESULTS:
├── Show friendly message
├── Show "Try different keywords"
├── Show popular categories
└── Clear search button

ERROR:
├── Show error message
├── Offer retry
└── Show offline message if applicable
```

### 17.4 Search Accessibility

```
Keyboard Navigation:
├── Tab: Focus search input
├── Type: Enter search term
├── Arrow Down: Navigate results
├── Arrow Up: Previous result
├── Enter: Select highlighted
├── Escape: Close dropdown
└── Tab: Move to next element

Screen Reader:
├── Role: combobox
├── Live region for results count
├── Announce: "X results found"
└── Announce: "No results for [query]"
```

---

## 18. PERMISSION & ACCESS CONTROL UX

### Scope

```
Phase 6 focuses on CUSTOMER-FACING frontend.

Roles:
├── Guest (unauthenticated user)
└── Authenticated Customer (registered user)

Note: Seller Portal and Admin Dashboard are Future Phases.
```

### 18.1 Route Protection Matrix

```
ROUTE                    GUEST    CUSTOMER
─────────────────────────────────────────────
/ (Homepage)             ✅       ✅
/products                ✅       ✅
/products/[slug]         ✅       ✅
/cart                    ✅       ✅
/checkout                ✅       ✅ ← Guest ALLOWED
/payment                 ✅       ✅ ← Guest ALLOWED
/orders                  🔒       ✅
/orders/[id]             🔒       ✅

✅ = Allow    🔒 = Redirect to login

Note: Guest checkout is supported per Backend Phase 2 design.
Guest can complete purchase without login.
```

### 18.2 Protected Route Behavior

```
GUEST ACCESSING PROTECTED ROUTE:
    ↓
Check auth status
    ↓
If not authenticated:
    ├── Show login prompt modal
    ├── Preserve intended destination
    └── Options: Login / Register / Continue as Guest
    ↓
If authenticated but wrong role:
    ├── Show "Access Denied" page
    └── Suggest alternative actions
```

### 18.3 Login Prompt UX

```
Protected action triggered:
    ↓
Show modal overlay:
┌─────────────────────────────────────────────┐
│                                             │
│   Please login to continue                  │
│                                             │
│   [LOGIN]        [REGISTER]                │
│                                             │
│   ──────── or ────────                     │
│                                             │
│   [CONTINUE AS GUEST]                      │
│                                             │
└─────────────────────────────────────────────┘

Behavior:
├── Modal is non-blocking (can dismiss)
├── Preserve intended destination in URL
├── Guest can continue with limited features
└── Full features available after login
```

### 18.4 Role-Based UI Adaptation

```
CUSTOMER UI:
├── Show "My Orders"
├── Show "My Account"
├── Hide admin links
└── Disable seller features

SELLER UI:
├── All customer features
├── Show "My Products"
├── Show "Add Product"
├── Show order management
└── Hide admin links

ADMIN UI:
├── All features
├── Show admin dashboard
├── Show user management
├── Show analytics
└── Full access
```

### 18.5 Permission Error Handling

```
INSUFFICIENT PERMISSIONS:
├── Message: "You don't have permission"
├── Action: Redirect to appropriate page
├── Log: Security event
└── Suggest: "Try logging in as different user"
```

---

## APPENDIX: UX Checklist

Before declaring a screen complete:

```
□ All interactive elements have working handlers
□ Loading states implemented (skeleton, spinner)
□ Error states implemented (inline, toast)
□ Empty states implemented
□ Success feedback implemented
□ Form validation works (inline errors)
□ Keyboard navigation works (Tab, Enter, Esc)
□ Focus management correct
□ Responsive on all breakpoints
□ Touch targets ≥ 44px
□ No console errors
□ Animations smooth (60fps)
□ Accessible (ARIA labels, color contrast)
```

---

_UX Blueprint Document_
_Phase 6 - Frontend User Experience Design_
_This document complements the Technical Architecture (STEP6.md) and Implementation Blueprint (STEP6-1.md)_
