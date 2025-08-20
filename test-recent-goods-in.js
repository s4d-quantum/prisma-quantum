const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testRecentGoodsInQuery() {
  try {
    console.log('Testing recent goods in query...');
    
    console.time('Recent goods in query');
    const recentGoodsInRaw = await prisma.$queryRaw`
      SELECT
        p.purchase_id,
        p.date,
        p.supplier_id,
        p.qc_required,
        p.qc_completed,
        s.name as supplier_name,
        COUNT(i.item_imei) as imei_count
      FROM tbl_purchases p
      LEFT JOIN tbl_suppliers s ON p.supplier_id = s.supplier_id
      LEFT JOIN tbl_imei i ON p.purchase_id = i.purchase_id
      GROUP BY p.purchase_id, p.date, p.supplier_id, p.qc_required, p.qc_completed, s.name
      ORDER BY p.date DESC
      LIMIT 10
    `;
    console.timeEnd('Recent goods in query');
    
    console.log('Recent goods in count:', recentGoodsInRaw.length);
    console.log('Sample result:', recentGoodsInRaw[0]);
    
  } catch (error) {
    console.error('Error testing recent goods in query:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testRecentGoodsInQuery();