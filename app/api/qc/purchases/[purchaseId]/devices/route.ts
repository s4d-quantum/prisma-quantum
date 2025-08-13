import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET /api/qc/purchases/[purchaseId]/devices - Get devices for a specific purchase order
export async function GET(
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

    // Get devices for this purchase order from the view using raw SQL
    const devices: any[] = await prisma.$queryRaw`
      SELECT * FROM vw_purchase_order_devices 
      WHERE purchase_order_id = ${purchaseId}
    `;

    // Transform the data to match the required format
    const formattedDevices = devices.map(device => ({
      imei: device.imei,
      model_no: device.model_no,
      color: device.color,
      storage: device.storage,
      grade: device.grade,
      cosmetic: device.qc_complete === 'Yes' ? 'Passed' : 'Pending',
      functional: device.qc_complete === 'Yes' ? 'Passed' : 'Pending',
      fault: '', // Not available in current view
      spec: '', // Not available in current view
      comments: '' // Not available in current view
    }));

    return NextResponse.json({
      devices: formattedDevices
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