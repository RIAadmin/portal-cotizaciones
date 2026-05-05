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
    console.log("Creating table 'QuotationUpdate'...");
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS QuotationUpdate (
        id INT AUTO_INCREMENT PRIMARY KEY,
        percentage INT NOT NULL,
        notes TEXT,
        createdAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
        userId INT NOT NULL,
        quotationId INT NOT NULL,
        FOREIGN KEY (userId) REFERENCES User(id),
        FOREIGN KEY (quotationId) REFERENCES Quotation(id)
      )
    `);

    console.log("Creating table 'Payment'...");
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS Payment (
        id INT AUTO_INCREMENT PRIMARY KEY,
        amount DECIMAL(10, 2) NOT NULL,
        date DATETIME(3) NOT NULL,
        createdAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
        quotationId INT NOT NULL,
        FOREIGN KEY (quotationId) REFERENCES Quotation(id)
      )
    `);

    console.log("Tables created successfully.");
  } catch (e) {
    console.error("Error creating tables:", e.message);
  } finally {
    await prisma.$disconnect();
  }
}

fix();
