const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testParallelQueries() {
 try {
    console.log('Testing parallel queries...');
    
    // Get current date for time-based queries
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to start of day for accurate comparison
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
    
    console.time('All queries in parallel');
    const [
      totalProducts,
      totalCustomers,
      totalOrders,
      totalSuppliers,
      pendingOrders,
      recentOrdersRaw,
      lowStockItems,
      // New dashboard data points
      imeiStock,
      totalInToday,
      totalOutToday,
      devicesAwaitingQC,
      recentGoodsInRaw,
      // New queries for updated dashboard
      recentOperationsRaw,
      availableStockCount,
      pendingQCCount,
      oldStockCount
    ] = await Promise.all([
      // Total IMEI products
      prisma.tbl_imei.count(),
      
      // Total customers
      prisma.tbl_customers.count(),
      
      // Total orders (distinct order_id)
      prisma.tbl_orders.count(),
      
      // Total suppliers
      prisma.tbl_suppliers.count(),
      
      // Pending orders (no specific delivered field, use date as proxy)
      prisma.tbl_orders.count({
        where: {
          date: {
            gte: lastMonth
          }
        }
      }),
      
      // Recent orders with customer data (manual join since no relations)
      prisma.$queryRaw`
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
      `,
      
      // Low stock items (items with specific status)
      prisma.tbl_imei.findMany({
        take: 10,
        where: {
          status: { in: [1, 2] }
        }
      }),
      
      // IMEI Stock: Total no of devices in stock (status = 1 in tbl_imei)
      prisma.tbl_imei.count({
        where: {
          status: 1
        }
      }),
      
      // Total In: no of units booked in today
      // (from tbl_purchases where date = today)
      prisma.tbl_purchases.count({
        where: {
          date: {
            gte: today,
            lt: tomorrow
          }
        }
      }),
      
      // Total Out: no of units booked out today
      // (from tbl_imei_sales_orders where date = today and is_completed = 1)
      prisma.tbl_imei_sales_orders.count({
        where: {
          date: {
            gte: today,
            lt: tomorrow
          },
          is_completed: 1
        }
      }),
      
      // Devices awaiting QC: count of all devices in tbl_purchases
      // with qc_required = 1 and qc_completed = 0
      prisma.tbl_purchases.count({
        where: {
          qc_required: 1,
          qc_completed: 0
        }
      }),
      
      // Recent Goods In table: most recent purchases with supplier information
      // We need to get distinct purchases by grouping by purchase_id
      prisma.$queryRaw`
        SELECT DISTINCT
          purchase_id,
          date,
          supplier_id,
          qc_required,
          qc_completed
        FROM tbl_purchases
        ORDER BY date DESC
        LIMIT 10
      `,
      
      // Recent operations from tbl_log (last 3 operations)
      prisma.$queryRaw`
        SELECT
          id,
          date,
          item_code,
          subject,
          details,
          ref,
          auto_time
        FROM tbl_log
        ORDER BY auto_time DESC
        LIMIT 3
      `,
      
      // Available Stock: devices with available_flag = 'Available'
      prisma.$queryRaw`
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
      `,
      
      // Pending QC: devices with status=1 and qc_required=1 and qc_completed=0
      prisma.$queryRaw`
        SELECT COUNT(*) as count
        FROM tbl_imei i
        JOIN tbl_purchases p ON p.item_imei = i.item_imei
        WHERE i.status = 1
          AND p.qc_required = 1
          AND p.qc_completed = 0
      `,
      
      // Old Stock (90+ days): devices with status=1 and purchase date > 90 days ago
      prisma.$queryRaw`
        SELECT COUNT(*) as count
        FROM tbl_imei i
        JOIN tbl_purchases p ON p.item_imei = i.item_imei
        WHERE i.status = 1
          AND DATEDIFF(CURDATE(), p.date) > 90
      `
    ]);
    console.timeEnd('All queries in parallel');
    
    console.log('Results:');
    console.log('- Total products:', totalProducts);
    console.log('- Total customers:', totalCustomers);
    console.log('- Total orders:', totalOrders);
    console.log('- Total suppliers:', totalSuppliers);
    console.log('- Pending orders:', pendingOrders);
    console.log('- Recent orders:', recentOrdersRaw.length);
    console.log('- Low stock items:', lowStockItems.length);
    console.log('- IMEI stock:', imeiStock);
    console.log('- Total in today:', totalInToday);
    console.log('- Total out today:', totalOutToday);
    console.log('- Devices awaiting QC:', devicesAwaitingQC);
    console.log('- Recent goods in:', recentGoodsInRaw.length);
    console.log('- Recent operations:', recentOperationsRaw.length);
    console.log('- Available stock count:', availableStockCount[0].count);
    console.log('- Pending QC count:', pendingQCCount[0].count);
    console.log('- Old stock count:', oldStockCount[0].count);
    
  } catch (error) {
    console.error('Error testing parallel queries:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testParallelQueries();