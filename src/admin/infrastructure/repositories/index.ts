import AWS from 'aws-sdk';
import { DynamoDBFinanceRepository } from './dynamodb-finance-repository';
import { DynamoDBDriverRepository } from './driver-repository';
import { config } from '../../config';
import { LoggerFactory } from '../logging/LoggerFactory';

// Crear loggers
const repositoryLogger = LoggerFactory.getLogger('repository');

// Configuración de DynamoDB
const getDocumentClient = () => {
  const options: AWS.DynamoDB.ClientConfiguration = {
    region: config.region
  };

  // Para desarrollo local
  if (config.isLocal) {
    options.endpoint = 'http://localhost:8000';
    repositoryLogger.info('Usando endpoint local para DynamoDB', { endpoint: options.endpoint });
  }

  return new AWS.DynamoDB.DocumentClient(options);
};

// Crear instancia del cliente DynamoDB
const documentClient = getDocumentClient();

repositoryLogger.info('Inicializando repositorios', { 
  tableName: config.tableName,
  stage: config.stage,
  isLocal: config.isLocal
});

// Exportar instancias de repositorios
export const financeRepository = new DynamoDBFinanceRepository(
  documentClient,
  config.tableName,
  LoggerFactory.getLogger('financeRepository')
);

export const driverRepository = new DynamoDBDriverRepository(
  documentClient,
  config.tableName,
  LoggerFactory.getLogger('driverRepository')
);