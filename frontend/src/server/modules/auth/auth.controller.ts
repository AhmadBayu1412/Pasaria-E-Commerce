import { Request, Response, NextFunction } from "express"
import { loginSchema, registerSchema } from "./auth.schema"
import { authService } from "./auth.service"
import { SESSION_CONFIG } from "../../shared/session/session.config"
import {
    generateCsrfToken,
    storeCsrfToken,
    setCsrfCookie,
    deleteCsrfToken,
    clearCsrfCookie
} from "../../shared/security/csrf"

// ============ REGISTER ============
export async function register(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const result = registerSchema.safeParse(req.body)

        if (!result.success) {
            return res.status(400).json({
                error: {
                    code: "VALIDATION_ERROR",
                    message: "Input tidak valid"
                }
            })
        }

        const user = await authService.register(result.data)

        return res.status(201).json({ data: user })
    } catch (error) {
        next(error)
    }
}

// ============ LOGIN ============
export async function login(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const result = loginSchema.safeParse(req.body)

        if (!result.success) {
            return res.status(400).json({
                error: {
                    code: "VALIDATION_ERROR",
                    message: "Input tidak valid"
                }
            })
        }

        const { user, sessionId } = await authService.login(result.data)

        // Set session cookie
        res.cookie(
            SESSION_CONFIG.cookieName,
            sessionId,
            {
                ...SESSION_CONFIG.cookie,
                maxAge: SESSION_CONFIG.ttl * 1000
            }
        )

        // Generate & store CSRF token untuk session baru
        const csrfToken = generateCsrfToken()
        await storeCsrfToken(sessionId, csrfToken)
        setCsrfCookie(res, csrfToken)

        return res.status(200).json({ data: { user } })
    } catch (error) {
        next(error)
    }
}

// ============ LOGOUT ============
export async function logout(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const sessionId = req.user?.sessionId

        if (sessionId) {
            await authService.logout(sessionId)
            // Hapus CSRF token juga
            await deleteCsrfToken(sessionId)
        }

        // Clear session cookie
        res.clearCookie(SESSION_CONFIG.cookieName, {
            ...SESSION_CONFIG.cookie,
            maxAge: 0
        })

        // Clear CSRF cookie
        clearCsrfCookie(res)

        return res.status(200).json({
            data: { message: "Logout berhasil" }
        })
    } catch (error) {
        next(error)
    }
}