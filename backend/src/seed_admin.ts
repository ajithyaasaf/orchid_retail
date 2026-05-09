import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const email = 'orchidkidswearhub@gmail.com';
  const password = 'admin'; // Known password for testing
  const hashedPassword = await bcrypt.hash(password, 10);

  const admin = await prisma.user.upsert({
    where: { email },
    update: {
      password: hashedPassword,
      role: 'admin',
    },
    create: {
      email,
      name: 'Admin User',
      password: hashedPassword,
      role: 'admin',
      phone: '+917200879956',
    },
  });

  console.log(`✅ Admin user created/updated:`);
  console.log(`   Email: ${email}`);
  console.log(`   Password: ${password}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
