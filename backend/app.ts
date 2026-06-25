import dotenv from 'dotenv'
dotenv.config()

import express from "express";
import productRoutes from "./modules/product/product.routes"
import { prisma } from "./infra/db/prisma";
import { checkRedisHealth } from './infra/cache/health';

// Redis: Aktifkan setelah redis.ts dibuat
import { redis } from './infra/cache/redis';
import { checkDatabaseHealth } from './infra/db/health';

// PHASE 1 STEP 6
import { errorMiddleware } from './shared/middleware/error.middleware';
import { notFound } from './shared/middleware/not-found.middleware';
import { requestIdMiddleware } from './shared/middleware/request-id.middleware';

// PHASE 2 STEP 3
import authRoutes from "./modules/auth/index.js"

const app = express()
const port = Number(process.env.PORT) || 3000

app.use(express.json())

// STEP 9: Request ID middleware
app.use(requestIdMiddleware)

//! HEALTH
app.get('/health', async (_, res) => {
    const db = await checkDatabaseHealth()
    const cache = await checkRedisHealth()

    const healthy = 
        db.database === "UP"
        &&
        cache.redis === "UP"

    return res
    .status(
        healthy 
            ? 200
            : 503
    )
    .json({
        status: 
            healthy
                ? "UP"
                : "DOWN",
        uptime: process.uptime(),
        database: db.database,
        redis: cache.redis,
        service: "Pasaria Api",
        message: 'Pasaria E-Commerce API is running on Modular Monolith architecture'
    })
})

app.get('/health/db', async (_, res) => {
    const result = await checkDatabaseHealth()

    return res
        .status(
            result.database === "UP"
                ? 200
                : 503
        )
        .json(result)
})

app.use("/products", productRoutes)

process.on("SIGINT",
    async () => {
        console.log("\nShutting down...")
        await prisma.$disconnect()
        await redis.quit()
        process.exit(0)
    }
)

// Tambah authRoutes
app.use("/auth", authRoutes)

// Middleware order: notFound dulu, baru errorMiddleware
app.use(notFound)
app.use(errorMiddleware)

// BOOTSTRAP
async function bootstrap() {
    try {
        await prisma.$connect()
        console.log("✅ DB CONNECTED")

        await redis.connect()
        console.log("✅ REDIS CONNECTED")
        
        app.listen(port, () => {
            console.log(`⚡️[server]: Server Pasaria berjalan di http://localhost:${port}/health`)
        })
        
    } catch (err) {
        console.error("BOOT FAILED:", err)
        process.exit(1)
    }

}

bootstrap()


