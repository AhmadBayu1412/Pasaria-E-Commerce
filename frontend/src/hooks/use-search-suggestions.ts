'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useDebounce } from './use-debounce';
import { searchService } from '@/services/search.service';
import type { SearchSuggestion } from '@/types/search';

interface UseSearchSuggestionsProps {
  query: string;
  enabled?: boolean;
}

export function useSearchSuggestions({
  query,
  enabled = true,
}: UseSearchSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const fetchRef = useRef<() => void>(() => {});

  const debouncedQuery = useDebounce(query, 200);

  const fetchSuggestions = useCallback(async () => {
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    if (!debouncedQuery.trim() || debouncedQuery.length < 2) {
      setSuggestions([]);
      setIsLoading(false);
      return;
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    setIsLoading(true);
    setError(null);

    try {
      const results = await searchService.getSuggestions(debouncedQuery, {
        signal: abortControllerRef.current.signal,
      });
      setSuggestions(results);
    } catch (err) {
      // Ignore AbortError
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }
      setError((err as Error).message);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, [debouncedQuery]);

  // Store the fetch function in ref
  fetchRef.current = fetchSuggestions;

  useEffect(() => {
    if (enabled) {
      fetchRef.current();
    }

    // Cleanup: cancel request on unmount
    return () => {
      abortControllerRef.current?.abort();
    };
  }, [enabled, fetchSuggestions]);

  return {
    suggestions,
    isLoading,
    error,
  };
}
