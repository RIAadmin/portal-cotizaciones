const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  try {
    const users = await prisma.user.count();
    const quotations = await prisma.quotation.count();
    const clients = await prisma.client.count();
    console.log(`Users: ${users}, Quotations: ${quotations}, Clients: ${clients}`);
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

check();
