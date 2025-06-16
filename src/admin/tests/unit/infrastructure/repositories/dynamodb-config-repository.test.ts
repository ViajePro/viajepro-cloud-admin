import { DynamoDBConfigRepository } from '../../../../infrastructure/repositories/dynamodb-config-repository';
import { TravelCostConfig, DEFAULT_CONFIG_ID } from '../../../../domain/config';

describe('DynamoDBConfigRepository', () => {
  let repository: DynamoDBConfigRepository;
  let mockDocClient: any;
  let mockLogger: any;

  beforeEach(() => {
    mockDocClient = {
      get: jest.fn().mockReturnValue({
        promise: jest.fn()
      }),
      put: jest.fn().mockReturnValue({
        promise: jest.fn()
      })
    };

    mockLogger = {
      info: jest.fn(),
      debug: jest.fn(),
      warn: jest.fn(),
      error: jest.fn()
    };

    repository = new DynamoDBConfigRepository(mockDocClient, 'TestTable', mockLogger);
  });

  describe('getTravelCostConfig', () => {
    it('debería obtener la configuración correctamente', async () => {
      // Arrange
      const mockConfig = {
        configId: DEFAULT_CONFIG_ID,
        baseFare: 100,
        perKilometerRate: 10,
        driverCommissionPercentage: 80,
        updatedAt: new Date().toISOString(),
        updatedBy: 'test-user'
      };

      mockDocClient.get().promise.mockResolvedValue({
        Item: mockConfig
      });

      // Act
      const result = await repository.getTravelCostConfig();

      // Assert
      expect(mockDocClient.get).toHaveBeenCalledWith({
        TableName: 'TestTable',
        Key: {
          PK: 'CONFIG',
          SK: DEFAULT_CONFIG_ID
        }
      });
      expect(result).toEqual({
        configId: DEFAULT_CONFIG_ID,
        baseFare: 100,
        perKilometerRate: 10,
        driverCommissionPercentage: 80,
        updatedAt: expect.any(Date),
        updatedBy: 'test-user'
      });
    });

    it('debería devolver null cuando no existe configuración', async () => {
      // Arrange
      mockDocClient.get().promise.mockResolvedValue({});

      // Act
      const result = await repository.getTravelCostConfig();

      // Assert
      expect(result).toBeNull();
    });

    it('debería propagar errores', async () => {
      // Arrange
      const error = new Error('Database error');
      mockDocClient.get().promise.mockRejectedValue(error);

      // Act & Assert
      await expect(repository.getTravelCostConfig()).rejects.toThrow('Database error');
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('saveTravelCostConfig', () => {
    it('debería guardar la configuración correctamente', async () => {
      // Arrange
      const now = new Date();
      const config: TravelCostConfig = {
        configId: DEFAULT_CONFIG_ID,
        baseFare: 100,
        perKilometerRate: 10,
        driverCommissionPercentage: 80,
        updatedAt: now,
        updatedBy: 'test-user'
      };

      // Act
      const result = await repository.saveTravelCostConfig(config);

      // Assert
      expect(mockDocClient.put).toHaveBeenCalledWith({
        TableName: 'TestTable',
        Item: {
          PK: 'CONFIG',
          SK: DEFAULT_CONFIG_ID,
          configId: DEFAULT_CONFIG_ID,
          baseFare: 100,
          perKilometerRate: 10,
          driverCommissionPercentage: 80,
          updatedAt: now.toISOString(),
          updatedBy: 'test-user'
        }
      });
      expect(result).toEqual(config);
    });

    it('debería propagar errores', async () => {
      // Arrange
      const config: TravelCostConfig = {
        configId: DEFAULT_CONFIG_ID,
        baseFare: 100,
        perKilometerRate: 10,
        driverCommissionPercentage: 80,
        updatedAt: new Date(),
        updatedBy: 'test-user'
      };

      const error = new Error('Database error');
      mockDocClient.put().promise.mockRejectedValue(error);

      // Act & Assert
      await expect(repository.saveTravelCostConfig(config)).rejects.toThrow('Database error');
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });
});