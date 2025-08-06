const axios = require('axios');

// Test data for completing the sales order with real IMEI numbers
const completeData = {
  deliveryCompany: "DHL",
  trackingNumber: "DHL123456789",
  totalBoxes: 1,
  totalPallets: 0,
  poBox: "POBOX123",
  addedDevices: [
    {
      imei: "350117735198465",
      brand: "Samsung",
      model: "F966B/DS",
      color: "Blue Shadow",
      grade: "A",
      storage: "512GB"
    },
    {
      imei: "359037086962072",
      brand: "Samsung",
      model: "G950F",
      color: "Black",
      grade: "B",
      storage: "64GB"
    },
    {
      imei: "359041081558364",
      brand: "Samsung",
      model: "G950F",
      color: "Black",
      grade: "B",
      storage: "64GB"
    }
  ]
};

async function testCompleteSalesOrder() {
  try {
    console.log('Testing sales order completion with real IMEIs...');
    
    // Make API call to complete sales order
    const response = await axios.post('http://localhost:3000/api/sales-orders/10768/complete', completeData);
    
    console.log('Sales order completed successfully!');
    console.log('Response:', response.data);
    
  } catch (error) {
    console.error('Error completing sales order:', error.response?.data || error.message);
  }
}

// Run the test
testCompleteSalesOrder();