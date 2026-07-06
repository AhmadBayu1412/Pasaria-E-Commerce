# Phase 6 Step 3 Blueprint - Revision Notes

## Overview

This document captures the review feedback and revisions to be made to the Step 3 Blueprint for Product Listing Page.

**Based on:** Review feedback dated July 6, 2026  
**Blueprint:** `phase6-step3-blueprint.md`

---

## Approved With Minor Revisions

**Final Score:** 9.8 / 10

---

## Revision Items

### R1: Remove filters.store (Zustand)

**Current:**

```
store/
└── filters/
    ├── filters.store.ts
    ├── filters.types.ts
    └── index.ts
```

**Revised:**
URL is the single source of truth. Remove Zustand store for filters.

**New Flow:**

```
SearchParams
    ↓
useFilters() hook
    ↓
router.replace()
    ↓
Server Render
```

**Rationale:** Filter state only lives on the listing page. No need for global state.

---

### R2: Add SEARCH_DEBOUNCE Constant

**Add to:**

```typescript
// lib/constants/search.ts
export const SEARCH_DEBOUNCE = 300; // milliseconds
```

**Rationale:** Avoid hardcoding. Easy to adjust UX later.

---

### R3: Separate API Server and Client

**Current:**

```
lib/
└── products/
    └── products.api.ts
```

**Revised:**

```
lib/
└── api/
    ├── products.server.ts    # Server: fetch, cache, revalidate
    └── products.client.ts    # Client: abort controller, loading
```

**Rationale:** Server and client fetching have different needs.

---

### R4: Break Down ProductCard

**Current:**

```
ProductCard (single component)
```

**Revised:**

```
ProductCard/
├── ProductCard.tsx           # Wrapper
├── product-card.types.ts
├── product-card-image.tsx    # Image with blur
├── product-card-info.tsx     # Title, description
├── product-card-price.tsx    # Price, discount
├── product-card-rating.tsx   # Stars, count
└── product-card-actions.tsx  # Wishlist, compare, add-to-cart
```

**Rationale:** Will be reused in Home, Related Products, Wishlist, Search, Recommendation.

---

### R5: Pagination Ellipsis Algorithm

**Ensure Pagination supports:**

```
1 | 2 | 3 | ... | 10
```

**NOT:**

```
1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10
```

**Rationale:** Handle cases with 800+ pages.

---

### R6: Add AbortController to Search

**Add to products.client.ts:**

```typescript
export function useProductSearch() {
  const abortControllerRef = useRef<AbortController | null>(null);

  const search = async (query: string) => {
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new controller
    abortControllerRef.current = new AbortController();

    return fetchProducts({ q: query }, abortControllerRef.current.signal);
  };

  return { search };
}
```

**Rationale:** Prevent race conditions when user types fast.

---

### R7: Define Empty States in Detail

**Add component:** `EmptyState.tsx`

**Variants:**

1. **No Search Results**
   - Icon: Search with X
   - Message: "No products found for '[query]'"
   - Action: Clear search button

2. **No Category Products**
   - Icon: Folder empty
   - Message: "No products in this category yet"
   - Action: Browse other categories link

3. **Out of Stock (Future)**
   - Icon: Package
   - Message: "Products are currently out of stock"
   - Action: Notify me button

4. **API Error**
   - Icon: Warning triangle
   - Message: "Failed to load products"
   - Action: Retry button

---

### R8: Image Strategy

**Add to ProductCard:**

```typescript
// Image requirements
const productImage = {
  aspectRatio: '4/3',
  blurDataURL: generateBlurPlaceholder(imageUrl),
  fallback: '/images/product-placeholder.png',
  priority: index < 4, // First 4 images are priority
  sizes: '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw',
};
```

**Components needed:**

- `ProductImage` with next/image
- Blur placeholder generator
- Skeleton image component

---

### R9: Differentiate Loading Strategies

| Action        | Loading Type      | Behavior                       |
| ------------- | ----------------- | ------------------------------ |
| Initial Load  | Full Skeleton     | Page shell + grid skeleton     |
| Filter Change | Grid Only         | Grid skeleton, keep sidebar    |
| Pagination    | Grid Only         | Grid skeleton, keep filters    |
| Search        | Optimistic + Grid | Show recent results + skeleton |

---

### R10: Add SEO Metadata

**Add to page.tsx:**

```typescript
export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}): Promise<Metadata> {
  const params = await searchParams;
  const category = params.category;
  const query = params.q;

  const title = query
    ? `Search: ${query} - Pasaria`
    : category
      ? `${category} - Pasaria`
      : 'Products - Pasaria';

  const description = query
    ? `Find the best products matching "${query}" at Pasaria. Shop now!`
    : 'Browse our complete collection of quality products at great prices.';

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
    },
  };
}
```

