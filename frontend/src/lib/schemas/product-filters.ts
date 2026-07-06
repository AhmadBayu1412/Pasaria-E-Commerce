/**
 * Product Filters Schema
 * 
 * Zod schema for validating URL query parameters.
 */

import { z } from 'zod';

export const ProductFilterSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(12).max(48).default(12),
  sort: z
    .enum(['newest', 'price_asc', 'price_desc', 'popularity', 'rating'])
    .default('newest'),
  category: z.string().optional(),
  q: z.string().max(100).optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
});

export type ProductFilters = z.infer<typeof ProductFilterSchema>;

export const SortOptions = [
  { value: 'newest', label: 'Terbaru' },
  { value: 'price_asc', label: 'Harga: Rendah ke Tinggi' },
  { value: 'price_desc', label: 'Harga: Tinggi ke Rendah' },
  { value: 'popularity', label: 'Terpopuler' },
  { value: 'rating', label: 'Rating Tertinggi' },
] as const;
