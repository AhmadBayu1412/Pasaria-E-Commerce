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
        stock: raw.stock,
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
    return {
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price,
        stock: product.stock,
        sellerId: product.sellerId,
        categoryId: product.categoryId,  // Phase 3 Step 2 - Category relation
        createdAt: product.createdAt.toISOString(),
        updatedAt: product.updatedAt.toISOString()
    }
}

// ----- Prisma -> DTO (Direct, untuk response tanpa domain object) -----
export function toDTODirect(raw: PrismaProduct): ProductResponseDTO {
    return {
        id: raw.id,
        name: raw.name,
        description: raw.description,
        price: raw.price.toNumber(),
        stock: raw.stock,
        sellerId: raw.sellerId,
        categoryId: raw.categoryId,  // Phase 3 Step 2 - Category relation
        createdAt: raw.createdAt.toISOString(),
        updatedAt: raw.updatedAt.toISOString()
    }
}

// ----- Domain List → DTO List -----
export function toDTOList(products: Product[]): ProductResponseDTO[] {
    return products.map(toDTO)
}