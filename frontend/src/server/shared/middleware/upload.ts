// shared/middleware/upload.ts

// ============================================================
// MULTER UPLOAD CONFIG (Phase 3 Step 5)
// Single file upload for product images
// ============================================================

import multer from "multer"
import type { Request } from "express"
import type { FileFilterCallback } from "multer"

// Memory storage - file buffer untuk disimpan manual
const storage = multer.memoryStorage()

// File filter - hanya image yang diperbolehkan
const fileFilter = (
    _req: Request,
    file: Express.Multer.File,
    cb: FileFilterCallback
) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"]

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true)
    } else {
        cb(new Error(`Tipe file tidak diperbolehkan. Hanya: ${allowedTypes.join(", ")}`))
    }
}

// Multer instance - 5MB max, single file
export const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
        files: 1
    }
})
