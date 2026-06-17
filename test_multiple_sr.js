#!/usr/bin/env node

/**
 * Simple test to verify the manual vote casting with multiple SR numbers
 */

const http = require('http');

function testMultipleSRNumbers() {
  console.log('🧪 Testing manual vote by multiple SR numbers...\n');
  
  const postData = JSON.stringify({
    sr_numbers: ['001', '002', '003']
  });
  
  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/votes/by-sr/votes',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };
  
  const req = http.request(options, (res) => {
    console.log(`📤 Status Code: ${res.statusCode}`);
    console.log(`📋 Headers: ${JSON.stringify(res.headers)}\n`);
    
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const json = JSON.parse(data);
        console.log('✅ Response:', json);
        
        if (res.statusCode === 200 && json.success) {
          console.log(`\n✔️ Manual vote by multiple SR numbers successful! Processed: ${json.processed}`);
          if (json.errors && json.errors.length > 0) {
            console.log(`⚠️ Errors: ${json.errors.length} SR numbers failed`);
          }
        } else {
          console.log('\n✖️ Manual vote by multiple SR numbers failed!');
        }
      } catch (e) {
        console.log('❌ Error parsing response:', e);
        console.log('Raw response:', data);
      }
    });
  });
  
  req.on('error', (error) => {
    console.error('❌ Connection error:', error.message);
    console.log('\n⚠️ Make sure the server is running on port 5000');
  });
  
  req.write(postData);
  req.end();
}

function runTest() {
  console.log('🚀 Testing manual vote casting with multiple SR numbers...\n');
  
  testMultipleSRNumbers();
}

runTest();