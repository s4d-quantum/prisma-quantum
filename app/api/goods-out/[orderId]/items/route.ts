import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * GET /api/goods-out/[orderId]/items
 * Next 13/14 App Router convention requires a dynamic segment folder "[orderId]"
 * with a route.ts exporting GET(request, context). For robustness across
 * environments, we add an explicit config export with dynamic = "force-dynamic"
 * to avoid edge/static misclassification that can cause 404s in dev.
 */
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, context: { params: { orderId: string } }) {
  try {
    const orderIdParam = context?.params?.orderId;
    const orderId = parseInt(orderIdParam || "", 10);
    if (!orderId || Number.isNaN(orderId)) {
      return NextResponse.json({ error: "Invalid orderId" }, { status: 400 });
    }

    // 1) Get all IMEIs for this goods-out order from tbl_orders
    const orderRows = await prisma.tbl_orders.findMany({
      where: { order_id: orderId },
      select: { item_imei: true },
      orderBy: { id: "asc" },
    });

    const imeis = orderRows
      .map((r) => r.item_imei)
      .filter((v): v is string => !!v && v.trim() !== "");

    if (imeis.length === 0) {
      // No items found for this order
      return NextResponse.json({ items: [] });
    }

    // 2) Load base IMEI records for enrichment
    const imeiRecords = await prisma.tbl_imei.findMany({
      where: { item_imei: { in: imeis } },
      select: {
        item_imei: true,
        item_tac: true,
        item_color: true,
        item_gb: true,
        item_grade: true,
      },
    });

    // Build a map for quick lookup
    const imeiMap = new Map(imeiRecords.map((r) => [r.item_imei, r]));

    // Collect TACs and grades for batch queries
    const tacs = Array.from(
      new Set(
        imeiRecords
          .map((r) => r.item_tac)
          .filter((t): t is string => !!t && t.trim() !== "")
      )
    );

    const gradeIds = Array.from(
      new Set(
        imeiRecords
          .map((r) => r.item_grade)
          .filter((g): g is number => typeof g === "number")
      )
    );

    // Load TAC rows
    const tacRows = tacs.length
      ? await prisma.tbl_tac.findMany({
          where: { item_tac: { in: tacs } },
          select: { item_tac: true, item_details: true, item_brand: true },
        })
      : [];

    const tacMap = new Map(tacRows.map((t) => [t.item_tac, t]));

    // Collect category IDs (item_brand) from TACs
    const categoryIds = Array.from(
      new Set(
        tacRows
          .map((t) => t.item_brand)
          .filter((c) => c !== null && c !== undefined)
      )
    );

    // Load manufacturer titles from categories; normalize ids to string for map keys
    const categoryRows =
      categoryIds.length > 0
        ? await prisma.tbl_categories.findMany({
            where: { category_id: { in: categoryIds as any[] } },
            select: { category_id: true, title: true },
          })
        : [];

    const categoryMap = new Map(
      categoryRows.map((c) => [String(c.category_id), c.title])
    );

    // Load grades
    const gradeRows =
      gradeIds.length > 0
        ? await prisma.tbl_grades.findMany({
            where: { grade_id: { in: gradeIds } },
            select: { grade_id: true, title: true },
          })
        : [];

    const gradeMap = new Map(gradeRows.map((g) => [g.grade_id, g.title]));

    // 3) Compose response items
    const items = imeis.map((imei) => {
      const base = imeiMap.get(imei);
      const tac = base?.item_tac ? tacMap.get(base.item_tac) : undefined;

      const manufacturer =
        (tac?.item_brand != null
          ? categoryMap.get(String(tac.item_brand))
          : undefined) || "-";

      const model = tac?.item_details || "-";
      const storage = base?.item_gb || "-";
      const color = base?.item_color || "-";
      const grade =
        (typeof base?.item_grade === "number"
          ? gradeMap.get(base.item_grade)
          : undefined) || "-";

      return {
        imei: String(imei),
        manufacturer,
        model,
        storage,
        color,
        grade,
      };
    });

    return NextResponse.json({ items });
  } catch (error) {
    console.error("Goods Out Items API error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch goods out order items",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}