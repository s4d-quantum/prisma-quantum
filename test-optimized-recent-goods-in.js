const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testOptimizedRecentGoodsInQuery() {
  try {
    console.log('Testing optimized recent goods in query...');
    
    // Step 1: Fetch recent purchases
    console.time('Step 1: Fetch recent purchases');
    const recentPurchases = await prisma.$queryRaw`
      SELECT
        purchase_id,
        date,
        supplier_id,
        qc_required,
        qc_completed
      FROM tbl_purchases
      ORDER BY date DESC
      LIMIT 10
    `;
    console.timeEnd('Step 1: Fetch recent purchases');
    
    console.log('Recent purchases count:', recentPurchases.length);
    
    // Step 2: Fetch supplier information for these purchases
    console.time('Step 2: Fetch supplier information');
    const supplierIds = recentPurchases.map(p => p.supplier_id);
    const suppliers = await prisma.tbl_suppliers.findMany({
      where: {
        supplier_id: {
          in: supplierIds
        }
      }
    });
    console.timeEnd('Step 2: Fetch supplier information');
    
    // Create a supplier map for quick lookup
    const supplierMap = {};
    suppliers.forEach(supplier => {
      supplierMap[supplier.supplier_id] = supplier;
    });
    
    // Step 3: Fetch IMEI counts for these purchases
    console.time('Step 3: Fetch IMEI counts');
    const purchaseIds = recentPurchases.map(p => p.purchase_id);
    const imeiCounts = await prisma.tbl_imei.groupBy({
      by: ['purchase_id'],
      _count: {
        item_imei: true
      },
      where: {
        purchase_id: {
          in: purchaseIds
        }
      }
    });
    console.timeEnd('Step 3: Fetch IMEI counts');
    
    // Create an IMEI count map for quick lookup
    const imeiCountMap = {};
    imeiCounts.forEach(count => {
      imeiCountMap[count.purchase_id] = count._count.item_imei;
    });
    
    // Combine the data
    console.time('Step 4: Combine data');
    const result = recentPurchases.map(purchase => ({
      purchase_id: purchase.purchase_id,
      date: purchase.date,
      supplier_id: purchase.supplier_id,
      qc_required: purchase.qc_required,
      qc_completed: purchase.qc_completed,
      supplier_name: supplierMap[purchase.supplier_id]?.name || 'Unknown Supplier',
      imei_count: imeiCountMap[purchase.purchase_id] || 0
    }));
    console.timeEnd('Step 4: Combine data');
    
    console.log('Final result count:', result.length);
    console.log('Sample result:', result[0]);
    
    // Total time
    console.time('Total optimized query time');
    
  } catch (error) {
    console.error('Error testing optimized recent goods in query:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testOptimizedRecentGoodsInQuery();