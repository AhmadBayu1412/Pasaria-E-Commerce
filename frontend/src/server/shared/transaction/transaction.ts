import {prisma} from "../../infra/db/prisma"
import { deleteCache } from "../../infra/cache/redis.service"
import { BusinessError } from "../errors/business.error"

/**
 * Transaction Helper
 *
 * Konsep:
 * - Transaction opened by SERVICE (bukan controller)
 * - Cache invalidate HANYA setelah DB commit berhasil
 * - DB > Cache (cache bukan source of truth)
 */

export class TransactionManager {
    /**
     * Eksekusi operasi dalam transaction
     * @param operations - Semua operasi yang harus atomic
     * @param cacheInvalidations - Cache keys yang harus di-invalidasi SETELAH commit
     */

    static async withTransaction<T>(
        operations: (tx: any) => Promise<T>,
        cacheInvalidations?: string[]
    ): Promise<T> {
        try {
            // 1. Execute semua operasi dalam transaksi
            const result = await prisma.$transaction(async (tx) => {
                return await operations(tx)
            })

            // 2. DB commit berhasil -> baru invalidate cache
            if(cacheInvalidations && cacheInvalidations.length > 0) {
                await this.invalidateCaches(cacheInvalidations)
            }

            return result
        } catch (error){
            // 3. Kalau error -> otomatis rollback semua perubahan DB. cache tidak perlu di revoke karena tidak ada yang berubahh di DB
            // 4. Rethrow business error untuk handler di controller
            if (error instanceof BusinessError) {
                throw error
            }

            // Error lain -> convert ke generic error
            throw new BusinessError(
                error instanceof Error
                    ? error.message
                    : "Transaction failed",
                500
            )
        }
    }

    /**
     * Invalidate multiple cache keys
     * Sekali gagal, continue dengan yang lain (non-blocking)
     */

    private static async invalidateCaches(keys: string[]): Promise<void> {
        const promises = keys.map(async (key) => {
            try {
                await deleteCache(key)
                console.log(`[CACHE INVALIDATED] ${key}`)
            } catch {
                console.log(`[CACHE INVALIDATE FAILED] ${key} - non-critical`)
            }
        })

        await Promise.all(promises)
    }


}