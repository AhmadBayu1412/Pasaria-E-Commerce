/**
 * Search Store
 * Phase 6 Step 9 - Search Components
 * 
 * Zustand Store - HANYA untuk user preferences yang tidak masuk URL
 * 
 * URL adalah source of truth untuk:
 * - q (query)
 * - category
 * - page
 * - sortBy
 * - minPrice/maxPrice
 * - availability
 * 
 * Store adalah source of truth untuk:
 * - recentSearches
 * - isFilterOpen (UI state)
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const STORAGE_KEY = 'pasaria_search_state';
const MAX_RECENT_SEARCHES = 10;

interface SearchState {
  // Recent Searches (localStorage)
  recentSearches: string[];
  addRecentSearch: (query: string) => void;
  removeRecentSearch: (query: string) => void;
  clearRecentSearches: () => void;

  // UI State (in-memory only)
  isFilterOpen: boolean;
  setFilterOpen: (open: boolean) => void;
}

export const useSearchStore = create<SearchState>()(
  persist(
    (set) => ({
      // Recent Searches
      recentSearches: [],

      addRecentSearch: (query: string) => {
        if (!query.trim()) return;

        set((state) => {
          const filtered = state.recentSearches.filter(
            (q) => q.toLowerCase() !== query.toLowerCase(),
          );
          return {
            recentSearches: [query, ...filtered].slice(0, MAX_RECENT_SEARCHES),
          };
        });
      },

      removeRecentSearch: (query: string) => {
        set((state) => ({
          recentSearches: state.recentSearches.filter((q) => q !== query),
        }));
      },

      clearRecentSearches: () => {
        set({ recentSearches: [] });
      },

      // UI State - NOT persisted
      isFilterOpen: false,
      setFilterOpen: (open: boolean) => {
        set({ isFilterOpen: open });
      },
    }),
    {
      name: STORAGE_KEY,
      partialize: (state) => ({ recentSearches: state.recentSearches }),
    },
  ),
);
