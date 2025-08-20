const http = require('http');
const fs = require('fs');

// Configuration
const baseUrl = 'http://localhost:3000'; // Assuming the app runs on port 3000
const dashboardEndpoint = '/api/dashboard';
const testIterations = 10;

// Function to make HTTP request and measure response time
function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    const req = http.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        resolve({
          statusCode: res.statusCode,
          responseTime: responseTime,
          data: data
        });
      });
    });
    
    req.on('error', (e) => {
      reject(e);
    });
    
    req.end();
  });
}

// Function to run performance test
async function runPerformanceTest() {
  console.log(`Testing dashboard performance with ${testIterations} iterations...`);
  
  const results = [];
  
  for (let i = 0; i < testIterations; i++) {
    try {
      console.log(`Running test ${i + 1}/${testIterations}`);
      const result = await makeRequest(`${baseUrl}${dashboardEndpoint}`);
      results.push(result.responseTime);
      console.log(`Test ${i + 1}: ${result.responseTime}ms`);
    } catch (error) {
      console.error(`Test ${i + 1} failed:`, error.message);
    }
    
    // Add a small delay between requests
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  // Calculate statistics
  if (results.length > 0) {
    const avgResponseTime = results.reduce((a, b) => a + b, 0) / results.length;
    const minResponseTime = Math.min(...results);
    const maxResponseTime = Math.max(...results);
    
    console.log('\n=== PERFORMANCE TEST RESULTS ===');
    console.log(`Average Response Time: ${avgResponseTime.toFixed(2)}ms`);
    console.log(`Minimum Response Time: ${minResponseTime}ms`);
    console.log(`Maximum Response Time: ${maxResponseTime}ms`);
    console.log(`Total Tests: ${results.length}`);
    
    // Save results to file
    const resultsData = {
      timestamp: new Date().toISOString(),
      testIterations: testIterations,
      results: results,
      averageResponseTime: avgResponseTime,
      minResponseTime: minResponseTime,
      maxResponseTime: maxResponseTime
    };
    
    fs.writeFileSync('dashboard-performance-results.json', JSON.stringify(resultsData, null, 2));
    console.log('\nResults saved to dashboard-performance-results.json');
  } else {
    console.log('No successful tests to report');
  }
}

// Run the performance test
runPerformanceTest().catch(console.error);