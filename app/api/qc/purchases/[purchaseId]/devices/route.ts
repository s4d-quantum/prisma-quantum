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

    // Get the purchase order details with supplier in a single query
    const purchaseResult: any[] = await prisma.$queryRawUnsafe(
      `SELECT
        p.*,
        s.name as supplier_name,
        s.address as supplier_address,
        s.phone as supplier_phone,
        s.email as supplier_email,
        s.city as supplier_city,
        s.country as supplier_country,
        s.postcode as supplier_postcode,
        s.vat as supplier_vat
      FROM tbl_purchases p
      LEFT JOIN tbl_suppliers s ON p.supplier_id = s.supplier_id
      WHERE p.purchase_id = ?
      LIMIT 1`,
      purchaseId
    );

    if (purchaseResult.length === 0) {
      return NextResponse.json(
        { error: "Purchase order not found" },
        { status: 404 }
      );
    }

    const purchaseOrder = purchaseResult[0];

    // Get devices for this purchase order with QC information in a single query
    const devices: any[] = await prisma.$queryRawUnsafe(
      `SELECT
        i.item_imei as imei,
        t.item_details as model_no,
        i.item_color as color,
        i.item_gb as storage,
        i.item_grade as grade,
        qc.item_cosmetic_passed,
        qc.item_functional_passed,
        qc.item_comments
      FROM tbl_imei i
      LEFT JOIN tbl_tac t ON i.item_tac = t.item_tac
      LEFT JOIN tbl_qc_imei_products qc ON qc.item_code = i.item_imei AND qc.purchase_id = ?
      WHERE i.purchase_id = ?`,
      purchaseId,
      purchaseId
    );

    // Process devices to format the data
    const devicesWithQc = devices.map(device => {
      // Convert grade number back to letter
      let gradeLetter = 'NA';
      if (device.grade) {
        const gradeMap: { [key: number]: string } = {
          1: 'A', 2: 'B', 3: 'C', 4: 'D', 5: 'E', 6: 'F'
        };
        gradeLetter = gradeMap[parseInt(device.grade)] || device.grade.toString();
      }

      return {
        imei: device.imei,
        model_no: device.model_no || '',
        color: device.color || '',
        storage: device.storage || '',
        grade: gradeLetter,
        cosmetic: device.item_cosmetic_passed === 1 ? 'Passed' :
                 device.item_cosmetic_passed === 0 ? 'Failed' : 'Pending',
        functional: device.item_functional_passed === 1 ? 'Passed' :
                   device.item_functional_passed === 0 ? 'Failed' : 'Pending',
        fault: '', // Not available in current data
        spec: '', // Not available in current data
        comments: device.item_comments || ''
      };
    });

    // Format supplier data
    const supplier = purchaseOrder.supplier_name ? {
      supplier_id: purchaseOrder.supplier_id,
      name: purchaseOrder.supplier_name,
      address: purchaseOrder.supplier_address,
      phone: purchaseOrder.supplier_phone,
      email: purchaseOrder.supplier_email,
      city: purchaseOrder.supplier_city,
      country: purchaseOrder.supplier_country,
      postcode: purchaseOrder.supplier_postcode,
      vat: purchaseOrder.supplier_vat
    } : null;

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