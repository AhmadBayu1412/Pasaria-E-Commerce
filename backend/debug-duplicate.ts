// Debug script to check for duplicate OrderItems
import { prisma } from './infra/db/prisma.js'

async function checkDuplicates() {
  console.log('=== CHECKING FOR DUPLICATE ORDER ITEMS ===\n')

  // Get all orders with their items count
  const orders = await prisma.order.findMany({
    include: {
      items: {
        select: {
          id: true,
          productId: true,
          productName: true,
          quantity: true,
        }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 20,
  })

  console.log(`Found ${orders.length} recent orders\n`)

  for (const order of orders) {
    console.log(`Order #${order.id} (userId: ${order.userId}, status: ${order.status})`)
    console.log(`  Total items in DB: ${order.items.length}`)
    
    // Check for duplicates
    const productIds = order.items.map(i => i.productId)
    const uniqueProductIds = new Set(productIds)
    
    if (productIds.length !== uniqueProductIds.size) {
      console.log(`  ⚠️  DUPLICATE PRODUCTS DETECTED!`)
      // Group by productId
      const grouped = new Map<number, typeof order.items>()
      for (const item of order.items) {
        if (!grouped.has(item.productId)) {
          grouped.set(item.productId, [])
        }
        grouped.get(item.productId)!.push(item)
      }
      for (const [productId, items] of grouped) {
        if (items.length > 1) {
          console.log(`    Product ${productId}: ${items.length} entries`)
          items.forEach((item, idx) => {
            console.log(`      - Item #${item.id}: qty=${item.quantity}, name="${item.productName}"`)
          })
        }
      }
    }
    
    console.log(`  Items:`)
    order.items.forEach(item => {
      console.log(`    - Product #${item.productId} "${item.productName}": qty=${item.quantity}`)
    })
    console.log()
  }

  // Also check CartItems for comparison
  console.log('\n=== RECENT CART ITEMS ===')
  const recentCarts = await prisma.cart.findMany({
    include: { items: true },
    orderBy: { updatedAt: 'desc' },
    take: 5,
  })

  for (const cart of recentCarts) {
    console.log(`Cart #${cart.id} (userId: ${cart.userId})`)
    console.log(`  Items: ${cart.items.length}`)
    cart.items.forEach(item => {
      console.log(`    - Product #${item.productId}: qty=${item.quantity}`)
    })
  }
}

checkDuplicates()
  .then(() => {
    console.log('\n✅ Check complete')
    process.exit(0)
  })
  .catch(err => {
    console.error('❌ Error:', err)
    process.exit(1)
  })
