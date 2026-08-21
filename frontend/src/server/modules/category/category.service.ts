// ============================================================
// CATEGORY SERVICE
// Handles category-related business logic
// ============================================================

import { prisma } from '../../infra/db/prisma';

/**
 * Category with product count (returned to client)
 */
export interface CategoryWithCount {
  id: number;
  name: string;
  icon: string;
  description: string;
  productCount: number;
}

/**
 * Helper to get icon for category
 */
function getIconForCategory(name: string): string {
  const iconMap: Record<string, string> = {
    Elektronik: '📱',
    Fashion: '👕',
    'Rumah Tangga': '🏠',
    Kecantikan: '💄',
    Olahraga: '⚽',
    'Makanan & Minuman': '🍕',
  };
  return iconMap[name] || '📦';
}

/**
 * Helper to get description for category
 */
function getDescriptionForCategory(name: string): string {
  const descMap: Record<string, string> = {
    Elektronik: 'Smartphone, laptop, dan aksesoris elektronik',
    Fashion: 'Pakaian, sepatu, dan aksesoris fashion',
    'Rumah Tangga': 'Furniture, dekorasi, dan perlengkapan rumah',
    Kecantikan: 'Skincare, makeup, dan parfum',
    Olahraga: 'Alat olahraga dan perlengkapan fitness',
    'Makanan & Minuman': 'Makanan ringan, minuman, dan produk organik',
  };
  return descMap[name] || 'Produk berkualitas';
}

export const CategoryService = {
  /**
   * Get all categories with product count
   */
  async getAllWithProductCount(): Promise<ReadonlyArray<CategoryWithCount>> {
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: { products: true },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    return categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      icon: getIconForCategory(cat.name),
      description: getDescriptionForCategory(cat.name),
      productCount: cat._count.products,
    }));
  },

  /**
   * Get category by ID with product count
   */
  async getByIdWithProductCount(
    id: number
  ): Promise<CategoryWithCount | null> {
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    if (!category) return null;

    return {
      id: category.id,
      name: category.name,
      icon: getIconForCategory(category.name),
      description: getDescriptionForCategory(category.name),
      productCount: category._count.products,
    };
  },
} as const;
