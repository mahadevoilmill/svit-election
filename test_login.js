#!/usr/bin/env node

/**
 * Test script to verify login endpoint
 */

const http = require('http');

function testLogin() {
  console.log('🧪 Testing login endpoint...\n');

  const postData = JSON.stringify({
    username: 'NEST',
    password: 'sardar123'
  });

  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/login',
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
          console.log('\n✔️ Login successful!');
        } else {
          console.log('\n✖️ Login failed!');
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

testLogin();
