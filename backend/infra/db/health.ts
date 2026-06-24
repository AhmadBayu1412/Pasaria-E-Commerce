import {prisma} from "./prisma"

export async function checkDatabaseHealth() {
    try {
        await prisma.$connect()
        return {
            database: "UP",
            error: null
        }
    } catch (error: any) {
        console.error("[HEALTH CHECK FAILED]: Database is unreachable.",
        error?.message || error)
        return {
            database: "DOWN",
            error: 
                error?.message ||
                "Unknown error",
        }
    }
}