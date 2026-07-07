# Phase 6 Step 9 - Blueprint Revision Notes

## Tanggal: 7 Juli 2026

## Reviewer Score: 8.8/10

## Target Score (after revision): 9.6-9.8/10

---

## 🔴 Critical Issues (Must Fix)

### 1. ❌ Backend Alignment - Store Search

**Problem:**
Blueprint menampilkan Store dalam autocomplete, tetapi backend Phase 1-5 belum memiliki domain Store.

**Backend yang ada:**

- Product
- Category
- Cart
- Order
- Payment

**Fix:**
Hapus Store dari autocomplete. Scope MVP cukup:

- Products
- Categories
- Query Suggestions

Store bisa menjadi Future Phase.

---

### 2. ❌ Backend Alignment - Rating Filter

**Problem:**
Rating Filter menggunakan ★★★★★, tetapi backend tidak memiliki modul Review/Rating.

**Fix:**
Hapus Rating Filter sampai backend memiliki Review Module.

Ganti dengan:

- Category
- Price Range
- Availability (In Stock / All)

---

### 3. ❌ Code Bug - useSearch key variable

**Problem:**

```typescript
if (key !== "page")  // 'key' is never declared
```

**Fix:**

```typescript
Object.entries(newQuery).forEach(([paramKey, value]) => {
  if (paramKey !== 'page' && newQuery.page === undefined) {
    params.set('page', '1');
  }
});
```

---

### 4. ❌ Code Bug - SearchHighlight regex

**Problem:**

```typescript
regex.test(part); // RegExp with 'g' flag changes lastIndex
```

**Fix:**

```typescript
const isMatch = part.toLowerCase() === query.toLowerCase();
// or use non-global regex
const regex = new RegExp(`(${escapeRegex(query)})`, 'i');
```

---

## 🟡 Important Issues (Should Fix)

### 5. Search Facets Architecture

**Problem:**
Blueprint menampilkan `facets` dalam response, tetapi backend mungkin belum mendukung.

**Fix - Proposed API Design:**

```
GET /search
├── Query: q, category, minPrice, maxPrice, sortBy, page, limit
└── Response:
    ├── items: SearchProductItem[]
    ├── total: number
    ├── page: number
    ├── totalPages: number
    └── facets?: SearchFacets  // optional, if backend supports

GET /search/suggestions
├── Query: q
└── Response: SearchSuggestion[]
    ├── type: 'product' | 'query'
    ├── text: string
    └── count?: number

GET /search/facets (optional)
├── Query: q
└── Response: SearchFacets
```

---

### 6. Recent Search - Hook vs Store

**Problem:**
`useRecentSearches()` sebagai hook, tapi search state akan berkembang.

**Fix:**
Gunakan Zustand store untuk consistency:

```typescript
// store/search-store.ts
interface SearchState {
  query: string;
  filters: SearchFilters;
  sort: SortOption;
  recentSearches: string[];

  // Actions
  setQuery: (q: string) => void;
  addRecentSearch: (q: string) => void;
  clearRecentSearches: () => void;
}

// persist to localStorage
```

---

### 7. Search Result Page - Server vs Client Component

**Problem:**
SearchPage menggunakan `'use client'` penuh.

**Fix:**

```
Search Bar      → Client Component (for interactivity)
Search Results  → Server Component (for SEO, performance)
```

```typescript
// app/search/page.tsx (Server Component)
export default async function SearchPage({
  searchParams,
}: {
  searchParams: { q?: string; category?: string; ... }
}) {
  const results = await searchService.search({
    q: searchParams.q,
    ...
  });

  return <SearchResults data={results} />;
}

// SearchBar (Client Component)
// SearchFilters (Client Component)
```

---

### 8. SearchProductItem - Lightweight Payload

**Problem:**
Menggunakan full `Product` entity untuk search results.

**Fix:**
Gunakan lightweight type:

```typescript
interface SearchProductItem {
  id: number;
  slug: string;
  name: string;
  thumbnail: string;
  price: number;
  originalPrice?: number;
  stock: number;
  categoryId: number;
}
```

---

### 9. Pagination - Reuse Existing

