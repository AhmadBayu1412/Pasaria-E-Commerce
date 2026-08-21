import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
    prisma?: PrismaClient;
}

if (!process.env.DATABASE_URL) {
    console.error("[PRISMA CRITICAL] process.env.DATABASE_URL is missing or undefined!")
}

export const prisma =
    globalForPrisma.prisma ??
    new PrismaClient({
        log: ['error', 'warn'],
    })

globalForPrisma.prisma = prisma