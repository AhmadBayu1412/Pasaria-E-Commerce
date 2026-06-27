import { prisma } from "./infra/db/prisma.js"

async function main() {
    // Update roles
    await prisma.user.update({
        where: { email: "admin@test.com" },
        data: { role: "ADMIN" }
    })
    console.log("✅ Admin role updated")

    await prisma.user.update({
        where: { email: "seller@test.com" },
        data: { role: "SELLER" }
    })
    console.log("✅ Seller 1 role updated")

    await prisma.user.update({
        where: { email: "seller2@test.com" },
        data: { role: "SELLER" }
    })
    console.log("✅ Seller 2 role updated")

    // Show all users
    const users = await prisma.user.findMany({
        select: { id: true, email: true, role: true }
    })
    console.log("\n📋 Users:")
    users.forEach(u => console.log(`   ${u.id}. ${u.email} - ${u.role}`))
}

main()
    .then(() => process.exit(0))
    .catch(e => {
        console.error(e)
        process.exit(1)
    })