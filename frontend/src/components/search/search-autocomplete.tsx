'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Search, Package } from 'lucide-react';
import type { SearchSuggestion } from '@/types/search';

interface SearchAutocompleteProps {
  suggestions: SearchSuggestion[];
  query: string;
  isLoading: boolean;
  onSuggestionClick: (suggestion: SearchSuggestion) => void;
  onViewAll: () => void;
}

export function SearchAutocomplete({
  suggestions,
  query,
  isLoading,
  onSuggestionClick,
  onViewAll,
}: SearchAutocompleteProps) {
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const listRef = useRef<HTMLDivElement>(null);
  const prevSuggestionsLength = useRef(suggestions?.length ?? 0);

  // Reset selection when suggestions change
  useEffect(() => {
    if (suggestions?.length !== prevSuggestionsLength.current) {
      setSelectedIndex(-1);
      prevSuggestionsLength.current = suggestions?.length ?? 0;
    }
  }, [suggestions]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((i) => Math.min(i + 1, suggestions.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((i) => Math.max(i - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (selectedIndex >= 0 && suggestions[selectedIndex]) {
            onSuggestionClick(suggestions[selectedIndex]);
          } else {
            onViewAll();
          }
          break;
        case 'Escape':
          e.preventDefault();
          break;
      }
    },
    [selectedIndex, suggestions, onSuggestionClick, onViewAll],
  );

  if (isLoading) {
    return (
      <div className="p-4" role="status" aria-label="Loading suggestions">
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-8 bg-gray-100 rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (suggestions.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        Tidak ada saran untuk &quot;{query}&quot;
      </div>
    );
  }

  // Group suggestions
  const querySuggestions = suggestions.filter((s) => s.type === 'query');
  const productSuggestions = suggestions.filter((s) => s.type === 'product');

  return (
    <div ref={listRef} role="listbox" onKeyDown={handleKeyDown}>
      {querySuggestions.length > 0 && (
        <div className="p-4 pb-2">
          <p className="text-xs font-medium text-gray-500 uppercase mb-2">
            Saran
          </p>
          {querySuggestions.map((suggestion, index) => {
            const globalIndex = index;
            return (
              <button
                key={`query-${index}`}
                role="option"
                aria-selected={selectedIndex === globalIndex}
                className={`
                  w-full flex items-center gap-3 px-3 py-2 rounded-lg
                  transition-colors text-left
                  ${
                    selectedIndex === globalIndex
                      ? 'bg-primary-50 text-primary-600'
                      : 'hover:bg-gray-50'
                  }
                `}
                onClick={() => onSuggestionClick(suggestion)}
              >
                <Search className="w-4 h-4 text-gray-400" />
                <span>{suggestion.text}</span>
              </button>
            );
          })}
        </div>
      )}

      {productSuggestions.length > 0 && (
        <div className="p-4 border-t border-gray-100">
          <p className="text-xs font-medium text-gray-500 uppercase mb-2">
            Produk
          </p>
          {productSuggestions.slice(0, 4).map((suggestion, index) => {
            const globalIndex = querySuggestions.length + index;
            return (
              <button
                key={`product-${index}`}
                role="option"
                aria-selected={selectedIndex === globalIndex}
                className={`
                  w-full flex items-center gap-3 px-3 py-2 rounded-lg
                  transition-colors text-left
                  ${
                    selectedIndex === globalIndex
                      ? 'bg-primary-50 text-primary-600'
                      : 'hover:bg-gray-50'
                  }
                `}
                onClick={() => onSuggestionClick(suggestion)}
              >
                <Package className="w-4 h-4 text-gray-400" />
                <span className="flex-1 truncate">{suggestion.text}</span>
                {suggestion.count && (
                  <span className="text-xs text-gray-400">
                    {suggestion.count} produk
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      <div className="p-4 border-t border-gray-100">
        <button
          onClick={onViewAll}
          className="w-full flex items-center justify-center gap-2 py-2
                     bg-primary-50 text-primary-600 rounded-lg font-medium
                     hover:bg-primary-100 transition-colors"
        >
          Lihat semua hasil untuk &quot;{query}&quot;
        </button>
      </div>
    </div>
  );
}
