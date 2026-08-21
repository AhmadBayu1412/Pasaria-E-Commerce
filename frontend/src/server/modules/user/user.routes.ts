import { authenticate } from "../auth/auth.middleware"
import { authorize } from "../authorization/index"
import { getMeController, getUserByIdController } from "./user.controller"
import { Router } from "express"



const router = Router()

/**
 * Get /users/me
 * Get current authenticated user profile
 * Accessible oleh: semua authenticated users
 */
router.get("/me", authenticate, getMeController)

/**
 * GET /users/:id
 * Get user by ID
 * Accessible oleh: ADMIN only
 */
router.get("/:id", authenticate, authorize("ADMIN"), getUserByIdController)

export default router