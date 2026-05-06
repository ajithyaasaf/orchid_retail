import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('admin123', 10);

  // 1. Ensure a Super Admin exists
  await prisma.user.upsert({
    where: { email: 'superadmin@orchidhub.in' },
    update: { 
      role: 'super_admin',
      password: password 
    },
    create: {
      email: 'superadmin@orchidhub.in',
      name: 'Super Admin',
      password,
      role: 'super_admin',
      phone: '+910000000000'
    },
  });

  // 2. Ensure a Standard Admin exists
  await prisma.user.upsert({
    where: { email: 'admin@orchidhub.in' },
    update: { 
      role: 'admin',
      password: password 
    },
    create: {
      email: 'admin@orchidhub.in',
      name: 'Staff Admin',
      password,
      role: 'admin',
      phone: '+911111111111'
    },
  });

  console.log('✅ Accounts set up:');
  console.log('1. Super Admin: superadmin@orchidhub.in / admin123');
  console.log('2. Standard Admin: admin@orchidhub.in / admin123');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
