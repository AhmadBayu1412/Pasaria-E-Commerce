import type { Request } from "express"
import type { AuthenticatedUser } from "../types/auth.types"
import type { UserRole } from "../types/auth.types"
import { AUTH_ERRORS } from "../errors/auth.errors"

/**
 * Ambil current user dari request
 * Throw error jika tidak ada
 */
export function requireUser(req: Request): AuthenticatedUser {
    if (!req.user) {
        throw AUTH_ERRORS.authRequired
    }
    return req.user
}

/**
 * Alias untuk requireUser
 */
export const getCurrentUser = requireUser

/**
 * Cek apakah user adalah ADMIN
 */
export function isAdmin(user: AuthenticatedUser): boolean {
    return user.role === "ADMIN"
}

/**
 * Cek apakah user adalah SELLER
 */
export function isSeller(user: AuthenticatedUser): boolean {
    return user.role === "SELLER"
}

/**
 * Cek apakah user adalah CUSTOMER
 */
export function isCustomer(user: AuthenticatedUser): boolean {
    return user.role === "CUSTOMER"
}

/**
 * Cek apakah user memiliki role tertentu
 */
export function hasRole(user: AuthenticatedUser, ...roles: UserRole[]): boolean {
    return roles.includes(user.role)
}

/**
 * Cek apakah user adalah ADMIN atau SELLER
 */
export function isPrivileged(user: AuthenticatedUser): boolean {
    return user.role === "ADMIN" || user.role === "SELLER"
}
