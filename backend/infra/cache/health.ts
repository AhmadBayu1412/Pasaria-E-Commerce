import {redis} from "./redis"

export async function checkRedisHealth() {
    try {
        const result = await redis.ping()

        return {
            redis: 
                result === "PONG"
                    ? "UP"
                    : "DOWN",
            error: null,
        }
    } catch (error: any) {
        return {
            redis: "DOWN",
            error: error?.message || "Unknown error",
        }
    }
}