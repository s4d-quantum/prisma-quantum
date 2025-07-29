import { NextRequest, NextResponse } from "next/server";
// import { getServerSession } from "next-auth/next";
// import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET /api/suppliers - List suppliers with pagination and search
export async function GET(request: NextRequest) {
  try {

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '1000'); // Increased default limit
    const search = searchParams.get('search') || '';

    const skip = (page - 1) * limit;

    // Build where clause for filtering
    const where: any = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { supplier_id: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } }
      ];
    }

    // Get total count for pagination
    const totalCount = await prisma.tbl_suppliers.count({ where });

    // Get suppliers
    const suppliers = await prisma.tbl_suppliers.findMany({
      where,
      skip,
      take: limit,
      orderBy: { name: 'asc' }
    });

    return NextResponse.json({
      suppliers,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    });

  } catch (error) {
    console.error("Suppliers GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch suppliers" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// POST /api/suppliers - Create new supplier
export async function POST(request: NextRequest) {
  try {

    const body = await request.json();
    const {
      supplier_id,
      name,
      address,
      address2,
      phone,
      email,
      city,
      country,
      postcode,
      vat
    } = body;

    // Validate required fields
    if (!supplier_id || !name) {
      return NextResponse.json(
        { error: "Supplier ID and name are required" },
        { status: 400 }
      );
    }

    // Check if supplier ID already exists
    const existingSupplier = await prisma.tbl_suppliers.findFirst({
      where: { supplier_id }
    });

    if (existingSupplier) {
      return NextResponse.json(
        { error: "Supplier ID already exists" },
        { status: 409 }
      );
    }

    // Create new supplier
    const newSupplier = await prisma.tbl_suppliers.create({
      data: {
        supplier_id,
        name,
        address: address || null,
        address2: address2 || null,
        phone: phone || null,
        email: email || null,
        city: city || null,
        country: country || null,
        postcode: postcode || null,
        vat: vat || null,
        user_id: 1 // Would be session.user.id in real implementation
      }
    });

    // Log the creation
    await prisma.tbl_log.create({
      data: {
        date: new Date(),
        item_code: supplier_id,
        subject: "Supplier Created",
        details: `New supplier created: ${name}`,
        ref: newSupplier.id.toString(),
        user_id: 1
      }
    });

    return NextResponse.json(newSupplier, { status: 201 });

  } catch (error) {
    console.error("Suppliers POST error:", error);
    return NextResponse.json(
      { error: "Failed to create supplier" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
