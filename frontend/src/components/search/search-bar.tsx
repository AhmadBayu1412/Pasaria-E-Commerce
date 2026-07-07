'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Search, X, Clock } from 'lucide-react';
import { useSearchStore } from '@/store/search-store';
import { useSearchSuggestions } from '@/hooks/use-search-suggestions';
import { SearchAutocomplete } from './search-autocomplete';
import { cn } from '@/lib/cn';

interface SearchBarProps {
  defaultValue?: string;
  onSearch?: (query: string) => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
}

export function SearchBar({
  defaultValue = '',
  onSearch,
  placeholder = 'Cari produk, toko, atau kategori...',
  className,
  autoFocus = false,
}: SearchBarProps) {
  const [query, setQuery] = useState(defaultValue);
  const [isFocused, setIsFocused] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    recentSearches,
    addRecentSearch,
    removeRecentSearch,
    clearRecentSearches,
  } = useSearchStore();

  const { suggestions, isLoading } = useSearchSuggestions({
    query,
    enabled: isFocused && query.length >= 2,
  });

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (query.trim()) {
        addRecentSearch(query);
        onSearch?.(query);
        setShowDropdown(false);
        inputRef.current?.blur();
      }
    },
    [query, addRecentSearch, onSearch],
  );

  const handleRecentClick = useCallback(
    (recentQuery: string) => {
      setQuery(recentQuery);
      addRecentSearch(recentQuery);
      onSearch?.(recentQuery);
      setShowDropdown(false);
    },
    [addRecentSearch, onSearch],
  );

  const handleSuggestionClick = useCallback(
    (suggestion: { text: string }) => {
      setQuery(suggestion.text);
      addRecentSearch(suggestion.text);
      onSearch?.(suggestion.text);
      setShowDropdown(false);
    },
    [addRecentSearch, onSearch],
  );

  const handleClear = () => {
    setQuery('');
    inputRef.current?.focus();
  };

  const showRecent = isFocused && !query && recentSearches.length > 0;
  const showSuggestions = isFocused && query.length >= 2;

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <form onSubmit={handleSubmit} className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowDropdown(true);
          }}
          onFocus={() => {
            setIsFocused(true);
            setShowDropdown(true);
          }}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className="w-full pl-12 pr-12 py-3 rounded-full border border-gray-200
                     focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20
                     outline-none transition-all"
          role="combobox"
          aria-expanded={showDropdown}
          aria-autocomplete="list"
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full
                       hover:bg-gray-100 transition-colors"
            aria-label="Clear search"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        )}
      </form>

      {(showRecent || showSuggestions) && (
        <div
          className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl
                        shadow-xl border border-gray-100 overflow-hidden z-50"
        >
          {showRecent && (
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-500">
                  Pencarian Terakhir
                </span>
                <button
                  onClick={clearRecentSearches}
                  className="text-xs text-primary-600 hover:underline"
                >
                  Hapus Semua
                </button>
              </div>
              <div className="space-y-1">
                {recentSearches.slice(0, 5).map((recent, index) => (
                  <button
                    key={index}
                    onClick={() => handleRecentClick(recent)}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg
                               hover:bg-gray-50 transition-colors text-left"
                  >
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="flex-1">{recent}</span>
                    <X
                      className="w-4 h-4 text-gray-400 hover:text-gray-600"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeRecentSearch(recent);
                      }}
                      role="button"
                      aria-label={`Remove ${recent}`}
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          {showSuggestions && (
            <SearchAutocomplete
              suggestions={suggestions}
              query={query}
              isLoading={isLoading}
              onSuggestionClick={handleSuggestionClick}
              onViewAll={() => {
                addRecentSearch(query);
                onSearch?.(query);
                setShowDropdown(false);
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}
