import { prisma } from "../../infra/db/prisma"
import { SESSION_CONFIG } from "../../shared/session/session.config"
import type { SessionData } from "../../shared/session/session.types"
import type { UserRole } from "@prisma/client"

/**
 * Session Service — Prisma Database Implementation (Serverless compatible)
 *
 * Flow:
 * SessionService -> Prisma -> Supabase PostgreSQL
 */
export const sessionService = {
    //! Create session baru. Dipanggil setelah login berhasil
    async create(data: SessionData): Promise<string> {
        const sessionId = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "")
        const expiresAt = new Date(Date.now() + SESSION_CONFIG.ttl * 1000)

        await prisma.session.create({
            data: {
                id: sessionId,
                userId: data.userId,
                role: data.role as UserRole,
                expiresAt,
            }
        })

        return sessionId
    },

    //! Get session dari database. Return null jika tidak ditemukan atau expired
    async get(sessionId: string): Promise<SessionData | null> {
        try {
            const record = await prisma.session.findUnique({
                where: { id: sessionId },
            })

            if (!record) return null

            // Check expiration
            if (record.expiresAt < new Date()) {
                await prisma.session.delete({ where: { id: sessionId } }).catch(() => {})
                return null
            }

            return {
                userId: record.userId,
                role: record.role as unknown as import("../../shared/auth/types/auth.types").UserRole,
            }
        } catch (err) {
            console.error("[SESSION GET ERROR]", err)
            return null
        }
    },

    //! Delete session. Dipanggil saat logout
    async delete(sessionId: string): Promise<void> {
        try {
            await prisma.session.delete({ where: { id: sessionId } })
        } catch {
            // Ignore if already deleted
        }
    }
}
