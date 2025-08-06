const axios = require('axios');

// Test data for completing the sales order
const completeData = {
  deliveryCompany: "DHL",
  trackingNumber: "DHL123456789",
  totalBoxes: 1,
  totalPallets: 0,
  poBox: "POBOX123",
  addedDevices: [
    {
      imei: "123456789012345",
      brand: "Apple",
      model: "iPhone 12",
      color: "Black",
      grade: "A",
      storage: "128GB"
    },
    {
      imei: "123456789012346",
      brand: "Apple",
      model: "iPhone 12",
      color: "Black",
      grade: "A",
      storage: "128GB"
    },
    {
      imei: "123456789012347",
      brand: "Apple",
      model: "iPhone 12",
      color: "Black",
      grade: "A",
      storage: "128GB"
    }
  ]
};

async function testCompleteSalesOrder() {
  try {
    console.log('Testing sales order completion...');
    
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