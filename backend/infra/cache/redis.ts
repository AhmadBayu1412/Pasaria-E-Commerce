import { createClient } from "redis";

// Deteksi apakah menggunakan TLS (rediss://) untuk Upstash
const redisUrl = process.env.REDIS_URL
const isTLS = redisUrl?.startsWith("rediss://") ?? false

export const redis = isTLS
    // Upstash / TLS connection (rediss://)
    ? createClient({
        url: redisUrl,
        socket: {
            tls: true,
            rejectUnauthorized: false,
            reconnectStrategy(retries: number) {
                if (retries > 5) {
                    console.error("[REDIS] reconnect stopped after 5 attempts")
                    return false
                }
                return Math.min(retries * 300, 3000)
            }
        } as any // redis v6 TLS socket type workaround
    })
    // Local / non-TLS connection (redis://)
    : createClient({
        url: redisUrl,
        socket: {
            reconnectStrategy(retries: number) {
                if (retries > 5) {
                    console.error("[REDIS] reconnect stopped after 5 attempts")
                    return false
                }
                return Math.min(retries * 300, 3000)
            }
        }
    })

redis.on(
    "error",
    (err) => {
        const ignored = [
            "Socket closed unexpectedly", "ECONNREFUSED"
        ]
        if (ignored.some(
            msg => err.message.includes(msg)
        )) {
            return
        }
        console.error(
            "[REDIS]",
            err.message
        )
    }
)