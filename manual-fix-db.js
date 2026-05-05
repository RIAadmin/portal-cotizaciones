const { PrismaClient } = require('@prisma/client');

async function fix() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: "mysql://riaindus_cotizaciones:Ria_Portal_2026_!@riaindustrial.com.mx:3306/riaindus_portal_cotizaciones"
      }
    }
  });

  try {
    console.log("Adding column 'progress'...");
    await prisma.$executeRawUnsafe("ALTER TABLE Quotation ADD COLUMN progress INT DEFAULT 0");
    
    console.log("Updating 'status' enum...");
    await prisma.$executeRawUnsafe("ALTER TABLE Quotation MODIFY COLUMN status ENUM('PENDING','OC_UPLOADED','INVOICED','ANTICIPO','CANCELLED') DEFAULT 'PENDING'");
    
    console.log("Database fixed manually.");
  } catch (e) {
    console.error("Error during manual fix:", e.message);
  } finally {
    await prisma.$disconnect();
  }
}

fix();
