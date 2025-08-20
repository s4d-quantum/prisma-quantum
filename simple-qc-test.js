const axios = require('axios');

async function simpleQCTest() {
  try {
    console.log('Testing QC API endpoints...');
    
    // Test QC purchases endpoint with a short timeout
    console.time('QC Purchases Endpoint');
    const purchasesResponse = await axios.get('http://localhost:3000/api/qc/purchases', {
      params: {
        page: 1,
        limit: 5
      },
      timeout: 5000 // 5 second timeout
    });
    console.timeEnd('QC Purchases Endpoint');
    
    console.log(`Status: ${purchasesResponse.status}`);
    console.log(`QC Purchases: ${purchasesResponse.data.purchases?.length || 0} items`);
    console.log(`Total Pages: ${purchasesResponse.data.pagination?.totalPages || 0}`);
    
    // If we have purchases, test the devices endpoint for the first purchase
    if (purchasesResponse.data.purchases?.length > 0) {
      const firstPurchaseId = purchasesResponse.data.purchases[0].purchase_id;
      console.log(`Testing devices for purchase ID: ${firstPurchaseId}`);
      
      console.time('QC Devices Endpoint');
      const devicesResponse = await axios.get(`http://localhost:3000/api/qc/purchases/${firstPurchaseId}/devices`, {
        timeout: 5000 // 5 second timeout
      });
      console.timeEnd('QC Devices Endpoint');
      
      console.log(`Status: ${devicesResponse.status}`);
      console.log(`QC Devices: ${devicesResponse.data.devices?.length || 0} items`);
    }
    
    console.log('Simple QC test completed successfully!');
  } catch (error) {
    console.error('Error testing QC endpoints:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

simpleQCTest();