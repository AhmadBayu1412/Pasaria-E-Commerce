// ============================================================
// PRODUCT MAPPER
// Transformasi: Prisma → DTO only (no Domain layer)
// ============================================================

import { Product as PrismaProduct } from "@prisma/client";
import { Product } from "../types/product.types";
import { ProductResponseDTO } from "../types/product.dto";

// ----- Prisma -> Domain -----
export function toDomain(raw: PrismaProduct): Product {
    return {
        id: raw.id,
        name: raw.name,
        description: raw.description,
        price: raw.price.toNumber(),
        // --- Inventory Fields (Phase 3 Step 4) ---
        availableStock: raw.availableStock,
        reservedStock: raw.reservedStock,
        // -------------------------------------------
        sellerId: raw.sellerId,
        categoryId: raw.categoryId,  // Phase 3 Step 2 - Category relation
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt
    }
}

// ----- Prisma -> Domain (Batch) -----
export function toDomainList(rawList: PrismaProduct[]): Product[] {
    return rawList.map(toDomain)
}

// ----- Domain -> DTO -----
export function toDTO(product: Product): ProductResponseDTO {
    const availableStock = product.availableStock
    const reservedStock = product.reservedStock

    return {
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price,
        // --- Inventory Fields (Phase 3 Step 4) ---
        availableStock,
        reservedStock,
        totalStock: availableStock + reservedStock,
        // -------------------------------------------
        sellerId: product.sellerId,
        categoryId: product.categoryId,  // Phase 3 Step 2 - Category relation
        images: [],  // populated by image.service when needed
        createdAt: product.createdAt.toISOString(),
        updatedAt: product.updatedAt.toISOString()
    }
}

// ----- Prisma -> DTO (Direct, untuk response tanpa domain object) -----
export function toDTODirect(raw: PrismaProduct): ProductResponseDTO {
    const availableStock = raw.availableStock
    const reservedStock = raw.reservedStock

    return {
        id: raw.id,
        name: raw.name,
        description: raw.description,
        price: raw.price.toNumber(),
        // --- Inventory Fields (Phase 3 Step 4) ---
        availableStock,
        reservedStock,
        totalStock: availableStock + reservedStock,
        // -------------------------------------------
        sellerId: raw.sellerId,
        categoryId: raw.categoryId,  // Phase 3 Step 2 - Category relation
        images: [],  // populated by image.service when needed
        createdAt: raw.createdAt.toISOString(),
        updatedAt: raw.updatedAt.toISOString()
    }
}

// ----- Domain List → DTO List -----
export function toDTOList(products: Product[]): ProductResponseDTO[] {
    return products.map(toDTO)
}
