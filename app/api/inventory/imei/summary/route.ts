import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
// import { getServerSession } from "next-auth";
// import { authOptions } from "../../../auth/[...nextauth]/route";

const prisma = new PrismaClient();

export async function GET() {

  try {
    const totalItems = await prisma.tbl_imei.count();
    const inStockItems = await prisma.tbl_imei.count({
      where: { status: 1 },
    });
    const outOfStockItems = await prisma.tbl_imei.count({
      where: { status: 0 },
    });

    return NextResponse.json({
      totalItems,
      inStockItems,
      outOfStockItems,
    });
  } catch (error) {
    console.error("Error fetching IMEI inventory summary:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
