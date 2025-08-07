import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import type { Readable } from "stream";

const prisma = new PrismaClient();

// Device type for individual device listing
type Device = {
  imei: string;
  manufacturer: string;
  model_no: string;
  color: string;
  storage: string;
  grade: string;
  status: string;
  supplier: string;
  qc_required: string;
  qc_complete: string;
  repair_required: string;
  repair_complete: string;
  tray_id: string;
};

async function buildDeliveryData(purchaseId: number) {
  // Get purchase order details from tbl_purchases
  const purchaseRecords = await prisma.tbl_purchases.findMany({
    where: { purchase_id: purchaseId },
    take: 1
  });
  
  if (!purchaseRecords || purchaseRecords.length === 0) throw new Error("Purchase order not found");
  const purchase = purchaseRecords[0];
  
  // Get supplier details
  const supplier = purchase.supplier_id
    ? await prisma.tbl_suppliers.findFirst({
        where: { supplier_id: purchase.supplier_id },
      })
    : null;

  // Get company settings
  const companySettings = await prisma.tbl_settings.findFirst();
  
  // Get all devices for this purchase order from the view
  const deviceResults: any = await prisma.$queryRaw`
    SELECT * FROM vw_purchase_order_devices WHERE purchase_order_id = ${purchaseId}
  `;
  
  // Convert devices to our Device type
  const devices: Device[] = deviceResults.map((d: any) => ({
    imei: d.imei || "N/A",
    manufacturer: d.manufacturer || "N/A",
    model_no: d.model_no || "N/A",
    color: d.color || "N/A",
    storage: d.storage || "N/A",
    grade: d.grade || "N/A",
    status: d.status || "N/A",
    supplier: d.supplier || "N/A",
    qc_required: d.qc_required || "No",
    qc_complete: d.qc_complete || "No",
    repair_required: d.repair_required || "No",
    repair_complete: d.repair_complete || "No",
    tray_id: d.tray_id || "N/A",
  }));

  return { purchase, supplier, companySettings, devices };
}

