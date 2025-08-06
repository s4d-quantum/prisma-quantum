const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testDbQuery() {
  try {
    console.log('Testing database query for order 14198...');
    
    // Get order details
    const order = await prisma.tbl_orders.findFirst({
      where: {
        order_id: 14198
      }
    });
    
    console.log('Order details:', order);
    
    // Get all devices for this order
    const devices = await prisma.tbl_orders.findMany({
      where: {
        order_id: 14198
      }
    });
    
    console.log('Devices count:', devices.length);
    console.log('Devices:', devices);
    
    // Get IMEI details for each device
    for (const device of devices) {
      if (device.item_imei) {
        const imei = await prisma.tbl_imei.findFirst({
          where: {
            item_imei: device.item_imei
          }
        });
        
        console.log(`IMEI ${device.item_imei}:`, imei);
        
        let tac = null;
        if (imei?.item_tac) {
          tac = await prisma.tbl_tac.findFirst({
            where: {
              item_tac: imei.item_tac
            }
          });
        }
        
        console.log(`TAC ${imei?.item_tac}:`, tac);
      }
    }
    
  } catch (error) {
    console.error('Error querying database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDbQuery();