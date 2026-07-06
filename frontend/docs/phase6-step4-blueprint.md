# Phase 6 Step 4 Blueprint: Product Detail Page (REVISED)

## Overview

Step 4 focuses on building the **Product Detail Page** - a critical page for e-commerce conversion. This page will validate the Design System from Step 2 with complex interactions like image galleries, variant selection, and real-time stock.

> **Key Changes from Original:**
>
> - Removed Review System (no backend module)
> - Changed Variant model to SKU/combination-based
> - Removed duplicate stock fields
> - Simplified Related Products (grid, not carousel)
> - Removed Compare/Wishlist (backend TBD)
> - Added testing requirements
> - Added accessibility checklist

---

## Context

### Previous Steps

- **Step 1:** Frontend foundation (Next.js 15, TypeScript, Zustand, folder structure)
- **Step 2:** Design System (Tokens, UI Components, Layout Components)
- **Step 3:** Product Listing Page (Filtering, Search, Pagination, URL State)

### Next Steps After This

- **Step 5:** Cart & Checkout Flow
- **Step 6:** User Authentication UI
- **Step 7:** Order Management UI
- **Step 8:** Admin Dashboard
- **Step 9:** Search & Filter Components (Advanced)
- **Step 10:** Performance Optimization & Final Review

---

## 1. Page Requirements

### Functional Requirements

1. **Product Information Display**
   - Product name, description, SKU
   - Price with discount calculation
   - Rating display (read-only, no review submission)
   - Stock status (In Stock, Low Stock, Out of Stock)
   - Badges (New, Sale, Hot)

2. **Image Gallery (MVP)**
   - Main image display
   - Thumbnail navigation (click to switch)
   - Responsive image handling
   - NOTE: Zoom/Lightbox deferred to Step 10

3. **Variant Selection**
   - Color swatches
   - Size selection
   - Each variant is a SKU with:
     - Unique combination of attributes (color + size)
     - Own price, stock, and SKU code
   - Disabled variants when out of stock

4. **Add to Cart**
   - Quantity selector with bounds (min=1, max=stock)
   - Add to cart button with loading state
   - Toast notification on success
   - NOTE: Compare/Wishlist removed (backend TBD)

5. **Product Details Tabs**
   - Description
   - Specifications
   - Shipping Info
   - NOTE: Reviews = "Coming Soon" placeholder

6. **Related Products**
   - Grid layout (4 items)
   - Reuses ProductCard from Step 3
   - NOTE: Carousel deferred to Step 10

### Non-Functional Requirements

1. **Performance**
   - First Contentful Paint < 1.5s
   - Largest Contentful Paint < 2.5s
   - Cumulative Layout Shift < 0.1
   - Image optimization with next/image

2. **Accessibility** (Quality Gate)
   - Keyboard navigation for gallery (arrow keys)
   - Screen reader announcements for stock changes
   - Focus management on variant selection
   - ESC to close any overlay
   - ARIA live regions for dynamic content

3. **SEO**
   - Per-product metadata
   - Structured data (JSON-LD)
   - Open Graph images
   - Canonical URL

---

## 2. Architecture Decisions

### 2.1 Page Structure

```
┌─────────────────────────────────────────────────────────────┐
│                    ProductDetailPage                        │
│                    (Server Component)                       │
│                                                             │
│  Breadcrumb (Back to products)                              │
│                                                             │
│  ┌──────────────────┐  ┌────────────────────────────────┐  │
│  │  Image Gallery   │  │  Product Info                   │  │
│  │  (Client)        │  │  - Title, Price, Rating         │  │
│  │                  │  │  - Variant Selector              │  │
│  │  [thumb] [thumb] │  │  - Quantity + Add to Cart        │  │
│  │  [main image   ] │  │                                 │  │
│  └──────────────────┘  └────────────────────────────────┘  │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  Product Tabs (#description, #specs, #shipping)       │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  Related Products (Grid 2x2)                         │  │
│  └─────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Component Architecture

```
src/components/features/products/product-detail/
├── product-detail.tsx              # Main page wrapper
├── product-detail.types.ts          # Types
├── product-gallery/
│   ├── product-gallery.tsx         # Main gallery component
│   ├── product-gallery.types.ts
│   └── index.ts
├── product-info/
│   ├── product-info.tsx            # Product info section
│   ├── product-info.types.ts
│   └── index.ts
├── variant-selector/
│   ├── variant-selector.tsx        # Variant selection
│   ├── variant-selector.types.ts
│   └── index.ts
├── quantity-selector/
│   ├── quantity-selector.tsx        # Quantity input with bounds
│   ├── quantity-selector.types.ts
│   └── index.ts
├── product-tabs/
│   ├── product-tabs.tsx            # Tabbed content
│   ├── product-tabs.types.ts
│   └── index.ts
├── add-to-cart/
│   ├── add-to-cart.tsx             # Add to cart button
│   ├── add-to-cart.types.ts
│   └── index.ts
├── product-specifications/
│   ├── product-specifications.tsx
│   └── index.ts
└── related-products/
    ├── related-products.tsx         # Grid (not carousel)
    └── index.ts