async function createPdfBuffer({
  purchaseId,
  purchase,
  supplier,
  companySettings,
  devices,
}: {
  purchaseId: number;
  purchase: any;
  supplier: any;
  companySettings: any;
  devices: Device[];
}) {
  const PDFDocument = (await import("pdfkit")).default;

  // Professional look & feel
  const doc = new PDFDocument({ size: "A4", margin: 36 }); // ~0.5" margins
  const chunks: Buffer[] = [];
  const pageWidth = doc.page.width;
  const left = 36;
  const right = pageWidth - 36;

  const COLORS = {
    accent: "#0a66c2",
    text: "#222222",
    subtle: "#666666",
    rule: "#e0e0e0",
    tableHeaderBg: "#f5f7fb",
  };

  // Set up event handlers before using any PDF features
  doc.on("data", (chunk: Buffer) => chunks.push(chunk));
  const endPromise = new Promise<void>((resolve) => doc.on("end", () => resolve()));

  // Use PDFKit core fonts only (no file paths). Valid names: Helvetica, Times-Roman, Courier, etc.
  doc.font("Helvetica");
  doc.fillColor(COLORS.text);
  doc.fontSize(10);

  // Header: title bar
  const titleBarY = doc.y;
  doc.rect(left, titleBarY, right - left, 24).fill(COLORS.tableHeaderBg);
  doc.fillColor(COLORS.accent);
  doc.font("Helvetica").fontSize(15).text("Delivery Note", left + 8, titleBarY + 6);
  doc.fillColor(COLORS.text);

  // Company (left) and Meta (right) columns WITHOUT a divider yet
  doc.moveDown(0.8);
  const colTopY = doc.y;
  const leftColW = 300;
  const rightColW = right - (left + leftColW);

  // Company info - slightly smaller to avoid crowding
  let companyEndY = colTopY;
  if (companySettings) {
    doc.font("Helvetica").fontSize(12).text(companySettings.company_title || "S4D Limited", left, companyEndY, { width: leftColW });
    doc.font("Helvetica").fontSize(9).fillColor(COLORS.subtle);
    companyEndY = doc.y;
    if (companySettings.address) doc.text(companySettings.address, left, companyEndY, { width: leftColW });
    if ([companySettings.city, companySettings.country].some(Boolean)) {
      doc.text([companySettings.city, companySettings.country].filter(Boolean).join(", "), { width: leftColW });
    }
    if (companySettings.postcode) doc.text(companySettings.postcode, { width: leftColW });
    if (companySettings.phone) doc.text(`Office: ${companySettings.phone}`, { width: leftColW });
    if (companySettings.email) doc.text(companySettings.email, { width: leftColW });
    doc.text("www.s4dltd.com", { width: leftColW });
    companyEndY = doc.y; // ensure end Y is after URL
  }

  // Purchase meta (right) - right aligned, anchored at colTopY
  doc.fillColor(COLORS.text);
  doc.font("Helvetica").fontSize(12);
  doc.text(`Purchase #: PO-${purchaseId}`, left + leftColW, colTopY, { width: rightColW, align: "right" });
  doc.font("Helvetica").fontSize(10).fillColor(COLORS.subtle);
  doc.text(`Date: ${purchase.date ? new Date(purchase.date).toLocaleDateString() : "N/A"}`, left + leftColW, doc.y, {
    width: rightColW,
    align: "right",
  });

  // Force the y-position below the full company block (after URL) before drawing divider
  const afterColumnsY = Math.max(doc.y, companyEndY);
  doc.y = afterColumnsY + 8; // add a bit more spacing to ensure it's clearly below
  doc.strokeColor(COLORS.rule).moveTo(left, doc.y).lineTo(right, doc.y).stroke();

  // Supplier section: right-justified ADDRESS ONLY; meta stays left-aligned under the line
  doc.moveDown(0.6);
  // Move just the "Supplier" label to the right so it sits above the right-justified address
  doc.font("Helvetica-Bold").fontSize(11).fillColor(COLORS.text)
     .text("Supplier", left + leftColW, doc.y, { width: right - (left + leftColW), align: "right" });
  doc.moveDown(0.2);

  if (supplier) {
    doc.font("Helvetica").fontSize(10).fillColor(COLORS.text);
    const addressLines: string[] = [];
    if (supplier.name) addressLines.push(String(supplier.name));
    if (supplier.address) addressLines.push(String(supplier.address));
    if (supplier.address2) addressLines.push(String(supplier.address2));
    const cityCountry = [supplier.city, supplier.country].filter(Boolean).join(", ");
    if (cityCountry) addressLines.push(cityCountry);
    if (supplier.postcode) addressLines.push(String(supplier.postcode));
    if (supplier.phone) addressLines.push(String(supplier.phone));
    if (supplier.email) addressLines.push(String(supplier.email));

    // Right-justify only the address block on the right half
    const pad = 6;
    const addrX = left + leftColW + pad;
    const addrW = right - addrX - pad;

    // Top faint rule to visually contain this block
    const startY = doc.y;
    doc.rect(left, startY, right - left, 0.1).fill(COLORS.rule);
    doc.fillColor(COLORS.text);
    doc.moveDown(0.2);

    addressLines.forEach((t) => {
      doc.text(t, addrX, doc.y + 2, { width: addrW, align: "right" });
    });

    // Left-aligned meta list under the divider, on the LEFT side
    doc.moveDown(0.4);
    const metaStartY = Math.max(doc.y, startY);
    doc.y = metaStartY;

    const metaPairs: [string, string][] = [
      ["PO Reference", purchase.po_ref || "N/A"],
      ["QC Required", purchase.qc_required === 1 ? "Yes" : "No"],
      ["Repair Required", purchase.repair_required === 1 ? "Yes" : "No"],
      ["Total Devices", String(devices.length)],
    ];

    const labelW = 100;
    const metaX = left + pad;
    const metaW = (left + leftColW) - metaX - pad;

    metaPairs.forEach(([k, v]) => {
      doc.font("Helvetica-Bold").fillColor(COLORS.text).text(`${k}:`, metaX, doc.y, { width: labelW });
      doc.font("Helvetica").fillColor(COLORS.subtle).text(v, metaX + labelW + 6, doc.y - 12, { width: metaW - labelW - 6 });
      doc.fillColor(COLORS.text);
      doc.moveDown(0.2);
    });

    // Bottom rule for the whole supplier block
    doc.moveDown(0.2);
    doc.strokeColor(COLORS.rule).moveTo(left, doc.y + 2).lineTo(right, doc.y + 2).stroke();
    doc.moveDown(0.6);
  } else {
    doc.font("Helvetica-Oblique").fontSize(10).fillColor(COLORS.subtle)
       .text("N/A", left + leftColW, doc.y, { width: rightColW, align: "right" });
  }

  // Items table - individual devices (not grouped)
  // Header row
  doc.rect(left, doc.y, right - left, 20).fill(COLORS.tableHeaderBg);
  doc.fillColor(COLORS.text).font("Helvetica-Bold").fontSize(10);
  const headerY = doc.y + 4;
  
  // Define column positions
  const imeiX = left + 8;
  const manufacturerX = imeiX + 120;
  const modelX = manufacturerX + 80;
  const colorX = modelX + 70;
  const storageX = colorX + 50;
  const gradeX = storageX + 40;
  const trayX = gradeX + 30;
  
  doc.text("IMEI", imeiX, headerY, { width: manufacturerX - imeiX - 8 });
  doc.text("Manufacturer", manufacturerX, headerY, { width: modelX - manufacturerX - 8 });
  doc.text("Model", modelX, headerY, { width: colorX - modelX - 8 });
  doc.text("Color", colorX, headerY, { width: storageX - colorX - 8 });
  doc.text("GB", storageX, headerY, { width: gradeX - storageX - 8 });
  doc.text("Grade", gradeX, headerY, { width: trayX - gradeX - 8 });
  doc.text("Tray", trayX, headerY, { width: right - trayX - 8 });
  
  doc.moveDown(1.2);
  doc.font("Helvetica").fontSize(9).fillColor(COLORS.text);

  // Rows with light horizontal lines
  devices.forEach((device) => {
    const rowY = doc.y + 2;
    
    doc.text(device.imei, imeiX, rowY, { width: manufacturerX - imeiX - 8 });
    doc.text(device.manufacturer, manufacturerX, rowY, { width: modelX - manufacturerX - 8 });
    doc.text(device.model_no, modelX, rowY, { width: colorX - modelX - 8 });
    doc.text(device.color, colorX, rowY, { width: storageX - colorX - 8 });
    doc.text(device.storage, storageX, rowY, { width: gradeX - storageX - 8 });
    doc.text(device.grade, gradeX, rowY, { width: trayX - gradeX - 8 });
    doc.text(device.tray_id, trayX, rowY, { width: right - trayX - 8 });
    
    const rowBottom = doc.y + 4;
    doc.strokeColor(COLORS.rule).moveTo(left, rowBottom).lineTo(right, rowBottom).stroke();
    doc.y = rowBottom;
  });

  // Total row
  doc.moveDown(0.4);
  doc.font("Helvetica-Bold").fillColor(COLORS.text);
  doc.text(`Total Devices: ${devices.length}`, imeiX, doc.y, { width: right - imeiX - 8 });

  // Signature section
  doc.moveDown(1.0);
  const drawSig = (label: string) => {
    doc.font("Helvetica").fontSize(10).fillColor(COLORS.text).text(label, left, doc.y + 6);
    const y = doc.y + 10;
    doc.strokeColor("#000").moveTo(left + 120, y).lineTo(right - 150, y).stroke();
    doc.moveDown(0.6);
  };
  drawSig("Received by:");
  drawSig("Checked by:");
  drawSig("Date:");

  // Footer notes
  doc.moveDown(0.8);
  doc.font("Helvetica-Bold").fontSize(9).fillColor(COLORS.text).text(
    "ALL ITEMS MUST BE CHECKED AGAINST THIS DELIVERY NOTE UPON RECEIPT",
    { align: "center" }
  );
  doc.moveDown(0.2);
  doc.font("Helvetica").fontSize(7).fillColor("#777777").text(
    "Confidentiality Notice: This document has been sent by S4D Limited (registered in England and Wales with number 9342012). " +
      "Registered office: Ebenezer House, Ryecroft, Newcastle Under Lyme, Staffordshire, ST5 2BE. This document is confidential and intended for the use of the named recipient only. " +
      "If you are not the intended recipient, please notify us immediately. Please note that this document and any attachments have not been encrypted. " +
      "They may, therefore, be liable to be compromised. Please also note that it is your responsibility to scan this document and any attachments for viruses.",
    { align: "left" }
  );

  doc.end();
  await endPromise;
  return Buffer.concat(chunks);
}

// GET /api/goods-in/[purchaseId]/delivery-note - Generate delivery note for a goods in purchase order
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ purchaseId: string }> }
) {
  try {
    const { purchaseId: purchaseIdParam } = await params;
    const purchaseId = parseInt(purchaseIdParam);
    if (isNaN(purchaseId)) {
      return NextResponse.json({ error: "Invalid purchase ID" }, { status: 400 });
    }

    const data = await buildDeliveryData(purchaseId);
    const pdfBuffer = await createPdfBuffer({ purchaseId, ...data });

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="delivery-note-${purchaseId}.pdf"`,
        "Content-Length": String(pdfBuffer.length),
      },
    });
  } catch (error) {
    console.error("Delivery Note GET error:", error);
    return NextResponse.json(
      {
        error:
          "Failed to generate delivery note: " +
          (error instanceof Error ? error.message : "Unknown error"),
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}