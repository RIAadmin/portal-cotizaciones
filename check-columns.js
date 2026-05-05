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
    const columns = await prisma.$queryRaw`SHOW COLUMNS FROM Quotation`;
    console.log(JSON.stringify(columns, null, 2));
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

check();
