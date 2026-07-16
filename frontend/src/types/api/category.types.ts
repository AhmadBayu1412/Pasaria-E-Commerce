// Category Types - for API responses

/**
 * API Error format
 */
export interface ApiError {
  code: string;
  message: string;
}

/**
 * Base API Response
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

/**
 * Category with product count (from API)
 */
export interface Category {
  id: number;
  name: string;
  icon: string;
  description: string;
  productCount: number;
}

/**
 * API Response for categories list
 */
export interface CategoriesResponse {
  success: boolean;
  data?: {
    items: Category[];
  };
  error?: ApiError;
}

/**
 * API Response for single category
 */
export interface CategoryResponse {
  success: boolean;
  data?: {
    category: Category;
  };
  error?: ApiError;
}
