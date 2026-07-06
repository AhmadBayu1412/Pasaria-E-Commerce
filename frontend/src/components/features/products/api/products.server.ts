/**
 * Products API - Server Side
 * 
 * Server-side data fetching for products.
 */

import type { Product, Category, ProductsResponse } from '@/components/features/products/product-card';
import type { ProductFilters } from '@/lib/schemas';

// Mock data for demonstration
const mockCategories: Category[] = [
  { id: '1', name: 'Elektronik', slug: 'elektronik', productCount: 150 },
  { id: '2', name: 'Fashion', slug: 'fashion', productCount: 280 },
  { id: '3', name: 'Kecantikan', slug: 'kecantikan', productCount: 95 },
  { id: '4', name: 'Rumah Tangga', slug: 'rumah-tangga', productCount: 120 },
  { id: '5', name: 'Olahraga', slug: 'olahraga', productCount: 75 },
];

const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Laptop ASUS ROG Strix G16',
    slug: 'laptop-asus-rog-strix-g16',
    description: 'Laptop gaming dengan performa tinggi',
    price: 24999000,
    originalPrice: 27999000,
    images: ['/images/product-placeholder.png'],
    category: mockCategories[0],
    rating: 4.5,
    reviewCount: 128,
    badges: ['sale'],
    stock: 15,
    createdAt: '2024-01-15',
  },
  {
    id: '2',
    name: 'Smartphone Samsung Galaxy S24 Ultra',
    slug: 'samsung-galaxy-s24-ultra',
    description: 'Smartphone flagship dengan kamera 200MP',
    price: 21999000,
    images: ['/images/product-placeholder.png'],
    category: mockCategories[0],
    rating: 4.8,
    reviewCount: 256,
    badges: ['new'],
    stock: 30,
    createdAt: '2024-02-01',
  },
  {
    id: '3',
    name: 'Kemeja Lengan Panjang Premium',
    slug: 'kemeja-lengan-panjang-premium',
    description: 'Kemeja formal dengan bahan katun berkualitas',
    price: 299000,
    originalPrice: 399000,
    images: ['/images/product-placeholder.png'],
    category: mockCategories[1],
    rating: 4.2,
    reviewCount: 89,
    badges: ['sale'],
    stock: 50,
    createdAt: '2024-01-20',
  },
  {
    id: '4',
    name: 'Serum Wajah Vitamin C',
    slug: 'serum-wajah-vitamin-c',
    description: 'Serum untuk brighten kulit wajah',
    price: 185000,
    images: ['/images/product-placeholder.png'],
    category: mockCategories[2],
    rating: 4.6,
    reviewCount: 312,
    badges: ['hot'],
    stock: 100,
    createdAt: '2024-02-10',
  },
  {
    id: '5',
    name: 'Rice Cooker Multifungsi',
    slug: 'rice-cooker-multifungsi',
    description: 'Rice cooker dengan berbagai fitur memasak',
    price: 850000,
    originalPrice: 999000,
    images: ['/images/product-placeholder.png'],
    category: mockCategories[3],
    rating: 4.3,
    reviewCount: 178,
    badges: ['sale'],
    stock: 25,
    createdAt: '2024-01-25',
  },
  {
    id: '6',
    name: 'Sepatu Lari Nike Air Max',
    slug: 'sepatu-lari-nike-air-max',
    description: 'Sepatu lari dengan teknologi air cushioning',
    price: 1899000,
    images: ['/images/product-placeholder.png'],
    category: mockCategories[4],
    rating: 4.7,
    reviewCount: 445,
    badges: ['new'],
    stock: 40,
    createdAt: '2024-02-15',
  },
];

/**
 * Fetch products with filters
 */
export async function fetchProducts(filters: ProductFilters): Promise<ProductsResponse> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  let filteredProducts = [...mockProducts];

  // Filter by category
  if (filters.category) {
    filteredProducts = filteredProducts.filter(
      (p) => p.category.slug === filters.category
    );
  }

  // Filter by search query
  if (filters.q) {
    const query = filters.q.toLowerCase();
    filteredProducts = filteredProducts.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query)
    );
  }

  // Sort
  switch (filters.sort) {
    case 'price_asc':
      filteredProducts.sort((a, b) => a.price - b.price);
      break;
    case 'price_desc':
      filteredProducts.sort((a, b) => b.price - a.price);
      break;
    case 'rating':
      filteredProducts.sort((a, b) => b.rating - a.rating);
      break;
    case 'newest':
    default:
      filteredProducts.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  }

  // Pagination
  const totalItems = filteredProducts.length;
  const totalPages = Math.ceil(totalItems / filters.pageSize);
  const start = (filters.page - 1) * filters.pageSize;
  const products = filteredProducts.slice(start, start + filters.pageSize);

  return {
    products,
    pagination: {
      page: filters.page,
      pageSize: filters.pageSize,
      totalItems,
      totalPages,
    },
    filters: {
      categories: mockCategories,
      priceRange: { min: 0, max: 30000000 },
    },
  };
}

/**
 * Get all categories
 */
export async function fetchCategories(): Promise<Category[]> {
  await new Promise((resolve) => setTimeout(resolve, 100));
  return mockCategories;
}
