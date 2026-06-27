

/**
 * Authorization Middleware Factory
 * 
 * Prinsip step 6
 * 1. Sepaaration of Responsibility - authorize() murni soal ROLE
 * 2. Fail Secure - jika role tidak dikenali, default: 403
 * 3. Reusable - sekali buat, semua module pakai
 * 
 * @param allowedRoles - role yang BOLEH akses endpoint
 * @return Express middleware yang mengecek role user
 * 
 * Usage:
 * - authorize("ADMIN") - hanya ADMIN
 * - authorize("ADMIN", "SELLER") - ADMIN atau SELLER
 */

import { Response, Request, NextFunction } from "express";
import type { UserRole } from "../user/types/user.types.js";
import { BusinessError } from "../../shared/errors/business.error.js";

export function authorize(...allowedRoles: UserRole[]) {
    return (
        req: Request,
        _res: Response,
        next: NextFunction
    ): void => {
        try {
            // Pastikan request sudah melewati authenticate()
            if (!req.user) {
                throw new BusinessError(
                    "Authentication diperlukan sebelum authorization", 401
                )
            }

            const userRole = req.user.role

            // Cek apakah role user termasuk dalam allowed roles
            if (!allowedRoles.includes(userRole)) {
                throw new BusinessError(
                    `Role "${userRole}" tidak memiliki akses ke endpoint ini`, 403
                )
            }
            // User authorized - lanjut ke controller
            next()
        } catch (error) {
            next(error)
        }
    }
}