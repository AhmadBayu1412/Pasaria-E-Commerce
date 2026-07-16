/**
 * Category Service
 * Handles all category-related API calls
 */

import apiClient from './api-client';
import type { Category, CategoriesResponse, CategoryResponse } from '@/types/api/category.types';

export const categoryService = {
  /**
   * Get all categories with product count
   * Endpoint: GET /categories
   */
  async getCategories(): Promise<Category[]> {
    try {
      const response = await apiClient.get<CategoriesResponse>('/categories');
      const { success, data, error } = response.data;

      if (!success || !data?.items) {
        throw new Error(error?.message || 'Failed to fetch categories');
      }

      // Transform backend response to ensure proper typing
      return data.items.map((item) => ({
        id: item.id,
        name: item.name,
        icon: item.icon || '📦',
        description: item.description || '',
        productCount: item.productCount || 0,
      }));
    } catch (error) {
      console.error('[CategoryService] getCategories error:', error);
      throw error;
    }
  },

  /**
   * Get category by ID with product count
   * Endpoint: GET /categories/:id
   */
  async getCategoryById(id: number): Promise<Category> {
    try {
      const response = await apiClient.get<CategoryResponse>(`/categories/${id}`);
      const { success, data, error } = response.data;

      if (!success || !data?.category) {
        throw new Error(error?.message || 'Failed to fetch category');
      }

      return {
        id: data.category.id,
        name: data.category.name,
        icon: data.category.icon || '📦',
        description: data.category.description || '',
        productCount: data.category.productCount || 0,
      };
    } catch (error) {
      console.error('[CategoryService] getCategoryById error:', error);
      throw error;
    }
  },
} as const;

// Export error types
export enum CategoryError {
  NETWORK = 'NETWORK',
  NOT_FOUND = 'NOT_FOUND',
  UNKNOWN = 'UNKNOWN',
}

export const CATEGORY_ERROR_MESSAGES: Record<CategoryError, string> = {
  [CategoryError.NETWORK]: 'Koneksi terputus. Periksa internet Anda.',
  [CategoryError.NOT_FOUND]: 'Kategori tidak ditemukan.',
  [CategoryError.UNKNOWN]: 'Terjadi kesalahan. Silakan coba lagi.',
};

export function handleCategoryError(error: unknown): CategoryError {
  if (error instanceof Error) {
    if (error.message.includes('404')) return CategoryError.NOT_FOUND;
    if (
      error.message.includes('network') ||
      error.message.includes('fetch') ||
      error.message.includes('Failed to fetch')
    ) {
      return CategoryError.NETWORK;
    }
  }
  return CategoryError.UNKNOWN;
}
