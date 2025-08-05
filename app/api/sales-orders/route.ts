import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function getGradeText(grade: number): string {
  const gradeMap: { [key: number]: string } = {
    1: "A",
    2: "B",
    3: "C",
    4: "D",
    5: "E",
    6: "F"
  };
  
  return gradeMap[grade] || "N/A";
}

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
        _all: true
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
        quantity: count?._count._all || 0
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

// POST /api/sales-orders - Create new sales order
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      customer_id,
      items,
      customer_ref,
      po_ref,
      supplier_id
    } = body;

    // Validate required fields
    if (!customer_id || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Customer ID and items are required" },
        { status: 400 }
      );
    }

    // Check if customer exists
    const customer = await prisma.tbl_customers.findFirst({
      where: { customer_id }
    });

    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    // Get the next order_id (sequential)
    const lastOrder = await prisma.tbl_imei_sales_orders.findFirst({
      orderBy: { order_id: 'desc' },
      select: { order_id: true }
    });
    
    const nextOrderId = lastOrder && lastOrder.order_id ? lastOrder.order_id + 1 : 1;

    // Create sales order items
    const salesOrderItems = [];
    
    // Process each item and create multiple entries based on quantity
    for (const item of items) {
      const {
        item_brand,
        item_details,
        item_color,
        item_grade,
        item_gb,
        quantity,
        tray_id
      } = item;
      
      // Create individual entries for each quantity
      for (let i = 0; i < quantity; i++) {
        salesOrderItems.push({
          order_id: nextOrderId,
          customer_id,
          item_brand,
          item_details,
          item_color,
          item_grade: getGradeText(item_grade), // Convert numeric grade to letter
          item_gb,
          date: new Date(),
          tray_id: tray_id || null,
          is_completed: 0,
          item_code: null, // Will be filled when goods out is processed
          goodsout_order_id: null, // Will be filled when goods out is processed
          po_ref: po_ref || null,
          customer_ref: customer_ref || null,
          supplier_id: supplier_id || null
        });
      }
    }

    // Create all sales order items in a single transaction
    const createdItems = await prisma.tbl_imei_sales_orders.createMany({
      data: salesOrderItems
    });

    // Return success response
    return NextResponse.json({
      message: "Sales order created successfully",
      order_id: nextOrderId,
      items_created: createdItems.count
    }, { status: 201 });

  } catch (error) {
    console.error("Sales Orders POST error:", error);
    return NextResponse.json(
      { error: "Failed to create sales order" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}