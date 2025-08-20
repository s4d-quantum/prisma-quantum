const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addQCIndexes() {
  try {
    // Add indexes to optimize QC queries
    console.log('Adding indexes to tbl_purchases...');
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_purchases_qc_supplier ON tbl_purchases (qc_required, qc_completed, supplier_id)`;
    
    console.log('Adding indexes to tbl_qc_imei_products...');
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_qc_imei_item_code_purchase ON tbl_qc_imei_products (item_code, purchase_id)`;
    
    console.log('QC indexes added successfully!');
  } catch (error) {
    console.error('Error adding QC indexes:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addQCIndexes();