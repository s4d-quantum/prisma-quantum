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

    // First, get distinct purchase_ids with their latest record
    const purchaseIdsResult: any[] = await prisma.$queryRawUnsafe(
      `SELECT DISTINCT purchase_id
      FROM tbl_purchases 
      WHERE qc_required = 1
      ${purchaseId ? `AND purchase_id = ${parseInt(purchaseId)}` : ''}
      ${qcStatus === 'completed' ? `AND qc_completed = 1` : qcStatus === 'incomplete' ? `AND qc_completed = 0` : ''}
      ${supplierId ? `AND supplier_id = '${supplierId}'` : ''}
      ORDER BY purchase_id DESC
      LIMIT ${limit} OFFSET ${skip}`
    );

    const purchaseIds = purchaseIdsResult.map((row: any) => row.purchase_id);

    if (purchaseIds.length === 0) {
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

    // Get the latest record for each purchase_id
    const purchases: any[] = await prisma.$queryRawUnsafe(
      `SELECT p.*, s.name as supplier_name
      FROM tbl_purchases p
      LEFT JOIN tbl_suppliers s ON p.supplier_id = s.supplier_id
      WHERE p.purchase_id IN (${purchaseIds.join(',')})
      ORDER BY p.date DESC`
    );

    // Get device count for each purchase
    const purchasesWithDetails = await Promise.all(
      purchases.map(async (purchase: any) => {
        // Get device count for this purchase
        const deviceCountResult: any[] = await prisma.$queryRawUnsafe(
          `SELECT COUNT(*) as count FROM tbl_imei WHERE purchase_id = ${purchase.purchase_id}`
        );
        
        const deviceCount = Number(deviceCountResult[0].count);
        
        return {
          ...purchase,
          device_count: deviceCount,
          supplier: purchase.supplier_name ? {
            name: purchase.supplier_name
          } : null
        };
      })
    );

    // Get total count for pagination
    const countResult: any[] = await prisma.$queryRawUnsafe(
      `SELECT COUNT(DISTINCT purchase_id) as count
      FROM tbl_purchases 
      WHERE qc_required = 1
      ${purchaseId ? `AND purchase_id = ${parseInt(purchaseId)}` : ''}
      ${qcStatus === 'completed' ? `AND qc_completed = 1` : qcStatus === 'incomplete' ? `AND qc_completed = 0` : ''}
      ${supplierId ? `AND supplier_id = '${supplierId}'` : ''}`
    );
    
    const totalCount = Number(countResult[0].count);

    // Format the results to remove duplicates
    const formattedPurchases: any[] = [];
    const seenPurchaseIds = new Set();
    
    for (const purchase of purchasesWithDetails) {
      if (!seenPurchaseIds.has(purchase.purchase_id)) {
        seenPurchaseIds.add(purchase.purchase_id);
        formattedPurchases.push(purchase);
      }
    }

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