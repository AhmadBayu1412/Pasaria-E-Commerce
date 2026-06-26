import { Router } from "express";
import { login, logout, register } from "./auth.controller.js";
import { authenticate } from "./auth.middleware.js";

const router = Router()

// ============ PUBLIC ROUTES ============
router.post("/register", register)
router.post("/login", login)

// ============ PROTECTED ROUTES ============
// Semua route di bawah butuh authentication
router.post("/logout", authenticate, logout)

// Note: /me endpoint TIDAK dibuat di step 5
// Nanti akan dibuat di user module (step 6+)
export default router 