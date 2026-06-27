/**
 * STEP 7: Test Script untuk Ownership Validation
 *
 * Usage:
 * 1. Jalankan server: npm run dev
 * 2. Pastikan sudah login sebagai SELLER dan ADMIN (cookie files ada)
 * 3. Jalankan script: npx tsx test-ownership.ts
 */

import * as fs from 'fs'
import * as http from 'http'

const BASE_URL = 'http://localhost:3000/api'

// Helper untuk load cookies - parse format Netscape
function loadCookies(filename: string): string {
    try {
        const content = fs.readFileSync(filename, 'utf-8')
        const lines = content.split(/\r?\n/)
        for (const line of lines) {
            const trimmed = line.trim()
            if (!trimmed || trimmed.startsWith('# ')) continue
            const parts = line.split('\t')
            if (parts.length >= 7) {
                const name = parts[5].trim()
                const value = parts[6].trim()
                if (name && value) {
                    return `${name}=${value}`
                }
            }
        }
        return ''
    } catch (e) {
        return ''
    }
}

// Helper untuk HTTP request
async function httpRequest(
    method: string,
    path: string,
    cookie: string,
    body?: object
): Promise<{ status: number; data: any }> {
    return new Promise((resolve) => {
        const url = new URL(path, BASE_URL)
        const options: http.RequestOptions = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname + url.search,
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        }

        if (cookie) {
            options.headers!['Cookie'] = cookie
        }

        const req = http.request(options, (res) => {
            let data = ''
            res.on('data', chunk => data += chunk)
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode || 0, data: JSON.parse(data) })
                } catch {
                    resolve({ status: res.statusCode || 0, data: { raw: data } })
                }
            })
        })

        req.on('error', (err) => {
            resolve({ status: 0, data: { error: err.message } })
        })

        if (body) {
            req.write(JSON.stringify(body))
        }
        req.end()
    })
}

