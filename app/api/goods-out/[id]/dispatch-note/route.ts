import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET /api/goods-out/[id]/dispatch-note - Generate dispatch note for a goods out order
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params before using them
    const { id } = await params;
    const orderId = parseInt(id);

    if (isNaN(orderId)) {
      return NextResponse.json(
        { error: "Invalid order ID" },
        { status: 400 }
      );
    }

    // Get order details
    const order = await prisma.tbl_orders.findFirst({
      where: {
        order_id: orderId
      }
    });

    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    // Get customer details
    let customer = null;
    if (order.customer_id) {
      customer = await prisma.tbl_customers.findFirst({
        where: {
          customer_id: order.customer_id
        }
      });
    }

    // Get company settings
    const companySettings = await prisma.tbl_settings.findFirst();

    // Get all devices for this order
    const devices = await prisma.tbl_orders.findMany({
      where: {
        order_id: orderId
      }
    });

    // Get IMEI details for each device
    const imeiDetails = await Promise.all(
      devices.map(async (device) => {
        if (device.item_imei) {
          const imei = await prisma.tbl_imei.findFirst({
            where: {
              item_imei: device.item_imei
            }
          });
          
          let tac = null;
          if (imei?.item_tac) {
            tac = await prisma.tbl_tac.findFirst({
              where: {
                item_tac: imei.item_tac
              }
            });
          }
          
          return { device, imei, tac };
        }
        return { device, imei: null, tac: null };
      })
    );

    // Group devices by their characteristics
    const groupedDevices: any = {};
    
    imeiDetails.forEach(({ device, imei, tac }) => {
      // Create a key based on device characteristics
      // Use available data or fallback to device fields
      const brand = tac?.item_brand || 'Unknown';
      const details = tac?.item_details || 'Unknown';
      const color = imei?.item_color || 'Unknown';
      const gb = imei?.item_gb || 'Unknown';
      const grade = imei?.item_grade?.toString() || 'Unknown';
      
      const key = `${brand}|${details}|${color}|${gb}|${grade}`;
      
      if (!groupedDevices[key]) {
        groupedDevices[key] = {
          brand: brand,
          details: details,
          color: color,
          gb: gb,
          grade: grade,
          count: 0
        };
      }
      
      // Increment the count for this group
      groupedDevices[key].count++;
    });

    // Create a formatted dispatch note
    let dispatchNote = `DISPATCH NOTE\n\n`;
    dispatchNote += `Dispatch#: IO-${orderId}\n`;
    dispatchNote += `Date: ${order.date ? new Date(order.date).toLocaleDateString() : 'N/A'}\n\n`;
    
    if (companySettings) {
      dispatchNote += `${companySettings.company_title || 'S4D Limited'}\n`;
      if (companySettings.address) dispatchNote += `${companySettings.address}\n`;
      if (companySettings.city || companySettings.country) {
        const location = [companySettings.city, companySettings.country].filter(Boolean).join(', ');
        dispatchNote += `${location}\n`;
      }
      if (companySettings.postcode) dispatchNote += `${companySettings.postcode}\n`;
      if (companySettings.phone) dispatchNote += `Office: ${companySettings.phone}\n`;
      dispatchNote += `www.s4dltd.com\n\n`;
    }
    
    if (customer) {
      dispatchNote += `Customer:\n`;
      dispatchNote += `${customer.name || ''}\n`;
      if (customer.address) dispatchNote += `${customer.address}\n`;
      if (customer.address2) dispatchNote += `${customer.address2}\n`;
      if (customer.city || customer.country) {
        const location = [customer.city, customer.country].filter(Boolean).join(', ');
        dispatchNote += `${location}\n`;
      }
      if (customer.postcode) dispatchNote += `${customer.postcode}\n`;
      if (customer.phone) dispatchNote += `${customer.phone}\n`;
      if (customer.email) dispatchNote += `${customer.email}\n`;
      dispatchNote += `\n`;
    }
    
    dispatchNote += `Customer Ref: ${order.customer_ref || 'N/A'}\n`;
    dispatchNote += `Courier: ${order.delivery_company || 'N/A'}\n`;
    dispatchNote += `Tracking No: ${order.tracking_no || 'N/A'}\n`;
    dispatchNote += `PO Reference: ${order.po_box || 'N/A'}\n`;
    dispatchNote += `Total # of Boxes: ${order.total_boxes || 'N/A'}\n`;
    dispatchNote += `Total # of Pallets: ${order.total_pallets || 'N/A'}\n\n`;
    
    dispatchNote += `Description\t\t\t\t\tQty\n`;
    dispatchNote += `--------------------------------------------------\n`;
    
    Object.values(groupedDevices).forEach((device: any) => {
      const description = `${device.brand} ${device.details} ${device.color} ${device.gb}GB Grade ${device.grade}`;
      dispatchNote += `${description}\t\t${device.count}\n`;
    });
    
    const totalCount = Object.values(groupedDevices).reduce((sum: number, device: any) => sum + device.count, 0);
    dispatchNote += `--------------------------------------------------\n`;
    dispatchNote += `Total:\t\t\t\t\t${totalCount}\n\n`;
    
    dispatchNote += `Dispatched by:\n`;
    dispatchNote += `Recieved by Signature:\n`;
    dispatchNote += `Recieved by Print:\n\n`;
    
    dispatchNote += `ANY DISCREPANCIES MUST BE REPORTED WITHIN 48 HOURS OF DELIVERY\n\n`;
    
    dispatchNote += `Confidentiality Notice: This document has been sent by S4D Limited (registered in England and Wales with number 9342012). Registered office: Ebenezer House, Ryecroft, Newcastle Under Lyme, Staffordshire, ST5 2BE. This document is confidential and intended for the use of the named recipient only. If you are not the intended recipient, please notify us immediately. Please note that this document and any attachments have not been encrypted. They may, therefore, be liable to be compromised. Please also note that it is your responsibility to scan this document and any attachments for viruses.`;

    // Return the text as a response with PDF extension for compatibility
    return new NextResponse(dispatchNote, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="dispatch-note-${orderId}.pdf"`,
      },
    });

  } catch (error) {
    console.error("Dispatch Note GET error:", error);
    return NextResponse.json(
      { error: "Failed to generate dispatch note: " + (error instanceof Error ? error.message : "Unknown error") },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}