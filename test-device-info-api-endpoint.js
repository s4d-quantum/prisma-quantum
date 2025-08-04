// Test script for device info API endpoint
const testDeviceInfoAPI = async () => {
  try {
    // Replace with an actual IMEI from your database for testing
    const testIMEI = '358792082399411'; // Example IMEI from the prompt
    
    console.log(`Testing device info API with IMEI: ${testIMEI}`);
    
    // Test the endpoint
    const response = await fetch(`http://localhost:3000/api/inventory/imei/info?imei=${testIMEI}`);
    
    if (!response.ok) {
      console.error(`Error: ${response.status} ${response.statusText}`);
      const errorData = await response.json();
      console.error('Error details:', errorData);
      return;
    }
    
    const data = await response.json();
    console.log('Device info API response:');
    console.log(JSON.stringify(data, null, 2));
    
  } catch (error) {
    console.error('Test failed with error:', error);
  }
};

// Run the test
testDeviceInfoAPI();