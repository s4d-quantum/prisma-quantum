import { NextRequest, NextResponse } from "next/server";
// import { getServerSession } from "next-auth/next";
// import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET /api/purchases - List purchases with pagination and filtering
export async function GET(request: NextRequest) {
  try {

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const purchaseId = searchParams.get('purchaseId') || '';
    const supplier_id = searchParams.get('supplier_id');
    const qc_status = searchParams.get('qc_status');

    const skip = (page - 1) * limit;

    
        // Build where clause for filtering
        const where: any = {};
        
        if (purchaseId) {
          where.purchase_id = parseInt(purchaseId);
        } else if (search) {
          where.OR = [
            { item_imei: { contains: search } },
            { po_ref: { contains: search } },
            { tray_id: { contains: search } }
          ];
        }
    if (supplier_id) {
      where.supplier_id = supplier_id;
    }

    if (qc_status === 'required') {
      where.qc_required = 1;
    } else if (qc_status === 'completed') {
      where.qc_completed = 1;
    } else if (qc_status === 'pending') {
      where.AND = [
        { qc_required: 1 },
        { qc_completed: { not: 1 } }
      ];
    }

    // Get total count for pagination
    const totalCount = await prisma.tbl_purchases.count({ where });

    // Get purchases
    const purchases = await prisma.tbl_purchases.findMany({
      where,
      skip,
      take: limit,
      orderBy: { date: 'desc' }
    });

    // Get supplier details for each purchase
    const purchasesWithDetails = await Promise.all(
      purchases.map(async (purchase) => {
        const supplier = await prisma.tbl_suppliers.findFirst({
          where: { supplier_id: purchase.supplier_id }
        });
        
        return {
          ...purchase,
          supplier: supplier || null
        };
      })
    );

    return NextResponse.json({
      purchases: purchasesWithDetails,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    });

  } catch (error) {
    console.error("Purchases GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch purchases" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// POST /api/purchases - Create new purchase
export async function POST(request: NextRequest) {
  try {

    const body = await request.json();
    const {
      purchase_id,
      item_imei,
      supplier_id,
      tray_id,
      qc_required,
      repair_required,
      priority,
      po_ref,
      report_comment
    } = body;

    // Validate required fields
    if (!purchase_id || !item_imei || !supplier_id) {
      return NextResponse.json(
        { error: "Purchase ID, IMEI, and supplier ID are required" },
        { status: 400 }
      );
    }

    // Check if supplier exists
    const supplier = await prisma.tbl_suppliers.findFirst({
      where: { supplier_id }
    });

    if (!supplier) {
      return NextResponse.json(
        { error: "Supplier not found" },
        { status: 404 }
      );
    }

    // Create new purchase
    const newPurchase = await prisma.tbl_purchases.create({
      data: {
        purchase_id,
        item_imei,
        date: new Date(),
        supplier_id,
        tray_id: tray_id || null,
        qc_required: qc_required ? 1 : 0,
        qc_completed: 0,
        repair_required: repair_required ? 1 : 0,
        repair_completed: 0,
        purchase_return: 0,
        priority: priority ? parseInt(priority) : 1,
        po_ref: po_ref || null,
        report_comment: report_comment || null,
        has_return_tag: 0,
        unit_confirmed: 0,
        user_id: 1 // Would be session.user.id in real implementation
      }
    });

    // Log the creation
    await prisma.tbl_log.create({
      data: {
        date: new Date(),
        item_code: item_imei,
        subject: "Purchase Created",
        details: `New purchase created: ${purchase_id} from supplier ${supplier_id}`,
        ref: newPurchase.id.toString(),
        user_id: 1
      }
    });

    return NextResponse.json(newPurchase, { status: 201 });

  } catch (error) {
    console.error("Purchases POST error:", error);
    return NextResponse.json(
      { error: "Failed to create purchase" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
