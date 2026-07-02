/**
 * Worker Entry Point
 * Run separately from API server: npm run worker
 */

import { createProductWorker, closeWorker } from "./infra/queue/worker.js"
import { closeQueue } from "./infra/queue/bullmq.js"
import { redis } from "./infra/cache/redis.js"
import { prisma } from "./infra/db/prisma.js"

console.log("=".repeat(50))
console.log("🚀 BullMQ Worker Starting...")
console.log("=".repeat(50))

async function bootstrap(): Promise<void> {
  try {
    // Connect to Redis
    if (!redis.isOpen) {
      await redis.connect()
    }
    console.log("✅ Redis connected")

    // Connect to Prisma
    await prisma.$connect()
    console.log("✅ Database connected")

    // Start worker
    createProductWorker()

    console.log("=".repeat(50))
    console.log("✅ Worker is ready and listening")
    console.log("=".repeat(50))

  } catch (err) {
    console.error("❌ Bootstrap failed:", err)
    process.exit(1)
  }
}

async function shutdown(signal: string): Promise<void> {
  console.log(`\n${signal} received`)
  console.log("Shutting down gracefully...")

  try {
    await closeWorker()
    await closeQueue()
    await redis.quit()
    await prisma.$disconnect()

    console.log("✅ Shutdown complete")
    process.exit(0)

  } catch (err) {
    console.error("❌ Shutdown error:", err)
    process.exit(1)
  }
}

// Signal handlers
process.on("SIGINT", () => shutdown("SIGINT"))
process.on("SIGTERM", () => shutdown("SIGTERM"))

// Unhandled rejection handler
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason)
})

// Bootstrap
bootstrap()
