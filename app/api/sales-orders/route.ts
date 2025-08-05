import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET /api/sales-orders - List sales orders with pagination and filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const orderId = searchParams.get('orderId') || '';

    const skip = (page - 1) * limit;

    // Build where clause for filtering tbl_imei_sales_orders
    const where: any = {};

    if (orderId) {
      where.order_id = parseInt(orderId);
    }

    // Get distinct order_ids based on filters
    const orderIdsResult = await prisma.tbl_imei_sales_orders.findMany({
      where,
      select: {
        order_id: true,
      },
      distinct: ['order_id'],
      skip,
      take: limit,
      orderBy: {
        date: 'desc'
      }
    });

    const orderIds = orderIdsResult.map(p => p.order_id).filter(id => id !== null) as number[];

    // Get full sales order details with aggregated data
    const salesOrders = await prisma.tbl_imei_sales_orders.groupBy({
      by: ['order_id', 'date', 'customer_id'],
      where: {
        order_id: {
          in: orderIds
        }
      },
      orderBy: {
        date: 'desc'
      }
    });

    // Get customer names for the sales orders
    const customerIds = Array.from(new Set(salesOrders.map(p => p.customer_id).filter(id => id !== null))) as string[];
    const customers = await prisma.tbl_customers.findMany({
      where: {
        customer_id: {
          in: customerIds
        }
      },
      select: {
        customer_id: true,
        name: true
      }
    });

    // Get item counts for each order
    const orderCounts = await prisma.tbl_imei_sales_orders.groupBy({
      by: ['order_id'],
      where: {
        order_id: {
          in: orderIds
        }
      },
      _count: {
        item_code: true
      }
    });

    // Combine sales order data with customer names and item counts
    const salesOrdersWithDetails = salesOrders.map(order => {
      const customer = customers.find(c => c.customer_id === order.customer_id);
      const count = orderCounts.find(c => c.order_id === order.order_id);
      return {
        order_id: order.order_id,
        date: order.date,
        customer_id: order.customer_id,
        customer: customer?.name || null,
        quantity: count?._count.item_code || 0
      };
    });

    // Get total count for pagination
    const totalCount = await prisma.tbl_imei_sales_orders.count({
      where
    });

    return NextResponse.json({
      orders: salesOrdersWithDetails,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    });

  } catch (error) {
    console.error("Sales Orders GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch sales orders" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}