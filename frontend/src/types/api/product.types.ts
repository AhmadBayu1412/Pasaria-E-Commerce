// Product Types

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
  availableStock: number;
}

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
