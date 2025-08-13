import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET /api/qc/purchases/[purchaseId]/devices - Get devices for a specific purchase order
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ purchaseId: string }> }
) {
  try {
    const { purchaseId: purchaseIdParam } = await params;
    const purchaseId = parseInt(purchaseIdParam);

    if (isNaN(purchaseId)) {
      return NextResponse.json(
        { error: "Invalid purchase ID" },
        { status: 400 }
      );
    }

    // Get the purchase order details
    const purchaseOrder = await prisma.tbl_purchases.findFirst({
      where: {
        purchase_id: purchaseId
      }
    });

    if (!purchaseOrder) {
      return NextResponse.json(
        { error: "Purchase order not found" },
        { status: 404 }
      );
    }

    // Get supplier details
    const supplier = await prisma.tbl_suppliers.findFirst({
      where: {
        supplier_id: purchaseOrder.supplier_id
      }
    });

    // Get devices for this purchase order from the view
    const devices: any[] = await prisma.$queryRawUnsafe(
      `SELECT * FROM vw_purchase_order_devices WHERE purchase_order_id = ${purchaseId}`
    );

    // For each device, get the latest QC information
    const devicesWithQc = await Promise.all(
      devices.map(async (device) => {
        // Get QC information for this device
        const qcInfo = await prisma.tbl_qc_imei_products.findFirst({
          where: {
            item_code: device.imei,
            purchase_id: purchaseId
          }
        });

        // Convert grade number back to letter
        let gradeLetter = 'NA';
        if (device.grade) {
          const gradeMap: { [key: number]: string } = {
            1: 'A', 2: 'B', 3: 'C', 4: 'D', 5: 'E', 6: 'F'
          };
          gradeLetter = gradeMap[parseInt(device.grade)] || device.grade;
        }

        return {
          imei: device.imei,
          model_no: device.model_no,
          color: device.color || '',
          storage: device.storage || '',
          grade: gradeLetter,
          cosmetic: qcInfo?.item_cosmetic_passed === 1 ? 'Passed' : 
                   qcInfo?.item_cosmetic_passed === 0 ? 'Failed' : 'Pending',
          functional: qcInfo?.item_functional_passed === 1 ? 'Passed' : 
                     qcInfo?.item_functional_passed === 0 ? 'Failed' : 'Pending',
          fault: '', // Not available in current view
          spec: '', // Not available in current view
          comments: qcInfo?.item_comments || ''
        };
      })
    );

    return NextResponse.json({
      purchaseOrder: {
        id: purchaseOrder.id,
        purchase_id: purchaseOrder.purchase_id,
        date: purchaseOrder.date,
        supplier: supplier,
        qc_completed: purchaseOrder.qc_completed
      },
      devices: devicesWithQc
    });

  } catch (error) {
    console.error("QC Purchase Devices GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch devices for purchase order" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}