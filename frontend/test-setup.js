// Simple test script to verify the frontend and backend can communicate
import axios from 'axios';

// Configure axios to use credentials
axios.defaults.withCredentials = true;

async function testConnection() {
  try {
    console.log('Testing connection to backend...');
    
    // Test the session endpoint first
    console.log('Testing session endpoint...');
    const sessionResponse = await axios.get('http://localhost:3000/api/auth/session', {
      timeout: 5000 // 5 second timeout
    });
    console.log('✅ Session endpoint accessible');
    console.log(`Session data: ${JSON.stringify(sessionResponse.data, null, 2)}`);
    
    // Test the inventory API endpoint
    console.log('Testing inventory API endpoint...');
    const response = await axios.get('http://localhost:3000/api/inventory/imei?page=1&limit=5', {
      timeout: 5000 // 5 second timeout
    });
    
    console.log('✅ Inventory API connection successful!');
    console.log(`Status: ${response.status}`);
    console.log(`Data items: ${response.data.data ? response.data.data.length : 0}`);
    
  } catch (error) {
    console.error('❌ Connection failed:');
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Data: ${JSON.stringify(error.response.data, null, 2)}`);
      if (error.response.status === 404) {
        console.error('Endpoint not found. Please check if the Next.js backend is running and the API routes are correctly configured.');
      }
    } else if (error.request) {
      console.error('No response received from server');
    } else {
      console.error('Error:', error.message);
    }
  }
}

testConnection();