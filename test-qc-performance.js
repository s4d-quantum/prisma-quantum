const axios = require('axios');

async function testQCPerformance() {
  try {
    console.log('Testing QC API performance...');
    
    // Test QC purchases endpoint
    console.time('QC Purchases Endpoint');
    const purchasesResponse = await axios.get('http://localhost:3000/api/qc/purchases', {
      params: {
        page: 1,
        limit: 10
      },
      timeout: 30000 // 30 second timeout
    });
    console.timeEnd('QC Purchases Endpoint');
    
    console.log(`QC Purchases: ${purchasesResponse.data.purchases.length} items`);
    console.log(`Total Pages: ${purchasesResponse.data.pagination.totalPages}`);
    
    // If we have purchases, test the devices endpoint for the first purchase
    if (purchasesResponse.data.purchases.length > 0) {
      const firstPurchaseId = purchasesResponse.data.purchases[0].purchase_id;
      console.log(`Testing devices for purchase ID: ${firstPurchaseId}`);
      
      console.time('QC Devices Endpoint');
      const devicesResponse = await axios.get(`http://localhost:3000/api/qc/purchases/${firstPurchaseId}/devices`, {
        timeout: 30000 // 30 second timeout
      });
      console.timeEnd('QC Devices Endpoint');
      
      console.log(`QC Devices: ${devicesResponse.data.devices.length} items`);
    }
    
    console.log('Performance test completed successfully!');
  } catch (error) {
    console.error('Error testing QC performance:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testQCPerformance();