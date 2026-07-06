# Phase 6 Step 4 Blueprint: Product Detail Page

## Overview

Step 4 focuses on building the **Product Detail Page** - a critical page for e-commerce conversion. This page will challenge the Design System with complex interactions like image galleries, variant selection, and real-time stock.

> **Key Question:** Can the Design System handle complex product pages with variants, galleries, and dynamic stock, or do we need to extend it?

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
   - Rating and review count
   - Stock status (In Stock, Low Stock, Out of Stock)
   - Badges (New, Sale, Hot)

2. **Image Gallery**
   - Main image with zoom capability
   - Thumbnail navigation
   - Image lightbox/lightbox
   - Responsive image handling

3. **Variant Selection**
   - Color swatches
   - Size selection
   - Price/variant mapping
   - Stock per variant
   - Disabled variants when out of stock

4. **Add to Cart**
   - Quantity selector
   - Add to cart button
   - Wishlist toggle
   - Compare toggle

5. **Product Details Tabs**
   - Description
   - Specifications
   - Reviews
   - Shipping Info

6. **Related Products**
   - Carousel of related products
   - Same category products
   - Frequently bought together

7. **Social Sharing**
   - Share to social media
   - Copy link

### Non-Functional Requirements

1. **Performance**
   - First Contentful Paint < 1.5s
   - Largest Contentful Paint < 2.5s
   - Cumulative Layout Shift < 0.1
   - Image optimization with next/image

2. **Accessibility**
   - Keyboard navigation for gallery
   - Screen reader announcements for stock
   - Focus management on variant selection

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
│                    (Server Component)                      │
│                                                             │
│  ┌──────────────────┐  ┌────────────────────────────────┐  │
│  │  Image Gallery   │  │  Product Info                   │  │
│  │  (Client)        │  │  - Title, Price, Rating         │  │
│  │                  │  │  - Variant Selector              │  │
│  │  [thumb] [thumb] │  │  - Quantity + Add to Cart        │  │
│  │  [main image   ] │  │  - Wishlist, Compare            │  │
│  │  [    zoom      ] │  │                                 │  │
│  └──────────────────┘  └────────────────────────────────┘  │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  Product Tabs (Description, Specs, Reviews, Shipping)│  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  Related Products Carousel                          │  │
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
│   ├── variant-selector.tsx       # Variant selection
│   ├── variant-selector.types.ts
│   └── index.ts
├── quantity-selector/
│   ├── quantity-selector.tsx       # Quantity input
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
├── product-reviews/
│   ├── product-reviews.tsx
│   └── index.ts
└── related-products/
    ├── related-products.tsx         # Carousel
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
│  Client Components (Interactivity)                      │
│                                                          │
│  ProductGallery - Image switching, zoom                  │
│  VariantSelector - Color/size selection                 │
│  QuantitySelector - +/- buttons                         │
│  AddToCart - Add to cart action                        │
│  ProductTabs - Tab switching                           │
└─────────────────────────────────────────────────────────┘
```

---

## 3. Component Inventory

### 3.1 New Components Needed

| Component             | Purpose                        | Type           |
| --------------------- | ------------------------------ | -------------- |
| ProductGallery        | Image gallery with thumbnails  | Client         |
| ProductInfo           | Product details section        | Presentational |
| VariantSelector       | Color/size selection           | Client         |
| QuantitySelector      | Quantity input                 | Client         |
| AddToCart             | Add to cart button with states | Client         |
| ProductTabs           | Tabbed content display         | Client         |
| ProductSpecifications | Product specs table            | Presentational |
| ProductReviews        | Reviews list                   | Presentational |
| RelatedProducts       | Carousel of related items      | Presentational |
| ProductBreadcrumb     | Breadcrumb navigation          | Presentational |

### 3.2 Components from Design System

| Component | Usage                        |
| --------- | ---------------------------- |
| Button    | Add to cart, tabs, actions   |
| Badge     | Product badges, stock status |
| Card      | Related product cards        |
| Spinner   | Loading states               |
| Skeleton  | Loading skeletons            |
| Modal     | Image lightbox               |
| Toast     | Add to cart notification     |

### 3.3 Modifications to Design System

**Potential additions:**

1. **Badge** - Add `variant="outline"` for subtle badges
2. **Button** - Add `variant="danger"` for destructive actions
3. **Modal** - Consider adding `size="xl"` for image lightbox
4. **Toast** - Already implemented in Step 2

---

## 4. API Contract

### 4.1 Product Detail Response

```typescript
interface ProductDetailResponse {
  product: Product;
  relatedProducts: Product[];
  specifications: Specification[];
  reviews: ReviewSummary;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  sku: string;
  description: string;
  price: number;
  originalPrice?: number;
  images: ProductImage[];
  category: Category;
  variants: Variant[];
  rating: number;
  reviewCount: number;
  badges?: ('new' | 'sale' | 'hot')[];
  stock: number;
  specifications: Record<string, string>;
  shipping: ShippingInfo;
  createdAt: string;
  updatedAt: string;
}

