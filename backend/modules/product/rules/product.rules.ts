import {prisma} from "../../../infra/db/prisma"
import { BusinessError } from "../../../shared/errors/business.error"

export const ProductRules = {
    // STEP 8 Memastikan tidak ada duplikat
    async assertUniqueName(name: string): Promise<void> {
        const existingProduct = await prisma.product.findFirst({
            where: { name }
        });

        if (existingProduct) {
            throw new BusinessError("Product already exists", 409)
        }
    },

    // STEP 8 memastikan nama unik saatupdate kecuali milik produk itu sendiri
    async assertUniqueNameForUpdate(id: number, name: string): Promise<void> {
        const existingProduct = await prisma.product.findFirst({
            where: { name }
        })

        if(existingProduct && existingProduct.id !== id) {
            throw new BusinessError("Product name already taken by another product", 409)
        }
    } 
}