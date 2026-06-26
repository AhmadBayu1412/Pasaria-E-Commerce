import { getCache, setCacheWithTTL, deleteCache } from "../../shared/cache/cache.service.js";
import { SESSION_CONFIG } from "../../shared/session/session.config.js";
import { SessionKeys } from "../../shared/session/session.keys.js";
import type { SessionData } from "../../shared/session/session.types.js";

/**
 * ! Session Service
 *
 * Abstraksi dari Redis melalui CacheService
 * Tidak langsung impor dari infra/cache/redis
 *
 * Flow:
 * SessionService -> CacheService -> Redis
 *
 * Ini memungkinkan swapping Redis dengan storage lain
 * tidak mengubah SessionService
 */
export const sessionService = {
    //! Create session baru. Dipanggil setelah login berhasil
    async create(data: SessionData): Promise<string> {
        // Generate session ID - 64 char hex
        const sessionId = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "")

        await setCacheWithTTL(
            SessionKeys.byId(sessionId),
            data,
            SESSION_CONFIG.ttl
        )
        return sessionId
    },
    //! Get session dari storage. Return null jika tidak ditemukan atau expired
    async get(sessionId: string): Promise<SessionData | null> {
        return await getCache<SessionData>(SessionKeys.byId(sessionId))
    },

    //! Delete session. Dipanggil saat logout
    async delete(sessionId: string): Promise<void> {
        await deleteCache(SessionKeys.byId(sessionId))
    }
}