**Problem:**
Membuat `search-pagination` baru.

**Fix:**
Gunakan `components/ui/pagination` yang sudah ada dari Step 4.

---

### 10. Search Suggestion - Simplify

**Problem:**
terlalu kompleks dengan 4 type.

**Fix:**
MVP cukup:

```typescript
type: 'product' | 'query';
```

Category bisa ditampilkan di Search Page filters.
Store adalah Future Phase.

---

## 🟢 Enhancement (Nice to Have)

### 11. Error Boundary

**Addition:**

```typescript
interface SearchErrorState {
  type: 'autocomplete' | 'results' | 'filters';
  message: string;
  onRetry: () => void;
}
```

---

### 12. Mobile UX - Bottom Sheet

**Addition:**

```typescript
// Filter untuk Mobile
<MobileFilterSheet>
  <FilterContent />
</MobileFilterSheet>

// bukan sidebar di mobile
```

---

### 13. Search Cache

**Addition:**

```typescript
// Cache autocomplete results
const cache = new Map<string, { data: T; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCached(key: string) {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  return null;
}
```

---

### 14. Cancel Previous Request (AbortController)

**Addition:**

```typescript
// use-search-suggestions.ts
const abortControllerRef = useRef<AbortController | null>(null>();

useEffect(() => {
  // Cancel previous request
  abortControllerRef.current?.abort();

  // Create new request
  abortControllerRef.current = new AbortController();

  fetch(url, { signal: abortControllerRef.current.signal })
    .catch((e) => {
      if (e.name === 'AbortError') return; // Ignore cancellation
      throw e;
    });
}, [debouncedQuery]);
```

---

### 15. Keyboard Navigation

**Addition:**

```typescript
// SearchAutocomplete keyboard support
onKeyDown={(e) => {
  switch (e.key) {
    case 'ArrowDown':
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, suggestions.length - 1));
      break;
    case 'ArrowUp':
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
      break;
    case 'Enter':
      if (suggestions[selectedIndex]) {
        onSuggestionClick(suggestions[selectedIndex]);
      }
      break;
    case 'Escape':
      setShowDropdown(false);
      break;
  }
}}
```

---

## 📊 Updated Scores

| Area               | Original | Revised |
| ------------------ | :------: | :-----: |
| Architecture       |  9.5/10  | 9.7/10  |
| Maintainability    |  9.5/10  | 9.7/10  |
| UX                 |  9.0/10  | 9.5/10  |
| Backend Alignment  |  7.5/10  | 9.5/10  |
| Performance        |  8.5/10  | 9.0/10  |
| Next.js App Router |  8.5/10  | 9.5/10  |
| Code Quality       |  8.0/10  | 9.5/10  |

**Revised Overall: 9.5/10**

---

## ✅ Checklist Before Implementation

- [ ] Hapus Store dari autocomplete scope
- [ ] Hapus Rating Filter
- [ ] Fix useSearch key variable bug
- [ ] Fix SearchHighlight regex bug
- [ ] Update SearchFacets menjadi optional/separate endpoint
- [ ] Ganti recent searches hook ke Zustand store
- [ ] Update SearchPage menjadi Server Component
- [ ] Buat SearchProductItem type
- [ ] Reuse pagination dari components/ui
- [ ] Simplify SearchSuggestion type
- [ ] Tambahkan Error Boundary states
- [ ] Tambahkan mobile Bottom Sheet untuk filters
- [ ] Tambahkan AbortController untuk request cancellation
- [ ] Tambahkan keyboard navigation
- [ ] Review dan approve

---

## 📝 Notes

1. **Backend Alignment Priority**: Pastikan semua features sync dengan backend Phase 1-5
2. **Incremental Enhancement**: Store Search dan Rating bisa ditambahkan saat backend ready
3. **Performance First**: AbortController dan caching adalah enhancement penting
4. **Accessibility**: Keyboard navigation harus ada di MVP
5. **Mobile First**: Bottom sheet untuk mobile, sidebar untuk desktop

---

**Status: 🔄 REVISION IN PROGRESS**

**Next Action: Update blueprint dengan revision notes ini**
