const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  try {
    const order = await prisma.order.findFirst({
      orderBy: { createdAt: 'desc' },
      include: { shippingAddress: true }
    });
    console.log('--- LATEST ORDER ---');
    console.log(JSON.stringify(order, null, 2));
    await prisma.$disconnect();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

check();
