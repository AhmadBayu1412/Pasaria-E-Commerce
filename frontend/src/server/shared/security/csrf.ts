import type { Request, Response, NextFunction } from "express"
import { prisma } from "../../infra/db/prisma"
import { SESSION_CONFIG } from "../session/session.config"
import { CSRF_COOKIE_CONFIG, CSRF_HEADER_NAME } from "./security.constants"
import { BusinessError } from "../errors/business.error"

/**
 * CSRF-specific errors
 */
const CSRF_ERRORS = {
    tokenMissing: new BusinessError("Forbidden", 403, "CSRF_TOKEN_MISSING"),
    tokenInvalid: new BusinessError("Forbidden", 403, "CSRF_TOKEN_INVALID"),
    validationFailed: new BusinessError("Forbidden", 403, "CSRF_VALIDATION_FAILED")
} as const

/**
 * Generate CSRF token
 */
export function generateCsrfToken(): string {
    const randomPart = crypto.randomUUID().replace(/-/g, "")
    const timestamp = Date.now().toString(36)
    return `${randomPart}.${timestamp}`
}

/**
 * Simpan CSRF token ke DB Session record
 */
export async function storeCsrfToken(
    sessionId: string,
    token: string
): Promise<void> {
    try {
        await prisma.session.update({
            where: { id: sessionId },
            data: { csrfToken: token }
        })
    } catch (err) {
        console.error("[CSRF STORE ERROR]", err)
    }
}

/**
 * Hapus CSRF token dari Session record
 */
export async function deleteCsrfToken(sessionId: string): Promise<void> {
    try {
        await prisma.session.update({
            where: { id: sessionId },
            data: { csrfToken: null }
        })
    } catch {
        // Ignore
    }
}

/**
 * Set CSRF cookie
 */
export function setCsrfCookie(
    res: Response,
    token: string
): void {
    res.cookie("csrfToken", token, CSRF_COOKIE_CONFIG)
}

/**
 * Clear CSRF cookie
 */
export function clearCsrfCookie(res: Response): void {
    res.clearCookie("csrfToken", {
        ...CSRF_COOKIE_CONFIG,
        maxAge: 0
    })
}

/**
 * CSRF Validation Middleware
 */
export function validateCsrf(
    req: Request,
    _res: Response,
    next: NextFunction
): void {
    if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
        return next()
    }

    const sessionId = req.cookies?.[SESSION_CONFIG.cookieName]

    if (!sessionId) {
        return next()
    }

    const clientToken = req.headers[CSRF_HEADER_NAME] as string | undefined

    if (!clientToken) {
        return next(CSRF_ERRORS.tokenMissing)
    }

    validateToken(sessionId, clientToken)
        .then(isValid => {
            if (!isValid) {
                return next(CSRF_ERRORS.tokenInvalid)
            }
            next()
        })
        .catch(() => {
            return next(CSRF_ERRORS.validationFailed)
        })
}

/**
 * Internal token validation via Prisma Session table
 */
async function validateToken(
    sessionId: string,
    clientToken: string
): Promise<boolean> {
    if (!clientToken || !sessionId) {
        return false
    }

    try {
        const session = await prisma.session.findUnique({
            where: { id: sessionId },
            select: { csrfToken: true }
        })

        if (!session || !session.csrfToken) {
            return false
        }

        return session.csrfToken === clientToken
    } catch {
        return false
    }
}