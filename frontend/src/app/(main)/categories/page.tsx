'use client';

/**
 * Categories Page
 * Route: /categories
 */

import { Container } from '@/components/layout/container';
import Link from 'next/link';

const categories = [
  {
    id: 'electronics',
    name: 'Elektronik',
    icon: '📱',
    count: 156,
    description: 'Smartphone, laptop, dan aksesoris elektronik',
  },
  {
    id: 'fashion',
    name: 'Fashion',
    icon: '👕',
    count: 324,
    description: 'Pakaian, sepatu, dan aksesoris fashion',
  },
  {
    id: 'home',
    name: 'Rumah Tangga',
    icon: '🏠',
    count: 89,
    description: 'Furniture, dekorasi, danperlengkapan rumah',
  },
  {
    id: 'beauty',
    name: 'Kecantikan',
    icon: '💄',
    count: 201,
    description: 'Skincare, makeup, dan parfum',
  },
  {
    id: 'sports',
    name: 'Olahraga',
    icon: '⚽',
    count: 78,
    description: 'Alat olahraga dan perlengkapan fitness',
  },
  {
    id: 'food',
    name: 'Makanan & Minuman',
    icon: '🍕',
    count: 145,
    description: 'Makanan ringan, minuman, dan produk organik',
  },
];

export default function CategoriesPage() {
  return (
    <div className="bg-secondary-50 min-h-screen">
      <Container>
        <div className="py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-secondary-900">
              Kategori Produk
            </h1>
            <p className="text-secondary-600 mt-1">
              Jelajahi produk berdasarkan kategori
            </p>
          </div>

          {/* Categories Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/products?category=${category.id}`}
                className="group bg-white rounded-xl border border-secondary-200 p-6 hover:border-primary-300 hover:shadow-lg transition-all duration-200"
              >
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 bg-primary-50 rounded-xl flex items-center justify-center text-3xl group-hover:bg-primary-100 transition-colors">
                    {category.icon}
                  </div>
                  <div className="flex-1">
                    <h2 className="font-semibold text-secondary-900 group-hover:text-primary-600 transition-colors">
                      {category.name}
                    </h2>
                    <p className="text-sm text-secondary-500 mt-1">
                      {category.description}
                    </p>
                    <p className="text-xs text-secondary-400 mt-2">
                      {category.count} produk
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </Container>
    </div>
  );
}
