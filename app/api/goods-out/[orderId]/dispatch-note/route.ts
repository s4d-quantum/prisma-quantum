import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import type { Readable } from "stream";
import nodemailer from "nodemailer";

const prisma = new PrismaClient();

type GroupedDevice = {
  brand: string;
  details: string;
  color: string;
  gb: string;
  grade: string;
  count: number;
};

// Single grade mapping helper (DB numeric -> letter). 0 or null -> N/A (omitted in text).
const gradeToLetter = (g: any): string => {
  if (g === null || g === undefined) return "N/A";
  const num = Number(g);
  if (Number.isNaN(num)) return String(g);
  const map: Record<number, string> = {
    0: "N/A",
    1: "A",
    2: "B",
    3: "C",
    4: "D",
    5: "E",
    6: "F",
  };
  return map[num] ?? String(num);
};

async function buildDispatchData(orderId: number) {
  // Get order details
  const order = await prisma.tbl_orders.findFirst({
    where: { order_id: orderId },
  });
  if (!order) throw new Error("Order not found");

  // Get customer details
  const customer = order.customer_id
    ? await prisma.tbl_customers.findFirst({
        where: { customer_id: order.customer_id },
      })
    : null;

  // Get company settings
  const companySettings = await prisma.tbl_settings.findFirst();

  // Get all devices for this order (each row is an item dispatched under this order)
  const devices = await prisma.tbl_orders.findMany({
    where: { order_id: orderId },
  });

  // Join out IMEI and TAC
  const imeiDetails = await Promise.all(
    devices.map(async (device) => {
      if (device.item_imei) {
        const imei = await prisma.tbl_imei.findFirst({
          where: { item_imei: device.item_imei },
        });

        const tac =
          imei?.item_tac &&
          (await prisma.tbl_tac.findFirst({
            where: { item_tac: imei.item_tac },
          }));

        return { device, imei, tac };
      }
      return { device, imei: null as any, tac: null as any };
    })
  );

  // Build a brandId -> title map from tbl_categories so we can map codes like "CAT3" to real manufacturer names.
  const brandIds = Array.from(
    new Set(
      imeiDetails
        .map(({ tac }) => tac?.item_brand)
        .filter((v) => v !== undefined && v !== null)
    )
  ) as (number | string)[];

  const categoryMap = new Map<string | number, string>();
  if (brandIds.length) {
    const categories = await prisma.tbl_categories.findMany({
      where: { category_id: { in: brandIds as any } },
    });
    categories.forEach((c: any) => {
      categoryMap.set(c.category_id, c.title);
    });
  }

  // Group devices
  const groupedDevices: Record<string, GroupedDevice> = {};
  imeiDetails.forEach(({ imei, tac }) => {
    // tac.item_brand is a ref code/id; resolve to human title via tbl_categories
    const brandCode = tac?.item_brand as any;
    const resolvedBrand =
      (brandCode !== undefined && brandCode !== null && categoryMap.get(brandCode)) ||
      String(brandCode ?? "Unknown");

    const details = (tac?.item_details as any) ?? "Unknown";
    const color = (imei?.item_color as any) ?? "Unknown";
    const gb = (imei?.item_gb as any) ?? "Unknown";

    // Prefer mapping via tbl_grades if available; otherwise use enumeration
    const rawGrade = imei?.item_grade;
    const mappedGrade = gradeToLetter(rawGrade);

    const key = `${resolvedBrand}|${details}|${color}|${gb}|${mappedGrade}`;
    if (!groupedDevices[key]) {
      groupedDevices[key] = {
        brand: resolvedBrand,
        details,
        color,
        gb,
        grade: mappedGrade,
        count: 0,
      };
    }
    groupedDevices[key].count++;
  });

  const totalCount = Object.values(groupedDevices).reduce(
    (sum, d) => sum + d.count,
    0
  );

  return { order, customer, companySettings, groupedDevices, totalCount };
}

