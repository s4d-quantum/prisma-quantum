const axios = require('axios');

// Test data with existing customer
const testData = {
  customer_id: "CST-44", // Using existing customer from the API response
  items: [
    {
      item_brand: "Apple",
      item_details: "iPhone 12",
      item_color: "Black",
      item_grade: 1,
      item_gb: "128GB",
      quantity: 3,
      tray_id: "TRAY001"
    }
  ],
  customer_ref: "CR001",
  po_ref: "PO001",
  supplier_id: "SUPP001"
};

async function testSalesOrderCreation() {
  try {
    console.log('Testing sales order creation...');
    
    // Make API call to create sales order
    const response = await axios.post('http://localhost:3000/api/sales-orders', testData);
    
    console.log('Sales order created successfully!');
    console.log('Response:', response.data);
    
  } catch (error) {
    console.error('Error creating sales order:', error.response?.data || error.message);
  }
}

// Run the test
testSalesOrderCreation();