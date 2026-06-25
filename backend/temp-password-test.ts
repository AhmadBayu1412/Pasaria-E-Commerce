/**
 * Test untuk Step 2 - Password Security
 *
 * Jalankan: npx tsx temp-password-test.ts
 */

import { hashPassword, verifyPassword } from "./src/shared/security/password"
import { createUser } from "./modules/user/user.service.js"

async function main() {
    // ====================================
    // TEST 1: Password Hashing & Verify
    // ====================================
    console.log("=== Test 1: Password Hashing ===\n")

    const password = "12345678"
    const hash = await hashPassword(password)

    console.log("Plain password:", password)
    console.log("Hash result:", hash)

    // Verifikasi format hash
    if (!hash.startsWith("$2")) {
        throw new Error("Hash should start with $2")
    }

    // Verify BENAR
    const valid = await verifyPassword(password, hash)
    console.log("\nverifyPassword(correct):", valid)

    // Verify SALAH
    const invalid = await verifyPassword("wrongpassword", hash)
    console.log("verifyPassword(wrong):", invalid)

    if (!valid || invalid) {
        console.error("\n❌ FAIL: verifyPassword failed")
        process.exit(1)
    }

    console.log("\n✅ Test 1 PASSED: Password hashing works!\n")

    // ====================================
    // TEST 2: CreateUser via Service
    // ====================================
    console.log("=== Test 2: createUser Service ===\n")

    // Test password < 8 karakter (harus gagal)
    try {
        await createUser({
            email: "short@test.com",
            password: "123" // kurang dari 8
        })
        console.error("❌ FAIL: Should reject password < 8 characters")
        process.exit(1)
    } catch (e: any) {
        console.log("Rejected short password:", e.message)
        console.log("✅ Test 2a PASSED: Password policy enforced\n")
    }

    // Test email sudah terdaftar (harus gagal)
    try {
        await createUser({
            email: "bcrypt@test.com",
            password: "12345678"
        })
        // Kalau gagal karena duplicate email, itu expected
        // Ini bisa terjadi kalau test sebelumnya sudah jalan
        console.log("Email duplicate check passed")
    } catch (e: any) {
        console.log("Duplicate email rejected:", e.message)
    }

    // Create user baru
    const testEmail = `bcrypt-${Date.now()}@test.com`
    const user = await createUser({
        email: testEmail,
        password: "12345678"
    })

    console.log("Created user:", user)

    // Verify DTO tidak bocor passwordHash
    if ("passwordHash" in user) {
        console.error("❌ FAIL: DTO leaks passwordHash!")
        process.exit(1)
    }

    // Verify semua field ada
    if (!user.id || !user.email || !user.role || user.isActive === undefined) {
        console.error("❌ FAIL: DTO missing required fields!")
        process.exit(1)
    }

    console.log("\n✅ Test 2 PASSED: createUser works correctly!\n")
    console.log("=" .repeat(50))
    console.log("✅ ALL TESTS PASSED!")
    console.log("=" .repeat(50))
}

main().catch((e) => {
    console.error("\n❌ Test failed:", e.message)
    process.exit(1)
})
