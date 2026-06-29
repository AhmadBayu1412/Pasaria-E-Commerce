// ============================================================
// PRODUCT VALIDATION (Zod Schemas)
// Fokus: validasi input, terpisah dari DTO
// ============================================================

import { z } from "zod"

export const createProductSchema = z.object({
    name: z.string()
        .min(1, "Nama produk tidak boleh kosong")
        .max(255, "Nama produk maksimal 255 karakter"),
    description: z.string().optional(),
    price: z.number()
        .positive("Harga harus lebih dari 0")
        .finite("Harga harus berupa angka valid"),
    stock: z.number()
        .int("Stok harus berupa angka bulat")
        .min(0, "Stok tidak boleh negatif")
        .optional(),
    categoryId: z.number().int().positive("Category ID harus berupa angka positif").optional()  // Phase 3 Step 2
})

export type CreateProductInput = z.infer<typeof createProductSchema>

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
    stock: z.number()
        .int("Stok harus berupa angka bulat")
        .min(0, "Stok tidak boleh negatif")
        .optional(),
    categoryId: z.number().int().positive("Category ID harus berupa angka positif").nullable().optional()  // Phase 3 Step 2 - nullable untuk unset
})

export type UpdateProductInput = z.infer<typeof updateProductSchema>