```

### 2.3 Data Flow

```
URL: /products/[slug]
          │
          ▼
┌─────────────────────────────────────────────────────────┐
│  generateMetadata()                                     │
│  - Generate SEO metadata                                │
│  - Generate JSON-LD structured data                     │
└─────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────┐
│  ProductDetailPage (Server Component)                   │
│                                                          │
│  fetchProduct(slug)                                      │
│    └─► API call with revalidation                       │
│                                                          │
│  fetchRelatedProducts(categoryId)                         │
│    └─► API call                                         │
└─────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────┐
│  Client Components (Interactivity)                       │
│                                                          │
│  ProductGallery - Image switching                        │
│  VariantSelector - SKU selection                        │
│  QuantitySelector - +/- with bounds                     │
│  AddToCart - Add to cart action                         │
│  ProductTabs - Tab switching                            │
└─────────────────────────────────────────────────────────┘
```

---

## 3. Component Inventory

### 3.1 New Components Needed

| Component             | Purpose                        | Type           |
| --------------------- | ------------------------------ | -------------- |
| ProductGallery        | Image gallery with thumbnails  | Client         |
| ProductInfo           | Product details section        | Presentational |
| VariantSelector       | SKU/variant selection          | Client         |
| QuantitySelector      | Quantity input with bounds     | Client         |
| AddToCart             | Add to cart button with states | Client         |
| ProductTabs           | Tabbed content display         | Client         |
| ProductSpecifications | Product specs table            | Presentational |
| RelatedProducts       | Grid of related items (2x2)    | Presentational |
| ProductBreadcrumb     | Breadcrumb navigation          | Presentational |
| ReviewsPlaceholder    | "Coming Soon" for reviews      | Presentational |

### 3.2 Components from Design System

| Component | Usage                        |
| --------- | ---------------------------- |
| Button    | Add to cart, tabs, actions   |
| Badge     | Product badges, stock status |
| Card      | Related product cards        |
| Spinner   | Loading states               |
| Skeleton  | Loading skeletons            |
| Toast     | Add to cart notification     |

### 3.3 Removed from Scope

- ~~Compare Toggle~~ (no backend module)
- ~~Wishlist Toggle~~ (backend TBD - local storage optional)
- ~~Lightbox/Zoom~~ (Step 10 enhancement)
- ~~Reviews Tab Content~~ (Coming Soon placeholder)

---

## 4. API Contract

### 4.1 Product Detail Response

```typescript
interface ProductDetailResponse {
  product: Product;
  relatedProducts: ProductListItem[];
}

interface Product {
  id: number;
  name: string;
  slug: string;
  sku: string;
  description: string;
  price: number;
  originalPrice?: number;
  images: ProductImage[];
  category: Category;
  rating: number;
  reviewCount: number;
  badges?: ('new' | 'sale' | 'hot')[];

  // Variants as SKUs - each combination has own price/stock
  variants: ProductVariant[];

  // Aggregated for display (not source of truth)
  totalStock: number;
  isAvailable: boolean;

  specifications: Record<string, string>;
  shipping: ShippingInfo;

  createdAt: string;
  updatedAt: string;
}

interface ProductImage {
  id: number;
  url: string;
  alt: string;
  isPrimary: boolean;
}

// SKU-based variant model
interface ProductVariant {
  id: number;
  sku: string;

  // Attributes that define this SKU
  attributes: {
    color?: string;
    colorHex?: string;
    size?: string;
    // Extensible for future attributes
    [key: string]: string | undefined;
  };

  // Stock and price for this specific SKU
  price: number; // Can differ per SKU
  stock: number; // Stock at SKU level

