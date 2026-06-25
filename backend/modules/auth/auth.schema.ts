import { z } from "zod"

// Email validation dengan normalize: trim + lowercase
const emailSchema = z.string()
    .min(1, { message: "Email tidak boleh kosong" })
    .transform(v => v.trim().toLowerCase())
    .refine(v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), {
        message: "Email tidak valid"
    })

export const registerSchema = z.object({
    email: emailSchema,
    password: z.string().min(8, { message: "Password minimal 8 karakter" })
})

export type RegisterInput = z.infer<typeof registerSchema>