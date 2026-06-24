import 'dotenv/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from './generated/prisma/client.js'

async function test() {
  console.log('DATABASE_URL:', process.env.DATABASE_URL)

  try {
    const adapter = new PrismaPg({
      connectionString: process.env.DATABASE_URL!,
    })

    const prisma = new PrismaClient({ adapter })
    const result = await prisma.$queryRaw`SELECT 1 as test`
    console.log('Result:', result)
    await prisma.$disconnect()
    console.log('SUCCESS!')
  } catch (err: any) {
    console.error('Error:', err.message)
  }
}

test()
