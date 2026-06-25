import { Request, Response, NextFunction } from "express";
import { registerSchema } from "./auth.schema.js";
import { authService } from "./auth.service.js";


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