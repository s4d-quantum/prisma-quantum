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
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());

    // Get dashboard data based on actual schema
    const [
      totalProducts,
      totalCustomers,
      totalOrders,
      totalSuppliers,
      pendingOrders,
      recentOrdersRaw,
      lowStockItems
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
      })
    ]);

    // Get customer data for recent orders manually
    const customerIds = [...new Set(recentOrdersRaw.map(order => order.customer_id))];
    const customers = await prisma.tbl_customers.findMany({
      where: {
        customer_id: { in: customerIds }
      }
    });

    const customerMap = customers.reduce((acc, customer) => {
      acc[customer.customer_id!] = customer;
      return acc;
    }, {} as Record<string, any>);

    // Format the response to match frontend expectations
    const response = {
      totalRevenue: 0, // You can calculate this from orders if needed
      totalOrders,
      totalCustomers,
      totalProducts,
      totalSuppliers,
      pendingOrders,
      recentOrders: recentOrdersRaw.map(order => ({
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
      lowStockItems: lowStockItems.map(item => ({
        id: item.id,
        item_imei: item.item_imei,
        item_tac: item.item_tac,
        item_color: item.item_color,
        item_grade: item.item_grade,
        item_gb: item.item_gb,
        status: item.status,
        created_at: item.created_at
      }))
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
