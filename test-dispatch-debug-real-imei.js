const { PrismaClient } = require('@prisma/client');
const PDFDocument = require('pdfkit');
const fs = require('fs');

const prisma = new PrismaClient();

async function testDispatchDebug() {
  try {
    console.log('Testing dispatch note generation with real IMEIs step by step...');
    
    const orderId = 14199;
    
    // Get order details
    console.log('Getting order details...');
    const order = await prisma.tbl_orders.findFirst({
      where: {
        order_id: orderId
      }
    });
    
    console.log('Order:', order);
    
    if (!order) {
      console.log('Order not found');
      return;
    }
    
    // Get customer details
    console.log('Getting customer details...');
    let customer = null;
    if (order.customer_id) {
      customer = await prisma.tbl_customers.findFirst({
        where: {
          customer_id: order.customer_id
        }
      });
    }
    
    console.log('Customer:', customer);
    
    // Get company settings
    console.log('Getting company settings...');
    const companySettings = await prisma.tbl_settings.findFirst();
    console.log('Company settings:', companySettings);
    
    // Get all devices for this order
    console.log('Getting devices for order...');
    const devices = await prisma.tbl_orders.findMany({
      where: {
        order_id: orderId
      }
    });
    
    console.log('Devices count:', devices.length);
    console.log('Devices:', devices);
    
    // Get IMEI details for each device
    console.log('Getting IMEI details...');
    const imeiDetails = await Promise.all(
      devices.map(async (device) => {
        if (device.item_imei) {
          console.log(`Getting details for IMEI: ${device.item_imei}`);
          const imei = await prisma.tbl_imei.findFirst({
            where: {
              item_imei: device.item_imei
            }
          });
          
          console.log(`IMEI result:`, imei);
          
          let tac = null;
          if (imei?.item_tac) {
            console.log(`Getting TAC details for: ${imei.item_tac}`);
            tac = await prisma.tbl_tac.findFirst({
              where: {
                item_tac: imei.item_tac
              }
            });
            console.log(`TAC result:`, tac);
          }
          
          return { device, imei, tac };
        }
        return { device, imei: null, tac: null };
      })
    );
    
    console.log('IMEI details:', imeiDetails);
    
    // Group devices by their characteristics
    console.log('Grouping devices...');
    const groupedDevices = {};
    
    imeiDetails.forEach(({ device, imei, tac }) => {
      // Create a key based on device characteristics
      // Use available data or fallback to device fields
      const brand = tac?.item_brand || 'Unknown';
      const details = tac?.item_details || 'Unknown';
      const color = imei?.item_color || 'Unknown';
      const gb = imei?.item_gb || 'Unknown';
      const grade = imei?.item_grade?.toString() || 'Unknown';
      
      const key = `${brand}|${details}|${color}|${gb}|${grade}`;
      
      console.log(`Group key: ${key}`);
      
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
    
    console.log('Grouped devices:', groupedDevices);
    
    // Try to generate PDF
    console.log('Generating PDF...');
    try {
      // Create PDF
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50
      });

      // Collect PDF data
      const chunks = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => {
        console.log('PDF generation completed');
      });

      // Add company header
      doc.fontSize(20).text('Dispatch Note', { align: 'center' });
      doc.moveDown();

      // Company details
      if (companySettings) {
        doc.fontSize(12);
        doc.text(companySettings.company_title || 'S4D Limited');
        if (companySettings.address) doc.text(companySettings.address);
        if (companySettings.city || companySettings.country) {
          const location = [companySettings.city, companySettings.country].filter(Boolean).join(', ');
          doc.text(location);
        }
        if (companySettings.postcode) doc.text(companySettings.postcode);
        if (companySettings.phone) doc.text(`Office: ${companySettings.phone}`);
        doc.text('www.s4dltd.com');
      } else {
        doc.fontSize(12);
        doc.text('S4D Limited');
        doc.text('Ebenezer House, Ryecroft');
        doc.text('Newcastle Under Lyme, Staffordshire, ST5 2BE');
        doc.text('Office: +44 1782 330780');
        doc.text('www.s4dltd.com');
      }
      doc.moveDown();

      // Order details
      doc.fontSize(12);
      doc.text(`Dispatch#: IO-${orderId}`, { align: 'right' });
      doc.text(`Date: ${order.date ? new Date(order.date).toLocaleDateString() : 'N/A'}`, { align: 'right' });
      doc.moveDown();

      // Customer details
      if (customer) {
        doc.text('Customer:');
        doc.text(customer.name || '');
        if (customer.address) doc.text(customer.address);
        if (customer.address2) doc.text(customer.address2);
        if (customer.city || customer.country) {
          const location = [customer.city, customer.country].filter(Boolean).join(', ');
          doc.text(location);
        }
        if (customer.postcode) doc.text(customer.postcode);
        if (customer.phone) doc.text(customer.phone);
        if (customer.email) doc.text(customer.email);
        doc.moveDown();
      }

      // Order details
      doc.text(`Customer Ref: ${order.customer_ref || 'N/A'}`);
      doc.text(`Courier: ${order.delivery_company || 'N/A'}`);
      doc.text(`Tracking No: ${order.tracking_no || 'N/A'}`);
      doc.text(`PO Reference: ${order.po_box || 'N/A'}`);
      doc.text(`Total # of Boxes: ${order.total_boxes || 'N/A'}`);
      doc.text(`Total # of Pallets: ${order.total_pallets || 'N/A'}`);
      doc.moveDown();

      // Devices table header
      const tableTop = doc.y;
      const itemDescriptionX = 50;
      const itemQtyX = 400;
      const rowHeight = 20;

      doc.fontSize(12).font('Helvetica-Bold');
      doc.text('Description', itemDescriptionX, tableTop);
      doc.text('Qty', itemQtyX, tableTop);
      doc.font('Helvetica').fontSize(10);

      // Draw table header line
      doc.moveTo(itemDescriptionX, tableTop + 15)
         .lineTo(550, tableTop + 15)
         .stroke();

      let yPosition = tableTop + 25;

      // Add grouped devices to table
      Object.values(groupedDevices).forEach((device) => {
        if (yPosition > 750) { // Create new page if needed
          doc.addPage();
          yPosition = 50;
        }

        const description = `${device.brand} ${device.details} ${device.color} ${device.gb}GB Grade ${device.grade}`;
        
        doc.text(description, itemDescriptionX, yPosition, { width: 300 });
        doc.text(device.count.toString(), itemQtyX, yPosition);
        
        yPosition += rowHeight;
      });

      // Add total
      doc.moveTo(itemDescriptionX, yPosition)
         .lineTo(550, yPosition)
         .stroke();
         
      doc.font('Helvetica-Bold');
      doc.text('Total:', itemDescriptionX, yPosition + 5);
      const totalCount = Object.values(groupedDevices).reduce((sum, device) => sum + device.count, 0);
      doc.text(totalCount.toString(), itemQtyX, yPosition + 5);

      // Add signature sections
      yPosition += 50;
      if (yPosition > 750) {
        doc.addPage();
        yPosition = 50;
      }

      doc.font('Helvetica').fontSize(10);
      doc.text('Dispatched by:', 50, yPosition);
      doc.text('Recieved by Signature:', 50, yPosition + 30);
      doc.text('Recieved by Print:', 50, yPosition + 60);

      // Add disclaimer
      yPosition += 100;
      if (yPosition > 750) {
        doc.addPage();
        yPosition = 50;
      }

      doc.fontSize(8);
      doc.text('ANY DISCREPANCIES MUST BE REPORTED WITHIN 48 HOURS OF DELIVERY', 50, yPosition, { align: 'center' });

      // Confidentiality notice
      yPosition += 30;
      if (yPosition > 750) {
        doc.addPage();
        yPosition = 50;
      }

      doc.fontSize(6);
      doc.text('Confidentiality Notice: This document has been sent by S4D Limited (registered in England and Wales with number 9342012). Registered office: Ebenezer House, Ryecroft, Newcastle Under Lyme, Staffordshire, ST5 2BE. This document is confidential and intended for the use of the named recipient only. If you are not the intended recipient, please notify us immediately. Please note that this document and any attachments have not been encrypted. They may, therefore, be liable to be compromised. Please also note that it is your responsibility to scan this document and any attachments for viruses.', 50, yPosition, { width: 500 });

      doc.end();

      // Wait for PDF generation to complete
      await new Promise(resolve => {
        doc.on('end', resolve);
      });

      const pdfBuffer = Buffer.concat(chunks);
      console.log('PDF buffer length:', pdfBuffer.length);
      
      // Save to file
      fs.writeFileSync(`dispatch-note-${orderId}-debug.pdf`, pdfBuffer);
      console.log(`PDF saved as dispatch-note-${orderId}-debug.pdf`);
      
    } catch (pdfError) {
      console.error('Error generating PDF:', pdfError);
    }
    
  } catch (error) {
    console.error('Error in dispatch debug:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDispatchDebug();