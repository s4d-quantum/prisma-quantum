const axios = require('axios');
const fs = require('fs');

async function testDispatchNote() {
  try {
    console.log('Testing dispatch note generation with real IMEIs...');
    
    // Test with the new order ID we just created
    const orderId = 14199;
    
    console.log(`Fetching dispatch note for order ${orderId}...`);
    
    const response = await axios.get(`http://localhost:3000/api/goods-out/${orderId}/dispatch-note`, {
      responseType: 'stream'
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers);
    
    // Save the file with PDF extension since the API returns PDF content type
    const writer = fs.createWriteStream(`dispatch-note-${orderId}.pdf`);
    response.data.pipe(writer);
    
    writer.on('finish', () => {
      console.log(`Dispatch note saved as dispatch-note-${orderId}.pdf`);
    });
    
    writer.on('error', (err) => {
      console.error('Error saving dispatch note:', err);
    });
    
  } catch (error) {
    console.error('Error testing dispatch note generation:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response headers:', error.response.headers);
      // Try to get response data
      if (error.response.data) {
        console.error('Response data:', error.response.data);
      }
    }
  }
}

testDispatchNote();