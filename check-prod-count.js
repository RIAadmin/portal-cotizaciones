const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "mysql://riaindus_cotizaciones:Ria_Portal_2026_!@riaindustrial.com.mx:3306/riaindus_portal_cotizaciones"
    }
  }
});

async function check() {
  try {
    const count = await prisma.quotation.count();
    console.log("TOTAL_QUOTATIONS:", count);
    const recent = await prisma.quotation.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: { folio: true, description: true }
    });
    console.log("RECENT_QUOTATIONS:", JSON.stringify(recent, null, 2));
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}
check();
