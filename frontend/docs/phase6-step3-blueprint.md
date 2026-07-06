# Phase 6 Step 3 Blueprint: Product Listing Page

## Overview

Step 3 focuses on building the **Product Listing Page** - the first real UI page that will validate whether the Design System from Step 2 is production-ready.

> **Key Question:** Can we build a complete product listing page using only the Design System components, or do we need to extend/modify them?

---

## Context

### Previous Steps

- **Step 1:** Frontend foundation (Next.js 15, TypeScript, Zustand, folder structure)
- **Step 2:** Design System (Tokens, UI Components, Layout Components)

### Next Steps After This

- **Step 4:** Product Detail Page
- **Step 5:** Cart & Checkout Flow
- **Step 6:** User Authentication UI
- **Step 7:** Order Management UI
- **Step 8:** Admin Dashboard
- **Step 9:** Search & Filter Components
- **Step 10:** Performance Optimization

---

## 1. Page Requirements

### Functional Requirements

1. **Product Grid Display**
   - Display products in a responsive grid (1-4 columns based on viewport)
   - Each product card shows: image, title, price, rating, badge (optional)
   - Click to navigate to product detail

2. **Category Filtering**
   - Filter products by category
   - Single or multiple category selection
   - URL sync for shareable filter state

3. **Sorting**
   - Sort by: Price (Low-High, High-Low), Newest, Popularity, Rating
   - URL sync for sort state

4. **Pagination**
   - Page-based pagination
   - Items per page: 12, 24, 48
   - URL sync for page state

5. **Search**
   - Search by product name
   - Debounced input (300ms)
   - URL sync for search query

### Non-Functional Requirements

1. **Performance**
   - First Contentful Paint < 1.5s
   - Largest Contentful Paint < 2.5s
   - Cumulative Layout Shift < 0.1

2. **Accessibility**
   - All interactive elements keyboard accessible
   - Screen reader friendly grid navigation
   - Focus management on filter/sort changes

3. **SEO**
   - Server-side rendering for initial load
   - Proper meta tags
   - Structured data for products

---

## 2. Architecture Decisions

### 2.1 Server vs Client Component Strategy

