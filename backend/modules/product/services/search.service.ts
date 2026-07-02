import { prisma } from "../../../infra/db/prisma.js"
import { SearchProductsInput } from "../validation/search.validation.js"
import { SearchResponseDTO, ProductSearchSummaryDTO } from "../types/search.dto.js"
import { cacheGetOrSet } from "../../../shared/cache/index.js"
import { CACHE_TTL } from "../../../shared/config/cache.config.js"
import { productSearchKey, type ProductSearchCacheInput } from "../../../shared/cache/cache.keys.js"

function calculateEffectivePrice(basePrice: any, discountPrice: any): number {
  const base = typeof basePrice === "number" ? basePrice : parseFloat(String(basePrice))
  if (discountPrice === null) return base
  const discount = typeof discountPrice === "number" ? discountPrice : parseFloat(String(discountPrice))
  return Math.min(base, discount)
}

function mapToSearchSummary(product: any): ProductSearchSummaryDTO {
  const effective = calculateEffectivePrice(product.basePrice, product.discountPrice)
  const hasDiscount = product.discountPrice !== null

  let primaryImage: { id: number; path: string } | null = null
  if (product.images && product.images.length > 0) {
    const primary = product.images.find((img: any) => img.isPrimary)
    const fallback = product.images[0]
    const selected = primary || fallback
    if (selected) {
      primaryImage = {
        id: selected.id,
        path: selected.path
      }
    }
  }

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    effectivePrice: String(effective),
    basePrice: String(product.basePrice),
    discountPrice: product.discountPrice ? String(product.discountPrice) : null,
    hasDiscount,
    currency: "IDR",
    primaryImage,
    category: product.category
      ? { id: product.category.id, name: product.category.name }
      : null,
    seller: { id: product.sellerId },
    availableStock: product.availableStock,
    hasStock: product.availableStock > 0
  }
}

function mapSortField(sort: string): string {
  const sortMapping: Record<string, string> = {
    name: "name",
    price: "basePrice",
    createdAt: "createdAt",
    effectivePrice: "basePrice"
  }
  return sortMapping[sort] || "createdAt"
}

/**
 * Execute database query for search
 * This function is called on cache miss
 */
async function executeSearchQuery(input: SearchProductsInput): Promise<SearchResponseDTO> {
  const { q, page, limit, sort, order, category, seller, minPrice, maxPrice, inStock } = input

  const skip = (page - 1) * limit

  const where: any = {}

  if (q && q.trim()) {
    where.OR = [
      { name: { contains: q.trim(), mode: "insensitive" } },
      { description: { contains: q.trim(), mode: "insensitive" } }
    ]
  }

  if (category) {
    where.categoryId = category
  }

  if (seller) {
    where.sellerId = seller
  }

  if (inStock === "true") {
    where.availableStock = { gt: 0 }
  } else if (inStock === "false") {
    where.availableStock = { lte: 0 }
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    where.basePrice = {}
    if (minPrice !== undefined) {
      where.basePrice.gte = minPrice
    }
    if (maxPrice !== undefined) {
      where.basePrice.lte = maxPrice
    }
  }

  const sortField = mapSortField(sort)

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortField]: order },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        basePrice: true,
        discountPrice: true,
        availableStock: true,
        sellerId: true,
        categoryId: true,
        category: {
          select: { id: true, name: true }
        },
        images: {
          select: { id: true, path: true, isPrimary: true },
          orderBy: { isPrimary: "desc" },
          take: 1
        }
      }
    }),
    prisma.product.count({ where })
  ])

  const totalPages = Math.ceil(total / limit)

  const items = products.map(mapToSearchSummary)

  return {
    success: true,
    data: items,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    },
    filters: {
      query: q || null,
      category: category || null,
      seller: seller || null,
      minPrice: minPrice || null,
      maxPrice: maxPrice || null,
      inStock: inStock === "true" ? true : inStock === "false" ? false : null,
      sort,
      order
    }
  }
}

export async function searchProducts(
  input: SearchProductsInput
): Promise<SearchResponseDTO> {
  // Generate cache key from search parameters
  const cacheKey = productSearchKey(input as ProductSearchCacheInput)

  // Cache-aside pattern: get from cache or fetch from DB
  const cached = await cacheGetOrSet<SearchResponseDTO>(
    cacheKey,
    CACHE_TTL.SEARCH_RESULT,
    () => executeSearchQuery(input)
  )

  return cached.data!
}
