/**
 * Trigger n8n Workflow - Demo Script
 * Sends test data to n8n webhook to demonstrate automation
 */

const https = require('https');
const http = require('http');

// REPLACE THIS with your actual webhook URL from n8n
const WEBHOOK_URL = 'http://localhost:5678/webhook-test/webhook-trigger';

// Test data to send
const testData = {
  customer: 'John Doe',
  email: 'john@example.com',
  rating: 5,
  comment: 'Great service! Very satisfied.',
  timestamp: new Date().toISOString()
};

console.log('🚀 Triggering n8n workflow...');
console.log('📊 Sending data:', JSON.stringify(testData, null, 2));

// Parse URL
const url = new URL(WEBHOOK_URL);
const client = url.protocol === 'https:' ? https : http;

// Prepare request
const options = {
  hostname: url.hostname,
  port: url.port || (url.protocol === 'https:' ? 443 : 80),
  path: url.pathname + url.search,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  }
};

// Send request
const req = client.request(options, (res) => {
  console.log(`✅ Status: ${res.statusCode}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('📥 Response:', data);
    console.log('🎉 Workflow triggered successfully!');
    console.log('\n👉 Check n8n to see the execution results!');
  });
});

req.on('error', (error) => {
  console.error('❌ Error:', error.message);
  console.log('\n💡 Make sure:');
  console.log('   1. n8n is running (http://localhost:5678)');
  console.log('   2. Workflow is ACTIVE in n8n');
  console.log('   3. Webhook URL is correct');
});

// Send data
req.write(JSON.stringify(testData));
req.end();
