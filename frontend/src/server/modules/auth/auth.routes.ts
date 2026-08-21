import { Router } from "express"
import { login, logout, register } from "./auth.controller"
import { authenticate } from "./auth.middleware"
import { rateLimit } from "../../shared/security/rate-limit"
import { validateCsrf } from "../../shared/security/csrf"

const router = Router()

// ============ PUBLIC ROUTES ============
// Rate limiter dipasang per endpoint
router.post("/register", rateLimit("register"), register)
router.post("/login", rateLimit("login"), login)

// ============ PROTECTED ROUTES ============
// CSRF validation untuk endpoint yang memodifikasi data
router.post("/logout", authenticate, validateCsrf, logout)

export default router