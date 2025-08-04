import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET /api/goods-in - List purchase orders with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const purchaseId = searchParams.get('purchaseId') || '';
    const supplierId = searchParams.get('supplierId') || '';
    const dateFrom = searchParams.get('dateFrom') || '';
    const dateTo = searchParams.get('dateTo') || '';

    const skip = (page - 1) * limit;

    // Build where clause for filtering tbl_purchases
    const where: any = {};

    if (purchaseId) {
      where.purchase_id = parseInt(purchaseId);
    }

    if (supplierId) {
      where.supplier_id = supplierId;
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

    // Get distinct purchase_ids based on filters
    const purchaseIdsResult = await prisma.tbl_purchases.findMany({
      where,
      select: {
        purchase_id: true,
      },
      distinct: ['purchase_id'],
      skip,
      take: limit,
      orderBy: {
        date: 'desc'
      }
    });

    const purchaseIds = purchaseIdsResult.map(p => p.purchase_id);

    // Get full purchase order details with aggregated data
    const purchaseOrders = await prisma.tbl_purchases.groupBy({
      by: ['purchase_id', 'date', 'supplier_id', 'qc_required', 'priority'],
      where: {
        purchase_id: {
          in: purchaseIds
        }
      },
      _count: {
        item_imei: true
      },
      orderBy: {
        date: 'desc'
      }
    });

    // Get supplier names for the purchase orders
    const supplierIds = Array.from(new Set(purchaseOrders.map(p => p.supplier_id)));
    const suppliers = await prisma.tbl_suppliers.findMany({
      where: {
        supplier_id: {
          in: supplierIds
        }
      },
      select: {
        supplier_id: true,
        name: true
      }
    });

    // Combine purchase order data with supplier names and quantity counts
    const purchaseOrdersWithDetails = purchaseOrders.map(order => {
      const supplier = suppliers.find(s => s.supplier_id === order.supplier_id);
      return {
        purchase_id: order.purchase_id,
        date: order.date,
        supplier_id: order.supplier_id,
        supplier_name: supplier?.name || null,
        qc_required: order.qc_required,
        priority: order.priority,
        quantity: order._count.item_imei
      };
    });

    // Get total count for pagination
    const totalCount = await prisma.tbl_purchases.count({
      where: {
        purchase_id: {
          in: purchaseIds
        }
      }
    });

    return NextResponse.json({
      purchaseOrders: purchaseOrdersWithDetails,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    });

  } catch (error) {
    console.error("Goods In GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch purchase orders" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}