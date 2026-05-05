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
    const tables = await prisma.$queryRaw`SHOW TABLES`;
    console.log(JSON.stringify(tables, null, 2));
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

check();
