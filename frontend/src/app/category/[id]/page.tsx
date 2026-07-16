/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { categoryService, handleCategoryError, CATEGORY_ERROR_MESSAGES, CategoryError } from '@/services/category.service';
import type { Category } from '@/types/api/category.types';

export default function CategoryPage() {
  const params = useParams();
  const categoryIdParam = params?.id;
  const categoryId = parseInt(Array.isArray(categoryIdParam) ? categoryIdParam[0] : (categoryIdParam ?? '0'), 10);

  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<CategoryError | null>(null);

  const fetchCategory = useCallback(async () => {
    if (isNaN(categoryId) || categoryId <= 0) {
      setError(CategoryError.NOT_FOUND);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await categoryService.getCategoryById(categoryId);
      setCategory(data);
    } catch (err) {
      const errorType = handleCategoryError(err);
      setError(errorType);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId]);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    fetchCategory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !category) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="bg-white rounded-xl p-8 text-center">
            <p className="text-gray-600 mb-4">
              {error ? CATEGORY_ERROR_MESSAGES[error] : 'Kategori tidak ditemukan'}
            </p>
            <Link
              href="/category"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-block"
            >
              Kembali ke Kategori
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl flex items-center justify-center text-3xl">
              {category.icon}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{category.name}</h1>
              <p className="text-gray-600 mt-1">{category.description}</p>
              <p className="text-sm text-gray-500 mt-2">
                {category.productCount} produk tersedia
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Products Grid Placeholder */}
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-xl p-8 text-center border border-gray-100">
          <p className="text-gray-500">
            Halaman produk untuk kategori &quot;{category.name}&quot; sedang dalam pengembangan.
          </p>
          <p className="text-sm text-gray-400 mt-2">
            Komponen ProductGrid akan ditambahkan di sini.
          </p>
        </div>
      </div>
    </div>
  );
}
