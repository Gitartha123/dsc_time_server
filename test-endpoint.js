const http = require('http');

const data = JSON.stringify({
  name: 'Test User',
  email: 'test@example.com',
  machineHash: 'DEVICE-TEST-001'
});

const options = {
  hostname: 'localhost',
  port: 5001,
  path: '/api/time',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  
  let body = '';
  res.on('data', (chunk) => {
    body += chunk;
  });
  
  res.on('end', () => {
    console.log('Response:', body);
    try {
      const json = JSON.parse(body);
      console.log('Parsed:', JSON.stringify(json, null, 2));
    } catch (e) {
      console.log('Could not parse JSON');
    }
  });
});

req.on('error', (e) => {
  console.error(`Error: ${e.message}`);
  console.error('Full error:', e);
  process.exit(1);
});

console.log('Sending request to http://localhost:5001/api/time');
console.log('Data:', data);
req.write(data);
req.end();
