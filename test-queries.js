const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testQueries() {
  try {
    console.log('Testing individual queries...');
    
    // Test 1: Simple count query
    console.time('Simple count query');
    const count = await prisma.tbl_imei.count();
    console.timeEnd('Simple count query');
    console.log('Total IMEI count:', count);
    
    // Test 2: Recent orders query
    console.time('Recent orders query');
    const recentOrders = await prisma.$queryRaw`
      SELECT
        o.id,
        o.order_id,
        o.customer_id,
        o.item_imei,
        o.date,
        o.po_box,
        o.tracking_no,
        c.name as customer_name
      FROM tbl_orders o
      LEFT JOIN tbl_customers c ON o.customer_id = c.customer_id
      ORDER BY o.date DESC
      LIMIT 5
    `;
    console.timeEnd('Recent orders query');
    console.log('Recent orders count:', recentOrders.length);
    
    // Test 3: Available stock query
    console.time('Available stock query');
    const availableStock = await prisma.$queryRaw`
      SELECT COUNT(DISTINCT i.item_imei) as count
      FROM tbl_imei i
      JOIN tbl_purchases p ON p.item_imei = i.item_imei
      WHERE i.status = 1
        AND (
          p.qc_required = 0
          OR (p.qc_required = 1 AND p.qc_completed = 1)
        )
        AND (
          p.repair_required = 0
          OR (p.repair_required = 1 AND p.repair_completed = 1)
        )
    `;
    console.timeEnd('Available stock query');
    console.log('Available stock count:', availableStock[0].count);
    
    // Test 4: Pending QC query
    console.time('Pending QC query');
    const pendingQC = await prisma.$queryRaw`
      SELECT COUNT(DISTINCT i.item_imei) as count
      FROM tbl_imei i
      JOIN tbl_purchases p ON p.item_imei = i.item_imei
      WHERE i.status = 1
        AND p.qc_required = 1
        AND p.qc_completed = 0
    `;
    console.timeEnd('Pending QC query');
    console.log('Pending QC count:', pendingQC[0].count);
    
  } catch (error) {
    console.error('Error testing queries:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testQueries();