import { NextRequest, NextResponse } from "next/server";
// import { getServerSession } from "next-auth/next";
// import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function getGradeText(grade: number | null): string {
  if (grade === null || grade === 0) return "N/A";
  
  const gradeMap: { [key: number]: string } = {
    1: "A",
    2: "B",
    3: "C",
    4: "D",
    5: "E",
    6: "F"
  };
  
  return gradeMap[grade] || "N/A";
}

function getStatusText(status: number | null): string {
  if (status === null) return "N/A";
  
  return status === 1 ? "In Stock" : "Out of Stock";
}

// GET /api/inventory/imei/[id] - Get single IMEI product by ID or IMEI
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
    
    // Always try IMEI lookup first, then fall back to ID lookup
    let product = await prisma.tbl_imei.findFirst({
      where: { item_imei: id }
    });
    
    // If not found by IMEI, try by database ID
    if (!product) {
      const numericId = parseInt(id);
      if (!isNaN(numericId)) {
        product = await prisma.tbl_imei.findUnique({
          where: { id: numericId }
        });
      }
    }

    if (!product) {
      return NextResponse.json(
        { error: "Device not found" },
        { status: 404 }
      );
    }

    // Fetch manufacturer and model information from vw_tac using raw query
    const manufacturerResults: any = await prisma.$queryRaw`
      SELECT item_details, brand_title
      FROM vw_tac
      WHERE item_tac = ${product.item_tac}
    `;
    
    const manufacturerInfo = manufacturerResults.length > 0 ? manufacturerResults[0] : null;
    
    // Fetch supplier information from vw_device_supplier using raw query
    const supplierResults: any = await prisma.$queryRaw`
      SELECT supplier_name, supplier_address, supplier_city, supplier_country, supplier_phone, supplier_email, supplier_vat
      FROM vw_device_supplier
      WHERE item_imei = ${product.item_imei}
    `;
    
    const supplier = supplierResults.length > 0 ? supplierResults[0] : null;
    
    // Fetch purchase information from tbl_purchases
    const purchase = await prisma.tbl_purchases.findFirst({
      where: { item_imei: product.item_imei }
    });
    
    // Fetch tray information if purchase has a tray_id using raw query
    let trayInfo = null;
    if (purchase && purchase.tray_id) {
      const trayResults: any = await prisma.$queryRaw`
        SELECT title
        FROM tbl_trays
        WHERE tray_id = ${purchase.tray_id}
      `;
      
      trayInfo = trayResults.length > 0 ? trayResults[0] : null;
    }
    
    // Fetch movement logs from tbl_log
    const movements = await prisma.tbl_log.findMany({
      where: { item_code: product.item_imei },
      orderBy: { date: 'desc' }
    });

    // Format the response with all required information
    const response = {
      device: {
        imei: product.item_imei,
        color: product.item_color || "N/A",
        storage: product.item_gb || "N/A",
        purchaseId: product.purchase_id,
        status: product.status,
        statusText: getStatusText(product.status),
        grade: product.item_grade,
        gradeText: getGradeText(product.item_grade)
      },
      manufacturerInfo: {
        model: manufacturerInfo?.item_details || null,
        brand: manufacturerInfo?.brand_title || null
      },
      supplier: {
        name: supplier?.supplier_name || null,
        address: supplier?.supplier_address || null,
        city: supplier?.supplier_city || null,
        country: supplier?.supplier_country || null,
        phone: supplier?.supplier_phone || null,
        email: supplier?.supplier_email || null,
        vat: supplier?.supplier_vat || null
      },
      purchase: purchase ? {
        purchaseNumber: purchase.purchase_id,
        date: purchase.date,
        location: purchase.tray_id,
        locationName: trayInfo?.title || null,
        qcRequired: purchase.qc_required === 1,
        qcCompleted: purchase.qc_completed === 1,
        repairRequired: purchase.repair_required === 1,
        repairCompleted: purchase.repair_completed === 1,
        purchaseReturn: purchase.purchase_return === 1,
        priority: purchase.priority,
        comments: purchase.report_comment
      } : null,
      movements: movements.map(log => ({
        id: log.id,
        date: log.date,
        subject: log.subject,
        details: log.details,
        ref: log.ref,
        autoTime: log.auto_time,
        userId: log.user_id
      }))
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error("Device info API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch device information" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// PUT /api/inventory/imei/[id] - Update IMEI product
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {

    const id = parseInt(params.id);
    const body = await request.json();
    
    // Check if product exists
    const existingProduct = await prisma.tbl_imei.findUnique({
      where: { id }
    });

    if (!existingProduct) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    // Check if new IMEI conflicts with existing one (if changed)
    if (body.item_imei && body.item_imei !== existingProduct.item_imei) {
      const conflictingImei = await prisma.tbl_imei.findFirst({
        where: { 
          item_imei: body.item_imei,
          id: { not: id }
        }
      });

      if (conflictingImei) {
        return NextResponse.json(
          { error: "IMEI already exists" },
          { status: 409 }
        );
      }
    }

    // Update the product
    const updatedProduct = await prisma.tbl_imei.update({
      where: { id },
      data: {
        item_imei: body.item_imei || existingProduct.item_imei,
        item_tac: body.item_tac || existingProduct.item_tac,
        item_color: body.item_color !== undefined ? body.item_color : existingProduct.item_color,
        item_grade: body.item_grade !== undefined ? parseInt(body.item_grade) : existingProduct.item_grade,
        item_gb: body.item_gb !== undefined ? body.item_gb : existingProduct.item_gb,
        purchase_id: body.purchase_id !== undefined ? (body.purchase_id ? parseInt(body.purchase_id) : null) : existingProduct.purchase_id,
        status: body.status !== undefined ? parseInt(body.status) : existingProduct.status,
        unit_confirmed: body.unit_confirmed !== undefined ? body.unit_confirmed : existingProduct.unit_confirmed
      }
    });

    // Log the update
    await prisma.tbl_log.create({
      data: {
        date: new Date(),
        item_code: updatedProduct.item_imei,
        subject: "IMEI Updated",
        details: `IMEI product updated: ${updatedProduct.item_imei}`,
        ref: updatedProduct.id.toString(),
        user_id: 1 // Would be session.user.id in real implementation
      }
    });

    return NextResponse.json(updatedProduct);

  } catch (error) {
    console.error("IMEI product PUT error:", error);
    return NextResponse.json(
      { error: "Failed to update product" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// DELETE /api/inventory/imei/[id] - Delete IMEI product
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {

    const id = parseInt(params.id);
    
    // Check if product exists
    const existingProduct = await prisma.tbl_imei.findUnique({
      where: { id }
    });

    if (!existingProduct) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    // TODO: Check if product is referenced in orders, purchases, etc.
    // For now, we'll allow deletion

    // Delete the product
    await prisma.tbl_imei.delete({
      where: { id }
    });

    // Log the deletion
    await prisma.tbl_log.create({
      data: {
        date: new Date(),
        item_code: existingProduct.item_imei,
        subject: "IMEI Deleted",
        details: `IMEI product deleted: ${existingProduct.item_imei}`,
        ref: id.toString(),
        user_id: 1 // Would be session.user.id in real implementation
      }
    });

    return NextResponse.json({ message: "Product deleted successfully" });

  } catch (error) {
    console.error("IMEI product DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to delete product" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