  // Availability
  isAvailable: boolean; // computed: stock > 0

  // Image mapping (optional - some products use same images)
  imageUrl?: string;
}

interface ShippingInfo {
  weight: number;
  dimensions: { length: number; width: number; height: number };
  shippingClass: string;
  estimatedDays: string;
  freeShipping: boolean;
}

// Lightweight for related products
interface ProductListItem {
  id: number;
  name: string;
  slug: string;
  price: number;
  originalPrice?: number;
  primaryImage: string | null;
  badges?: ('new' | 'sale' | 'hot')[];
  isAvailable: boolean;
}
```

### 4.2 Cart API (from Step 1)

```typescript
interface AddToCartRequest {
  productId: number;
  variantId?: number; // SKU ID
  quantity: number;
}

interface AddToCartResponse {
  success: boolean;
  cart: Cart;
  message?: string;
}
```

### 4.3 API Endpoints

```
GET /products/:slug
  Response: ProductDetailResponse
  Errors: NOT_FOUND

GET /products?category=:categoryId&limit=4
  Response: { items: ProductListItem[], total }
  (for related products)
```

---

## 5. URL Structure

```
/products/[slug]
    │
    ├── #description    (hash for tab)
    ├── #specifications (hash for tab)
    └── #shipping       (hash for tab)
```

---

## 6. State Management

### 6.1 Client-Side State (React useState)

```typescript
// Selected SKU (single source of truth for price/stock/image)
const [selectedSku, setSelectedSku] = useState<ProductVariant | null>(null);

// Quantity with bounds
const [quantity, setQuantity] = useState(1);

// Active tab (synced with URL hash)
const [activeTab, setActiveTab] = useState<
  'description' | 'specs' | 'shipping'
>('description');

// Gallery index
const [activeImageIndex, setActiveImageIndex] = useState(0);

// Stock validation (for race conditions)
const [currentStock, setCurrentStock] = useState<number>(0);
```

### 6.2 selectedSku Default Rule

```typescript
// On page load, auto-select first available SKU
useEffect(() => {
  if (variants.length > 0) {
    const firstAvailable = variants.find((v) => v.isAvailable);
    if (firstAvailable) {
      setSelectedSku(firstAvailable);
      setCurrentStock(firstAvailable.stock);
    } else {
      // All variants out of stock
      setSelectedSku(null);
      setCurrentStock(0);
    }
  }
}, [variants]);

// SKU selection handler
const handleSkuSelect = (sku: ProductVariant) => {
  setSelectedSku(sku);
  setCurrentStock(sku.stock);

  // Auto-adjust quantity if exceeds new stock
  if (quantity > sku.stock) {
    setQuantity(Math.max(1, sku.stock));
  }

  // If SKU has own image, switch gallery
  if (sku.imageUrl) {
    setActiveImageIndex(-1); // Special index for SKU image
  }
};
```

### 6.2 Quantity Selector Rules

```typescript
interface QuantityBounds {
  minimum: 1;
  maximum: currentStock; // from selectedSku

  // Disable conditions
  canIncrement: quantity < currentStock;
  canDecrement: quantity > 1;
}
```

### 6.3 Cart State (Zustand - from Step 1)

```typescript
// cart-store.ts (already exists)
interface CartStore {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  addItem: (item: AddToCartRequest) => Promise<void>;
  removeItem: (variantId: number) => void;
  updateQuantity: (variantId: number, quantity: number) => void;
  clearCart: () => void;
}
```

### 6.4 Wishlist State (Future - NOT in this step)

```typescript
// Deferred to future step when backend confirms
// Option A: localStorage only
// Option B: Backend API endpoint

