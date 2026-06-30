// ============================================================
// PRODUCT VALIDATION (Zod Schemas)
// Fokus: validasi input, terpisah dari DTO
// ============================================================

import { z } from "zod"

// ======= Pagination Query Schema =======
export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(["name", "price", "createdAt", "stock"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc")
}) 

export type PaginationQueryInput = z.infer<typeof paginationQuerySchema>

export const createProductSchema = z.object({
    name: z.string()
        .min(1, "Nama produk tidak boleh kosong")
        .max(255, "Nama produk maksimal 255 karakter"),
    description: z.string().optional(),
    price: z.number()
        .positive("Harga harus lebih dari 0")
        .finite("Harga harus berupa angka valid"),
    // --- Inventory Fields (Phase 3 Step 4) ---
    availableStock: z.number()
        .int("Stok harus berupa angka bulat")
        .min(0, "Stok tidak boleh negatif")
        .optional(),
    reservedStock: z.number()
        .int("Reserved stock harus berupa angka bulat")
        .min(0, "Reserved stock tidak boleh negatif")
        .optional(),
    // -------------------------------------------
    categoryId: z.number().int().positive("Category ID harus berupa angka positif").optional()  // Phase 3 Step 2
})

export type CreateProductInput = z.infer<typeof createProductSchema>

// ======== Update Product Schema ========
export const updateProductSchema = z.object({
    name: z.string()
        .min(1, "Nama produk tidak boleh kosong")
        .max(255, "Nama produk maksimal 255 karakter")
        .optional(),
    description: z.string().optional(),
    price: z.number()
        .positive("Harga harus lebih dari 0")
        .finite("Harga harus berupa angka valid")
        .optional(),
    // --- Inventory Fields (Phase 3 Step 4) ---
    // NOTE: Untuk update stock, gunakan PATCH /products/:id/inventory
    // Schema ini tidak mengijinkan update availableStock/reservedStock langsung
    availableStock: z.number()
        .int("Stok harus berupa angka bulat")
        .min(0, "Stok tidak boleh negatif")
        .optional(),
    reservedStock: z.number()
        .int("Reserved stock harus berupa angka bulat")
        .min(0, "Reserved stock tidak boleh negatif")
        .optional(),
    // -------------------------------------------
    categoryId: z.number().int().positive("Category ID harus berupa angka positif").nullable().optional()
})

export type UpdateProductInput = z.infer<typeof updateProductSchema>

// ======= INVENTORY SCHEMAS =======

// Operation enum
export const inventoryOperationSchema = z.enum(["increase", "decrease", "reserve", "release"])

// Request: Inventory Operation
export const inventoryOperationRequestSchema = z.object({
    operation: inventoryOperationSchema,
    quantity: z.number()
        .int("Quantity harus bilangan bulat")
        .min(1, "Quantity minimal 1")
        .max(10000, "Quantity maksimal 10000 per transaksi")
    })

export type InventoryOperationInput = z.infer<typeof inventoryOperationRequestSchema>