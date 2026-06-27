import { Request, Response, NextFunction } from "express"
import type { AuthenticatedUser } from "../../shared/session/session.types.js"
import { SESSION_CONFIG } from "../../shared/session/session.config.js"
import { BusinessError } from "../../shared/errors/business.error.js"
import { findById } from "../user/user.service.js"
import { sessionService } from "./session.service.js"

//! Extend Express request
declare global {
    namespace Express {
        interface Request {
            user?: AuthenticatedUser
        }
    }
}

/**
 * Authentication Middleware
 * 
 * Flow:
 * 1. Baca sessionId dari cookie
 * 2. Cari session di storage
 * 3. Validasi user masih aktif di database
 * 4. Attach AuthenticatedUser ke request
 * 
 * Session validation:
 * - Session harus ada di redis
 * - User harus masih aktif di database
 * - Ini mencegah disabled user tetap bisa pakai session lama
 */
export async function authenticate(
    req: Request,
    _res: Response,
    next: NextFunction
): Promise<void> {
    try {
        //! 1. Baca session ID dari cookie
        const sessionId = req.cookies?.[SESSION_CONFIG.cookieName]

        if (!sessionId) {
            throw new BusinessError("Silakan login terlebih dahulu", 401)
        }

        //! 2. Cari session di storage
        const session = await sessionService.get(sessionId)

        if (!session) {
            throw new BusinessError("Session expired. Silakan login kembali.", 401)
        }

        //! 3. Validasi user masih aktif di database
        const dbUser = await findById(session.userId)

        if (!dbUser) {
            //! User deleted dari database
            await sessionService.delete(sessionId)
            throw new BusinessError("Akun tidak ditemukan", 401)
        }

        if (!dbUser.isActive) {
            //! User disabled - return 401 karena user tidak bisa melakukan operasi apapun
            await sessionService.delete(sessionId)
            throw new BusinessError("Akun non-aktif. Hubungi support.", 401)
        }

        //! 4. Attach user ke request
        req.user = {
            id: session.userId,
            role: session.role,
            sessionId: sessionId
        }

        next()
    } catch (error) {
        next(error)
    }
}