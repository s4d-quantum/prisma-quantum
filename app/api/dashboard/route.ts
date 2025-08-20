import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Function to convert BigInt values to strings in an object
function convertBigInts(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (typeof obj === 'bigint') {
    return Number(obj);
  }
  
  // Handle Date objects
  if (obj instanceof Date) {
    return obj.toISOString();
  }
  
  if (Array.isArray(obj)) {
    return obj.map(convertBigInts);
  }
  
  if (typeof obj === 'object') {
    const result: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        result[key] = convertBigInts(obj[key]);
      }
    }
    return result;
  }
  
  return obj;
}

export async function GET(request: NextRequest) {
  try {
    // Authentication temporarily disabled for testing
    // const session = await getServerSession(authOptions);
    
    // if (!session) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }

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
      // Total IMEI products - optimized with potential index usage
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
      
      // Recent orders with customer data (optimized with JOIN)
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
      // Optimized to avoid expensive JOINs and GROUP BY
      (async () => {
        // Step 1: Fetch recent purchases (distinct by purchase_id)
        const recentPurchases: any[] = await prisma.$queryRaw`
          SELECT DISTINCT
            purchase_id,
            date,
            supplier_id,
            qc_required,
            qc_completed
          FROM tbl_purchases
          ORDER BY date DESC
          LIMIT 10
        `;
        
        // Step 2: Fetch supplier information for these purchases
        const supplierIds = recentPurchases.map((p) => p.supplier_id);
        const suppliers = await prisma.tbl_suppliers.findMany({
          where: {
            supplier_id: {
              in: supplierIds
            }
          }
        });
        
        // Create a supplier map for quick lookup
        const supplierMap: Record<string, any> = {};
        suppliers.forEach((supplier: any) => {
          supplierMap[supplier.supplier_id] = supplier;
        });
        
        // Step 3: Fetch IMEI counts for these purchases
        const purchaseIds = recentPurchases.map((p) => p.purchase_id);
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
        
        // Create an IMEI count map for quick lookup
        const imeiCountMap: Record<number, number> = {};
        imeiCounts.forEach((count: any) => {
          imeiCountMap[count.purchase_id] = count._count.item_imei;
        });
        
        // Combine the data
        return recentPurchases.map((purchase) => ({
          purchase_id: purchase.purchase_id,
          date: purchase.date,
          supplier_id: purchase.supplier_id,
          qc_required: purchase.qc_required,
          qc_completed: purchase.qc_completed,
          supplier_name: supplierMap[purchase.supplier_id]?.name || 'Unknown Supplier',
          imei_count: imeiCountMap[purchase.purchase_id] || 0
        }));
      })(),
      
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
      // Optimized by using direct tables instead of the complex view
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
      // Optimized by using direct tables instead of the complex view
      prisma.$queryRaw`
        SELECT COUNT(DISTINCT i.item_imei) as count
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


    // Process recent operations to convert from raw query result to objects
    const recentOperations = Array.isArray(recentOperationsRaw)
      ? recentOperationsRaw.map((item: any) => ({
          id: item.id,
          date: item.date,
          item_code: item.item_code,
          subject: item.subject,
          details: item.details,
          ref: item.ref,
          auto_time: item.auto_time
        }))
      : [];

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

    // Format the response to match frontend expectations
    const response = {
      totalProducts,
      totalCustomers,
      totalOrders,
      totalSuppliers,
      pendingOrders,
      recentOrders: Array.isArray(recentOrdersRaw)
        ? recentOrdersRaw.map((order: any) => ({
            id: order.id,
            order_id: order.order_id,
            customer_id: order.customer_id,
            item_imei: order.item_imei,
            date: order.date,
            po_box: order.po_box,
            tracking_no: order.tracking_no,
            customer: order.customer_name ? { name: order.customer_name } : null
          }))
        : [],
      topSellingProducts: [], // You can implement this later
      lowStockItems: lowStockItems.map((item: any) => ({
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
      recentGoodsIn: Array.isArray(recentGoodsInRaw)
        ? recentGoodsInRaw.map((purchase: any) => ({
            purchase_id: purchase.purchase_id,
            date: purchase.date,
            supplier: null, // Supplier info is now in supplier_name field
            supplier_name: purchase.supplier_name || 'Unknown Supplier',
            qc_required: purchase.qc_required === 1 ? 'Yes' : 'No',
            quantity: purchase.imei_count || 0
          }))
        : [],
      // Updated dashboard data
      recentOperations,
      availableStock,
      pendingQC,
      oldStock
    };

    return NextResponse.json(convertBigInts(response));

  } catch (error) {
    console.error("Dashboard API error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch dashboard data",
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
