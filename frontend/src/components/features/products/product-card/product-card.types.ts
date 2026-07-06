/**
 * Product Types
 */

export interface Product {
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

export interface Category {
  id: string;
  name: string;
  slug: string;
  productCount: number;
}

export type SortOption = 'newest' | 'price_asc' | 'price_desc' | 'popularity' | 'rating';

export interface ProductsResponse {
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
  };
}
