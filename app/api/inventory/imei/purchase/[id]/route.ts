import { NextRequest, NextResponse } from "next/server";
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

// GET /api/inventory/imei/purchase/[id] - Get all IMEI products for a specific purchase ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
    const purchaseId = parseInt(id);
    
    if (isNaN(purchaseId)) {
      return NextResponse.json(
        { error: "Invalid purchase ID" },
        { status: 400 }
      );
    }

    // Fetch all IMEI products for this purchase ID
    const products = await prisma.tbl_imei.findMany({
      where: { purchase_id: purchaseId }
    });

    if (!products || products.length === 0) {
      return NextResponse.json(
        { error: "No devices found for this purchase" },
        { status: 404 }
      );
    }

    // Enhance each product with additional information
    const enhancedProducts = await Promise.all(
      products.map(async (product) => {
        // Fetch manufacturer and model information from vw_tac using raw query
        const manufacturerResults: any = await prisma.$queryRaw`
          SELECT item_details, brand_title
          FROM vw_tac
          WHERE item_tac = ${product.item_tac}
        `;
        
        const manufacturerInfo = manufacturerResults.length > 0 ? manufacturerResults[0] : null;
        
        // Fetch supplier information from vw_device_supplier using raw query
        const supplierResults: any = await prisma.$queryRaw`
          SELECT supplier_name, supplier_address, supplier_city, supplier_country, supplier_phone, supplier_email, supplier_vat
          FROM vw_device_supplier
          WHERE item_imei = ${product.item_imei}
        `;
        
        const supplier = supplierResults.length > 0 ? supplierResults[0] : null;
        
        // Fetch purchase information from tbl_purchases
        const purchase = await prisma.tbl_purchases.findFirst({
          where: { item_imei: product.item_imei, purchase_id: purchaseId }
        });
        
        // Fetch tray information if purchase has a tray_id using raw query
        let trayInfo = null;
        if (purchase && purchase.tray_id) {
          const trayResults: any = await prisma.$queryRaw`
            SELECT title
            FROM tbl_trays
            WHERE tray_id = ${purchase.tray_id}
          `;
          
          trayInfo = trayResults.length > 0 ? trayResults[0] : null;
        }

        return {
          id: product.id,
          imei: product.item_imei,
          color: product.item_color || "N/A",
          storage: product.item_gb || "N/A",
          purchaseId: product.purchase_id,
          status: product.status,
          statusText: getStatusText(product.status),
          grade: product.item_grade,
          gradeText: getGradeText(product.item_grade),
          manufacturer: manufacturerInfo?.brand_title || "N/A",
          model: manufacturerInfo?.item_details || "N/A",
          trayId: purchase?.tray_id || "N/A",
          trayName: trayInfo?.title || "N/A"
        };
      })
    );

    return NextResponse.json(enhancedProducts);

  } catch (error) {
    console.error("Purchase devices API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch devices for purchase" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}