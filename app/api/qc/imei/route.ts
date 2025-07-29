import { NextRequest, NextResponse } from "next/server";
// import { getServerSession } from "next-auth/next";
// import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET /api/qc/imei - List QC records for IMEI products
export async function GET(request: NextRequest) {
  try {

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status'); // passed, failed, pending

    const skip = (page - 1) * limit;

    // Build where clause for filtering
    const where: any = {};
    
    if (search) {
      where.OR = [
        { item_code: { contains: search } }
      ];
    }

    if (status === 'passed') {
      where.AND = [
        { item_cosmetic_passed: 1 },
        { item_functional_passed: 1 }
      ];
    } else if (status === 'failed') {
      where.OR = [
        { item_cosmetic_passed: 0 },
        { item_functional_passed: 0 }
      ];
    }

    // Get total count for pagination
    const totalCount = await prisma.tbl_qc_imei_products.count({ where });

    // Get QC records
    const qcRecords = await prisma.tbl_qc_imei_products.findMany({
      where,
      skip,
      take: limit,
      orderBy: { id: 'desc' }
    });

    // Get purchase details for each QC record
    const qcWithDetails = await Promise.all(
      qcRecords.map(async (qc) => {
        const purchase = qc.purchase_id ? await prisma.tbl_purchases.findFirst({
          where: { purchase_id: qc.purchase_id }
        }) : null;
        
        return {
          ...qc,
          purchase: purchase || null
        };
      })
    );

    return NextResponse.json({
      qcRecords: qcWithDetails,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    });

  } catch (error) {
    console.error("QC GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch QC records" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// POST /api/qc/imei - Create new QC record
export async function POST(request: NextRequest) {
  try {

    const body = await request.json();
    const {
      purchase_id,
      item_code,
      item_comments,
      item_cosmetic_passed,
      item_functional_passed,
      item_flashed,
      item_eu
    } = body;

    // Validate required fields
    if (!purchase_id || !item_code) {
      return NextResponse.json(
        { error: "Purchase ID and item code are required" },
        { status: 400 }
      );
    }

    // Create new QC record
    const newQC = await prisma.tbl_qc_imei_products.create({
      data: {
        purchase_id: parseInt(purchase_id),
        item_code,
        item_comments: item_comments || null,
        item_cosmetic_passed: item_cosmetic_passed ? 1 : 0,
        item_functional_passed: item_functional_passed ? 1 : 0,
        item_flashed: item_flashed ? 1 : 0,
        item_eu: item_eu || null,
        user_id: 1 // Would be session.user.id in real implementation
      }
    });

    // Update purchase QC status
    await prisma.tbl_purchases.updateMany({
      where: { purchase_id: parseInt(purchase_id) },
      data: { qc_completed: 1 }
    });

    // Log the QC completion
    await prisma.tbl_log.create({
      data: {
        date: new Date(),
        item_code,
        subject: "QC Completed",
        details: `QC completed for item: ${item_code}. Cosmetic: ${item_cosmetic_passed ? 'Pass' : 'Fail'}, Functional: ${item_functional_passed ? 'Pass' : 'Fail'}`,
        ref: newQC.id.toString(),
        user_id: 1
      }
    });

    return NextResponse.json(newQC, { status: 201 });

  } catch (error) {
    console.error("QC POST error:", error);
    return NextResponse.json(
      { error: "Failed to create QC record" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
