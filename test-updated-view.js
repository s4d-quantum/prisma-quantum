const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testUpdatedView() {
  try {
    // Test the updated view
    console.log('Testing updated vw_device_overview view...');
    
    // Get a sample device from the view
    const devices = await prisma.$queryRaw`
      SELECT * 
      FROM vw_device_overview 
      LIMIT 5
    `;
    
    console.log('Sample devices from view:');
    console.log(JSON.stringify(devices, null, 2));
    
    // Test specific fields that were added/updated
    const detailedDevices = await prisma.$queryRaw`
      SELECT 
        imei,
        manufacturer,
        model_no,
        color,
        storage,
        grade,
        status,
        supplier,
        purchase_order_id,
        purchase_date,
        qc_required,
        qc_complete,
        repair_required,
        repair_complete,
        item_cosmetic_passed,
        item_functional_passed,
        tray_id,
        available_flag
      FROM vw_device_overview 
      LIMIT 5
    `;
    
    console.log('\nDetailed device information:');
    console.log(JSON.stringify(detailedDevices, null, 2));
    
    console.log('\nView test completed successfully!');
  } catch (error) {
    console.error('Error testing updated view:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testUpdatedView();