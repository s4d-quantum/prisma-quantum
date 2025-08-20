const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testDateFormat() {
  try {
    console.log('Testing date format...');
    
    // Fetch recent purchases to see the date format
    const recentPurchases = await prisma.$queryRaw`
      SELECT
        purchase_id,
        date,
        supplier_id,
        qc_required,
        qc_completed
      FROM tbl_purchases
      ORDER BY date DESC
      LIMIT 5
    `;
    
    console.log('Recent purchases with dates:');
    recentPurchases.forEach((purchase, index) => {
      console.log(`${index + 1}. Purchase ID: ${purchase.purchase_id}`);
      console.log(`   Date value: ${purchase.date}`);
      console.log(`   Date type: ${typeof purchase.date}`);
      console.log(`   Date instanceof Date: ${purchase.date instanceof Date}`);
      console.log(`   Formatted date: ${new Date(purchase.date).toLocaleDateString()}`);
      console.log(`   isNaN check: ${isNaN(new Date(purchase.date).getTime())}`);
      console.log('---');
    });
    
  } catch (error) {
    console.error('Error testing date format:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDateFormat();