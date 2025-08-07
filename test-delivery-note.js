const axios = require('axios');
const fs = require('fs');

async function testDeliveryNote() {
  try {
    console.log('Testing delivery note generation...');
    
    // Use a known purchase ID from your database
    const purchaseId = 7024; // This is from your example
    
    console.log(`Fetching delivery note for purchase order ${purchaseId}...`);
    
    const response = await axios.get(`http://localhost:3000/api/goods-in/${purchaseId}/delivery-note`, {
      responseType: 'stream'
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers);
    
    // Save the PDF to a file
    const writer = fs.createWriteStream(`delivery-note-${purchaseId}.pdf`);
    response.data.pipe(writer);
    
    writer.on('finish', () => {
      console.log(`Delivery note saved as delivery-note-${purchaseId}.pdf`);
    });
    
    writer.on('error', (err) => {
      console.error('Error saving delivery note:', err);
    });
    
  } catch (error) {
    console.error('Error testing delivery note generation:', error.response?.data || error.message);
  }
}

testDeliveryNote();