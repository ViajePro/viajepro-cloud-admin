const https = require('https');

// Configurar la URL base de tu API Gateway
const API_BASE_URL = 'https://YOUR_API_GATEWAY_URL.execute-api.us-east-2.amazonaws.com/Prod';

// Función helper para hacer requests
function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(API_BASE_URL + path);
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    if (body) {
      const bodyStr = JSON.stringify(body);
      options.headers['Content-Length'] = Buffer.byteLength(bodyStr);
    }

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const response = {
            statusCode: res.statusCode,
            body: JSON.parse(data)
          };
          resolve(response);
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            body: data
          });
        }
      });
    });

    req.on('error', reject);
    
    if (body) {
      req.write(JSON.stringify(body));
    }
    
    req.end();
  });
}

// Pruebas
async function runTests() {
  console.log('🧪 Iniciando pruebas de endpoints...\n');

  // Test 1: Reporte de ingresos
  console.log('1️⃣ Probando reporte de ingresos...');
  try {
    const startDate = '2024-01-01';
    const endDate = '2024-12-31';
    const response = await makeRequest('GET', `/finance/income-report?startDate=${startDate}&endDate=${endDate}`);
    console.log(`   Status: ${response.statusCode}`);
    console.log(`   Response: ${JSON.stringify(response.body, null, 2)}`);
    console.log(response.statusCode === 200 ? '   ✅ ÉXITO' : '   ❌ ERROR');
  } catch (error) {
    console.log(`   ❌ ERROR: ${error.message}`);
  }
  console.log('');

  // Test 2: Deudas de choferes
  console.log('2️⃣ Probando deudas de choferes...');
  try {
    const response = await makeRequest('GET', '/finance/driver-debts');
    console.log(`   Status: ${response.statusCode}`);
    console.log(`   Response: ${JSON.stringify(response.body, null, 2)}`);
    console.log(response.statusCode === 200 ? '   ✅ ÉXITO' : '   ❌ ERROR');
  } catch (error) {
    console.log(`   ❌ ERROR: ${error.message}`);
  }
  console.log('');

  // Test 3: Deuda de chofer específico
  console.log('3️⃣ Probando deuda de chofer específico...');
  try {
    const driverId = 'test-driver-123';
    const response = await makeRequest('GET', `/finance/driver-debts/${driverId}`);
    console.log(`   Status: ${response.statusCode}`);
    console.log(`   Response: ${JSON.stringify(response.body, null, 2)}`);
    console.log([200, 404].includes(response.statusCode) ? '   ✅ ÉXITO' : '   ❌ ERROR');
  } catch (error) {
    console.log(`   ❌ ERROR: ${error.message}`);
  }
  console.log('');

  // Test 4: Registrar pago
  console.log('4️⃣ Probando registro de pago...');
  try {
    const paymentData = {
      driverId: 'test-driver-123',
      amount: 100.50,
      description: 'Pago de prueba'
    };
    const response = await makeRequest('POST', '/finance/driver-payments', paymentData);
    console.log(`   Status: ${response.statusCode}`);
    console.log(`   Response: ${JSON.stringify(response.body, null, 2)}`);
    console.log([200, 201, 400, 404].includes(response.statusCode) ? '   ✅ ÉXITO' : '   ❌ ERROR');
  } catch (error) {
    console.log(`   ❌ ERROR: ${error.message}`);
  }
  console.log('');

  console.log('🏁 Pruebas completadas');
}

runTests().catch(console.error);