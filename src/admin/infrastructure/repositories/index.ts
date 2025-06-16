import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import { config } from '../../config';
import { LoggerFactory } from '../logging/LoggerFactory';
import { DynamoDBFinanceRepository } from './dynamodb-finance-repository';
import { DynamoDBConfigRepository } from './dynamodb-config-repository';
import { DynamoDBDriverRepository } from './driver-repository';

// Crear instancia de DynamoDB DocumentClient
const createDocClient = (): DocumentClient => {
  if (config.isLocal) {
    return new DocumentClient({
      region: config.region,
      endpoint: 'http://localhost:8000'
    });
  }
  return new DocumentClient({ region: config.region });
};

// Crear instancias de repositorios
const docClient = createDocClient();
const logger = LoggerFactory.getLogger('repositories');

// Exportar instancias de repositorios
export const financeRepository = new DynamoDBFinanceRepository(docClient, config.tableName, logger);
export const configRepository = new DynamoDBConfigRepository(docClient, config.tableName, logger);
export const driverRepository = new DynamoDBDriverRepository(docClient, config.tableName, logger);

// Función para crear repositorios (para compatibilidad)
export const createRepositories = () => {
  return {
    financeRepository,
    configRepository,
    driverRepository
  };
};