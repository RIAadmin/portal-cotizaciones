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
    const users = await prisma.user.count();
    const quotations = await prisma.quotation.count();
    const clients = await prisma.client.count();
    console.log(`PRODUCTION -> Users: ${users}, Quotations: ${quotations}, Clients: ${clients}`);
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

check();