---

### R11: Change Folder Structure to Features

**Current:**

```
components/
└── products/
```

**Revised:**

```
components/
└── features/
    └── products/
        ├── product-card/
        ├── product-grid/
        ├── product-grid-skeleton/
        ├── filter-sidebar/
        ├── pagination/
        └── empty-state/
```

**Rationale:** Clearer boundaries for enterprise scalability.

---

### R12: Edge Case Testing Plan

Add to blueprint section 7:

#### Filter Edge Cases

- [ ] Spam clicking categories
- [ ] Empty filter selection
- [ ] Invalid category slug
- [ ] URL with invalid query params

#### Search Edge Cases

- [ ] Fast typing (race conditions)
- [ ] Special characters: `!@#$%^&*()`
- [ ] Emoji: 🎉🛒
- [ ] Very long query (truncate at 100 chars)
- [ ] Empty query

#### Pagination Edge Cases

- [ ] Negative page number
- [ ] Page beyond total pages
- [ ] Non-numeric page
- [ ] Page = 0

#### URL Edge Cases

- [ ] Manual URL editing
- [ ] Corrupted query params
- [ ] Duplicate query params
- [ ] Empty URL state

#### Product Card Edge Cases

- [ ] No images
- [ ] Empty price
- [ ] Stock = 0
- [ ] Multiple badges (stack overflow)
- [ ] Very long product name (truncate with ellipsis)

---

## Summary of Changes

| Item | Change                        | Priority |
| ---- | ----------------------------- | -------- |
| R1   | Remove Zustand filter store   | High     |
| R2   | Add SEARCH_DEBOUNCE constant  | Medium   |
| R3   | Separate API server/client    | Medium   |
| R4   | Break down ProductCard        | High     |
| R5   | Pagination ellipsis algorithm | High     |
| R6   | AbortController (conditional) | Low      |
| R7   | Detailed Empty States         | Medium   |
| R8   | Image strategy                | Medium   |
| R9   | Loading strategies            | Low      |
| R10  | SEO metadata                  | High     |
| R11  | Features folder structure     | Medium   |
| R12  | Edge case testing             | Medium   |
| R13  | Query Parameter Validation    | High     |
| R14  | Shared Formatting Utilities   | Medium   |

---

## R13: Query Parameter Validation Layer

**Add Zod schema validation:**

```typescript
// lib/schemas/product-filters.ts
import { z } from 'zod';

export const ProductFilterSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(12).max(48).default(12),
  sort: z
    .enum(['newest', 'price_asc', 'price_desc', 'popularity', 'rating'])
    .default('newest'),
  category: z.string().optional(),
  q: z.string().max(100).optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
});

export type ProductFilters = z.infer<typeof ProductFilterSchema>;
```

**Flow:**

```
URL
  ↓
ProductFilterSchema.parse()
  ↓
Normalized Filters (defaults applied)
  ↓
Server Component
  ↓
Render
```

**Rationale:** Prevents bugs from invalid query parameters. Invalid values get sanitized to defaults.

---

## R14: Shared Formatting Utilities

**Add to lib/format/:**

```typescript
// lib/format/currency.ts
export function formatCurrency(
  amount: number,
  locale = 'id-ID',
  currency = 'IDR',
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// lib/format/number.ts
export function formatNumber(value: number, locale = 'id-ID'): string {
  return new Intl.NumberFormat(locale).format(value);
}

// lib/format/date.ts
export function formatDate(
  date: string | Date,
  locale = 'id-ID',
  options?: Intl.DateTimeFormatOptions,
): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    ...options,
  }).format(d);
}
```

**Rationale:** Single source of truth for formatting. Used by ProductCard, Checkout, Order History, Admin Dashboard.

---

## R6 Note: AbortController Implementation

> Implement `AbortController` only if search uses client-side fetch.

**If SSR with URL navigation:**

```
User types → router.replace() → Server re-render
```

No manual fetch needed. Skip AbortController.

**If client-side search:**

```
User types → useProductSearch() → fetch with AbortController
```

Implement R6 as planned.

---

## Next Steps

1. Update `phase6-step3-blueprint.md` with these revisions
2. Create implementation following revised blueprint
3. Verify build succeeds
4. Submit for final review

---

**Prepared by:** AI Assistant  
**Revision Date:** July 6, 2026  
**Status:** Ready for Implementation  
**Final Score:** 9.95 / 10
