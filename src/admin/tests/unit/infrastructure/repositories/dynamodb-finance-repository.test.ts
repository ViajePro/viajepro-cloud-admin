import { DynamoDBFinanceRepository } from '../../../../infrastructure/repositories/dynamodb-finance-repository';
import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import { DriverDebt, DriverPayment } from '../../../../domain/finance';

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

describe('DynamoDBFinanceRepository', () => {
  let repository: DynamoDBFinanceRepository;
  let mockDocClient: any;
  let mockLogger: any;
  const tableName = 'TestTable';
  
  beforeEach(() => {
    // Crear mock de DocumentClient con métodos comunes
    mockDocClient = {
      get: jest.fn().mockReturnThis(),
      put: jest.fn().mockReturnThis(),
      query: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
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
    repository = new DynamoDBFinanceRepository(
      mockDocClient as unknown as DocumentClient,
      tableName,
      mockLogger
    );
  });
  
  describe('getDriverDebt', () => {
    it('debería devolver la deuda de un conductor cuando existe', async () => {
      // Arrange
      const driverId = '123e4567-e89b-12d3-a456-426614174000';
      const mockItem = {
        PK: `DRIVER#${driverId}`,
        SK: `DEBT#${driverId}`,
        driverId,
        totalDebt: 1500,
        lastUpdated: '2023-01-15T12:00:00Z'
      };
      
      mockDocClient.promise.mockResolvedValue({
        Item: mockItem
      });
      
      // Act
      const result = await repository.getDriverDebt(driverId);
      
      // Assert
      expect(result).not.toBeNull();
      expect(result).toEqual({
        driverId,
        totalDebt: 1500,
        lastUpdated: new Date('2023-01-15T12:00:00Z')
      });
      
      expect(mockDocClient.get).toHaveBeenCalledWith({
        TableName: tableName,
        Key: {
          PK: `DRIVER#${driverId}`,
          SK: `DEBT#${driverId}`
        }
      });
    });
    
    it('debería devolver null cuando no existe deuda para el conductor', async () => {
      // Arrange
      const driverId = 'non-existent-id';
      
      mockDocClient.promise.mockResolvedValue({
        // Sin Item
      });
      
      // Act
      const result = await repository.getDriverDebt(driverId);
      
      // Assert
      expect(result).toBeNull();
    });
    
    it('debería propagar errores de DynamoDB', async () => {
      // Arrange
      const driverId = '123e4567-e89b-12d3-a456-426614174000';
      const error = new Error('Error de conexión a DynamoDB');
      
      mockDocClient.promise.mockRejectedValue(error);
      
      // Act & Assert
      await expect(repository.getDriverDebt(driverId)).rejects.toThrow(error);
    });
  });
  
  describe('registerDriverPayment', () => {
    it('debería registrar un pago correctamente', async () => {
      // Arrange
      const now = new Date();
      const payment: DriverPayment = {
        paymentId: '123e4567-e89b-12d3-a456-426614174099',
        driverId: '123e4567-e89b-12d3-a456-426614174000',
        amount: 500,
        date: now,
        description: 'Pago mensual',
        createdAt: now
      };
      
      mockDocClient.promise.mockResolvedValue({});
      
      // Act
      const result = await repository.registerDriverPayment(payment);
      
      // Assert
      expect(result).toEqual(payment);
      
      expect(mockDocClient.put).toHaveBeenCalledWith({
        TableName: tableName,
        Item: expect.objectContaining({
          PK: `DRIVER#${payment.driverId}`,
          SK: `PAYMENT#${payment.paymentId}`,
          paymentId: payment.paymentId,
          driverId: payment.driverId,
          amount: payment.amount
        })
      });
    });
    
    it('debería propagar errores al registrar un pago', async () => {
      // Arrange
      const now = new Date();
      const payment: DriverPayment = {
        paymentId: '123e4567-e89b-12d3-a456-426614174099',
        driverId: '123e4567-e89b-12d3-a456-426614174000',
        amount: 500,
        date: now,
        description: 'Pago mensual',
        createdAt: now
      };
      
      const error = new Error('Error al guardar en DynamoDB');
      mockDocClient.promise.mockRejectedValue(error);
      
      // Act & Assert
      await expect(repository.registerDriverPayment(payment)).rejects.toThrow(error);
    });
  });
  
  describe('updateDriverDebt', () => {
    it('debería actualizar la deuda existente de un conductor', async () => {
      // Arrange
      const driverId = '123e4567-e89b-12d3-a456-426614174000';
      const amountPaid = 500;
      const currentDebt = 1500;
      const expectedNewDebt = 1000;
      
      // Mock para getDriverDebt
      mockDocClient.promise.mockResolvedValueOnce({
        Item: {
          driverId,
          totalDebt: currentDebt,
          lastUpdated: '2023-01-10T12:00:00Z'
        }
      });
      
      // Mock para update
      mockDocClient.promise.mockResolvedValueOnce({});
      
      // Act
      const result = await repository.updateDriverDebt(driverId, amountPaid);
      
      // Assert
      expect(result).toEqual({
        driverId,
        totalDebt: expectedNewDebt,
        lastUpdated: expect.any(Date)
      });
      
      expect(mockDocClient.update).toHaveBeenCalledWith(expect.objectContaining({
        TableName: tableName,
        Key: {
          PK: `DRIVER#${driverId}`,
          SK: `DEBT#${driverId}`
        },
        UpdateExpression: expect.stringContaining('SET totalDebt = :newDebt')
      }));
    });
    
    it('debería crear un nuevo registro de deuda si no existe', async () => {
      // Arrange
      const driverId = '123e4567-e89b-12d3-a456-426614174000';
      const amountPaid = 500;
      
      // Mock para getDriverDebt (no existe deuda)
      mockDocClient.promise.mockResolvedValueOnce({
        // Sin Item
      });
      
      // Mock para put
      mockDocClient.promise.mockResolvedValueOnce({});
      
      // Act
      const result = await repository.updateDriverDebt(driverId, amountPaid);
      
      // Assert
      expect(result).toEqual({
        driverId,
        totalDebt: 0,
        lastUpdated: expect.any(Date)
      });
      
      expect(mockDocClient.put).toHaveBeenCalledWith(expect.objectContaining({
        TableName: tableName,
        Item: expect.objectContaining({
          PK: `DRIVER#${driverId}`,
          SK: `DEBT#${driverId}`,
          totalDebt: 0
        })
      }));
    });
    
    it('debería establecer la deuda en 0 si el pago es mayor que la deuda', async () => {
      // Arrange
      const driverId = '123e4567-e89b-12d3-a456-426614174000';
      const amountPaid = 2000;
      const currentDebt = 1500;
      
      // Mock para getDriverDebt
      mockDocClient.promise.mockResolvedValueOnce({
        Item: {
          driverId,
          totalDebt: currentDebt,
          lastUpdated: '2023-01-10T12:00:00Z'
        }
      });
      
      // Mock para update
      mockDocClient.promise.mockResolvedValueOnce({});
      
      // Act
      const result = await repository.updateDriverDebt(driverId, amountPaid);
      
      // Assert
      expect(result.totalDebt).toBe(0);
    });
  });
  
  describe('getAllDriverDebts', () => {
    it('debería devolver todas las deudas de conductores', async () => {
      // Arrange
      const mockItems = [
        {
          driverId: '123e4567-e89b-12d3-a456-426614174000',
          totalDebt: 1500,
          lastUpdated: '2023-01-15T12:00:00Z'
        },
        {
          driverId: '223e4567-e89b-12d3-a456-426614174001',
          totalDebt: 2500,
          lastUpdated: '2023-01-20T12:00:00Z'
        }
      ];
      
      mockDocClient.promise.mockResolvedValue({
        Items: mockItems
      });
      
      // Act
      const result = await repository.getAllDriverDebts();
      
      // Assert
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        driverId: '123e4567-e89b-12d3-a456-426614174000',
        totalDebt: 1500,
        lastUpdated: new Date('2023-01-15T12:00:00Z')
      });
      expect(result[1]).toEqual({
        driverId: '223e4567-e89b-12d3-a456-426614174001',
        totalDebt: 2500,
        lastUpdated: new Date('2023-01-20T12:00:00Z')
      });
      
      expect(mockDocClient.query).toHaveBeenCalledWith({
        TableName: tableName,
        IndexName: 'GSI2',
        KeyConditionExpression: 'GSI2_PK = :debtType',
        ExpressionAttributeValues: {
          ':debtType': 'DEBT#DRIVER'
        }
      });
    });
    
    it('debería devolver un array vacío si no hay deudas', async () => {
      // Arrange
      mockDocClient.promise.mockResolvedValue({
        Items: []
      });
      
      // Act
      const result = await repository.getAllDriverDebts();
      
      // Assert
      expect(result).toEqual([]);
    });
  });
  
  describe('getIncomeReport', () => {
    it('debería generar un reporte de ingresos correctamente', async () => {
      // Arrange
      const startDate = new Date('2023-01-01');
      const endDate = new Date('2023-01-31');
      
      const mockTravels = [
        {
          travelId: '1',
          finishedAt: '2023-01-05T10:00:00Z',
          calculatedCost: 100,
          companyCommission: 20
        },
        {
          travelId: '2',
          finishedAt: '2023-01-05T15:00:00Z',
          calculatedCost: 150,
          companyCommission: 30
        },
        {
          travelId: '3',
          finishedAt: '2023-01-10T12:00:00Z',
          calculatedCost: 200,
          companyCommission: 40
        }
      ];
      
      mockDocClient.promise.mockResolvedValue({
        Items: mockTravels
      });
      
      // Act
      const result = await repository.getIncomeReport(startDate, endDate);
      
      // Assert
      expect(result).toEqual({
        startDate: '2023-01-01',
        endDate: '2023-01-31',
        items: [
          {
            date: '2023-01-05',
            totalAmount: 250,
            totalCommission: 50,
            travelCount: 2
          },
          {
            date: '2023-01-10',
            totalAmount: 200,
            totalCommission: 40,
            travelCount: 1
          }
        ],
        totalAmount: 450,
        totalCommission: 90,
        totalTravels: 3
      });
      
      expect(mockDocClient.query).toHaveBeenCalledWith({
        TableName: tableName,
        IndexName: 'GSI1',
        KeyConditionExpression: 'GSI1_PK = :status AND GSI1_SK BETWEEN :startDate AND :endDate',
        ExpressionAttributeValues: {
          ':status': 'STATUS#finished',
          ':startDate': startDate.toISOString(),
          ':endDate': endDate.toISOString()
        }
      });
    });
    
    it('debería manejar viajes sin costo o comisión', async () => {
      // Arrange
      const startDate = new Date('2023-01-01');
      const endDate = new Date('2023-01-31');
      
      const mockTravels = [
        {
          travelId: '1',
          finishedAt: '2023-01-05T10:00:00Z',
          // Sin calculatedCost ni companyCommission
        }
      ];
      
      mockDocClient.promise.mockResolvedValue({
        Items: mockTravels
      });
      
      // Act
      const result = await repository.getIncomeReport(startDate, endDate);
      
      // Assert
      expect(result.items[0].totalAmount).toBe(0);
      expect(result.items[0].totalCommission).toBe(0);
    });
  });
});