interface ProductImage {
  id: string;
  url: string;
  alt: string;
  isPrimary: boolean;
}

interface Variant {
  id: string;
  type: 'color' | 'size';
  name: string;
  value: string; // e.g., "Red" or "XL"
  hexCode?: string; // For colors
  priceModifier: number; // Price adjustment
  stock: number;
  isAvailable: boolean;
}

interface Specification {
  label: string;
  value: string;
}

interface ShippingInfo {
  weight: number;
  dimensions: { length: number; width: number; height: number };
  shippingClass: string;
  estimatedDays: string;
  freeShipping: boolean;
}

interface ReviewSummary {
  average: number;
  total: number;
  distribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}
```

### 4.2 Cart API

```typescript
interface AddToCartRequest {
  productId: string;
  variantId?: string;
  quantity: number;
}

interface AddToCartResponse {
  success: boolean;
  cart: Cart;
  message?: string;
}

interface Cart {
  id: string;
  items: CartItem[];
  subtotal: number;
  itemCount: number;
}
```

---

## 5. URL Structure

```
/products/[slug]
    │
    ├── ?variant=[variantId]  (optional, for specific variant)
    └── ?tab=[tab]            (optional, for active tab)
```

---

## 6. SEO Strategy

### 6.1 Metadata

```typescript
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await fetchProduct(slug);

  return {
    title: `${product.name} - Pasaria`,
    description: product.description.slice(0, 160),
    openGraph: {
      title: product.name,
      description: product.description.slice(0, 160),
      images: [product.images[0].url],
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

### 6.2 Structured Data (JSON-LD)

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
    '@type': 'Offer',
    url: `/products/${product.slug}`,
    priceCurrency: 'IDR',
    price: product.price,
    availability:
      product.stock > 0
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
  },
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: product.rating,
    reviewCount: product.reviewCount,
  },
};
```

---

## 7. State Management

### 7.1 Client-Side State (React useState)

```typescript
// Variant selection
const [selectedVariants, setSelectedVariants] = useState<
  Record<string, Variant>
>({});

// Quantity
const [quantity, setQuantity] = useState(1);

// Active tab
const [activeTab, setActiveTab] = useState<
  'description' | 'specs' | 'reviews' | 'shipping'
>('description');

// Gallery index
const [activeImageIndex, setActiveImageIndex] = useState(0);

// Lightbox
const [isLightboxOpen, setIsLightboxOpen] = useState(false);
```

### 7.2 Cart State (Zustand)

```typescript
// cart.store.ts
interface CartState {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  addItem: (item: AddToCartRequest) => Promise<void>;
  removeItem: (productId: string, variantId?: string) => void;
  updateQuantity: (
    productId: string,
    variantId: string,
    quantity: number,
  ) => void;
  clearCart: () => void;
}
```

### 7.3 Wishlist State (Zustand)

```typescript
// wishlist.store.ts
interface WishlistState {
  items: string[]; // Product IDs
  toggleWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
}
```

---

## 8. Image Strategy

### 8.1 Main Gallery

```typescript
<Image
  src={currentImage.url}
  alt={currentImage.alt}
  fill
  priority={activeImageIndex === 0}
  sizes="(max-width: 768px) 100vw, 50vw"
  className="object-cover"
