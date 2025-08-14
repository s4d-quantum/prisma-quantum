const { PrismaClient } = require('@prisma/client');

async function testNewViewFields() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: "mysql://pgloader:715525@206.189.25.77:3306/s4d_england_db"
      }
    }
  });

  try {
    console.log('Testing new fields in vw_device_overview...');
    
    // Test the updated view with new fields
    const devices = await prisma.$queryRaw`
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
      WHERE item_cosmetic_passed IS NOT NULL AND item_functional_passed IS NOT NULL
      LIMIT 3
    `;
    
    console.log('Devices with QC information:');
    devices.forEach((device, index) => {
      console.log(`\nDevice ${index + 1}:`);
      console.log(`  IMEI: ${device.imei}`);
      console.log(`  Model: ${device.manufacturer} ${device.model_no}`);
      console.log(`  Color: ${device.color}, Storage: ${device.storage}GB`);
      console.log(`  Grade: ${device.grade}, Status: ${device.status}`);
      console.log(`  Supplier: ${device.supplier}`);
      console.log(`  Purchase Order: ${device.purchase_order_id} on ${device.purchase_date}`);
      console.log(`  QC Required: ${device.qc_required}, QC Completed: ${device.qc_complete}`);
      console.log(`  Repair Required: ${device.repair_required}, Repair Completed: ${device.repair_complete}`);
      console.log(`  Cosmetic Passed: ${device.item_cosmetic_passed}`);
      console.log(`  Functional Passed: ${device.item_functional_passed}`);
      console.log(`  Tray ID: ${device.tray_id}`);
      console.log(`  Available Flag: ${device.available_flag}`);
    });
    
    console.log('\n=== Test completed successfully ===');
    
  } catch (error) {
    console.error('Error testing new view fields:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testNewViewFields();