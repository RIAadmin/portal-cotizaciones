const { PrismaClient } = require('@prisma/client');

async function check() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: "mysql://riaindus_cotizaciones:Ria_Portal_2026_!@riaindustrial.com.mx:3306/riaindus_portal_cotizaciones"
      }
    }
  });

  try {
    const quotations = await prisma.quotation.findMany({
      select: { folio: true, status: true, isPaid: true }
    });
    console.log(JSON.stringify(quotations, null, 2));
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

check();