```
┌─────────────────────────────────────────────────────────┐
│                    ProductListingPage                    │
│                    (Server Component)                   │
│                                                          │
│  ┌─────────────┐  ┌─────────────────────────────────┐ │
│  │ Filters     │  │ ProductGrid                      │ │
│  │ (Client)    │  │ (Server with Suspense)          │ │
│  │             │  │                                 │ │
│  │ - Category  │  │ ┌─────┐ ┌─────┐ ┌─────┐        │ │
│  │ - Sort      │  │ │Card │ │Card │ │Card │        │ │
│  │ - Search    │  │ └─────┘ └─────┘ └─────┘        │ │
│  │ - Price     │  │ ┌─────┐ ┌─────┐ ┌─────┐        │ │
│  └─────────────┘  │ │Card │ │Card │ │Card │        │ │
│                    │ └─────┘ └─────┘ └─────┘        │ │
│                    └─────────────────────────────────┘ │
│                                                          │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Pagination (Client)                            │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

**Decision Rationale:**

- Page shell is Server Component for SEO and initial load performance
- Interactive filters are Client Components with URL sync
- Product grid is Server Component with Suspense for streaming
- Pagination is Client Component

### 2.2 Data Fetching Strategy

```
┌─────────────────────────────────────────────────────────┐
│                     URL State                            │
│  ?category=electronics&sort=price_asc&page=1&q=laptop  │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│                  Server Component                        │
│                                                          │
│  ┌─────────────────────────────────────────────────┐   │
│  │ fetchProducts(params)                           │   │
│  │   - Called on server                           │   │
│  │   - Returns: { products, total, pageInfo }      │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│                   Product Grid UI                        │
└─────────────────────────────────────────────────────────┘
```

**Decision Rationale:**

- URL is source of truth for filter/sort/pagination state
- Server-side data fetching for SEO
- No client-side data fetching on initial load
- Future: React Query for client-side caching (Step 10)

### 2.3 State Management

```
┌─────────────────────────────────────────────────────────┐
│                    URL (nuqs/zustand)                   │
│                                                          │
│  - searchParams.get('category')                         │
│  - searchParams.get('sort')                             │
│  - searchParams.get('page')                             │
│  - searchParams.get('q')                                │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│                   Filter State                          │
│                                                          │
│  useFilters() hook:                                     │
│  - selectedCategories: string[]                         │
│  - sortOption: SortOption                               │
│  - searchQuery: string                                  │
│  - priceRange: [min, max]                               │
│                                                          │
│  updateFilters(updates)                                 │
│    └─► router.push(newUrl)                             │
└─────────────────────────────────────────────────────────┘
```

**Decision Rationale:**

- URL is source of truth for shareability and bookmarking
- Client state synced to URL via nuqs or Zustand middleware
- No separate client state for filters (single source of truth)

---

## 3. Component Inventory

### 3.1 New Components Needed

| Component           | Purpose                 | Type           |
| ------------------- | ----------------------- | -------------- |
| ProductCard         | Display single product  | Presentational |
| ProductGrid         | Layout for products     | Presentational |
| FilterSidebar       | Container for filters   | Container      |
| FilterCheckbox      | Category filter item    | Interactive    |
| SortSelect          | Sort dropdown           | Interactive    |
| PriceRangeSlider    | Price filter            | Interactive    |
| SearchInput         | Search with debounce    | Interactive    |
| Pagination          | Page navigation         | Interactive    |
| PaginationButton    | Single page button      | Interactive    |
| ActiveFilters       | Show active filter tags | Presentational |
| ProductGridSkeleton | Loading state           | Presentational |

### 3.2 Components from Design System

| Component | Usage                           |
| --------- | ------------------------------- |
| Card      | ProductCard base                |
| Badge     | Product badges (Sale, New, Hot) |
| Button    | Pagination, Filters             |
| Input     | Search input                    |
| Spinner   | Loading states                  |
| Skeleton  | Loading skeletons               |
| Container | Page layout                     |

### 3.3 Component Modifications Needed

**Potential modifications to existing Design System:**

1. **Badge** - Add `variant="outline"` for subtle badges
2. **Input** - Add `size="lg"` for search input
3. **Card** - Consider adding hoverable image zoom effect

> **Note:** These are hypotheses. We will verify during implementation.

---

## 4. File Structure

```
src/
├── app/
│   ├── products/
│   │   ├── page.tsx                    # Main listing page
│   │   └── loading.tsx                  # Loading skeleton
│   └── layout.tsx                       # Root layout
├── components/
│   ├── products/
│   │   ├── product-card/
│   │   │   ├── product-card.tsx
│   │   │   ├── product-card.types.ts
│   │   │   └── index.ts
│   │   ├── product-grid/
│   │   │   ├── product-grid.tsx
│   │   │   ├── product-grid.types.ts
│   │   │   └── index.ts
│   │   └── product-grid-skeleton/
│   │       ├── product-grid-skeleton.tsx
│   │       └── index.ts
│   ├── filters/
│   │   ├── filter-sidebar/
│   │   │   ├── filter-sidebar.tsx
│   │   │   ├── filter-sidebar.types.ts
│   │   │   └── index.ts
│   │   ├── filter-checkbox/
│   │   ├── sort-select/
│   │   ├── price-range-slider/
│   │   ├── search-input/
│   │   └── active-filters/
│   ├── pagination/
│   │   ├── pagination.tsx
│   │   ├── pagination.types.ts
│   │   ├── pagination-button/
│   │   └── index.ts
│   └── ui/                              # Design System (existing)
├── hooks/
│   ├── use-filters.ts                  # Filter state management
│   └── use-product-search.ts            # Debounced search
├── lib/
│   └── products/
│       ├── products.api.ts              # API calls
│       ├── products.types.ts            # API types
│       └── products.utils.ts           # Helpers
└── store/
    └── filters/
        ├── filters.store.ts             # Zustand store
        ├── filters.types.ts
        └── index.ts
```

---

## 5. API Contract

### 5.1 Expected API Response

```typescript
// GET /api/products
interface ProductsResponse {
  products: Product[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
  filters: {
    categories: Category[];
    priceRange: { min: number; max: number };
    sortOptions: SortOption[];
  };
}

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  originalPrice?: number;
  images: string[];
  category: Category;
  rating: number;
  reviewCount: number;
  badges?: ('new' | 'sale' | 'hot')[];
  stock: number;
  createdAt: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  productCount: number;
}

type SortOption =
  | 'newest'
  | 'price_asc'
  | 'price_desc'
  | 'popularity'
  | 'rating';
```

### 5.2 Query Parameters

| Parameter  | Type       | Description                       |
| ---------- | ---------- | --------------------------------- |
| `page`     | number     | Current page (1-indexed)          |
| `pageSize` | number     | Items per page (12, 24, 48)       |
| `category` | string     | Category slug(s), comma-separated |
| `sort`     | SortOption | Sort order                        |
| `q`        | string     | Search query                      |
| `minPrice` | number     | Minimum price filter              |
| `maxPrice` | number     | Maximum price filter              |

---

## 6. State Flow

### 6.1 URL to UI Flow

```
User changes filter
        │
        ▼
URL State changes (useSearchParams)
        │
        ▼
Server Component re-fetches with new params
        │
        ▼
ProductGrid receives new data
        │
        ▼
