import {redis} from "../../infra/cache/redis"

export async function getCache<T>(
    key: string
): Promise<T | null> {
    try {
        if (!redis.isReady) {
            console.log("[CACHE SKIPPED] - Redis not ready")
            return null
        }

        const data =  await redis.get(key)

        if (!data) return null
        return JSON.parse(data)
    } catch (err){
        console.error(
            "[CACHE GET ERROR]",
            err
        )
        return null
    }

}

export async function setCache(
    key: string,
    value: unknown,
    ttl = 300
): Promise<void> {
    try {
        if(!redis.isReady) return
        await redis.set(
            key, JSON.stringify(value),
            {
                EX: ttl
            }
        )   
    } catch (err) {
        console.error(
            "[CACHE SET ERROR]",
            err
        )
    }

}

export async function deleteCache(
    key: string
): Promise<void> {
    try {
        if (!redis.isReady) return
        await redis.del(key)
    } catch (err) {
        console.error(
            "[CACHE DELETE ERROR]",
            err
        )
    }
}
