const { v4: uuidv4 } = require('uuid');

// Simular un evento de API Gateway
const event = {
  body: JSON.stringify({
    travelId: uuidv4(),
    driverId: uuidv4(),
    amount: 100,
    companyCommission: 20,
    paymentMethod: 'cash'
  }),
  path: '/travel-debt',
  httpMethod: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
};

// Importar el handler de Lambda
const { lambdaHandler } = require('./dist/app');

// Ejecutar el handler
async function testHandler() {
  try {
    console.log('Enviando evento:', JSON.stringify(event, null, 2));
    const response = await lambdaHandler(event);
    console.log('Respuesta:', JSON.stringify(response, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
}

// Ejecutar la prueba
testHandler();