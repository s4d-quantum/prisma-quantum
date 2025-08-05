import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// POST /api/sales-orders/[id]/complete - Mark a sales order as completed
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const orderId = parseInt(params.id);

    if (isNaN(orderId)) {
      return NextResponse.json(
        { error: "Invalid order ID" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { 
      deliveryCompany, 
      trackingNumber, 
      totalBoxes, 
      totalPallets, 
      poBox, 
      addedDevices 
    } = body;

    // Check if all items in the order are completed
    const orderItems = await prisma.tbl_imei_sales_orders.findMany({
      where: {
        order_id: orderId
      }
    });

    if (orderItems.length === 0) {
      return NextResponse.json(
        { error: "Sales order not found" },
        { status: 404 }
      );
    }

    // Get the next goodsout_order_id
    const lastGoodsOutOrder = await prisma.tbl_orders.findFirst({
      orderBy: { order_id: 'desc' },
      select: { order_id: true }
    });
    
    const nextGoodsOutOrderId = lastGoodsOutOrder && lastGoodsOutOrder.order_id ? lastGoodsOutOrder.order_id + 1 : 1;

    // Create a new goods out order for each device
    if (addedDevices && Array.isArray(addedDevices) && addedDevices.length > 0) {
      // Process each added device
      for (const device of addedDevices) {
        // Create a new order entry for this device
        await prisma.tbl_orders.create({
          data: {
            order_id: nextGoodsOutOrderId,
            item_imei: device.imei,
            customer_id: orderItems[0].customer_id || '',
            date: new Date(),
            po_box: poBox || null,
            tracking_no: trackingNumber || null,
            customer_ref: orderItems[0].customer_ref,
            delivery_company: deliveryCompany || null,
            total_boxes: totalBoxes ? parseInt(totalBoxes) : null,
            total_pallets: totalPallets ? parseInt(totalPallets) : null,
            order_return: 0,
            user_id: orderItems[0].user_id || null,
            unit_confirmed: 1,
            has_return_tag: 0,
            is_delivered: 0
          }
        });

        // Update the IMEI status to 0 (not in stock)
        await prisma.tbl_imei.updateMany({
          where: {
            item_imei: device.imei
          },
          data: {
            status: 0
          }
        });

        // Find and update the corresponding sales order item
        // We need to match the device characteristics with the order items
        const matchingOrderItem = orderItems.find(item => 
          item.item_color === device.color &&
          item.item_grade === device.grade &&
          item.item_gb === device.storage
        );

        if (matchingOrderItem) {
          // Update the sales order item with the IMEI and mark as completed
          await prisma.tbl_imei_sales_orders.update({
            where: {
              id: matchingOrderItem.id
            },
            data: {
              item_code: device.imei,
              is_completed: 1,
              goodsout_order_id: nextGoodsOutOrderId
            }
          });
        }
      }
    } else {
      // If no devices were added, still create the goods out order
      const goodsOutOrder = await prisma.tbl_orders.create({
        data: {
          order_id: nextGoodsOutOrderId,
          date: new Date(),
          customer_id: orderItems[0].customer_id || '',
          customer_ref: orderItems[0].customer_ref,
          delivery_company: deliveryCompany || null,
          tracking_no: trackingNumber || null,
          po_box: poBox || null,
          total_boxes: totalBoxes ? parseInt(totalBoxes) : null,
          total_pallets: totalPallets ? parseInt(totalPallets) : null,
          order_return: 0,
          user_id: orderItems[0].user_id || null,
          unit_confirmed: 1,
          has_return_tag: 0,
          is_delivered: 0
        }
      });

      // Update all sales order items with the goodsout_order_id
      await prisma.tbl_imei_sales_orders.updateMany({
        where: {
          order_id: orderId
        },
        data: {
          goodsout_order_id: nextGoodsOutOrderId
        }
      });
    }

    return NextResponse.json({
      message: "Sales order completed successfully",
      goodsout_order_id: nextGoodsOutOrderId
    });

  } catch (error) {
    console.error("Sales Order Complete POST error:", error);
    return NextResponse.json(
      { error: "Failed to complete sales order" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}