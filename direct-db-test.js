const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function directDbTest() {
  try {
    console.log('Testing direct database queries...');
    
    // Test a simple query to check database connection
    console.time('Simple DB Connection Test');
    const count = await prisma.tbl_purchases.count();
    console.timeEnd('Simple DB Connection Test');
    console.log(`Total purchases in DB: ${count}`);
    
    // Test the QC purchases query directly
    console.time('QC Purchases Query Test');
    const whereClause = 'WHERE qc_required = ?';
    const queryParams = [1];
    const limit = 5;
    const skip = 0;
    
    const purchasesQuery = `
      SELECT
        p.id,
        p.purchase_id,
        p.date,
        p.supplier_id,
        p.tray_id,
        p.qc_required,
        p.qc_completed,
        s.name as supplier_name,
        COUNT(i.item_imei) as device_count
      FROM tbl_purchases p
      LEFT JOIN tbl_suppliers s ON p.supplier_id = s.supplier_id
      LEFT JOIN tbl_imei i ON p.purchase_id = i.purchase_id
      ${whereClause}
      GROUP BY p.id, p.purchase_id, p.date, p.supplier_id, p.tray_id, p.qc_required, p.qc_completed, s.name
      ORDER BY p.purchase_id DESC
      LIMIT ? OFFSET ?
    `;
    
    const paginationParams = [...queryParams, limit, skip];
    const purchases = await prisma.$queryRawUnsafe(
      purchasesQuery, 
      ...paginationParams
    );
    console.timeEnd('QC Purchases Query Test');
    console.log(`Retrieved ${purchases.length} purchases`);
    
    // Test the count query
    console.time('QC Count Query Test');
    const countQuery = `
      SELECT COUNT(DISTINCT purchase_id) as count
      FROM tbl_purchases
      ${whereClause}
    `;
    
    const countResult = await prisma.$queryRawUnsafe(
      countQuery, 
      ...queryParams
    );
    console.timeEnd('QC Count Query Test');
    console.log(`Total QC purchases: ${countResult[0].count}`);
    
    console.log('Direct database tests completed successfully!');
  } catch (error) {
    console.error('Error in direct database tests:', error.message);
    console.error('Error stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

directDbTest();