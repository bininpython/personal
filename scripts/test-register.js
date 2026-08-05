const http = require('http');

const data = JSON.stringify({
  full_name: 'Chris Test',
  trainer_code: '#123-Chris',
  password: 'senha123',
});

const req = http.request({
  hostname: 'localhost',
  port: 3000,
  path: '/api/auth/trainer/register',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
}, res => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Body:', body);
  });
});

req.on('error', e => console.error(e));
req.write(data);
req.end();
