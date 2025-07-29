import { NextRequest, NextResponse } from "next/server";
// import { getServerSession } from "next-auth/next";
// import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET /api/orders - List orders with pagination and filtering
export async function GET(request: NextRequest) {
  try {

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const customer_id = searchParams.get('customer_id');
    const status = searchParams.get('status');

    const skip = (page - 1) * limit;

    // Build where clause for filtering
    const where: any = {};
    
    if (search) {
      where.OR = [
        { item_imei: { contains: search } },
        { customer_ref: { contains: search } },
        { tracking_no: { contains: search } }
      ];
    }

    if (customer_id) {
      where.customer_id = customer_id;
    }

    if (status === 'delivered') {
      where.is_delivered = 1;
    } else if (status === 'pending') {
      where.is_delivered = { not: 1 };
    }

    // Get total count for pagination
    const totalCount = await prisma.tbl_orders.count({ where });

    // Get orders
    const orders = await prisma.tbl_orders.findMany({
      where,
      skip,
      take: limit,
      orderBy: { date: 'desc' }
    });

    // Get customer details for each order
    const ordersWithDetails = await Promise.all(
      orders.map(async (order) => {
        const customer = await prisma.tbl_customers.findFirst({
          where: { customer_id: order.customer_id }
        });
        
        return {
          ...order,
          customer: customer || null
        };
      })
    );

    return NextResponse.json({
      orders: ordersWithDetails,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    });

  } catch (error) {
    console.error("Orders GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// POST /api/orders - Create new order
export async function POST(request: NextRequest) {
  try {

    const body = await request.json();
    const {
      order_id,
      item_imei,
      customer_id,
      po_box,
      customer_ref,
      delivery_company,
      total_boxes,
      total_pallets
    } = body;

    // Validate required fields
    if (!order_id || !item_imei || !customer_id) {
      return NextResponse.json(
        { error: "Order ID, IMEI, and customer ID are required" },
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

    // Check if IMEI exists and is available
    const imeiProduct = await prisma.tbl_imei.findFirst({
      where: { 
        item_imei,
        status: 1 // Assuming 1 means available
      }
    });

    if (!imeiProduct) {
      return NextResponse.json(
        { error: "IMEI not found or not available" },
        { status: 404 }
      );
    }

    // Create new order
    const newOrder = await prisma.tbl_orders.create({
      data: {
        order_id,
        item_imei,
        customer_id,
        date: new Date(),
        po_box: po_box || null,
        customer_ref: customer_ref || null,
        delivery_company: delivery_company || null,
        total_boxes: total_boxes ? parseInt(total_boxes) : null,
        total_pallets: total_pallets ? parseInt(total_pallets) : null,
        order_return: 0,
        unit_confirmed: 0,
        has_return_tag: 0,
        is_delivered: 0,
        user_id: 1 // Would be session.user.id in real implementation
      }
    });

    // Update IMEI status to reserved/sold
    await prisma.tbl_imei.updateMany({
      where: { item_imei },
      data: { status: 2 } // Assuming 2 means sold/reserved
    });

    // Log the creation
    await prisma.tbl_log.create({
      data: {
        date: new Date(),
        item_code: item_imei,
        subject: "Order Created",
        details: `New order created: ${order_id} for customer ${customer_id}`,
        ref: newOrder.id.toString(),
        user_id: 1
      }
    });

    return NextResponse.json(newOrder, { status: 201 });

  } catch (error) {
    console.error("Orders POST error:", error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
