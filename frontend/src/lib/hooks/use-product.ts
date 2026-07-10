'use client';

/**
 * Product Hooks
 * Data fetching hooks for product-related operations
 */

import { useState, useEffect, useCallback } from 'react';
import { productService } from '@/services/product.service';
import type { Product, ProductListItem } from '@/types/api';

interface UseProductBySlugResult {
  product: Product | null;
  isLoading: boolean;
  error: string | null;
}

interface UseProductsResult {
  products: ProductListItem[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Fetch product by slug
 * For client-side usage with loading and error states
 */
export function useProductBySlug(slug: string): UseProductBySlugResult {
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    async function fetchProduct() {
      setIsLoading(true);
      setError(null);

      try {
        const data = await productService.getProductBySlug(slug);
        if (isMounted) {
          setProduct(data);
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err instanceof Error
              ? err.message
              : 'Gagal memuat produk'
          );
          setProduct(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchProduct();

    return () => {
      isMounted = false;
    };
  }, [slug]);

  return { product, isLoading, error };
}

/**
 * Fetch paginated products list
 */
export function useProducts(
  page: number = 1,
  limit: number = 20
): UseProductsResult {
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await productService.getProducts({ page, limit });
      setProducts(response.items);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Gagal memuat produk'
      );
    } finally {
      setIsLoading(false);
    }
  }, [page, limit]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return { products, isLoading, error, refetch: fetchProducts };
}
