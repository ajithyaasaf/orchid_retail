import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('admin123', 10);

  // 1. Ensure a Super Admin exists
  await prisma.user.upsert({
    where: { email: 'orchidkidswearhub@gmail.com' },
    update: { 
      role: 'super_admin',
      password: password 
    },
    create: {
      email: 'orchidkidswearhub@gmail.com',
      name: 'Super Admin',
      password,
      role: 'super_admin',
      phone: '+917200879956'
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
      phone: '+917200879956'
    },
  });

  console.log('✅ Accounts set up:');
  console.log('1. Super Admin: orchidkidswearhub@gmail.com / admin123');
  console.log('2. Standard Admin: admin@orchidhub.in / admin123');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
