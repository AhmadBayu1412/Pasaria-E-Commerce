// Product Service
// PEIA Audit: Fixed response wrapper handling

import apiClient from './api-client';
import type {
  Product,
  ProductListItem,
  ProductSearchParams,
} from '@/types/api';

// Backend response types - match actual backend structure
interface BackendProductResponse {
  success: boolean;
  data: Product;
}

interface BackendProductsResponse {
  success: boolean;
  data: Product[]; // Backend returns array directly, not wrapped in { items }
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
}

interface BackendSearchResponse {
  success: boolean;
  data: Product[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
}

export const productService = {
  /**
   * Get paginated products list
   * Endpoint: GET /products
   * Backend returns: { success, data: [...products], pagination }
   */
  async getProducts(params?: ProductSearchParams): Promise<{
    items: ProductListItem[];
    pagination: {
      page: number;
      limit: number;
      totalItems: number;
      totalPages: number;
    };
  }> {
    const response = await apiClient.get<BackendProductsResponse>('/products', {
      params,
    });

    // Transform backend response to frontend expected format
    const items = response.data.data.map((p) => ({
      id: p.id,
      slug: String(p.id), // Backend may not have slug
      name: p.name,
      price: p.price,
      primaryImage: null, // Backend may not return images
      isAvailable: p.availableStock > 0,
    }));

    return {
      items,
      pagination: response.data.pagination,
    };
  },

  /**
   * Search products
   * Endpoint: GET /products/search
   */
  async searchProducts(query: string): Promise<{ items: ProductListItem[]; total: number }> {
    const response = await apiClient.get<BackendSearchResponse>('/products/search', {
      params: { q: query },
    });

    const items = response.data.data.map((p) => ({
      id: p.id,
      slug: String(p.id),
      name: p.name,
      price: p.price,
      primaryImage: null,
      isAvailable: p.availableStock > 0,
    }));

    return {
      items,
      total: response.data.pagination.totalItems,
    };
  },

  /**
   * Get product by ID
   * Endpoint: GET /products/:id
   */
  async getProductById(id: number): Promise<Product> {
    const response = await apiClient.get<BackendProductResponse>(`/products/${id}`);
    return response.data.data;
  },

  /**
   * Get product by slug
   * Endpoint: GET /products/:id (backend accepts slug as id)
   */
  async getProductBySlug(slug: string): Promise<Product> {
    const response = await apiClient.get<BackendProductResponse>(`/products/${slug}`);
    return response.data.data;
  },
};
