const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testVwDeviceOverview() {
  try {
    console.log('Testing vw_device_overview view...');
    
    // Test the view directly
    console.log('\n=== Testing vw_device_overview view ===');
    const viewResults = await prisma.$queryRaw`
      SELECT *
      FROM vw_device_overview
      WHERE imei = '350695341089608'
      LIMIT 1
    `;
    
    console.log('View results:', JSON.stringify(viewResults, null, 2));
    
    // Test with a different IMEI to make sure the view works with different devices
    console.log('\n=== Testing with different IMEI ===');
    const viewResults2 = await prisma.$queryRaw`
      SELECT *
      FROM vw_device_overview
      WHERE imei = '351751470414247'
      LIMIT 1
    `;
    
    console.log('View results for second IMEI:', JSON.stringify(viewResults2, null, 2));
    
    console.log('\n=== Test completed ===');
  } catch (error) {
    console.error('Test failed with error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testVwDeviceOverview();