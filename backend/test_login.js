import http from 'http';

const testUsers = [
  { username: 'margaritaviaje@gmail.com', password: 'admin123' },
  { username: 'margaritaviajes@gmail.com', password: 'admin123' }
];

async function runTests() {
  for (const user of testUsers) {
    await new Promise((resolve) => {
      const data = JSON.stringify(user);
      const options = {
        hostname: 'localhost',
        port: 3000,
        path: '/api/auth/login',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data)
        }
      };

      console.log(`Testing login for: ${user.username}`);

      const req = http.request(options, (res) => {
        console.log(`Status: ${res.statusCode}`);
        let responseData = '';
        res.on('data', chunk => responseData += chunk);
        res.on('end', () => {
          try {
            const json = JSON.parse(responseData);
            if (json.token) {
              console.log('✅ Success: Token received');
            } else {
              console.log('❌ Error:', json.error);
            }
          } catch (e) {
            console.log('Raw:', responseData);
          }
          resolve();
        });
      });
      req.write(data);
      req.end();
    });
  }
}

runTests();
