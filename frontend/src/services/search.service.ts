/**
 * Search Service
 * Phase 6 Step 9 - Search Components
 */

import apiClient from './api-client';
import type {
  SearchQuery,
  SearchResult,
  SearchSuggestion,
} from '@/types/search';

interface GetSuggestionsOptions {
  signal?: AbortSignal;
}

export const searchService = {
  /**
   * Search products
   */
  async search(query: SearchQuery): Promise<SearchResult> {
    const response = await apiClient.get('/search', { params: query });
    return response.data;
  },

  /**
   * Get search suggestions (autocomplete)
   */
  async getSuggestions(
    query: string,
    options?: GetSuggestionsOptions,
  ): Promise<SearchSuggestion[]> {
    const response = await apiClient.get('/search/suggestions', {
      params: { q: query },
      signal: options?.signal,
    });
    return response.data;
  },

  /**
   * Get popular searches
   */
  async getPopularSearches(limit = 10): Promise<string[]> {
    const response = await apiClient.get('/search/popular', {
      params: { limit },
    });
    return response.data;
  },
};
