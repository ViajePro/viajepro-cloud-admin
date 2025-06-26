// debug-dynamodb.js
// Script para verificar la estructura de la tabla DynamoDB

const AWS = require('aws-sdk');
const fs = require('fs');

// Configuración
const config = {
  region: 'us-east-2', // Ajustar según la región de tu tabla
  tableName: 'RemisData-dev' // Ajustar según el nombre de tu tabla
};

// Crear cliente DynamoDB
const docClient = new AWS.DynamoDB.DocumentClient({ region: config.region });

// Función para escanear la tabla y buscar elementos con STATUS#FINISHED
async function scanFinishedTravels() {
  console.log(`Escaneando tabla ${config.tableName} para buscar viajes finalizados...`);
  
  try {
    // Primero intentamos con la consulta GSI1
    const gsiParams = {
      TableName: config.tableName,
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1_PK = :status',
      ExpressionAttributeValues: {
        ':status': 'STATUS#FINISHED'
      },
      Limit: 10 // Limitar a 10 resultados para prueba
    };
    
    console.log('Consultando GSI1 con STATUS#FINISHED...');
    const gsiResult = await docClient.query(gsiParams).promise();
    
    console.log(`Encontrados ${gsiResult.Items?.length || 0} elementos con GSI1_PK = STATUS#FINISHED`);
    
    if (gsiResult.Items && gsiResult.Items.length > 0) {
      console.log('Estructura del primer elemento:');
      console.log(JSON.stringify(gsiResult.Items[0], null, 2));
    }
    
    // También probamos con minúsculas por si acaso
    const gsiParamsLower = {
      TableName: config.tableName,
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1_PK = :status',
      ExpressionAttributeValues: {
        ':status': 'STATUS#finished'
      },
      Limit: 10
    };
    
    console.log('Consultando GSI1 con STATUS#finished (minúsculas)...');
    const gsiResultLower = await docClient.query(gsiParamsLower).promise();
    
    console.log(`Encontrados ${gsiResultLower.Items?.length || 0} elementos con GSI1_PK = STATUS#finished`);
    
    // Ahora hacemos un escaneo general para ver qué valores de GSI1_PK existen
    const scanParams = {
      TableName: config.tableName,
      Limit: 100
    };
    
    console.log('Escaneando tabla para ver estructura general...');
    const scanResult = await docClient.scan(scanParams).promise();
    
    console.log(`Encontrados ${scanResult.Items?.length || 0} elementos en total`);
    
    // Extraer valores únicos de GSI1_PK
    const gsi1PkValues = new Set();
    scanResult.Items?.forEach(item => {
      if (item.GSI1_PK) {
        gsi1PkValues.add(item.GSI1_PK);
      }
    });
    
    console.log('Valores únicos de GSI1_PK encontrados:');
    console.log(Array.from(gsi1PkValues));
    
    // Guardar resultados en un archivo para análisis
    fs.writeFileSync('dynamodb-debug-results.json', JSON.stringify({
      gsiFinished: gsiResult.Items || [],
      gsiFinishedLower: gsiResultLower.Items || [],
      sampleItems: scanResult.Items?.slice(0, 10) || [],
      gsi1PkValues: Array.from(gsi1PkValues)
    }, null, 2));
    
    console.log('Resultados guardados en dynamodb-debug-results.json');
    
  } catch (error) {
    console.error('Error al consultar DynamoDB:', error);
  }
}

// Ejecutar función
scanFinishedTravels();