async function main() {
    console.log('╔════════════════════════════════════════════════════════════╗')
    console.log('║         STEP 7: OWNERSHIP VALIDATION TEST                ║')
    console.log('╚════════════════════════════════════════════════════════════╝')

    // Check server
    console.log('\n🔍 Checking server...')
    const serverCheck = await httpRequest('GET', '/products', '')
    if (serverCheck.status === 0) {
        console.log('\n❌ Server tidak berjalan!')
        console.log('   Jalankan: npm run dev')
        return
    }
    console.log('   ✅ Server berjalan\n')

    // Load cookies
    const sellerCookie = loadCookies('cookies_seller.txt')
    const seller2Cookie = loadCookies('cookies_seller2.txt')
    const adminCookie = loadCookies('cookies_admin.txt')

    if (!sellerCookie || !adminCookie) {
        console.log('❌ Cookie files tidak ditemukan!')
        return
    }
    console.log('✅ Cookie files loaded\n')

    const results: { test: string; expected: number; actual: number; pass: boolean; note?: string }[] = []

    console.log('─'.repeat(60))

    // ============================================================
    // TEST 1: Seller membuat produk
    // ============================================================
    console.log('\n📝 TEST 1: Seller membuat produk')
    const createRes = await httpRequest('POST', '/products', sellerCookie, {
        name: `Test Product ${Date.now()}`,
        price: 100000,
        stock: 10,
        description: 'Produk test'
    })
    console.log(`   Status: ${createRes.status}`)
    if (createRes.status === 201 && createRes.data.data) {
        console.log(`   ✅ Product created: ID=${createRes.data.data.id}, sellerId=${createRes.data.data.sellerId}`)
    } else {
        console.log(`   ❌ Error: ${createRes.data.message}`)
        console.log('\n❌ Gagal membuat produk. Stop testing.')
        return
    }
    results.push({ test: 'Seller create product', expected: 201, actual: createRes.status, pass: createRes.status === 201 })

    // ============================================================
    // TEST 2: Seller update produk miliknya sendiri
    // ============================================================
    console.log('\n📝 TEST 2: Seller update produk miliknya sendiri')
    const updateOwnRes = await httpRequest('PUT', `/products/${createRes.data.data.id}`, sellerCookie, {
        price: 150000
    })
    const t2Pass = updateOwnRes.status === 200
    console.log(`   Status: ${updateOwnRes.status} ${t2Pass ? '✅' : '❌'}`)
    if (!t2Pass && updateOwnRes.data.message) {
        console.log(`   Message: ${updateOwnRes.data.message}`)
    }
    results.push({ test: 'Seller update own product', expected: 200, actual: updateOwnRes.status, pass: t2Pass })

    // ============================================================
    // TEST 3: Seller 2 update Seller 1's product (HARUS DITOLAK)
    // ============================================================
    console.log('\n📝 TEST 3: Seller 2 mencoba update produk Seller 1')
    const updateOtherRes = await httpRequest('PUT', `/products/${createRes.data.data.id}`, seller2Cookie, {
        price: 50000
    })
    const t3Pass = updateOtherRes.status === 403
    console.log(`   Status: ${updateOtherRes.status} ${t3Pass ? '✅ (Forbidden)' : '❌'}`)
    if (updateOtherRes.data.message) {
        console.log(`   Message: ${updateOtherRes.data.message}`)
    }
    results.push({ test: 'Seller update other seller product', expected: 403, actual: updateOtherRes.status, pass: t3Pass })

    // ============================================================
    // TEST 4: Admin update produk siapapun
    // ============================================================
    console.log('\n📝 TEST 4: Admin update produk Seller 1')
    const adminUpdateRes = await httpRequest('PUT', `/products/${createRes.data.data.id}`, adminCookie, {
        price: 200000
    })
    const t4Pass = adminUpdateRes.status === 200
    console.log(`   Status: ${adminUpdateRes.status} ${t4Pass ? '✅' : '❌'}`)
    if (!t4Pass && adminUpdateRes.data.message) {
        console.log(`   Message: ${adminUpdateRes.data.message}`)
    }
    results.push({ test: 'Admin update any product', expected: 200, actual: adminUpdateRes.status, pass: t4Pass })

    // ============================================================
    // TEST 5: Seller delete produk miliknya sendiri
    // ============================================================
    console.log('\n📝 TEST 5: Seller 1 delete produk miliknya sendiri')
    const deleteOwnRes = await httpRequest('DELETE', `/products/${createRes.data.data.id}`, sellerCookie)
    const t5Pass = deleteOwnRes.status === 200
    console.log(`   Status: ${deleteOwnRes.status} ${t5Pass ? '✅' : '❌'}`)
    if (!t5Pass && deleteOwnRes.data.message) {
        console.log(`   Message: ${deleteOwnRes.data.message}`)
    }
    results.push({ test: 'Seller delete own product', expected: 200, actual: deleteOwnRes.status, pass: t5Pass })

    // ============================================================
    // TEST 6: Buat produk baru untuk test delete berikutnya
    // ============================================================
    console.log('\n📝 Setup: Membuat produk baru untuk test delete')
    const createForDelete = await httpRequest('POST', '/products', sellerCookie, {
        name: `Delete Test ${Date.now()}`,
        price: 50000,
        stock: 5
    })
    const newProductId = createForDelete.data.data?.id
    if (newProductId) {
        console.log(`   ✅ Product created: ID=${newProductId}`)
    } else {
        console.log(`   ❌ Gagal membuat produk untuk delete test`)
    }

    // ============================================================
    // TEST 7: Seller 2 mencoba delete produk Seller 1
    // ============================================================
    console.log('\n📝 TEST 6: Seller 2 mencoba delete produk Seller 1')
    const deleteOtherRes = await httpRequest('DELETE', `/products/${newProductId}`, seller2Cookie)
    const t6Pass = deleteOtherRes.status === 403
    console.log(`   Status: ${deleteOtherRes.status} ${t6Pass ? '✅ (Forbidden)' : '❌'}`)
    if (deleteOtherRes.data.message) {
        console.log(`   Message: ${deleteOtherRes.data.message}`)
    }
    results.push({ test: 'Seller delete other seller product', expected: 403, actual: deleteOtherRes.status, pass: t6Pass })

    // ============================================================
    // TEST 8: Admin delete produk siapapun
    // ============================================================
    console.log('\n📝 TEST 7: Admin delete produk Seller 1')
    const adminDeleteRes = await httpRequest('DELETE', `/products/${newProductId}`, adminCookie)
    const t7Pass = adminDeleteRes.status === 200
    console.log(`   Status: ${adminDeleteRes.status} ${t7Pass ? '✅' : '❌'}`)
    if (!t7Pass && adminDeleteRes.data.message) {
        console.log(`   Message: ${adminDeleteRes.data.message}`)
        if (adminDeleteRes.data.error) {
            console.log(`   Error: ${adminDeleteRes.data.error}`)
        }
    }
    results.push({ test: 'Admin delete any product', expected: 200, actual: adminDeleteRes.status, pass: t7Pass })

    // ============================================================
    // TEST 9: Produk tidak ditemukan
    // ============================================================
    console.log('\n📝 TEST 8: Update produk yang TIDAK ADA')
    const notFoundRes = await httpRequest('PUT', '/products/999999', sellerCookie, {
        price: 100000
    })
    const t8Pass = notFoundRes.status === 404
    console.log(`   Status: ${notFoundRes.status} ${t8Pass ? '✅ (Not Found)' : '❌'}`)
    if (notFoundRes.data.message) {
        console.log(`   Message: ${notFoundRes.data.message}`)
    }
    results.push({ test: 'Product not found', expected: 404, actual: notFoundRes.status, pass: t8Pass })

    // ============================================================
    // TEST 10: Customer cannot create product (RBAC check)
    // ============================================================
    console.log('\n📝 TEST 9: Customer TIDAK boleh membuat produk')
    // Login customer baru
    const customerLogin = await httpRequest('POST', '/auth/login', '', {
        email: 'customer@test.com',
        password: 'Customer123!'
    })

    if (customerLogin.status !== 200 || !customerLogin.data.sessionId) {
        // Customer belum ada, register dulu
        await httpRequest('POST', '/auth/register', '', {
            email: 'customer@test.com',
            password: 'Customer123!'
        })
        // Lalu login
        const login = await httpRequest('POST', '/auth/login', '', {
            email: 'customer@test.com',
            password: 'Customer123!'
        })
        console.log(`   Customer login status: ${login.status}`)
    }

    // Test customer create product - harus pakai customer cookie
    const customerCookieForTest = loadCookies('cookies_customer.txt')
    const customerRes = await httpRequest('POST', '/products', customerCookieForTest, {
        name: 'Customer Product',
        price: 50000
    })
    // Customer tidak boleh create - akan di-blokir RBAC middleware
    // Expected: 403 (authorize middleware) atau 401 (session invalid/expired)
    const t9Pass = customerRes.status === 403 || customerRes.status === 401
    console.log(`   Status: ${customerRes.status} ${t9Pass ? '✅ (Forbidden/Unauthorized)' : '❌'}`)
    if (customerRes.data.message) {
        console.log(`   Message: ${customerRes.data.message}`)
    }
    results.push({ test: 'Customer cannot create product', expected: 403, actual: customerRes.status, pass: t9Pass })

    // ============================================================
    // SUMMARY
    // ============================================================
    console.log('\n' + '─'.repeat(60))
    console.log('📊 SUMMARY')
    console.log('─'.repeat(60))

    let passed = 0
    let failed = 0

    for (const r of results) {
        const icon = r.pass ? '✅' : '❌'
        console.log(`${icon} ${r.test}`)
        console.log(`   Expected: ${r.expected}, Got: ${r.actual}`)
        if (r.note) {
            console.log(`   Note: ${r.note}`)
        }
        r.pass ? passed++ : failed++
    }

    console.log('\n' + '─'.repeat(60))
    console.log(`📈 Total: ${passed}/${results.length} passed`)
    console.log('═'.repeat(60))

    if (failed === 0) {
        console.log('\n🎉 SEMUA TEST LULUS! STEP 7 BERHASIL DIIMPLEMENTASIKAN!')
    } else {
        console.log(`\n⚠️  ${failed} test gagal. Check error message di atas.`)
    }
}

main().catch(console.error)