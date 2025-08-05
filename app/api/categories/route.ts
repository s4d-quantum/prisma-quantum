import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET /api/categories - List categories (manufacturers)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';

    // Build where clause for filtering
    const where: any = {};
    
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { category_id: { contains: search } }
      ];
    }

    // Get categories
    const categories = await prisma.tbl_categories.findMany({
      where,
      orderBy: { title: 'asc' }
    });

    return NextResponse.json(categories);
  } catch (error) {
    console.error("Categories GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}