// Product Types
// Match backend ProductResponseDTO structure

export interface ProductImage {
  id: number;
  url: string;
  alt?: string;
  isPrimary?: boolean;
}

export interface ProductInventory {
  stock: number;
  availableStock: number;
  reservedStock?: number;
}

export interface Product {
  id: number;
  slug?: string;
  name: string;
  description: string;
  price: number;
  availableStock: number;
  reservedStock?: number;
  totalStock?: number;
  sellerId?: number;
  categoryId?: number;
  images?: ProductImage[];
  inventory?: ProductInventory;
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
