import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// POST /api/goods-in/submit - Submit goods in data
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      date,
      supplier_id,
      qc_required,
      repair_required,
      po_ref,
      tray_id,
      devices
    } = body;

    // Validate required fields
    if (!supplier_id || !devices || !Array.isArray(devices) || devices.length === 0) {
      return NextResponse.json(
        { error: "Supplier ID and at least one device are required" },
        { status: 400 }
      );
    }

    // Get the next purchase_id
    const lastPurchase = await prisma.tbl_purchases.findFirst({
      orderBy: { purchase_id: 'desc' }
    });
    
    const nextPurchaseId = lastPurchase ? lastPurchase.purchase_id + 1 : 1;

    // Process each device
    const createdDevices = [];
    const createdPurchases = [];

    for (const device of devices) {
      const {
        imei,
        color,
        grade,
        storage,
        tray
      } = device;

      // Validate device fields
      if (!imei) {
        return NextResponse.json(
          { error: "IMEI is required for each device" },
          { status: 400 }
        );
      }

      // Extract TAC from IMEI (first 8 digits)
      const tac = imei.substring(0, 8);

      // Check if IMEI record exists
      const existingImeiRecord = await prisma.tbl_imei.findFirst({
        where: { item_imei: imei }
      });

      let imeiRecord;
      if (existingImeiRecord) {
        // Update existing record
        imeiRecord = await prisma.tbl_imei.update({
          where: { id: existingImeiRecord.id },
          data: {
            item_tac: tac,
            item_color: color || null,
            item_grade: grade || 0,
            item_gb: storage || null,
            purchase_id: nextPurchaseId,
            status: 1, // In stock
            unit_confirmed: 1
          }
        });
      } else {
        // Create new record
        imeiRecord = await prisma.tbl_imei.create({
          data: {
            item_imei: imei,
            item_tac: tac,
            item_color: color || null,
            item_grade: grade || 0,
            item_gb: storage || null,
            purchase_id: nextPurchaseId,
            status: 1, // In stock
            unit_confirmed: 1,
            created_at: new Date()
          }
        });
      }

      // Create purchase record
      const purchaseRecord = await prisma.tbl_purchases.create({
        data: {
          purchase_id: nextPurchaseId,
          item_imei: imei,
          date: new Date(date),
          supplier_id: supplier_id,
          tray_id: tray_id || tray || null,
          qc_required: qc_required ? 1 : 0,
          qc_completed: 0,
          repair_required: repair_required ? 1 : 0,
          repair_completed: 0,
          purchase_return: 0,
          priority: 1,
          po_ref: po_ref || null,
          report_comment: null,
          has_return_tag: 0,
          unit_confirmed: 1,
          user_id: 1 // Would be session.user.id in real implementation
        }
      });

      createdDevices.push(imeiRecord);
      createdPurchases.push(purchaseRecord);

      // Log the creation
      await prisma.tbl_log.create({
        data: {
          date: new Date(),
          item_code: imei,
          subject: "Goods In",
          details: `Device booked in: ${imei} from supplier ${supplier_id}`,
          ref: purchaseRecord.id.toString(),
          user_id: 1
        }
      });
    }

    return NextResponse.json({
      message: "Goods in submission successful",
      purchaseId: nextPurchaseId,
      devices: createdDevices,
      purchases: createdPurchases
    }, { status: 201 });

  } catch (error) {
    console.error("Goods in submission error:", error);
    return NextResponse.json(
      { error: "Failed to submit goods in data" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}