const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testDispatchDebug() {
  try {
    console.log('Testing dispatch note generation step by step...');
    
    const orderId = 14198;
    
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
    
  } catch (error) {
    console.error('Error in dispatch debug:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDispatchDebug();