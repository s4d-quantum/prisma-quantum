import { NextRequest, NextResponse } from "next/server";
// import { getServerSession } from "next-auth/next";
// import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET /api/inventory/imei/[id] - Get single IMEI product
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {

    const id = parseInt(params.id);
    
    const product = await prisma.tbl_imei.findUnique({
      where: { id }
    });

    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    // Get TAC details
    const tacDetails = await prisma.tbl_tac.findFirst({
      where: { item_tac: product.item_tac }
    });

    return NextResponse.json({
      ...product,
      tacDetails: tacDetails || null
    });

  } catch (error) {
    console.error("IMEI product GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch product" },
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
