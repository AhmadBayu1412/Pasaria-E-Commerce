import bcrypt from "bcrypt"

const SALT_ROUNDS = 10

// Hash password dengan bcrypt: One-way (tidak bisa di decode), Salt (otomatis per hash)
export async function hashPassword(
    password: string
): Promise<string> {

    return bcrypt.hash(password, SALT_ROUNDS)
}

// Verify plain password === hash
export async function verifyPassword(
    plain: string,
    hashed: string
): Promise<boolean> {
    
    return bcrypt.compare(plain, hashed)
}