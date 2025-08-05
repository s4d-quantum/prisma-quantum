import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// PUT /api/sales-orders/[id]/items/[itemId] - Update a sales order item with scanned device
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; itemId: string } }
) {
  try {
    const orderId = parseInt(params.id);
    const itemId = parseInt(params.itemId);

    if (isNaN(orderId) || isNaN(itemId)) {
      return NextResponse.json(
        { error: "Invalid order ID or item ID" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { imei, is_completed } = body;

    // Update the sales order item with the scanned device IMEI and completion status
    const updatedItem = await prisma.tbl_imei_sales_orders.update({
      where: {
        id: itemId,
        order_id: orderId
      },
      data: {
        item_code: imei,
        is_completed: is_completed ? 1 : 0
      }
    });

    return NextResponse.json({
      message: "Sales order item updated successfully",
      item: updatedItem
    });

  } catch (error) {
    console.error("Sales Order Item PUT error:", error);
    return NextResponse.json(
      { error: "Failed to update sales order item" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}