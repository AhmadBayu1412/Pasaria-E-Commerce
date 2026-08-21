import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { BusinessError } from "../errors/business.error";

export function errorMiddleware(
    err: any,
    req: Request,
    res: Response,
    next: NextFunction
) {
    if (res.headersSent) {
        return next(err)
    }

    // Zod validation error
    if (err instanceof ZodError) {
        return res.status(400).json({
            error: {
                code: "VALIDATION_ERROR",
                message: "Input tidak valid",
                details: err.flatten()
            }
        })
    }

    // Business error (custom validation, conflicts, etc.)
    if (err instanceof BusinessError) {
        return res.status(err.statusCode).json({
            error: {
                code: err.code || "BUSINESS_ERROR",
                message: err.message
            }
        })
    }

    // Generic error - Log for Vercel diagnostic
    console.error("[SERVER ERROR]", err)

    const statusCode = err.statusCode || err.status || 500

    return res
        .status(statusCode)
        .json({
            success: false,
            error: {
                code: err.code || "INTERNAL_SERVER_ERROR",
                message: err.message || "Terjadi kesalahan internal pada server",
                details: process.env.NODE_ENV !== "production" ? err.stack : undefined
            }
        })
}