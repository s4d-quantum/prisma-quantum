import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // Get query parameters from URL
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const storage = searchParams.get('storage');
    const color = searchParams.get('color');
    const grade = searchParams.get('grade');
    const supplier = searchParams.get('supplier');

    // Calculate skip for pagination
    const skip = (page - 1) * limit;

    // Build where clause based on filters
    const where: any = {};
    
    // Status filter
    if (status) {
      where.status = parseInt(status);
    }
    
    // Storage filter
    if (storage) {
      where.item_gb = storage;
    }
    
    // Color filter
    if (color) {
      where.item_color = { contains: color };
    }
    
    // Grade filter
    if (grade) {
      where.item_grade = parseInt(grade);
    }
    
    // Search filter (applies to multiple fields)
    if (search) {
      // First, get matching TAC records to find manufacturer/model
      const tacRecords = await prisma.tbl_tac.findMany({
        where: {
          OR: [
            { item_details: { contains: search } },
            { item_brand: { contains: search } }
          ]
        },
        select: {
          item_tac: true
        }
      });
      
      const matchingTacs = tacRecords.map((tac: any) => tac.item_tac);
      
      where.OR = [
        { item_imei: { contains: search } },
        { item_tac: { contains: search } },
        { item_color: { contains: search } },
        { item_gb: { contains: search } },
        { item_tac: { in: matchingTacs } } // Include items with matching TAC records
      ];
    }
    
    // Fetch IMEI inventory with pagination and filters
    let imeiItems: any[] = [];
    let totalCount = 0;
    
    if (supplier) {
      // When filtering by supplier, get all item_imei from tbl_purchases for this supplier
      // Then filter tbl_imei records by those IMEIs
      const supplierPurchases = await prisma.tbl_purchases.findMany({
        where: {
          supplier_id: supplier
        },
        select: {
          item_imei: true
        }
      });
      
      const supplierImeis = supplierPurchases
        .map((p: any) => p.item_imei)
        .filter((imei: any) => imei !== null && imei !== ''); // Filter out null/empty IMEIs
      
      if (supplierImeis.length === 0) {
        // No IMEIs found for this supplier, return empty result
        [imeiItems, totalCount] = [[], 0];
      } else {
        // Add supplier IMEI filter to existing where clause
        const supplierWhere = {
          ...where,
          item_imei: {
            in: supplierImeis
          }
        };
        
        [imeiItems, totalCount] = await Promise.all([
          prisma.tbl_imei.findMany({
            where: supplierWhere,
            skip,
            take: limit,
            orderBy: { created_at: 'desc' }
          }),
          prisma.tbl_imei.count({ where: supplierWhere })
        ]);
      }
    } else {
      // Normal query without supplier filter
      [imeiItems, totalCount] = await Promise.all([
        prisma.tbl_imei.findMany({
          where,
          skip,
          take: limit,
          orderBy: { created_at: 'desc' }
        }),
        prisma.tbl_imei.count({ where })
      ]);
    }

    // Enhance data with lookups for grade, manufacturer, model, and supplier
    const enhancedItems = await Promise.all(
      imeiItems.map(async (item) => {
        // Get grade information from tbl_grades
        let gradeTitle = null;
        if (item.item_grade) {
          const gradeRecord = await prisma.tbl_grades.findUnique({
            where: { grade_id: item.item_grade }
          });
          gradeTitle = gradeRecord?.title || null;
        }

        // Get manufacturer and model information
        let manufacturer = null;
        let model = null;
        if (item.item_tac) {
          // First, get the item_brand from tbl_tac
          const tacRecord = await prisma.tbl_tac.findFirst({
            where: { item_tac: item.item_tac }
          });
          
          if (tacRecord) {
            model = tacRecord.item_details || null;
            
            // Then, use item_brand to get the actual manufacturer name from tbl_categories
            if (tacRecord.item_brand) {
              const categoryRecord = await prisma.tbl_categories.findFirst({
                where: { category_id: tacRecord.item_brand }
              });
              manufacturer = categoryRecord?.title || tacRecord.item_brand;
            }
          }
        }

        // Get supplier information
        let supplier = null;
        if (item.item_imei) {
          // Find the purchase record by IMEI to get supplier
          const purchaseRecord = await prisma.tbl_purchases.findFirst({
            where: { item_imei: item.item_imei },
            select: { supplier_id: true }
          });
          
          if (purchaseRecord && purchaseRecord.supplier_id) {
            // Get the supplier name
            const supplierRecord = await prisma.tbl_suppliers.findFirst({
              where: { supplier_id: purchaseRecord.supplier_id },
              select: { name: true }
            });
            supplier = supplierRecord?.name || purchaseRecord.supplier_id;
          }
        }

        return {
          ...item,
          grade_title: gradeTitle,
          manufacturer: manufacturer,
          model: model,
          supplier: supplier
        };
      })
    );

    // Format the response to match frontend expectations
    const response = {
      data: enhancedItems,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error("Inventory IMEI API error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch inventory data",
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
