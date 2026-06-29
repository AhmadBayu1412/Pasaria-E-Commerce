// ============================================================
// CATEGORY VALIDATION (Zod Schemas)
// ============================================================

import { z } from "zod"

const CATEGORY_NAME_MIN_LENGTH = 1
const CATEGORY_NAME_MAX_LENGTH = 100
const CATEGORY_NAME_REGEX = /^[a-zA-Z0-9\s\-&]+$/

export const createCategorySchema = z.object({
    name: z.string()
        .min(CATEGORY_NAME_MIN_LENGTH, "Nama kategori tidak boleh kosong")
        .max(CATEGORY_NAME_MAX_LENGTH, "Nama kategori maksimal 100 karakter")
        .refine(
            (val) => val === val.trim(),
            "Nama kategori tidak boleh memiliki spasi di awal atau akhir"
        )
        .refine(
            (val) => CATEGORY_NAME_REGEX.test(val),
            "Nama kategori hanya boleh mengandung huruf, angka, spasi, strip, dan &"
        )
})

export type CreateCategoryInput = z.infer<typeof createCategorySchema>

export const updateCategorySchema = z.object({
    name: z.string()
        .min(CATEGORY_NAME_MIN_LENGTH, "Nama kategori tidak boleh kosong")
        .max(CATEGORY_NAME_MAX_LENGTH, "Nama kategori maksimal 100 karakter")
        .refine(
            (val) => val === val.trim(),
            "Nama kategori tidak boleh memiliki spasi di awal atau akhir"
        )
        .refine(
            (val) => CATEGORY_NAME_REGEX.test(val),
            "Nama kategori hanya boleh mengandung huruf, angka, spasi, strip, dan &"
        )
})

export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>