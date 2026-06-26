import { z } from "zod"

// Email validation dengan normalize: trim + lowercase
const emailSchema = z.string()
    .min(1, { message: "Email wajib diisi" })
    .transform(v => v.trim().toLowerCase())
    .refine(v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), {
        message: "Format email tidak valid"
    })

export const registerSchema = z.object({
    email: emailSchema,
    password: z.string()
        .min(8, { message: "Password minimal 8 karakter" })
})

export type RegisterInput = z.infer<typeof registerSchema>

// ============ LOGIN SCHEMA ============
export const loginSchema = z.object({
    email: emailSchema,
    password: z.string()
        .min(1, { message: "Password wajib diisi" })
})

export type LoginInput = z.infer<typeof loginSchema>