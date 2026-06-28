import dotenv from 'dotenv'
dotenv.config()

import express from "express"
import cookieParser from "cookie-parser"

import { prisma } from "./infra/db/prisma"
import { redis } from "./infra/cache/redis"
import { checkDatabaseHealth } from './infra/db/health'
import { checkRedisHealth } from './infra/cache/health'

// PHASE 1
import { errorMiddleware } from './shared/middleware/error.middleware'
import { notFound } from './shared/middleware/not-found.middleware'
import { requestIdMiddleware } from './shared/middleware/request-id.middleware'

// PHASE 2 - Auth
import authRoutes from "./modules/auth/index.js"
import userRoutes from "./modules/user/user.routes.js"

// PHASE 3 - Product
import productRoutes from "./modules/product/index.js"

// PHASE 2 - Step 9: Security Hardening
import { helmetMiddleware } from "./shared/security/helmet.config.js"
import { assertEnvironment } from "./infra/config/env.validation.js"

const app = express()
const port = Number(process.env.PORT) || 3000

// ============ TRUST PROXY ============
// Untuk rate limiting yang akurat di belakang reverse proxy
// Nilai sesuai jumlah proxy di depan aplikasi
app.set("trust proxy", Number(process.env.TRUST_PROXY_COUNT) || 1)

// ============ MIDDLEWARE ============

// 1. Security headers (Helmet) - FIRST
app.use(helmetMiddleware())

// 2. Cookie parser (untuk CSRF + session)
app.use(cookieParser())

// 3. Body parsers
app.use(express.json())

// 4. Request ID
app.use(requestIdMiddleware)

// ============ HEALTH CHECKS ============
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
        service: "Pasaria Api"
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

// ============ ROUTES ============
// Rate limiter dipasang di level route (auth.routes.ts), bukan di sini
app.use("/auth", authRoutes)
app.use("/users", userRoutes)
app.use("/products", productRoutes)

// ============ ERROR HANDLING ============
app.use(notFound)
app.use(errorMiddleware)

// ============ GRACEFUL SHUTDOWN ============
process.on("SIGINT",
    async () => {
        console.log("\nShutting down...")
        await prisma.$disconnect()
        await redis.quit()
        process.exit(0)
    }
)

// ============ BOOTSTRAP ============
async function bootstrap() {
    try {
        // Validasi environment SEBELUM mulai server
        assertEnvironment()

        await prisma.$connect()
        console.log("✅ DB CONNECTED")

        await redis.connect()
        console.log("✅ REDIS CONNECTED")

        app.listen(port, () => {
            console.log(`⚡️[server]: Server Pasaria berjalan di http://localhost:${port}`)
        })

    } catch (err) {
        console.error("BOOT FAILED:", err)
        process.exit(1)
    }
}

bootstrap()
