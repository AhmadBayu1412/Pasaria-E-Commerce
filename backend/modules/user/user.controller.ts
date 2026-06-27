import { Request, Response } from "express";
import { BusinessError } from "../../shared/errors/business.error.js";
import { findById } from "./user.service.js";
import { toUserDTO } from "./user.mapper.js";



/**
 * Get current user profile
 * Endpoint: GET /users/me
 */
export async function getMeController(
    req: Request,
    res: Response
): Promise<void> {
    if (!req.user) {
        throw new BusinessError("Authentication diperlukan", 401)
    }

    const user = await findById(req.user.id)

    if (!user) {
        throw new BusinessError("User tidak ditemukan", 404)
    }

    // Pakai toUserDTO mapper - konsisten dengan auth service
    const dto = toUserDTO(user)

    res.status(200).json({
        success: true,
        data: dto
    })
}

/**
 * Get user by ID
 * Endpoint: GET /users/:id
 *
 * Accessible oleh: ADMIN only
 */
export async function getUserByIdController(
    req: Request,
    res: Response
): Promise<void> {
    const userId = Number(req.params.id)

    if (!userId || isNaN(userId)) {
        throw new BusinessError("Invalid user ID", 400)
    }

    const user = await findById(userId)

    if (!user) {
        throw new BusinessError("User tidak ditemukan", 404)
    }

    // Pakai toUserDTO mapper - konsisten dengan auth service
    const dto = toUserDTO(user)

    res.status(200).json({
        success: true,
        data: dto
    })
}