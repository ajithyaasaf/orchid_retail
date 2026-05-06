import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    where: {
      role: { in: ['admin', 'super_admin'] }
    },
    select: {
      email: true,
      role: true
    }
  });

  console.log('--- Current Admin Accounts ---');
  users.forEach(u => console.log(`${u.email} -> Role: ${u.role}`));
}

main().finally(() => prisma.$disconnect());