// DO NOT implement wishlist.store in this step
```

---

## 7. SEO Strategy

### 7.1 Metadata

```typescript
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { product } = await fetchProduct(slug);

  return {
    title: `${product.name} - Pasaria`,
    description: truncate(product.description, 160),
    openGraph: {
      title: product.name,
      description: truncate(product.description, 160),
      images: product.images.map((img) => ({ url: img.url })),
      type: 'og:product',
      product: {
        price: {
          amount: product.price,
          currency: 'IDR',
        },
      },
    },
    alternates: {
      canonical: `/products/${product.slug}`,
    },
  };
}
```

### 7.2 Structured Data (JSON-LD)

```typescript
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Product',
  name: product.name,
  description: product.description,
  sku: product.sku,
  image: product.images.map((img) => img.url),
  brand: {
    '@type': 'Brand',
    name: 'Pasaria',
  },
  offers: {
    '@type': 'AggregateOffer',
    url: `/products/${product.slug}`,
    priceCurrency: 'IDR',
    lowPrice: getLowestPrice(product.variants),
    highPrice: getHighestPrice(product.variants),
    availability: product.isAvailable
      ? 'https://schema.org/InStock'
      : 'https://schema.org/OutOfStock',
  },
  aggregateRating:
    product.reviewCount > 0
      ? {
          '@type': 'AggregateRating',
          ratingValue: product.rating,
          reviewCount: product.reviewCount,
        }
      : undefined,
};
```

---

## 8. Image Strategy

### 8.1 Main Gallery

```typescript
<Image
  src={currentImage?.url || '/placeholder.png'}
  alt={currentImage?.alt || product.name}
  fill
  priority={activeImageIndex === 0}
  sizes="(max-width: 768px) 100vw, 50vw"
  className="object-cover"
/>
```

### 8.2 Thumbnails

```typescript
{images.map((image, index) => (
  <button
    key={image.id}
    onClick={() => setActiveImageIndex(index)}
    aria-label={`View image ${index + 1}`}
    aria-current={index === activeImageIndex}
  >
    <Image
      src={image.url}
      alt={image.alt}
      width={80}
      height={80}
      loading="lazy"
      className={cn(
        "object-cover rounded cursor-pointer border-2 transition",
        index === activeImageIndex
          ? "border-primary-500"
          : "border-transparent hover:border-secondary-200"
      )}
    />
  </button>
))}
```

### 8.3 Gallery Keyboard Navigation

```typescript
// Arrow key navigation
const handleKeyDown = (e: React.KeyboardEvent) => {
  if (e.key === 'ArrowLeft') {
    setActiveImageIndex((i) => Math.max(0, i - 1));
  } else if (e.key === 'ArrowRight') {
    setActiveImageIndex((i) => Math.min(images.length - 1, i + 1));
  }
};
```

---

## 9. Error Handling

### 9.1 Product Not Found

```typescript
if (!product) {
  notFound();
}
```

### 9.2 Add to Cart - Race Condition Handling

```typescript
const handleAddToCart = async () => {
  try {
    await addToCart({
      productId: product.id,
      variantId: selectedSku?.id,
      quantity,
    });
    toast.success('Ditambahkan ke keranjang');
  } catch (error) {
    // Handle race condition: stock changed
    if (error.code === 'OUT_OF_STOCK') {
      toast.error('Stok produk telah berubah');
      // Refresh stock from server
      const { product: updated } = await fetchProduct(slug);
      setCurrentStock(
        updated.variants.find((v) => v.id === selectedSku?.id)?.stock || 0,
      );
    } else {
      toast.error('Gagal menambahkan ke keranjang');
    }
  }
};
```

### 9.3 Out of Stock States

```typescript
// Variant out of stock
const isVariantAvailable = variant.isAvailable;

// Product completely out of stock
if (product.totalStock === 0) {
  return <OutOfStockBanner />;
}
```

---

## 10. Accessibility Checklist (Quality Gate)

### 10.1 Keyboard Navigation

- [ ] Tab order: Gallery → Variants → Quantity → Add to Cart → Tabs
- [ ] Arrow keys: Navigate gallery thumbnails
- [ ] Enter/Space: Select variant
- [ ] +/-: Adjust quantity
- [ ] Tab: Move between tabs

### 10.2 Screen Reader Support

- [ ] `aria-label` on gallery thumbnails
- [ ] `aria-current="true"` on active thumbnail
- [ ] `aria-live="polite"` on stock status
- [ ] `role="tablist"` and `role="tab"` on tabs
- [ ] `aria-selected` on selected variants
- [ ] `aria-disabled` on unavailable variants

### 10.3 Focus Management

- [ ] Focus ring visible on all interactive elements
- [ ] Focus trapped in modals (if any)
- [ ] Focus moves logically after actions

### 10.4 Dynamic Content

- [ ] Stock changes announced via aria-live
- [ ] Price changes announced
- [ ] Add to cart success/failure announced

---

## 11. Testing Requirements

### 11.1 Component Tests (Vitest + RTL)

```typescript
// product-gallery.test.tsx
describe('ProductGallery', () => {
  it('renders all images as thumbnails');
  it('changes main image on thumbnail click');
  it('navigates with arrow keys');
  it('has correct ARIA labels');
});

