import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Function to convert BigInt values to strings
function convertBigIntValues(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (typeof obj === 'bigint') {
    return obj.toString();
  }
  
  if (Array.isArray(obj)) {
    return obj.map(convertBigIntValues);
  }
  
  if (typeof obj === 'object') {
    const result: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        result[key] = convertBigIntValues(obj[key]);
      }
    }
    return result;
  }
  
  return obj;
}

// GET /api/inventory/imei/instock - Get devices in stock based on supplier and manufacturer
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const supplierId = searchParams.get('supplierId');
    const manufacturer = searchParams.get('manufacturer');
    const modelSearch = searchParams.get('modelSearch');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    // Validate required parameters
    if (!supplierId) {
      return NextResponse.json(
        { error: "Supplier ID is required" },
        { status: 400 }
      );
    }

    // Calculate offset for pagination
    const offset = (page - 1) * limit;

    // Build the query to get total count
    let countQuery = `
      SELECT COUNT(*) as total
      FROM (
        SELECT 1
        FROM tbl_imei i
        LEFT JOIN tbl_tac t ON i.item_tac = t.item_tac
        LEFT JOIN tbl_categories c ON t.item_brand = c.category_id
        LEFT JOIN tbl_grades g ON i.item_grade = g.grade_id
        WHERE i.status = 1
    `;

    const countQueryParams: any[] = [];

    // Add supplier filter if provided
    if (supplierId) {
      countQuery += ` AND i.item_imei IN (
        SELECT item_imei
        FROM tbl_purchases
        WHERE supplier_id = ?
      )`;
      countQueryParams.push(supplierId);
    }

    // Add manufacturer filter if provided
    if (manufacturer) {
      countQuery += ` AND c.category_id = ?`;
      countQueryParams.push(manufacturer);
    }

    // Add model search filter if provided
    if (modelSearch) {
      countQuery += ` AND t.item_details LIKE ?`;
      countQueryParams.push(`%${modelSearch}%`);
    }

    // Group by device specifications to get count of unique groups
    countQuery += `
      GROUP BY t.item_details, i.item_color, i.item_gb, g.title, i.item_grade, c.title
    `;

    countQuery += `) as grouped_devices`;

    // Execute the count query
    const countResult: any = await prisma.$queryRawUnsafe(countQuery, ...countQueryParams);
    const totalDevices = countResult.length > 0 ? parseInt(countResult[0].total) : 0;
    const totalPages = Math.ceil(totalDevices / limit);

    // Build the query using raw SQL to leverage the views
    let query = `
      SELECT
        t.item_details as model_name,
        i.item_color as color,
        i.item_gb as storage,
        g.title as grade,
        i.item_grade as grade_id,
        c.title as manufacturer,
        COUNT(i.item_imei) as quantity_available
      FROM tbl_imei i
      LEFT JOIN tbl_tac t ON i.item_tac = t.item_tac
      LEFT JOIN tbl_categories c ON t.item_brand = c.category_id
      LEFT JOIN tbl_grades g ON i.item_grade = g.grade_id
      WHERE i.status = 1
    `;

    const queryParams: any[] = [];

    // Add supplier filter if provided
    if (supplierId) {
      query += ` AND i.item_imei IN (
        SELECT item_imei
        FROM tbl_purchases
        WHERE supplier_id = ?
      )`;
      queryParams.push(supplierId);
    }

    // Add manufacturer filter if provided
    if (manufacturer) {
      query += ` AND c.category_id = ?`;
      queryParams.push(manufacturer);
    }

    // Add model search filter if provided
    if (modelSearch) {
      query += ` AND t.item_details LIKE ?`;
      queryParams.push(`%${modelSearch}%`);
    }

    // Group by device specifications to get quantity available for each group
    query += `
      GROUP BY t.item_details, i.item_color, i.item_gb, g.title, i.item_grade, c.title
      ORDER BY c.title, t.item_details, i.item_color, i.item_gb, g.title
    `;

    // Add pagination
    query += ` LIMIT ? OFFSET ?`;
    queryParams.push(limit, offset);

    // Execute the query for devices
    const devices: any = await prisma.$queryRawUnsafe(query, ...queryParams);
    
    // Convert BigInt values to strings to avoid serialization issues
    const convertedDevices = convertBigIntValues(devices);

    return NextResponse.json({
      devices: convertedDevices,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalDevices: totalDevices,
        limit: limit
      }
    });
  } catch (error) {
    console.error("In-stock devices GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch in-stock devices" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}