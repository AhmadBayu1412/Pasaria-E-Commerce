// ============ SESSION SERVICE ===============
import { redis } from "../../infra/cache/redis";

/**
 * Extended cache service untuk session. 
 * Menambah kemampuan TTL dari config
 */

export async function getCache<T>(
    key: string
): Promise<T | null> {
    try {
        if(!redis.isReady){
            console.log("[CACHE SKIPPED] - Redis not ready")
            return null
        }
        const data = await redis.get(key)
        if(!data) return null
        return JSON.parse(data)
    } catch (err) {
        console.error("[CACHE GET ERROR]", err)
        return null
    }
}

export async function setCache(
    key: string,
    value: unknown,
    ttl = 300
): Promise<void> {
    try {
        if (!redis.isReady) return
        await redis.set(
            key, 
            JSON.stringify(value),
            { EX: ttl}
        )
    } catch (err) {
        console.error("[CACHE SET ERROR]", err)
    }
}

export async function deleteCache(
    key: string
): Promise<void> {
    try {
        if (!redis.isReady) return
        await redis.del(key)
    } catch (err) {
        console.error("[CACHE DELETE ERROR]", err)
    }
}

/**
 * Set cache dengan TTL dari config
 * Dipakai khusus untuk session
 */
export async function setCacheWithTTL(
    key: string,
    value: unknown,
    ttl: number // detik, dari session.config.ts
): Promise<void> {
    try {
        if (!redis.isReady) return
        await redis.set(
            key,
            JSON.stringify(value),
            { EX: ttl}
        )
    } catch (err) {
        console.error("[CACHE SET TTL ERROR]", err)
    }
}