// variant-selector.test.tsx
describe('VariantSelector', () => {
  it('renders color swatches');
  it('renders size buttons');
  it('disables unavailable variants');
  it('updates price when variant selected');
  it('announces selection to screen readers');
});

// quantity-selector.test.tsx
describe('QuantitySelector', () => {
  it('starts at minimum value');
  it('increments quantity');
  it('decrements quantity');
  it('respects maximum bound');
  it('respects minimum bound');
  it('disables buttons at bounds');
});

// add-to-cart.test.tsx
describe('AddToCart', () => {
  it('shows loading state on click');
  it('calls addToCart with correct params');
  it('shows success toast on success');
  it('shows error toast on failure');
  it('is disabled when out of stock');
});

// product-tabs.test.tsx
describe('ProductTabs', () => {
  it('renders all tabs');
  it('switches content on click');
  it('updates URL hash');
});
```

### 11.2 Integration Tests

```typescript
// product-detail.integration.test.tsx
describe('Product Detail Flow', () => {
  it('loads product data from API');
  it('updates stock when variant changes');
  it('adds item to cart');
  it('handles out of stock gracefully');
});
```

### 11.3 SEO Tests

```typescript
describe('SEO', () => {
  it('generates correct metadata');
  it('includes JSON-LD structured data');
  it('has correct canonical URL');
  it('has Open Graph tags');
});
```

---

## 12. Milestones

### Milestone 1: Page Structure

- [ ] Create dynamic route (`/products/[slug]`)
- [ ] Create page layout
- [ ] Add breadcrumb
- [ ] Create loading skeleton
- [ ] Create 404 page

### Milestone 2: Product Display

- [ ] Create ProductInfo component
- [ ] Create ProductGallery component (MVP: thumbnails only, no zoom/lightbox)
- [ ] Connect to API/mock data

### Milestone 3: Variant Selection

- [ ] Create VariantSelector component
- [ ] Implement SKU-based model (color + size attributes)
- [ ] Handle stock per SKU
- [ ] Update price based on selected SKU

### Milestone 4: Add to Cart

- [ ] Create QuantitySelector with bounds
- [ ] Create AddToCart component
- [ ] Integrate with cart store
- [ ] Show toast notification
- [ ] Handle race conditions

### Milestone 5: Tabs & Details

- [ ] Create ProductTabs component
- [ ] Create ProductSpecifications
- [ ] Create ReviewsPlaceholder ("Coming Soon")

### Milestone 6: Related Products

- [ ] Create RelatedProducts component (grid layout, not carousel)
- [ ] Reuse ProductCard from Step 3

### Milestone 7: SEO

- [ ] Add generateMetadata
- [ ] Add JSON-LD structured data
- [ ] Add Open Graph tags

### Milestone 8: Polish & Accessibility

- [ ] Loading skeletons
- [ ] Error states
- [ ] Responsive design
- [ ] Accessibility audit (keyboard nav, screen reader, focus management)

### Milestone 9: Testing

- [ ] Component unit tests (Gallery, Variant, Quantity, AddToCart, Tabs)
- [ ] Integration tests
- [ ] SEO validation tests

---

## 13. Edge Cases

### 13.1 Variant Edge Cases

- [ ] Product with no variants (simple product)
- [ ] Product with only color variants
- [ ] Product with only size variants
- [ ] All variants out of stock → selectedSku = null
- [ ] Some variants out of stock (disable, don't hide)
- [ ] Invalid variant ID in URL

### 13.2 Stock Edge Cases

- [ ] Stock changes between page load and add to cart
- [ ] Quantity exceeds stock on add to cart
- [ ] Concurrent add to cart from multiple tabs
- [ ] Stock = 0 on page load
- [ ] Stock becomes 0 after selection → auto-adjust quantity to max available

### 13.3 Image Edge Cases

- [ ] No images (use placeholder)
- [ ] Single image (hide thumbnails)
- [ ] Very large images (handled by next/image)
- [ ] SKU with own image → use SKU image instead of global images

### 13.4 URL Edge Cases

- [ ] Invalid slug (404)
- [ ] Valid slug but product inactive (404)
- [ ] Valid slug but product deleted/archived (404)
- [ ] Hash navigation (#description, #specs, #shipping)
- [ ] Tab click updates hash → refresh page preserves tab

### 13.5 Product Status Edge Cases

All below result in 404:

- [ ] Product inactive
- [ ] Product deleted (soft delete)
- [ ] Product archived

---

## 14. Files to Create

```
src/app/products/[slug]/
├── page.tsx                    # Server Component + generateMetadata
├── loading.tsx                 # Skeleton
└── not-found.tsx               # 404

