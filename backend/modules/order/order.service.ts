import { CacheKey } from "../../infra/cache/cache.helper"
import { TransactionManager } from "../../shared/transaction/transaction"

export const OrderService = {
    /**
     * Contoh: createOrder() yang memanggil multiple services
     * 
     * Semua dalam 1 transaction:
     * 1. reserveStock() - kurangi stok
     * 2. createPayment() - buat record payment
     * 3. clearCart() - kosongkan cart
     * 
     * Kalau step 3 gagal → step 1 & 2 di-ROLLBACK
     */

    async createOrder(userId: number) {
        return TransactionManager.withTransaction(async (txt) => {
             // Ini tx - bukan prisma biasa
            // Semua query di sini akan di-rollback jika ada error
            
            // Step 1: Reserve stock (service dalam tx)
            // await tx.product.update({ where: {...}, data: { stock: {...} } })
            
            // Step 2: Create payment
            // await tx.payment.create({ data: {...} })
            
            // Step 3: Clear cart
            // await tx.cart.deleteMany({ where: { userId } })
            
            // Semua BERHASIL → commit otomatis oleh Prisma
            
            // Cache invalidation akan dilakukan oleh TransactionManager
            // setelah commit berhasil
        }, [
            CacheKey.productsList,
            CacheKey.cartList,
            CacheKey.orderList
        ])
    }
}