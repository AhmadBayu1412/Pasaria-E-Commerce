'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Input } from '@/components/ui';
import { SEARCH_DEBOUNCE_MS } from '@/lib/constants';

/**
 * Search Input Component
 * 
 * Debounced search input with URL sync.
 */
export function SearchInput() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(searchParams.get('q') || '');
  const searchQuery = searchParams.get('q') || '';

  // Debounced search
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (value !== searchQuery) {
        const params = new URLSearchParams(searchParams.toString());
        if (value) {
          params.set('q', value);
        } else {
          params.delete('q');
        }
        params.set('page', '1');
        router.push(`/products?${params.toString()}`);
      }
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timeout);
  }, [value, searchQuery, searchParams, router]);

  return (
    <div className="w-full max-w-md">
      <Input
        type="search"
        placeholder="Cari produk..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
        aria-label="Search products"
      />
    </div>
  );
}
