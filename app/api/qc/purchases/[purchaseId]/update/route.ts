import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// POST /api/qc/purchases/[purchaseId]/update - Update QC information for devices in a purchase order
export async function POST(
  request: NextRequest,
  { params }: { params: { purchaseId: string } }
) {
  try {
    const purchaseId = parseInt(params.purchaseId);
    
    if (isNaN(purchaseId)) {
      return NextResponse.json(
        { error: "Invalid purchase ID" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { devices, qcCompleted } = body;

    // Update each device
    for (const device of devices) {
      const { imei, color, grade, cosmetic, functional, comments } = device;
      
      // Convert grade letter to number (A=1, B=2, etc.)
      const gradeNumber = ['A', 'B', 'C', 'D', 'E', 'F'].indexOf(grade) + 1;
      
      // Update tbl_imei with color and grade
      await prisma.tbl_imei.updateMany({
        where: { item_imei: imei },
        data: {
          item_color: color,
          item_grade: gradeNumber
        }
      });

      // Check if QC record exists for this device
      const existingQcRecord = await prisma.tbl_qc_imei_products.findFirst({
        where: { item_code: imei, purchase_id: purchaseId }
      });

      if (existingQcRecord) {
        // Update existing QC record
        await prisma.tbl_qc_imei_products.update({
          where: { id: existingQcRecord.id },
          data: {
            item_cosmetic_passed: cosmetic,
            item_functional_passed: functional,
            item_comments: comments,
            user_id: 1 // Would be session.user.id in real implementation
          }
        });
      } else {
        // Create new QC record
        await prisma.tbl_qc_imei_products.create({
          data: {
            purchase_id: purchaseId,
            item_code: imei,
            item_cosmetic_passed: cosmetic,
            item_functional_passed: functional,
            item_comments: comments,
            user_id: 1 // Would be session.user.id in real implementation
          }
        });
      }
    }

    // Update purchase order QC completion status if requested
    if (qcCompleted) {
      await prisma.tbl_purchases.updateMany({
        where: { purchase_id: purchaseId },
        data: { qc_completed: 1 }
      });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("QC Update error:", error);
    return NextResponse.json(
      { error: "Failed to update QC information" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}