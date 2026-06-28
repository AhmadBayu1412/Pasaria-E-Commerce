import { Request, Response, NextFunction } from "express"
import type { AuthenticatedUser } from "../../shared/auth/types/auth.types.js"
import { SESSION_CONFIG } from "../../shared/session/session.config.js"
import { AUTH_ERRORS } from "../../shared/auth/errors/auth.errors.js"
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
            throw AUTH_ERRORS.authRequired
        }

        //! 2. Cari session di storage
        const session = await sessionService.get(sessionId)

        if (!session) {
            throw AUTH_ERRORS.sessionNotFound
        }

        //! 3. Validasi user masih aktif di database
        const dbUser = await findById(session.userId)

        if (!dbUser) {
            //! User deleted dari database
            await sessionService.delete(sessionId)
            throw AUTH_ERRORS.userNotFound
        }

        if (!dbUser.isActive) {
            //! User disabled - hapus session dan return 403
            await sessionService.delete(sessionId)
            throw AUTH_ERRORS.userInactive
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