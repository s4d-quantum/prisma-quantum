import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET /api/trays - List trays
export async function GET(request: NextRequest) {
  try {
    // Get all trays
    const trays = await prisma.tbl_trays.findMany({
      orderBy: { title: 'asc' }
    });

    return NextResponse.json({ trays });
  } catch (error) {
    console.error("Trays GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch trays" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}