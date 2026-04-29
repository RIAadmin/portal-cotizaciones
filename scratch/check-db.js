const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const q = await prisma.quotation.findUnique({ where: { id: 6 } });
    console.log('--- START DATA ---');
    console.log(JSON.stringify(q, null, 2));
    console.log('--- END DATA ---');
  } catch (err) {
    console.error('--- START ERROR ---');
    console.error(err.message);
    console.error('--- END ERROR ---');
  } finally {
    await prisma.$disconnect();
  }
}

main();
