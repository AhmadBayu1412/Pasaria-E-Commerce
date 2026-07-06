// Product Service

import apiClient from './api-client';
import type {
  Product,
  ProductListItem,
  ProductSearchParams,
  PaginatedResponse,
} from '@/types/api';

export const productService = {
  /**
   * Get paginated products list
   */
  async getProducts(params?: ProductSearchParams): Promise<PaginatedResponse<ProductListItem>> {
    const response = await apiClient.get<PaginatedResponse<ProductListItem>>('/products', {
      params,
    });
    return response.data;
  },

  /**
   * Search products
   */
  async searchProducts(query: string): Promise<{ items: ProductListItem[]; total: number }> {
    const response = await apiClient.get<{ items: ProductListItem[]; total: number }>(
      '/products/search',
      { params: { q: query } }
    );
    return response.data;
  },

  /**
   * Get product by ID
   */
  async getProductById(id: number): Promise<Product> {
    const response = await apiClient.get<{ product: Product }>(`/products/${id}`);
    return response.data.product;
  },

  /**
   * Get product by slug
   */
  async getProductBySlug(slug: string): Promise<Product> {
    const response = await apiClient.get<{ product: Product }>(`/products/${slug}`);
    return response.data.product;
  },
};
