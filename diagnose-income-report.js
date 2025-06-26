// diagnose-income-report.js
// Script para diagnosticar problemas con el reporte de ingresos

const AWS = require('aws-sdk');
const fs = require('fs');

// Configuración
const config = {
  region: 'us-east-2', // Ajustar según la región de tu tabla
  tableName: 'RemisData-dev' // Ajustar según el nombre de tu tabla
};

// Crear cliente DynamoDB
const docClient = new AWS.DynamoDB.DocumentClient({ region: config.region });

// Función para diagnosticar problemas con el reporte de ingresos
async function diagnoseIncomeReport() {
  console.log(`Diagnosticando problemas con el reporte de ingresos en la tabla ${config.tableName}...`);
  
  const diagnosticResults = {
    tableInfo: {},
    indexes: [],
    sampleItems: [],
    possibleTravelItems: [],
    uniqueKeys: {},
    recommendations: []
  };
  
  try {
    // 1. Obtener información de la tabla
    const dynamodb = new AWS.DynamoDB({ region: config.region });
    const tableInfo = await dynamodb.describeTable({ TableName: config.tableName }).promise();
    
    diagnosticResults.tableInfo = {
      name: tableInfo.Table.TableName,
      itemCount: tableInfo.Table.ItemCount,
      sizeBytes: tableInfo.Table.TableSizeBytes,
      status: tableInfo.Table.TableStatus,
      keySchema: tableInfo.Table.KeySchema
    };
    
    // Información sobre índices
    if (tableInfo.Table.GlobalSecondaryIndexes) {
      diagnosticResults.indexes = tableInfo.Table.GlobalSecondaryIndexes.map(idx => ({
        name: idx.IndexName,
        keySchema: idx.KeySchema
      }));
    }
    
    console.log(`Información de tabla obtenida: ${diagnosticResults.tableInfo.itemCount} elementos`);
    
    // 2. Obtener muestra de elementos
    const scanParams = {
      TableName: config.tableName,
      Limit: 50
    };
    
    const scanResult = await docClient.scan(scanParams).promise();
    diagnosticResults.sampleItems = scanResult.Items || [];
    
    console.log(`Muestra de ${diagnosticResults.sampleItems.length} elementos obtenida`);
    
    // 3. Analizar estructura de datos
    const uniqueKeys = {};
    const uniqueGSI1_PK = new Set();
    const uniqueGSI2_PK = new Set();
    const uniqueTypes = new Set();
    
    diagnosticResults.sampleItems.forEach(item => {
      // Recopilar todas las claves únicas
      Object.keys(item).forEach(key => {
        if (!uniqueKeys[key]) {
          uniqueKeys[key] = { count: 0, types: new Set() };
        }
        uniqueKeys[key].count++;
        uniqueKeys[key].types.add(typeof item[key]);
      });
      
      // Recopilar valores únicos de GSI1_PK
      if (item.GSI1_PK) {
        uniqueGSI1_PK.add(item.GSI1_PK);
      }
      
      // Recopilar valores únicos de GSI2_PK
      if (item.GSI2_PK) {
        uniqueGSI2_PK.add(item.GSI2_PK);
      }
      
      // Recopilar tipos únicos
      if (item.type) {
        uniqueTypes.add(item.type);
      }
      
      // Identificar posibles elementos de viaje
      if (
        (item.type && item.type.includes('TRAVEL')) ||
        (item.GSI1_PK && item.GSI1_PK.includes('STATUS')) ||
        (item.calculatedCost !== undefined) ||
        (item.companyCommission !== undefined) ||
        (item.travelId !== undefined)
      ) {
        diagnosticResults.possibleTravelItems.push(item);
      }
    });
    
    // Convertir Sets a Arrays para JSON
    diagnosticResults.uniqueKeys = Object.entries(uniqueKeys).map(([key, value]) => ({
      key,
      count: value.count,
      types: Array.from(value.types)
    }));
    
    diagnosticResults.uniqueGSI1_PK = Array.from(uniqueGSI1_PK);
    diagnosticResults.uniqueGSI2_PK = Array.from(uniqueGSI2_PK);
    diagnosticResults.uniqueTypes = Array.from(uniqueTypes);
    
    console.log('Análisis de estructura completado');
    
    // 4. Generar recomendaciones
    if (diagnosticResults.uniqueGSI1_PK.some(pk => pk.includes('STATUS'))) {
      const statusValues = diagnosticResults.uniqueGSI1_PK
        .filter(pk => pk.includes('STATUS'))
        .join(', ');
      
      diagnosticResults.recommendations.push(
        `Se encontraron los siguientes valores de STATUS en GSI1_PK: ${statusValues}. ` +
        `Asegúrate de usar el valor correcto en la consulta.`
      );
    } else {
      diagnosticResults.recommendations.push(
        'No se encontraron valores de STATUS en GSI1_PK. ' +
        'Es posible que los viajes estén almacenados con una estructura diferente.'
      );
    }
    
    // Verificar campos de fecha
    const dateFields = diagnosticResults.uniqueKeys
      .filter(k => k.key.toLowerCase().includes('date') || k.key.toLowerCase().includes('at'))
      .map(k => k.key);
    
    if (dateFields.length > 0) {
      diagnosticResults.recommendations.push(
        `Se encontraron los siguientes campos de fecha: ${dateFields.join(', ')}. ` +
        `Asegúrate de usar el campo correcto para filtrar por fecha.`
      );
    }
    
    // Verificar campos de monto
    const amountFields = diagnosticResults.uniqueKeys
      .filter(k => 
        k.types.includes('number') && 
        (k.key.toLowerCase().includes('amount') || 
         k.key.toLowerCase().includes('cost') || 
         k.key.toLowerCase().includes('price') ||
         k.key.toLowerCase().includes('commission'))
      )
      .map(k => k.key);
    
    if (amountFields.length > 0) {
      diagnosticResults.recommendations.push(
        `Se encontraron los siguientes campos de monto: ${amountFields.join(', ')}. ` +
        `Asegúrate de usar los campos correctos para calcular montos y comisiones.`
      );
    }
    
    // 5. Guardar resultados
    fs.writeFileSync('income-report-diagnosis.json', JSON.stringify(diagnosticResults, null, 2));
    console.log('Diagnóstico completado. Resultados guardados en income-report-diagnosis.json');
    
    // Mostrar recomendaciones
    console.log('\nRecomendaciones:');
    diagnosticResults.recommendations.forEach((rec, i) => {
      console.log(`${i+1}. ${rec}`);
    });
    
  } catch (error) {
    console.error('Error al diagnosticar:', error);
  }
}

// Ejecutar diagnóstico
diagnoseIncomeReport();