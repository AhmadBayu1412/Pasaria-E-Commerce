'use client';

import React from 'react';
import Link from 'next/link';
import type { Category } from '@/types/api/category.types';

interface CategoryCardProps {
  category: Category;
}

export function CategoryCard({ category }: CategoryCardProps) {
  return (
    <Link
      href={`/category/${category.id}`}
      className="group block bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100"
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
          {category.icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
            {category.name}
          </h3>
          <p className="mt-1 text-sm text-gray-500 line-clamp-2">
            {category.description}
          </p>
          <div className="mt-3 flex items-center gap-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {category.productCount} produk
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

interface CategoryGridProps {
  categories: Category[];
}

export function CategoryGrid({ categories }: CategoryGridProps) {
  if (categories.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Tidak ada kategori ditemukan.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {categories.map((category) => (
        <CategoryCard key={category.id} category={category} />
      ))}
    </div>
  );
}

interface CategoryListProps {
  categories: Category[];
  selectedId?: number;
  onSelect?: (id: number) => void;
}

export function CategoryList({ categories, selectedId, onSelect }: CategoryListProps) {
  if (categories.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Tidak ada kategori ditemukan.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {categories.map((category) => {
        const isSelected = category.id === selectedId;

        if (onSelect) {
          return (
            <button
              key={category.id}
              onClick={() => onSelect(category.id)}
              className={`
                inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all
                ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }
              `}
            >
              <span>{category.icon}</span>
              <span>{category.name}</span>
              <span
                className={`
                  px-1.5 py-0.5 rounded text-xs
                  ${isSelected ? 'bg-blue-500' : 'bg-gray-200'}
                `}
              >
                {category.productCount}
              </span>
            </button>
          );
        }

        return (
          <Link
            key={category.id}
            href={`/category/${category.id}`}
            className={`
              inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all
              ${
                isSelected
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }
            `}
          >
            <span>{category.icon}</span>
            <span>{category.name}</span>
            <span
              className={`
                px-1.5 py-0.5 rounded text-xs
                ${isSelected ? 'bg-blue-500' : 'bg-gray-200'}
              `}
            >
              {category.productCount}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
