import * as AWS from 'aws-sdk';
import { config } from '../../../../config';
import { LoggerFactory } from '../../../../infrastructure/logging/LoggerFactory';

// Mock de AWS SDK
jest.mock('aws-sdk', () => {
  return {
    DynamoDB: {
      DocumentClient: jest.fn().mockImplementation(() => ({}))
    }
  };
});

// Mock del logger
jest.mock('../../../../infrastructure/logging/LoggerFactory', () => ({
  LoggerFactory: {
    getLogger: jest.fn().mockReturnValue({
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn()
    })
  }
}));

// Mock de config
jest.mock('../../../../config', () => ({
  config: {
    tableName: 'TestTable',
    region: 'us-east-1',
    isLocal: false
  }
}));

describe('Repositories Index', () => {
  beforeEach(() => {
    // Limpiar el caché de módulos para cada prueba
    jest.resetModules();
  });
  
  it('debería exportar instancias de repositorios', () => {
    // Act
    const repositories = require('../../../../infrastructure/repositories');
    
    // Assert
    expect(repositories.financeRepository).toBeDefined();
    expect(repositories.driverRepository).toBeDefined();
  });
});