src/components/features/products/product-detail/
├── product-detail.tsx          # Main wrapper
├── product-detail.types.ts     # Types
├── product-gallery/
│   ├── product-gallery.tsx
│   ├── product-gallery.types.ts
│   └── index.ts
├── product-info/
│   ├── product-info.tsx
│   ├── product-info.types.ts
│   └── index.ts
├── variant-selector/
│   ├── variant-selector.tsx
│   ├── variant-selector.types.ts
│   └── index.ts
├── quantity-selector/
│   ├── quantity-selector.tsx
│   ├── quantity-selector.types.ts
│   └── index.ts
├── add-to-cart/
│   ├── add-to-cart.tsx
│   ├── add-to-cart.types.ts
│   └── index.ts
├── product-tabs/
│   ├── product-tabs.tsx
│   ├── product-tabs.types.ts
│   └── index.ts
├── product-specifications/
│   ├── product-specifications.tsx
│   └── index.ts
├── reviews-placeholder/
│   ├── reviews-placeholder.tsx
│   └── index.ts
└── related-products/
    ├── related-products.tsx
    └── index.ts

src/components/features/products/api/
├── product-detail.server.ts    # Server-side data fetching
└── index.ts
```

---

## 15. Verification Criteria

Step 4 is complete when:

### Functional

- [ ] Product detail page loads with full product info
- [ ] Image gallery works with thumbnails
- [ ] Variant selection updates price and stock (SKU-based model)
- [ ] Quantity selector respects min/max bounds
- [ ] Add to cart adds item and shows toast
- [ ] Tabs display correct content
- [ ] Reviews shows "Coming Soon" placeholder
- [ ] Related products grid displays (2x2)

### Non-Functional

- [ ] SEO metadata is correct
- [ ] JSON-LD structured data is valid
- [ ] No TypeScript errors
- [ ] Build succeeds
- [ ] All accessibility checklist items pass

### Testing

- [ ] Component tests pass (Gallery, Variant, Quantity, AddToCart, Tabs)
- [ ] Integration tests pass
- [ ] SEO validation pass

---

## 16. Dependencies

### From Previous Steps

- All Design System components (Step 2)
- ProductCard component (Step 3)
- Cart store (Step 1)
- lib/format utilities (Step 3)

### From Backend (Phase 1-5)

- GET /products/:slug endpoint
- POST /cart/items endpoint

### Not Included (Future Steps)

- ~~Wishlist store~~ (backend TBD)
- ~~Compare toggle~~ (no backend)
- ~~Lightbox/Zoom~~ (Step 10)
- ~~Reviews submission~~ (future backend module)
- ~~Carousel for related products~~ (Step 10)

---

## 17. Revision Summary

| Item | Change                                 | Priority |
| ---- | -------------------------------------- | -------- |
| R1   | Remove Review System, add placeholder  | HIGH     |
| R2   | Change Variant to SKU-based model      | HIGH     |
| R3   | Remove duplicate Product.stock         | HIGH     |
| R4   | Remove Compare toggle                  | HIGH     |
| R5   | Wishlist - decision deferred           | MEDIUM   |
| R6   | Related Products = Grid (not carousel) | MEDIUM   |
| R7   | Quantity bounds (min=1, max=stock)     | MEDIUM   |
| R8   | URL hash for tabs (#description, etc)  | MEDIUM   |
| R9   | Add selectedSku state                  | MEDIUM   |
| R10  | Race condition handling                | MEDIUM   |
| R11  | Full accessibility checklist           | MEDIUM   |
| R12  | Add testing requirements               | MEDIUM   |
| R13  | Simplify API contract                  | LOW      |
| R14  | Lightbox deferred to Step 10           | LOW      |

---

**Prepared by:** AI Assistant  
**Revision Date:** July 6, 2026  
**Blueprint Status:** Revised based on review feedback  
**Target Score:** 9.6-9.8 / 10
