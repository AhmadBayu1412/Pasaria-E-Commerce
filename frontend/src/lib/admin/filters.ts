/**
 * Admin Filter Objects
 * Typed filter objects for each domain
 */

import type { OrderStatus } from '@/types/api';

/**
 * Order Filter
 */
export interface OrderFilter {
  status?: OrderStatus[];
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  userId?: number;
  minAmount?: number;
  maxAmount?: number;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'total' | 'status';
  sortOrder?: 'asc' | 'desc';
}

export const DEFAULT_ORDER_FILTER: OrderFilter = {
  page: 1,
  limit: 20,
  sortBy: 'createdAt',
  sortOrder: 'desc',
};

/**
 * Product Filter
 */
export interface ProductFilter {
  category?: number[];
  status?: 'all' | 'active' | 'inactive';
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  stockStatus?: 'all' | 'in_stock' | 'low_stock' | 'out_of_stock';
  page?: number;
  limit?: number;
  sortBy?: 'name' | 'price' | 'createdAt' | 'stock';
  sortOrder?: 'asc' | 'desc';
}

export const DEFAULT_PRODUCT_FILTER: ProductFilter = {
  status: 'all',
  page: 1,
  limit: 20,
  sortBy: 'createdAt',
  sortOrder: 'desc',
};

/**
 * User Filter
 */
export interface UserFilter {
  role?: 'all' | 'customer' | 'admin';
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  hasOrders?: boolean;
  page?: number;
  limit?: number;
  sortBy?: 'name' | 'email' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export const DEFAULT_USER_FILTER: UserFilter = {
  role: 'all',
  page: 1,
  limit: 20,
  sortBy: 'createdAt',
  sortOrder: 'desc',
};
