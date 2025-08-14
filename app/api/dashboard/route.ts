import { NextRequest, NextResponse } from "next/server";
// import { getServerSession } from "next-auth/next";
// import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // TEMPORARILY DISABLED FOR TESTING
    // const session = await getServerSession(authOptions);
    // 
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

    // Process recentGoodsIn to convert from raw query result to objects
    const recentGoodsIn = Array.isArray(recentGoodsInRaw) 
      ? recentGoodsInRaw.map((item: any) => ({
          purchase_id: item.purchase_id,
          date: item.date,
          supplier_id: item.supplier_id,
          qc_required: item.qc_required,
          qc_completed: item.qc_completed
        }))
      : [];

    // Get customer data for recent orders manually
    const customerIds: string[] = [];
    recentOrdersRaw.forEach((order: any) => {
      if (order.customer_id && !customerIds.includes(order.customer_id)) {
        customerIds.push(order.customer_id);
      }
    });
    
    const customers = customerIds.length > 0 
      ? await prisma.tbl_customers.findMany({
          where: {
            customer_id: { in: customerIds }
          }
        })
      : [];

    const customerMap: Record<string, any> = {};
    customers.forEach((customer: any) => {
      customerMap[customer.customer_id] = customer;
    });

    // Get supplier data for recent goods in
    const supplierIds: string[] = [];
    recentGoodsIn.forEach((purchase: any) => {
      if (purchase.supplier_id && !supplierIds.includes(purchase.supplier_id)) {
        supplierIds.push(purchase.supplier_id);
      }
    });
    
    const suppliers = supplierIds.length > 0 
      ? await prisma.tbl_suppliers.findMany({
          where: {
            supplier_id: { in: supplierIds }
          }
        })
      : [];

    const supplierMap: Record<string, any> = {};
    suppliers.forEach((supplier: any) => {
      supplierMap[supplier.supplier_id] = supplier;
    });

    // For each recentGoodsIn item, we need to count how many IMEIs are associated with that purchase_id
    let imeiCountMap: Record<number, number> = {};
    
    // Only try to get IMEI counts if we have recentGoodsIn items
    if (recentGoodsIn.length > 0) {
      try {
        const purchaseIds = recentGoodsIn.map((purchase: any) => purchase.purchase_id);
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
        
        // Create a map of purchase_id to IMEI count
        imeiCountMap = {};
        imeiCounts.forEach((item: any) => {
          imeiCountMap[item.purchase_id] = item._count.item_imei;
        });
      } catch (error) {
        console.error("Error fetching IMEI counts:", error);
        // If there's an error, we'll just use 0 for all quantities
        imeiCountMap = {};
      }
    }

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
      totalRevenue: 0, // You can calculate this from orders if needed
      totalOrders,
      totalCustomers,
      totalProducts,
      totalSuppliers,
      pendingOrders,
      recentOrders: recentOrdersRaw.map((order: any) => ({
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
      recentGoodsIn: recentGoodsIn.map((purchase: any) => {
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

    return NextResponse.json(response);

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