UI re-renders with new products
```

### 6.2 Client Interactions

```
User clicks filter checkbox
        │
        ▼
updateFilters({ categories: [...current, newCategory] })
        │
        ▼
router.push('/products?category=...')
        │
        ▼
URL triggers Server Component re-render
```

### 6.3 Loading States

```
Initial Load:
  Page Shell (Server) → Suspense Boundary → Skeleton → Data

Filter Change:
  Skeleton → Data

Pagination:
  Skeleton → Data

Search:
  Debounce (300ms) → Skeleton → Data
```

---

## 7. Potential Issues & Mitigations

### 7.1 Hydration Issues

**Issue:** URL params may differ between server and client.

**Mitigation:**

- Use `suppressHydrationWarning` on filter components
- Ensure initial render matches server output
- Use URL as single source of truth

### 7.2 Performance

**Issue:** Large product list may cause slow initial render.

**Mitigation:**

- Implement pagination (12 items default)
- Use `next/image` for optimized images
- Streaming with Suspense boundaries
- Server Components for data fetching

### 7.3 Accessibility

**Issue:** Complex grid with filters may be hard to navigate.

**Mitigation:**

- Proper ARIA labels on all interactive elements
- Focus management on filter changes
- Keyboard navigation for grid
- Screen reader announcements for filter results count

### 7.4 Data Freshness

**Issue:** Stale data from server-side rendering.

**Mitigation:**

- Consider ISR (Incremental Static Regeneration) for product pages
- Add revalidation strategy
- Future: React Query for client-side caching

---

## 8. Testing Strategy

### 8.1 Unit Tests (Future - Step 10)

```typescript
// ProductCard.test.tsx
describe('ProductCard', () => {
  it('displays product information correctly');
  it('shows sale badge when applicable');
  it('shows out of stock state');
  it('is keyboard navigable');
});
```

### 8.2 Integration Tests (Future)

```typescript
// Filter integration
it('updates URL when filter changes');
it('fetches new products after filter');
```

### 8.3 Accessibility Tests (Future)

```typescript
// axe-core integration
it('passes accessibility checks', async () => {
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

---

## 9. Milestones

### Milestone 1: Page Structure

- [ ] Create page route (`/products`)
- [ ] Create loading skeleton
- [ ] Implement basic page layout
- [ ] Add to navigation

### Milestone 2: Product Display

- [ ] Create ProductCard component
- [ ] Create ProductGrid component
- [ ] Create ProductGridSkeleton
- [ ] Connect to API/mock data

### Milestone 3: Filtering

- [ ] Create FilterSidebar
- [ ] Create FilterCheckbox
- [ ] Create SortSelect
- [ ] Implement URL sync
- [ ] Add ActiveFilters display

### Milestone 4: Search & Pagination

- [ ] Create SearchInput with debounce
- [ ] Create Pagination component
- [ ] Connect all filters to URL
- [ ] Handle edge cases (empty results, invalid params)

### Milestone 5: Polish

- [ ] Loading states
- [ ] Error states
- [ ] Empty states
- [ ] Responsive design
- [ ] Accessibility audit

---

## 10. Open Questions

1. **Should we use React Query immediately or wait until Step 10?**
   - Pros of using now: Better caching, easier client-side updates
   - Cons: Additional complexity, may over-engineer

2. **Should filters be in a sidebar or horizontal chips?**
   - Sidebar: Better for mobile, more filters possible
   - Chips: Better UX on mobile for quick filters

3. **How should we handle product images?**
   - next/image with blur placeholder?
   - Lazy loading with Intersection Observer?
   - Optimized image CDN?

4. **Should we implement URL persistence?**
   - Save filter state to localStorage?
   - Shareable URLs are more important for e-commerce

---

## 11. Verification Criteria

Step 3 is complete when:

- [ ] Product listing page loads with products
- [ ] Filters update URL and product list
- [ ] Sorting works correctly
- [ ] Search is debounced and functional
- [ ] Pagination works with URL sync
- [ ] Loading skeletons display during data fetch
- [ ] Empty state shows when no results
- [ ] Error state shows on API failure
- [ ] All components use Design System tokens
- [ ] No TypeScript errors
- [ ] Build succeeds
- [ ] Basic accessibility passes (keyboard nav, screen reader)

---

## 12. Dependencies

### From Step 2

- All Design System components
- All Layout components
- Toast system

### New Dependencies

- `nuqs` - URL state management (optional, can use Zustand)
- `next/image` - Image optimization (already in Next.js)

### Future Dependencies (Step 10)

- `@tanstack/react-query` - Data fetching/caching
- `vitest` + `@testing-library/react` - Testing
- `axe-core` - Accessibility testing

---

**Prepared by:** AI Assistant  
**Blueprint Status:** Draft for Review  
**Next Step:** Implementation after blueprint approval
