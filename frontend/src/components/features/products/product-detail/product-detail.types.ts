/**
 * Product Detail Types
 */

export interface ProductImage {
  id: number;
  url: string;
  alt: string;
  isPrimary: boolean;
}

export interface ProductVariant {
  id: number;
  sku: string;
  attributes: {
    color?: string;
    colorHex?: string;
    size?: string;
    [key: string]: string | undefined;
  };
  price: number;
  stock: number;
  isAvailable: boolean;
  imageUrl?: string;
}

export interface ShippingInfo {
  weight: number;
  dimensions: { length: number; width: number; height: number };
  shippingClass: string;
  estimatedDays: string;
  freeShipping: boolean;
}

export interface Product {
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
  variants: ProductVariant[];
  totalStock: number;
  isAvailable: boolean;
  specifications: Record<string, string>;
  shipping: ShippingInfo;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  productCount: number;
}

export interface ProductListItem {
  id: number;
  name: string;
  slug: string;
  price: number;
  originalPrice?: number;
  primaryImage: string | null;
  badges?: ('new' | 'sale' | 'hot')[];
  isAvailable: boolean;
}

export interface ProductDetailResponse {
  product: Product;
  relatedProducts: ProductListItem[];
}

export type TabType = 'description' | 'specs' | 'shipping';