/>
```

### 8.2 Thumbnails

```typescript
<Image
  src={thumbnail.url}
  alt={thumbnail.alt}
  width={80}
  height={80}
  loading="lazy"
  className="object-cover rounded cursor-pointer"
/>
```

---

## 9. Loading States

### 9.1 Initial Load (SSR)

```
Server Component → fetchProduct() → Streaming → Suspense
```

### 9.2 Add to Cart

```
Click → Loading spinner on button → Success toast → Update cart count
```

### 9.3 Image Gallery

```
Click thumbnail → Skeleton on main image → New image
```

---

## 10. Error Handling

### 10.1 Product Not Found

```typescript
if (!product) {
  notFound(); // Calls Next.js notFound()
}
```

### 10.2 API Error

```typescript
// In Server Component
try {
  const product = await fetchProduct(slug);
} catch (error) {
  // Log error
  // Return error state or retry
}
```

### 10.3 Out of Stock

```typescript
// When adding to cart with no stock
if (selectedProduct.stock === 0) {
  toast.error('Produk sedang tidak tersedia');
  return;
}
```

---

## 11. Milestones

### Milestone 1: Page Structure

- [ ] Create dynamic route (`/products/[slug]`)
- [ ] Create page layout
- [ ] Add to navigation breadcrumb

### Milestone 2: Product Display

- [ ] Create ProductInfo component
- [ ] Create ProductGallery component
- [ ] Connect to API/mock data

### Milestone 3: Variant Selection

- [ ] Create VariantSelector component
- [ ] Implement color swatches
- [ ] Implement size selection
- [ ] Handle stock per variant

### Milestone 4: Add to Cart

- [ ] Create QuantitySelector component
- [ ] Create AddToCart component
- [ ] Integrate with cart store
- [ ] Show toast notification

### Milestone 5: Tabs & Details

- [ ] Create ProductTabs component
- [ ] Create ProductSpecifications
- [ ] Create ProductReviews (summary)

### Milestone 6: Related Products

- [ ] Create RelatedProducts component
- [ ] Create carousel navigation

### Milestone 7: SEO

- [ ] Add generateMetadata
- [ ] Add JSON-LD structured data
- [ ] Add Open Graph tags

### Milestone 8: Polish

- [ ] Loading skeletons
- [ ] Error states
- [ ] Responsive design
- [ ] Accessibility audit

---

## 12. Open Questions

1. **Image Storage**
   - Should we use external CDN?
   - What image optimization strategy?

2. **Review Loading**
   - Should reviews be loaded on demand?
   - How many reviews to show initially?

3. **Wishlist Persistence**
   - Local storage or database?
   - Sync across devices?

4. **Recently Viewed**
   - Should we track recently viewed products?
   - Where to display them?

5. **Social Sharing**
   - Which platforms to support?
   - Custom share text/images?

---

## 13. Verification Criteria

Step 4 is complete when:

- [ ] Product detail page loads with full product info
- [ ] Image gallery works with thumbnails and zoom
- [ ] Variant selection updates price and stock
- [ ] Quantity selector works correctly
- [ ] Add to cart adds item and shows toast
- [ ] Wishlist toggle works
- [ ] Tabs display correct content
- [ ] Related products carousel works
- [ ] SEO metadata is correct
- [ ] JSON-LD structured data is valid
- [ ] No TypeScript errors
- [ ] Build succeeds
- [ ] Basic accessibility passes

---

## 14. Dependencies

### From Previous Steps

- All Design System components
- All Product Listing components
- lib/format utilities
- lib/schemas

### New Components Needed

- Cart store (Zustand)
- Wishlist store (Zustand)
- Image lightbox (Modal enhancement)

### Future Dependencies

- React Query for client-side caching
- Testing libraries (Vitest, Testing Library)
- Storybook for documentation

---

**Prepared by:** AI Assistant  
**Blueprint Status:** Draft for Review  
**Next Step:** Implementation after blueprint approval