async function createPdfBuffer({
  orderId,
  order,
  customer,
  companySettings,
  groupedDevices,
  totalCount,
}: {
  orderId: number;
  order: any;
  customer: any;
  companySettings: any;
  groupedDevices: Record<string, GroupedDevice>;
  totalCount: number;
}): Promise<Buffer> {
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

  // Use PDFKit core fonts only (no file paths). Valid names: Helvetica, Times-Roman, Courier, etc.
  doc.font("Helvetica");
  doc.fillColor(COLORS.text);
  doc.fontSize(10);

  doc.on("data", (chunk: Buffer) => chunks.push(chunk));
  const endPromise = new Promise<void>((resolve) => doc.on("end", () => resolve()));

  // Header: title bar
  const titleBarY = doc.y;
  doc.rect(left, titleBarY, right - left, 24).fill(COLORS.tableHeaderBg);
  doc.fillColor(COLORS.accent);
  doc.font("Helvetica").fontSize(15).text("Dispatch Note", left + 8, titleBarY + 6);
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

  // Dispatch meta (right) - right aligned, anchored at colTopY
  doc.fillColor(COLORS.text);
  doc.font("Helvetica").fontSize(12);
  doc.text(`Dispatch #: IO-${orderId}`, left + leftColW, colTopY, { width: rightColW, align: "right" });
  doc.font("Helvetica").fontSize(10).fillColor(COLORS.subtle);
  doc.text(`Date: ${order.date ? new Date(order.date).toLocaleDateString() : "N/A"}`, left + leftColW, doc.y, {
    width: rightColW,
    align: "right",
  });

  // Force the y-position below the full company block (after URL) before drawing divider
  const afterColumnsY = Math.max(doc.y, companyEndY);
  doc.y = afterColumnsY + 8; // add a bit more spacing to ensure it's clearly below
  doc.strokeColor(COLORS.rule).moveTo(left, doc.y).lineTo(right, doc.y).stroke();

  // Customer section: right-justified ADDRESS ONLY; meta stays left-aligned under the line
  doc.moveDown(0.6);
  // Move just the "Customer" label to the right so it sits above the right-justified address
  doc.font("Helvetica-Bold").fontSize(11).fillColor(COLORS.text)
     .text("Customer", left + leftColW, doc.y, { width: right - (left + leftColW), align: "right" });
  doc.moveDown(0.2);

  if (customer) {
    doc.font("Helvetica").fontSize(10).fillColor(COLORS.text);
    const addressLines: string[] = [];
    if (customer.name) addressLines.push(String(customer.name));
    if (customer.address) addressLines.push(String(customer.address));
    if (customer.address2) addressLines.push(String(customer.address2));
    const cityCountry = [customer.city, customer.country].filter(Boolean).join(", ");
    if (cityCountry) addressLines.push(cityCountry);
    if (customer.postcode) addressLines.push(String(customer.postcode));
    if (customer.phone) addressLines.push(String(customer.phone));
    if (customer.email) addressLines.push(String(customer.email));

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
      ["Customer Ref", order.customer_ref || "N/A"],
      ["Courier", order.delivery_company || "N/A"],
      ["Tracking No", order.tracking_no || "N/A"],
      ["PO Reference", order.po_box || "N/A"],
      [
        "Totals",
        `Boxes: ${order.total_boxes != null ? String(order.total_boxes) : "N/A"}  |  Pallets: ${
          order.total_pallets != null ? String(order.total_pallets) : "N/A"
        }`,
      ],
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

    // Bottom rule for the whole customer block
    doc.moveDown(0.2);
    doc.strokeColor(COLORS.rule).moveTo(left, doc.y + 2).lineTo(right, doc.y + 2).stroke();
    doc.moveDown(0.6);
  } else {
    doc.font("Helvetica-Oblique").fontSize(10).fillColor(COLORS.subtle)
       .text("N/A", left + leftColW, doc.y, { width: rightColW, align: "right" });
  }

  // Items table
  // Header row
  doc.rect(left, doc.y, right - left, 20).fill(COLORS.tableHeaderBg);
  doc.fillColor(COLORS.text).font("Helvetica-Bold").fontSize(10);
  const descX = left + 8;
  const qtyX = right - 40;
  const headerY = doc.y + 4;
  doc.text("Description", descX, headerY, { width: qtyX - descX - 8 });
  doc.text("Qty", qtyX, headerY, { width: 32, align: "right" });
  doc.moveDown(1.2);
  doc.font("Helvetica").fontSize(10).fillColor(COLORS.text);

  // Rows with light horizontal lines
  Object.values(groupedDevices).forEach((d) => {
    const desc =
      `${d.brand} ${d.details} ${d.color}` +
      `${d.gb ? " " + d.gb + "GB" : ""}` +
      `${d.grade && d.grade !== "N/A" ? " Grade " + d.grade : ""}`;

    const rowY = doc.y + 4;
    doc.text(desc, descX, rowY, { width: qtyX - descX - 8 });
    const afterDescY = doc.y;
    doc.text(String(d.count), qtyX, rowY, { width: 32, align: "right" });
    const afterQtyY = doc.y;

    const rowBottom = Math.max(afterDescY, afterQtyY) + 6;
    doc.strokeColor(COLORS.rule).moveTo(left, rowBottom).lineTo(right, rowBottom).stroke();
    doc.y = rowBottom;
  });

  // Total row
  doc.moveDown(0.4);
  doc.font("Helvetica-Bold").fillColor(COLORS.text);
  doc.text("Total", descX, doc.y, { width: qtyX - descX - 8 });
  doc.text(String(totalCount), qtyX, doc.y - 12, { width: 32, align: "right" });
  doc.moveDown(0.6);

  // Signature section
  const drawSig = (label: string) => {
    doc.font("Helvetica").fontSize(10).fillColor(COLORS.text).text(label, left, doc.y + 6);
    const y = doc.y + 10;
    doc.strokeColor("#000").moveTo(left + 120, y).lineTo(right - 150, y).stroke();
    doc.moveDown(0.6);
  };
  drawSig("Dispatched by:");
  drawSig("Received by Signature:");
  drawSig("Received by Print:");

  // Footer notes
  doc.moveDown(0.8);
  doc.font("Helvetica-Bold").fontSize(9).fillColor(COLORS.text).text(
    "ANY DISCREPANCIES MUST BE REPORTED WITHIN 48 HOURS OF DELIVERY",
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

/**
 * Send the generated dispatch note PDF via SMTP (Mailtrap) to a default recipient.
 * This is best-effort; failures are logged but do not block the API response.
 */
async function emailDispatchNote(
  pdf: Buffer,
  {
    orderId,
    customerName,
    customerEmail,
    companyTitle,
  }: { orderId: number; customerName?: string | null; customerEmail?: string | null; companyTitle?: string | null }
) {
  // Read SMTP config from env with safe fallbacks per user's provided details.
  const host = process.env.MAILTRAP_HOST || "live.smtp.mailtrap.io";
  const port = Number(process.env.MAILTRAP_PORT || 2525);
  const secure = false; // Mailtrap works on STARTTLS for 2525 typically
  const user = process.env.MAILTRAP_USER || "api";
  const pass = process.env.MAILTRAP_PASS || "37de0592616065d26cd67312cf19b236";

  const from = process.env.MAIL_FROM || "warehouse@quantum-cloud.co.uk";
  const to = process.env.MAIL_TO_DEFAULT || "s4dpaul@mail.com";
  const cc = process.env.MAIL_CC || "warehouse@s4dltd.com";
  const replyTo = process.env.MAIL_REPLY_TO || from;

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
    tls: { rejectUnauthorized: false },
  });

  const subject = `Dispatch Note IO-${orderId}`;
  const html = `
    <div style="font-family: Arial, sans-serif; font-size:14px; color:#222">
      <p>Please find attached the dispatch note for order <strong>IO-${orderId}</strong>.</p>
      ${companyTitle ? `<p>Company: <strong>${companyTitle}</strong></p>` : ""}
      ${customerName ? `<p>Customer: <strong>${customerName}</strong></p>` : ""}
      ${customerEmail ? `<p>Customer Email: ${customerEmail}</p>` : ""}
      <p style="margin-top:16px;color:#666">This email was sent automatically by the S4D system.</p>
    </div>
  `;

  try {
    await transporter.sendMail({
      from,
      to,
      cc,
      replyTo,
      subject,
      html,
      text: `Dispatch note for IO-${orderId} attached.`,
      attachments: [
        {
          filename: `dispatch-note-${orderId}.pdf`,
          content: pdf,
          contentType: "application/pdf",
        },
      ],
    });
    console.log(`[dispatch-note] Email sent for IO-${orderId} to ${to} (cc: ${cc})`);
  } catch (err) {
    console.error(`[dispatch-note] Failed to send email for IO-${orderId}:`, err);
  }
}

// GET /api/goods-out/[orderId]/dispatch-note - Generate dispatch note for a goods out order
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId: orderIdParam } = await params;
    const orderId = parseInt(orderIdParam);
    if (isNaN(orderId)) {
      return NextResponse.json({ error: "Invalid order ID" }, { status: 400 });
    }

    const data = await buildDispatchData(orderId);
    const pdfBuffer = await createPdfBuffer({ orderId, ...data });

    // Fire-and-forget email (do not block response). Await to ensure errors are caught here,
    // but we won't throw even if it fails; the download still proceeds.
    emailDispatchNote(pdfBuffer, {
      orderId,
      customerName: data.customer?.name ?? null,
      customerEmail: data.customer?.email ?? null,
      companyTitle: data.companySettings?.company_title ?? null,
    });

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="dispatch-note-${orderId}.pdf"`,
        "Content-Length": String(pdfBuffer.length),
      },
    });
  } catch (error) {
    console.error("Dispatch Note GET error:", error);
    return NextResponse.json(
      {
        error:
          "Failed to generate dispatch note: " +
          (error instanceof Error ? error.message : "Unknown error"),
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}