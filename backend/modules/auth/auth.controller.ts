import { Request, Response, NextFunction } from "express";
import { loginSchema, registerSchema } from "./auth.schema.js";
import { authService } from "./auth.service.js";
import { SESSION_CONFIG } from "../../shared/session/session.config.js";

// ============ REGISTER ============
export async function register(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        // 1. Safe parse - tidak throw, return result
        const result = registerSchema.safeParse(req.body)

        if (!result.success) {
            // Zod validation error
            return res.status(400).json({
                error: {
                    code: "VALIDATION_ERROR",
                    message: "Input tidak valid",
                    details: result.error.flatten()
                }
            })
        }

        // 2. Delegate ke auth service
        const user = await authService.register(result.data)

        // 3. Return DTO (tanpa bungkus success)
        return res.status(201).json({
            data: user
        })
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
                    message: "Input tidak valid",
                    details: result.error.flatten()
                }
            })
        }

        // Login - returns user + sessionId
        const {user, sessionId} = await authService.login(result.data)

        // Set HttpOnly cookie
        res.cookie(
            SESSION_CONFIG.cookieName,
            sessionId,
            {
                ...SESSION_CONFIG.cookie,
                maxAge: SESSION_CONFIG.ttl * 1000 // convert to ms
            }
        )

        // Return nested { user } for future JWT compatibility
        return res.status(200).json({
            data: { user }
        })
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
        // req.user.sessionId sudah ada di middleware
        const sessionId = req.user?.sessionId

        if (sessionId) {
            await authService.logout(sessionId)
        }

        // Hapus cookie
        res.clearCookie(SESSION_CONFIG.cookieName, {
            ...SESSION_CONFIG.cookie,
            maxAge: 0
        })

        return res.status(200).json({
            data: { message: "Logout berhasil" }
        })
    } catch (error) {
        next(error)
    }
}