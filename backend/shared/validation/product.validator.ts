import {z} from "zod"

export const createProductSchema = z.object({
    name:z.string().min(3, "Nama minimal 3 karakter"),
    price:z.coerce.number().positive()
})

export const updateProductSchema = createProductSchema.partial()
