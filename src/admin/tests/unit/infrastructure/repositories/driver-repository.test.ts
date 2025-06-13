import { DynamoDBDriverRepository, Driver } from '../../../../infrastructure/repositories/driver-repository';
import { DocumentClient } from 'aws-sdk/clients/dynamodb';

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

describe('DynamoDBDriverRepository', () => {
  let repository: DynamoDBDriverRepository;
  let mockDocClient: any;
  let mockLogger: any;
  const tableName = 'TestTable';
  
  beforeEach(() => {
    // Crear mock de DocumentClient
    mockDocClient = {
      get: jest.fn().mockReturnThis(),
      promise: jest.fn()
    };
    
    // Crear mock del logger
    mockLogger = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn()
    };
    
    // Crear instancia del repositorio con los mocks
    repository = new DynamoDBDriverRepository(
      mockDocClient as unknown as DocumentClient,
      tableName,
      mockLogger
    );
  });
  
  describe('getDriverById', () => {
    it('debería devolver un conductor cuando existe en la base de datos', async () => {
      // Arrange
      const driverId = '123e4567-e89b-12d3-a456-426614174000';
      const mockItem = {
        PK: `DRIVER#${driverId}`,
        SK: `METADATA#${driverId}`,
        firstName: 'Juan',
        lastName: 'Pérez',
        phone: '123456789',
        document: 'DNI12345678',
        enabled: true,
        debt: 1500
      };
      
      mockDocClient.promise.mockResolvedValue({
        Item: mockItem
      });
      
      // Act
      const result = await repository.getDriverById(driverId);
      
      // Assert
      expect(result).not.toBeNull();
      expect(result).toEqual({
        id: driverId,
        firstName: 'Juan',
        lastName: 'Pérez',
        phone: '123456789',
        document: 'DNI12345678',
        enabled: true,
        debt: 1500
      });
      
      expect(mockDocClient.get).toHaveBeenCalledWith({
        TableName: tableName,
        Key: {
          PK: `DRIVER#${driverId}`,
          SK: `METADATA#${driverId}`
        }
      });
      
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Obteniendo información del chofer',
        { driverId }
      );
      
      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Chofer encontrado',
        { driverId, name: 'Juan Pérez' }
      );
    });
    
    it('debería establecer valores por defecto para enabled y debt si no existen', async () => {
      // Arrange
      const driverId = '123e4567-e89b-12d3-a456-426614174000';
      const mockItem = {
        PK: `DRIVER#${driverId}`,
        SK: `METADATA#${driverId}`,
        firstName: 'Juan',
        lastName: 'Pérez',
        phone: '123456789',
        document: 'DNI12345678'
        // Sin enabled ni debt
      };
      
      mockDocClient.promise.mockResolvedValue({
        Item: mockItem
      });
      
      // Act
      const result = await repository.getDriverById(driverId);
      
      // Assert
      expect(result).not.toBeNull();
      expect(result?.enabled).toBe(false); // Valor por defecto
      expect(result?.debt).toBe(0); // Valor por defecto
    });
    
    it('debería devolver null cuando el conductor no existe', async () => {
      // Arrange
      const driverId = 'non-existent-id';
      
      mockDocClient.promise.mockResolvedValue({
        // Sin Item
      });
      
      // Act
      const result = await repository.getDriverById(driverId);
      
      // Assert
      expect(result).toBeNull();
      
      expect(mockLogger.debug).toHaveBeenCalledWith(
        'No se encontró el chofer',
        { driverId }
      );
    });
    
    it('debería propagar errores de DynamoDB', async () => {
      // Arrange
      const driverId = '123e4567-e89b-12d3-a456-426614174000';
      const error = new Error('Error de conexión a DynamoDB');
      
      mockDocClient.promise.mockRejectedValue(error);
      
      // Act & Assert
      await expect(repository.getDriverById(driverId)).rejects.toThrow(error);
      
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error al obtener información del chofer',
        error
      );
    });
  });
});