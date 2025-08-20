const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addIndexes() {
  try {
    // Add indexes to optimize dashboard queries
    console.log('Adding indexes to tbl_imei...');
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_imei_status_item_imei ON tbl_imei (status, item_imei)`;
    
    console.log('Adding indexes to tbl_purchases...');
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_purchases_imei_qc ON tbl_purchases (item_imei, qc_required, qc_completed)`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_purchases_imei_date ON tbl_purchases (item_imei, date)`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_purchases_imei_repair ON tbl_purchases (item_imei, repair_required, repair_completed)`;
    
    console.log('Indexes added successfully!');
  } catch (error) {
    console.error('Error adding indexes:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addIndexes();