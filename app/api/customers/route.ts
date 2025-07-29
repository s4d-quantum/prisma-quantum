import { NextRequest, NextResponse } from "next/server";
// import { getServerSession } from "next-auth/next";
// import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET /api/customers - List customers with pagination and search
export async function GET(request: NextRequest) {
  try {

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';

    const skip = (page - 1) * limit;

    // Build where clause for filtering
    const where: any = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { customer_id: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } }
      ];
    }

    // Get total count for pagination
    const totalCount = await prisma.tbl_customers.count({ where });

    // Get customers
    const customers = await prisma.tbl_customers.findMany({
      where,
      skip,
      take: limit,
      orderBy: { name: 'asc' }
    });

    return NextResponse.json({
      customers,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    });

  } catch (error) {
    console.error("Customers GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch customers" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// POST /api/customers - Create new customer
export async function POST(request: NextRequest) {
  try {

    const body = await request.json();
    const {
      customer_id,
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
    if (!customer_id || !name) {
      return NextResponse.json(
        { error: "Customer ID and name are required" },
        { status: 400 }
      );
    }

    // Check if customer ID already exists
    const existingCustomer = await prisma.tbl_customers.findFirst({
      where: { customer_id }
    });

    if (existingCustomer) {
      return NextResponse.json(
        { error: "Customer ID already exists" },
        { status: 409 }
      );
    }

    // Create new customer
    const newCustomer = await prisma.tbl_customers.create({
      data: {
        customer_id,
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
        item_code: customer_id,
        subject: "Customer Created",
        details: `New customer created: ${name}`,
        ref: newCustomer.id.toString(),
        user_id: 1
      }
    });

    return NextResponse.json(newCustomer, { status: 201 });

  } catch (error) {
    console.error("Customers POST error:", error);
    return NextResponse.json(
      { error: "Failed to create customer" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
