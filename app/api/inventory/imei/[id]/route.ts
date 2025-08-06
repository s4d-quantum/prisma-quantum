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
    
    // Try to find device in vw_device_overview view
    const deviceResults: any = await prisma.$queryRaw`
      SELECT *
      FROM vw_device_overview
      WHERE imei = ${id}
    `;
    
    let device = deviceResults.length > 0 ? deviceResults[0] : null;
    
    // If not found by IMEI, try by database ID
    if (!device) {
      const numericId = parseInt(id);
      if (!isNaN(numericId)) {
        // Fallback to original method for database ID lookup
        let product = await prisma.tbl_imei.findUnique({
          where: { id: numericId }
        });
        
        if (product && product.item_imei) {
          // Fetch data from the view using the IMEI
          const deviceResults: any = await prisma.$queryRaw`
            SELECT *
            FROM vw_device_overview
            WHERE imei = ${product.item_imei}
          `;
          
          if (deviceResults.length > 0) {
            device = deviceResults[0];
          } else {
            // If view doesn't have the data, fall back to original method
            device = {
              imei: product.item_imei,
              color: product.item_color,
              storage: product.item_gb,
              purchaseId: product.purchase_id,
              status: product.status,
              statusText: getStatusText(product.status),
              grade: product.item_grade,
              gradeText: getGradeText(product.item_grade)
            };
          }
        }
      }
    }

    if (!device) {
      return NextResponse.json(
        { error: "Device not found" },
        { status: 404 }
      );
    }

    // Fetch movement logs from tbl_log
    const movements = await prisma.tbl_log.findMany({
      where: { item_code: device.imei || device.item_imei },
      orderBy: { date: 'desc' }
    });

    // Format the response with all required information
    const response = {
      device: {
        imei: device.imei || device.item_imei,
        color: device.color || "N/A",
        storage: device.storage || "N/A",
        purchaseId: device.purchase_order_id || device.purchaseId,
        status: device.status === "In Stock" ? 1 : (device.status === "Out of Stock" ? 0 : device.status),
        statusText: typeof device.status === 'string' ? device.status : getStatusText(device.status),
        grade: device.grade || device.item_grade,
        gradeText: device.gradeText || getGradeText(device.grade || device.item_grade)
      },
      manufacturerInfo: {
        model: device.model_no || null,
        brand: device.manufacturer || null
      },
      supplier: {
        name: device.supplier || null,
        address: null, // Not included in the view
        city: null, // Not included in the view
        country: null, // Not included in the view
        phone: null, // Not included in the view
        email: null, // Not included in the view
        vat: null // Not included in the view
      },
      purchase: (device.purchase_order_id || device.purchaseId) ? {
        purchaseNumber: device.purchase_order_id || device.purchaseId,
        date: null, // Not included in the view
        location: null, // Not included in the view
        locationName: null, // Not included in the view
        qcRequired: device.qc_required === "Yes",
        qcCompleted: device.qc_complete === "Yes",
        repairRequired: device.repair_required === "Yes",
        repairCompleted: device.repair_complete === "Yes",
        purchaseReturn: null, // Not included in the view
        priority: null, // Not included in the view
        comments: null // Not included in the view
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
