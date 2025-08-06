import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET /api/goods-out - List sales orders with pagination and filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const orderId = searchParams.get('orderId') || '';
    const customerId = searchParams.get('customerId') || '';
    const dateFrom = searchParams.get('dateFrom') || '';
    const dateTo = searchParams.get('dateTo') || '';

    const skip = (page - 1) * limit;

    // Build where clause for filtering tbl_orders
    const where: any = {};

    if (orderId) {
      where.order_id = parseInt(orderId);
    }

    if (customerId) {
      where.customer_id = customerId;
    }

    if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) {
        where.date.gte = new Date(dateFrom);
      }
      if (dateTo) {
        where.date.lte = new Date(dateTo);
      }
    }

    // Get distinct order_ids based on filters
    const orderIdsResult = await prisma.tbl_orders.findMany({
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

    const orderIds = orderIdsResult.map(p => p.order_id).filter(id => id !== null);

    // Get full sales order details with aggregated data
    const salesOrders = await prisma.tbl_orders.groupBy({
      by: ['order_id', 'date', 'customer_id', 'customer_ref', 'delivery_company', 'tracking_no'],
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
    const customerIds = Array.from(new Set(salesOrders.map(p => p.customer_id).filter(id => id !== null)));
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

    // Get goodsout_order_id from tbl_imei_sales_orders for each order
    const salesOrderItems = await prisma.tbl_imei_sales_orders.findMany({
      where: {
        order_id: {
          in: orderIds
        }
      },
      select: {
        order_id: true,
        goodsout_order_id: true
      }
    });

    // Create a map of order_id to goodsout_order_id
    const goodsOutOrderMap = new Map(salesOrderItems.map(item => [item.order_id, item.goodsout_order_id]));

    // Combine sales order data with customer names and goodsout_order_id
    const salesOrdersWithDetails = salesOrders.map(order => {
      const customer = customers.find(c => c.customer_id === order.customer_id);
      const goodsout_order_id = goodsOutOrderMap.get(order.order_id) || null;
      
      return {
        order_id: order.order_id,
        date: order.date,
        customer_id: order.customer_id,
        customer: customer?.name || null,
        customer_ref: order.customer_ref,
        delivery_company: order.delivery_company,
        tracking_no: order.tracking_no,
        goodsout_order_id: goodsout_order_id
      };
    });

    // Get total count for pagination
    const totalCount = await prisma.tbl_orders.count({
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
    console.error("Goods Out GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch sales orders" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}