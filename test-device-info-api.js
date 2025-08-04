// Test the device info API endpoint
const { PrismaClient } = require('@prisma/client');

async function testDeviceInfoAPI() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: "mysql://pgloader:715525@206.189.25.77:3306/s4d_england_db"
      }
    }
  });

  try {
    console.log('Testing device info API implementation...');
    
    // Get a sample IMEI to test with
    console.log('\n=== Getting sample IMEI ===');
    const imeiSample = await prisma.tbl_imei.findFirst({
      where: { 
        item_imei: { not: null },
        item_tac: { not: null }
      },
      select: { item_imei: true, item_tac: true }
    });
    
    if (!imeiSample) {
      console.log('No IMEI found in database');
      return;
    }
    
    const testImei = imeiSample.item_imei;
    console.log('Testing with IMEI:', testImei);
    
    // Test fetching device information from tbl_imei
    console.log('\n=== Testing Device Info Fetch ===');
    const device = await prisma.tbl_imei.findFirst({
      where: { item_imei: testImei }
    });
    console.log('Device info:', device);
    
    // Test fetching manufacturer and model information from vw_tac
    console.log('\n=== Testing Manufacturer Info Fetch ===');
    try {
      const manufacturerResults = await prisma.$queryRaw`
        SELECT item_details, brand_title 
        FROM vw_tac 
        WHERE item_tac = ${device.item_tac}
      `;
      console.log('Manufacturer info:', manufacturerResults);
    } catch (error) {
      console.log('Error fetching manufacturer info:', error.message);
    }
    
    // Test fetching supplier information from vw_device_supplier
    console.log('\n=== Testing Supplier Info Fetch ===');
    try {
      const supplierResults = await prisma.$queryRaw`
        SELECT supplier_name, supplier_address, supplier_city, supplier_country, supplier_phone, supplier_email, supplier_vat
        FROM vw_device_supplier 
        WHERE item_imei = ${testImei}
      `;
      console.log('Supplier info:', supplierResults);
    } catch (error) {
      console.log('Error fetching supplier info:', error.message);
    }
    
    // Test fetching purchase information
    console.log('\n=== Testing Purchase Info Fetch ===');
    const purchase = await prisma.tbl_purchases.findFirst({
      where: { item_imei: testImei }
    });
    console.log('Purchase info:', purchase);
    
    // Test fetching tray information if purchase has a tray_id
    console.log('\n=== Testing Tray Info Fetch ===');
    if (purchase && purchase.tray_id) {
      try {
        const trayResults = await prisma.$queryRaw`
          SELECT title
          FROM tbl_trays
          WHERE tray_id = ${purchase.tray_id}
        `;
        console.log('Tray info:', trayResults);
      } catch (error) {
        console.log('Error fetching tray info:', error.message);
      }
    } else {
      console.log('No tray ID found in purchase');
    }
    
    // Test fetching movement logs
    console.log('\n=== Testing Movement Logs Fetch ===');
    const movements = await prisma.tbl_log.findMany({
      where: { item_code: testImei },
      take: 5,
      orderBy: { date: 'desc' }
    });
    console.log('Movement logs count:', movements.length);
    console.log('Sample movement logs:', movements.slice(0, 3));
    
    console.log('\n=== Test completed successfully ===');
    
  } catch (error) {
    console.error('Device info API test error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDeviceInfoAPI();