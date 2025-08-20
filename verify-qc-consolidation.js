const axios = require('axios');

async function verifyQCConsolidation() {
  try {
    console.log('Verifying QC consolidation...');
    
    // Test QC purchases endpoint
    const purchasesResponse = await axios.get('http://localhost:3000/api/qc/purchases', {
      params: {
        page: 1,
        limit: 20 // Get more items to better verify
      },
      timeout: 10000 // 10 second timeout
    });
    
    console.log(`Retrieved ${purchasesResponse.data.purchases.length} purchases`);
    
    // Check for duplicate purchase_ids
    const purchaseIds = purchasesResponse.data.purchases.map(p => p.purchase_id);
    const uniquePurchaseIds = [...new Set(purchaseIds)];
    
    console.log(`Total purchase IDs: ${purchaseIds.length}`);
    console.log(`Unique purchase IDs: ${uniquePurchaseIds.length}`);
    
    if (purchaseIds.length === uniquePurchaseIds.length) {
      console.log('✅ SUCCESS: All purchases have unique purchase IDs (correct consolidation)');
    } else {
      console.log('❌ ERROR: Duplicate purchase IDs found (incorrect consolidation)');
      // Show duplicates
      const duplicates = purchaseIds.filter((id, index) => purchaseIds.indexOf(id) !== index);
      console.log(`Duplicate purchase IDs: ${[...new Set(duplicates)]}`);
    }
    
    // Show sample data
    console.log('\nSample purchases:');
    purchasesResponse.data.purchases.slice(0, 5).forEach(purchase => {
      console.log(`  Purchase ID: ${purchase.purchase_id}, Device Count: ${purchase.device_count}, Supplier: ${purchase.supplier?.name || 'N/A'}`);
    });
    
    console.log('\nVerification completed!');
  } catch (error) {
    console.error('Error verifying QC consolidation:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

verifyQCConsolidation();