import { prisma } from './infra/db/prisma.js';

async function main() {
  console.log('Connecting to database...');

  const targetUsers = await prisma.user.findMany({
    where: {
      email: {
        in: ['ahmadbayusamudera01@gmail.com', 'detective.20.03.2003@gmail.com']
      }
    },
    select: {
      id: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true
    }
  });

  console.log('\n=== TARGET USERS ===');
  console.log('Found:', targetUsers.length);
  targetUsers.forEach(u => {
    console.log(`  ID: ${u.id}, Email: ${u.email}, Role: ${u.role}, Active: ${u.isActive}, Created: ${u.createdAt}`);
  });

  const allUsers = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true
    },
    orderBy: { createdAt: 'desc' }
  });

  console.log('\n=== ALL USERS ===');
  console.log('Total:', allUsers.length);
  allUsers.forEach(u => {
    console.log(`  ID: ${u.id}, Email: ${u.email}, Role: ${u.role}, Active: ${u.isActive}, Created: ${u.createdAt}`);
  });
}

main()
  .catch(e => { console.error('ERROR:', e.message); process.exit(1); })
  .finally(() => { prisma.$disconnect(); console.log('\nDisconnected'); });
