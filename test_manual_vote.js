#!/usr/bin/env node

/**
 * Test script to verify manual vote casting functionality
 */

const http = require('http');

function testManualVoteBySR() {
  console.log('🧪 Testing manual vote by SR number...\n');

  const postData = JSON.stringify({
    sr_number: '001'
  });

  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/votes/by-sr/vote',
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
          console.log('\n✔️ Manual vote by SR number successful!');
        } else {
          console.log('\n✖️ Manual vote by SR number failed!');
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

function testBulkUpdate() {
  console.log('\n🧪 Testing bulk update votes...\n');

  const postData = JSON.stringify({
    updates: [
      { id: 1, total_votes: 5 },
      { id: 2, total_votes: 10 },
      { id: 3, total_votes: 3 }
    ]
  });

  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/votes/bulk-update',
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
          console.log('\n✔️ Bulk update successful!');
        } else {
          console.log('\n✖️ Bulk update failed!');
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

function testManualVoteBySRMultiple() {
  console.log('\n🧪 Testing manual vote by multiple SR numbers...\n');
  
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

function runAllTests() {
  console.log('🚀 Starting manual vote casting tests...\n');
  
  testManualVoteBySR();
  testManualVoteBySRMultiple();
  testBulkUpdate();
}

runAllTests();