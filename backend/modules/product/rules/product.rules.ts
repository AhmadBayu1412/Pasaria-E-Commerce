// ============================================================
// PRODUCT RULES (Business Invariants)
// Fokus: enforce business constraints ONLY
// ============================================================

import {prisma} from "../../../infra/db/prisma"
import { BusinessError } from "../../../shared/errors/business.error"

export const ProductRules = {
    // ----- Validasi: nama produk harus unik -----
    async assertUniqueName(name: string): Promise<void> {
        const existing = await prisma.product.findFirst({
            where: { name }
        });

        if (existing) {
            throw new BusinessError("Product already exists", 409)
        }
    },

    // ----- Validasi: nama unik saat update (exclude self) -----
    async assertUniqueNameForUpdate(id: number, name: string): Promise<void> {
        const existing = await prisma.product.findFirst({
            where: { name }
        })

        if(existing && existing.id !== id) {
            throw new BusinessError("Product name already taken by another product", 409)
        }
    }  
}