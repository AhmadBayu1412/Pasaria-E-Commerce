/**
 * Search Types
 * Phase 6 Step 9 - Search Components
 */

// ============================================
// Search Query - stored in URL
// ============================================

export interface SearchQuery {
  q: string;
  category?: number;
  minPrice?: number;
  maxPrice?: number;
  availability: 'all' | 'in_stock';
  sortBy: SortOption;
  page: number;
  limit: number;
}

export type SortOption = 'relevance' | 'price_asc' | 'price_desc' | 'newest';

// ============================================
// Search Suggestions - Discriminated Union
// ============================================

export type SearchSuggestion = SearchQuerySuggestion | SearchProductSuggestion;

export interface SearchQuerySuggestion {
  type: 'query';
  text: string;
}

export interface SearchProductSuggestion {
  type: 'product';
  text: string;
  count?: number;
}

// ============================================
// Lightweight Search Result Item
// ============================================

export interface SearchProductItem {
  id: number;
  slug: string;
  name: string;
  thumbnail: string;
  price: number;
  originalPrice?: number;
  stock: number;
  categoryId: number;
}

// ============================================
// Search Result Response
// ============================================

export interface SearchResult {
  items: SearchProductItem[];
  total: number;
  page: number;
  totalPages: number;
  suggestions?: SearchSuggestion[];
}

// ============================================
// Search Facets (Optional - backend dependent)
// ============================================

export interface SearchFacets {
  categories?: FacetItem[];
  priceRange?: { min: number; max: number };
}

export interface FacetItem {
  value: number;
  label: string;
  count: number;
}

// ============================================
// Filter State
// ============================================

export interface SearchFilters {
  category?: number;
  minPrice?: number;
  maxPrice?: number;
  availability: 'all' | 'in_stock';
}
