import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET /api/qc/purchases - List purchases requiring QC with pagination and filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const purchaseId = searchParams.get('purchaseId') || '';
    const qcStatus = searchParams.get('qcStatus') || '';
    const supplierId = searchParams.get('supplierId') || '';

    const skip = (page - 1) * limit;

    // Build WHERE clause conditions
    const whereConditions = [];
    const queryParams = [];

    whereConditions.push(`qc_required = ?`);
    queryParams.push(1);

    if (purchaseId) {
      whereConditions.push(`purchase_id = ?`);
      queryParams.push(parseInt(purchaseId));
    }

    if (qcStatus === 'completed') {
      whereConditions.push(`qc_completed = ?`);
      queryParams.push(1);
    } else if (qcStatus === 'incomplete') {
      whereConditions.push(`qc_completed = ?`);
      queryParams.push(0);
    }

    if (supplierId) {
      whereConditions.push(`supplier_id = ?`);
      queryParams.push(supplierId);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(DISTINCT purchase_id) as count
      FROM tbl_purchases
      ${whereClause}
    `;

    // For MySQL, we need to pass parameters directly to $queryRaw, not $queryRawUnsafe
    const countResult: any[] = await prisma.$queryRawUnsafe(
      countQuery,
      ...queryParams
    );
    const totalCount = Number(countResult[0].count);

    if (totalCount === 0) {
      return NextResponse.json({
        purchases: [],
        pagination: {
          page,
          limit,
          totalCount: 0,
          totalPages: 0
        }
      });
    }

    // Get purchases with device counts in a single query
    const purchasesQuery = `
      SELECT
        MAX(p.id) as id,
        p.purchase_id,
        MAX(p.date) as date,
        p.supplier_id,
        MAX(p.tray_id) as tray_id,
        MAX(p.qc_required) as qc_required,
        MAX(p.qc_completed) as qc_completed,
        MAX(s.name) as supplier_name
      FROM tbl_purchases p
      LEFT JOIN tbl_suppliers s ON p.supplier_id = s.supplier_id
      ${whereClause}
      GROUP BY p.purchase_id, p.supplier_id
      ORDER BY p.purchase_id DESC
      LIMIT ? OFFSET ?
    `;

    const paginationParams = [...queryParams, limit, skip];
    const purchases: any[] = await prisma.$queryRawUnsafe(
      purchasesQuery,
      ...paginationParams
    );
    
    // Get device counts for these purchases
    const purchaseIds = purchases.map(p => p.purchase_id);
    const deviceCounts: any[] = await prisma.$queryRawUnsafe(
      `SELECT purchase_id, COUNT(item_imei) as device_count
       FROM tbl_imei
       WHERE purchase_id IN (${purchaseIds.map(() => '?').join(',')})
       GROUP BY purchase_id`,
      ...purchaseIds
    );
    
    // Create a map for quick lookup
    const deviceCountMap: Record<number, number> = {};
    deviceCounts.forEach(row => {
      deviceCountMap[row.purchase_id] = Number(row.device_count);
    });

    // Format the results
    const formattedPurchases = purchases.map(purchase => ({
      id: purchase.id,
      purchase_id: purchase.purchase_id,
      date: purchase.date,
      supplier_id: purchase.supplier_id,
      tray_id: purchase.tray_id,
      qc_required: purchase.qc_required,
      qc_completed: purchase.qc_completed,
      device_count: deviceCountMap[purchase.purchase_id] || 0,
      supplier: purchase.supplier_name ? {
        name: purchase.supplier_name
      } : null
    }));

    return NextResponse.json({
      purchases: formattedPurchases,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    });

  } catch (error) {
    console.error("QC Purchases GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch QC purchases" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}