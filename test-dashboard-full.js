const { PrismaClient } = require('@prisma/client');

async function testDashboardFull() {
  const prisma = new PrismaClient();
  
  try {
    console.log("Testing full dashboard execution...");
    
    // Get current date for time-based queries
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to start of day for accurate comparison
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());

    // Get dashboard data based on actual schema
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
      prisma.tbl_orders.findMany({
        take: 5,
        orderBy: { date: 'desc' }
      }),
      
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
        SELECT COUNT(DISTINCT imei) as count
        FROM vw_device_overview
        WHERE available_flag = 'Available'
      `,
      
      // Pending QC: devices with status=1 and qc_required=1 and qc_completed=0
      prisma.$queryRaw`
        SELECT COUNT(*) as count
        FROM vw_device_overview
        WHERE status = 'In Stock'
          AND qc_required = 'Yes'
          AND qc_complete = 'No'
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

    console.log("All queries in Promise.all executed successfully!");
    
    // Process recentGoodsIn to convert from raw query result to objects
    const recentGoodsIn = Array.isArray(recentGoodsInRaw)
      ? recentGoodsInRaw.map((item) => ({
          purchase_id: item.purchase_id,
          date: item.date,
          supplier_id: item.supplier_id,
          qc_required: item.qc_required,
          qc_completed: item.qc_completed
        }))
      : [];
    
    console.log("Processed recentGoodsIn:", recentGoodsIn.length, "items");

    // Get customer data for recent orders manually
    const customerIds = [];
    recentOrdersRaw.forEach((order) => {
      if (order.customer_id && !customerIds.includes(order.customer_id)) {
        customerIds.push(order.customer_id);
      }
    });
    
    console.log("Customer IDs to fetch:", customerIds.length);
    
    const customers = customerIds.length > 0
      ? await prisma.tbl_customers.findMany({
          where: {
            customer_id: { in: customerIds }
          }
        })
      : [];
    
    console.log("Fetched customers:", customers.length);

    const customerMap = {};
    customers.forEach((customer) => {
      customerMap[customer.customer_id] = customer;
    });

    // Get supplier data for recent goods in
    const supplierIds = [];
    recentGoodsIn.forEach((purchase) => {
      if (purchase.supplier_id && !supplierIds.includes(purchase.supplier_id)) {
        supplierIds.push(purchase.supplier_id);
      }
    });
    
    console.log("Supplier IDs to fetch:", supplierIds.length);
    
    const suppliers = supplierIds.length > 0
      ? await prisma.tbl_suppliers.findMany({
          where: {
            supplier_id: { in: supplierIds }
          }
        })
      : [];
    
    console.log("Fetched suppliers:", suppliers.length);

    const supplierMap = {};
    suppliers.forEach((supplier) => {
      supplierMap[supplier.supplier_id] = supplier;
    });

    // For each recentGoodsIn item, we need to count how many IMEIs are associated with that purchase_id
    let imeiCountMap = {};
    
    // Only try to get IMEI counts if we have recentGoodsIn items
    if (recentGoodsIn.length > 0) {
      try {
        const purchaseIds = recentGoodsIn.map((purchase) => purchase.purchase_id);
        console.log("Fetching IMEI counts for purchase IDs:", purchaseIds);
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
        
        console.log("Fetched IMEI counts:", imeiCounts.length);
        
        // Create a map of purchase_id to IMEI count
        imeiCountMap = {};
        imeiCounts.forEach((item) => {
          imeiCountMap[item.purchase_id] = item._count.item_imei;
        });
      } catch (error) {
        console.error("Error fetching IMEI counts:", error);
        // If there's an error, we'll just use 0 for all quantities
        imeiCountMap = {};
      }
    }
    
    console.log("IMEI count map:", Object.keys(imeiCountMap).length, "entries");

    // Process recent operations to convert from raw query result to objects
    const recentOperations = Array.isArray(recentOperationsRaw)
      ? recentOperationsRaw.map((item) => ({
          id: item.id,
          date: item.date,
          item_code: item.item_code,
          subject: item.subject,
          details: item.details,
          ref: item.ref,
          auto_time: item.auto_time
        }))
      : [];
    
    console.log("Processed recent operations:", recentOperations.length, "items");

    // Extract counts from the raw query results
    const availableStock = Array.isArray(availableStockCount) && availableStockCount.length > 0
      ? Number(availableStockCount[0].count)
      : 0;
      
    const pendingQC = Array.isArray(pendingQCCount) && pendingQCCount.length > 0
      ? Number(pendingQCCount[0].count)
      : 0;
      
    const oldStock = Array.isArray(oldStockCount) && oldStockCount.length > 0
      ? Number(oldStockCount[0].count)
      : 0;
    
    console.log("Available stock:", availableStock);
    console.log("Pending QC:", pendingQC);
    console.log("Old stock:", oldStock);

    // Format the response to match frontend expectations
    const response = {
      totalProducts,
      totalCustomers,
      totalOrders,
      totalSuppliers,
      pendingOrders,
      recentOrders: recentOrdersRaw.map((order) => ({
        id: order.id,
        order_id: order.order_id,
        customer_id: order.customer_id,
        item_imei: order.item_imei,
        date: order.date,
        po_box: order.po_box,
        tracking_no: order.tracking_no,
        customer: customerMap[order.customer_id] || null
      })),
      topSellingProducts: [], // You can implement this later
      lowStockItems: lowStockItems.map((item) => ({
        id: item.id,
        item_imei: item.item_imei,
        item_tac: item.item_tac,
        item_color: item.item_color,
        item_grade: item.item_grade,
        item_gb: item.item_gb,
        status: item.status,
        created_at: item.created_at
      })),
      // New dashboard data points
      imeiStock,
      totalInToday,
      totalOutToday,
      devicesAwaitingQC,
      recentGoodsIn: recentGoodsIn.map((purchase) => {
        // Count the number of IMEIs for this purchase
        const quantity = imeiCountMap[purchase.purchase_id] || 0;
        
        return {
          purchase_id: purchase.purchase_id,
          date: purchase.date,
          supplier: supplierMap[purchase.supplier_id] || null,
          supplier_name: supplierMap[purchase.supplier_id]?.name || 'Unknown Supplier',
          qc_required: purchase.qc_required === 1 ? 'Yes' : 'No',
          quantity: quantity
        };
      }),
      // Updated dashboard data
      recentOperations,
      availableStock,
      pendingQC,
      oldStock
    };

    console.log("Dashboard response generated successfully!");
    console.log("Response keys:", Object.keys(response));
    
  } catch (error) {
    console.error("Dashboard full test failed:", error);
    console.error("Error stack:", error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

testDashboardFull();