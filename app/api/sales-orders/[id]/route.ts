import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET /api/sales-orders/[id] - Get details for a specific sales order
export async function GET(
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

    // Get all items for this order
    const orderItems = await prisma.tbl_imei_sales_orders.findMany({
      where: {
        order_id: orderId
      },
      orderBy: {
        date: 'desc'
      }
    });

    if (orderItems.length === 0) {
      return NextResponse.json(
        { error: "Sales order not found" },
        { status: 404 }
      );
    }

    // Get customer details
    const customerId = orderItems[0]?.customer_id || null;
    let customer = null;
    if (customerId) {
      // Find the customer by customer_id
      customer = await prisma.tbl_customers.findFirst({
        where: {
          customer_id: customerId
        }
      });
    }

    // Get the earliest date as the order date
    const orderDate = orderItems
      .map(item => item.date)
      .filter(date => date !== null)
      .sort()[0] || orderItems[0].date;

    // Group items by their characteristics (except item_code)
    // This will group devices that have the same model, color, grade, etc. but different item_codes
    const groupedItems: any = {};
    
    orderItems.forEach(item => {
      // Create a key based on all properties except item_code
      const key = `${item.item_brand}|${item.item_details}|${item.item_color}|${item.item_grade}|${item.item_gb}`;
      
      if (!groupedItems[key]) {
        groupedItems[key] = {
          item_brand: item.item_brand,
          item_details: item.item_details,
          item_color: item.item_color,
          item_grade: item.item_grade,
          item_gb: item.item_gb,
          count: 0
        };
      }
      
      // Increment the count for this group
      groupedItems[key].count++;
    });
    
    // Get category names for brand IDs
    const brandIds = Array.from(new Set(orderItems.map(item => item.item_brand).filter(brand => brand !== null))) as string[];
    const categories = await prisma.tbl_categories.findMany({
      where: {
        category_id: {
          in: brandIds
        }
      },
      select: {
        category_id: true,
        title: true
      }
    });
    
    // Create a map of category_id to title for quick lookup
    const categoryMap = new Map(categories.map(category => [category.category_id, category.title]));
    
    // Update grouped items with actual brand names
    Object.values(groupedItems).forEach((group: any) => {
      if (group.item_brand && categoryMap.has(group.item_brand)) {
        group.item_brand = categoryMap.get(group.item_brand) || group.item_brand;
      }
    });
    
    // Format the response
    const orderDetails = {
      order_id: orderId,
      date: orderDate,
      customer_id: customerId,
      customer_name: customer?.name || 'N/A',
      customer_ref: orderItems[0]?.customer_ref || null,
      po_ref: orderItems[0]?.po_ref || null,
      goodsout_order_id: orderItems[0]?.goodsout_order_id || null,
      items: Object.values(groupedItems).map((group: any) => ({
        item_brand: group.item_brand,
        item_details: group.item_details,
        item_color: group.item_color,
        item_grade: group.item_grade,
        item_gb: group.item_gb,
        quantity: group.count
      }))
    };

    return NextResponse.json(orderDetails);

  } catch (error) {
    console.error("Sales Order Detail GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch sales order details" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}