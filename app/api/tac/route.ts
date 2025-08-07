import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET /api/tac?imei={imei} - Get manufacturer and model information for an IMEI
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const imei = searchParams.get('imei');

    if (!imei) {
      return NextResponse.json(
        { error: "IMEI is required" },
        { status: 400 }
      );
    }

    // Extract TAC from IMEI (first 8 digits)
    const tac = imei.substring(0, 8);

    // Get TAC information
    const tacRecord = await prisma.tbl_tac.findFirst({
      where: { item_tac: tac }
    });

    if (!tacRecord) {
      return NextResponse.json(
        { error: "TAC not found for this IMEI" },
        { status: 404 }
      );
    }

    // Get manufacturer information from categories table
    let manufacturer = null;
    if (tacRecord.item_brand) {
      const categoryRecord = await prisma.tbl_categories.findFirst({
        where: { category_id: tacRecord.item_brand }
      });
      manufacturer = categoryRecord?.title || tacRecord.item_brand;
    }

    // Prepare response
    const response = {
      tac: tacRecord.item_tac,
      model: tacRecord.item_details,
      manufacturer: manufacturer,
      brandCode: tacRecord.item_brand
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("TAC GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch TAC information" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}