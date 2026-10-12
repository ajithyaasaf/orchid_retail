import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('admin123', 10);

  // 1. Primary Super Admin
  await prisma.user.upsert({
    where: { email: 'superadmin@orchidhub.in' },
    update: {
      role: 'super_admin',
      password: password,
      name: 'Super Admin',
    },
    create: {
      email: 'superadmin@orchidhub.in',
      name: 'Super Admin',
      password,
      role: 'super_admin',
      phone: '+919999999999',
    },
  });

  // 2. Primary Standard Admin
  await prisma.user.upsert({
    where: { email: 'admin@orchidhub.in' },
    update: {
      role: 'admin',
      password: password,
      name: 'Admin',
    },
    create: {
      email: 'admin@orchidhub.in',
      name: 'Admin',
      password,
      role: 'admin',
      phone: '+918888888888',
    },
  });

  // 3. Fallback Super Admin
  await prisma.user.upsert({
    where: { email: 'orchidkidswearhub@gmail.com' },
    update: {
      role: 'super_admin',
      password: password,
      name: 'Super Admin',
    },
    create: {
      email: 'orchidkidswearhub@gmail.com',
      name: 'Super Admin',
      password,
      role: 'super_admin',
      phone: '+917200879956',
    },
  });

  console.log('✅ Accounts set up successfully:');
  console.log('1. Super Admin: superadmin@orchidhub.in / admin123');
  console.log('2. Standard Admin: admin@orchidhub.in / admin123');
  console.log('3. Super Admin: orchidkidswearhub@gmail.com / admin123');
}

main()
  .catch((e) => {
    console.error('Error in seed_test_admins:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
