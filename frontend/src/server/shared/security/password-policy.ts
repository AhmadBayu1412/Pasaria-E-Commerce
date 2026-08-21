import { BusinessError } from "../errors/business.error";

// Password policy validation: Pure function - tidak akses database
export function validatePassword(password: string): void {
    if (password.length < 8) {
        throw new BusinessError("Password minimal 8 karakter", 400)
    }
}