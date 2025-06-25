import { GetDriverDebtsUseCase } from '../../../../application/usecases/get-driver-debts-use-case';
import { FinanceRepository } from '../../../../application/ports/finance-repository';
import { DynamoDBDriverRepository, Driver } from '../../../../infrastructure/repositories/driver-repository';
import { DriverDebt, DriverDebtSummary } from '../../../../domain/finance';
import { DebtNotFoundError, DriverNotFoundError } from '../../../../domain/errors';

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

describe('GetDriverDebtsUseCase', () => {
  let useCase: GetDriverDebtsUseCase;
  let mockFinanceRepository: jest.Mocked<FinanceRepository>;
  let mockDriverRepository: jest.Mocked<DynamoDBDriverRepository>;
  
  beforeEach(() => {
    // Crear mocks de los repositorios
    mockFinanceRepository = {
      getIncomeReport: jest.fn(),
      getAllDriverDebts: jest.fn(),
      getDriverDebt: jest.fn(),
      registerDriverPayment: jest.fn(),
      updateDriverDebt: jest.fn(),
      registerTravelDebt: jest.fn()
    } as jest.Mocked<FinanceRepository>;
    
    mockDriverRepository = {
      getDriverById: jest.fn()
    } as unknown as jest.Mocked<DynamoDBDriverRepository>;
    
    useCase = new GetDriverDebtsUseCase(mockFinanceRepository, mockDriverRepository);
  });
  
  describe('execute', () => {
    it('debería devolver un resumen de deudas de todos los choferes', async () => {
      // Arrange
      const mockDebts: DriverDebt[] = [
        {
          driverId: '123e4567-e89b-12d3-a456-426614174000',
          totalDebt: 1500,
          lastUpdated: new Date('2023-01-15')
        },
        {
          driverId: '223e4567-e89b-12d3-a456-426614174001',
          totalDebt: 2500,
          lastUpdated: new Date('2023-01-20')
        }
      ];
      
      const mockDrivers: Driver[] = [
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          firstName: 'Juan',
          lastName: 'Pérez',
          phone: '123456789',
          document: 'DNI12345678',
          enabled: true
        },
        {
          id: '223e4567-e89b-12d3-a456-426614174001',
          firstName: 'María',
          lastName: 'González',
          phone: '987654321',
          document: 'DNI87654321',
          enabled: true
        }
      ];
      
      mockFinanceRepository.getAllDriverDebts.mockResolvedValue(mockDebts);
      mockDriverRepository.getDriverById.mockImplementation(async (driverId) => {
        const driver = mockDrivers.find(d => d.id === driverId);
        return driver || null;
      });
      
      // Act
      const result = await useCase.execute();
      
      // Assert
      expect(result.isSuccess).toBe(true);
      
      const debtSummaries = result.getValue();
      expect(debtSummaries.length).toBe(2);
      
      expect(debtSummaries[0].driverId).toBe(mockDebts[0].driverId);
      expect(debtSummaries[0].driverName).toBe('Juan Pérez');
      expect(debtSummaries[0].totalDebt).toBe(1500);
      
      expect(debtSummaries[1].driverId).toBe(mockDebts[1].driverId);
      expect(debtSummaries[1].driverName).toBe('María González');
      expect(debtSummaries[1].totalDebt).toBe(2500);
      
      expect(mockFinanceRepository.getAllDriverDebts).toHaveBeenCalledTimes(1);
      expect(mockDriverRepository.getDriverById).toHaveBeenCalledTimes(2);
    });
    
    it('debería manejar el caso cuando no se encuentra información del chofer', async () => {
      // Arrange
      const mockDebts: DriverDebt[] = [
        {
          driverId: '123e4567-e89b-12d3-a456-426614174000',
          totalDebt: 1500,
          lastUpdated: new Date('2023-01-15')
        }
      ];
      
      mockFinanceRepository.getAllDriverDebts.mockResolvedValue(mockDebts);
      mockDriverRepository.getDriverById.mockResolvedValue(null);
      
      // Act
      const result = await useCase.execute();
      
      // Assert
      expect(result.isSuccess).toBe(true);
      
      const debtSummaries = result.getValue();
      expect(debtSummaries.length).toBe(1);
      expect(debtSummaries[0].driverName).toBe('Desconocido');
    });
    
    it('debería manejar errores del repositorio', async () => {
      // Arrange
      const errorMessage = 'Error de conexión a la base de datos';
      mockFinanceRepository.getAllDriverDebts.mockRejectedValue(new Error(errorMessage));
      
      // Act
      const result = await useCase.execute();
      
      // Assert
      expect(result.isSuccess).toBe(false);
      expect(result.isFailure).toBe(true);
      expect(result.getError()).toContain(errorMessage);
    });
    
    it('debería manejar errores desconocidos', async () => {
      // Arrange
      mockFinanceRepository.getAllDriverDebts.mockRejectedValue('Error no estándar');
      
      // Act
      const result = await useCase.execute();
      
      // Assert
      expect(result.isSuccess).toBe(false);
      expect(result.isFailure).toBe(true);
      expect(result.getError()).toContain('Error desconocido');
    });
  });
  
  describe('getDriverDebt', () => {
    it('debería devolver la deuda de un chofer específico', async () => {
      // Arrange
      const driverId = '123e4567-e89b-12d3-a456-426614174000';
      
      const mockDebt: DriverDebt = {
        driverId,
        totalDebt: 1500,
        lastUpdated: new Date('2023-01-15')
      };
      
      const mockDriver: Driver = {
        id: driverId,
        firstName: 'Juan',
        lastName: 'Pérez',
        phone: '123456789',
        document: 'DNI12345678',
        enabled: true
      };
      
      mockFinanceRepository.getDriverDebt.mockResolvedValue(mockDebt);
      mockDriverRepository.getDriverById.mockResolvedValue(mockDriver);
      
      // Act
      const result = await useCase.getDriverDebt(driverId);
      
      // Assert
      expect(result.isSuccess).toBe(true);
      
      const debtSummary = result.getValue();
      expect(debtSummary.driverId).toBe(driverId);
      expect(debtSummary.driverName).toBe('Juan Pérez');
      expect(debtSummary.totalDebt).toBe(1500);
    });
    
    it('debería fallar si no se encuentra la deuda del chofer', async () => {
      // Arrange
      const driverId = '123e4567-e89b-12d3-a456-426614174000';
      
      mockFinanceRepository.getDriverDebt.mockResolvedValue(null);
      
      // Act
      const result = await useCase.getDriverDebt(driverId);
      
      // Assert
      expect(result.isSuccess).toBe(false);
      expect(result.isFailure).toBe(true);
      expect(result.getError()).toContain(`No se encontró deuda para el chofer con ID ${driverId}`);
    });
    
    it('debería fallar si no se encuentra información del chofer', async () => {
      // Arrange
      const driverId = '123e4567-e89b-12d3-a456-426614174000';
      
      const mockDebt: DriverDebt = {
        driverId,
        totalDebt: 1500,
        lastUpdated: new Date('2023-01-15')
      };
      
      mockFinanceRepository.getDriverDebt.mockResolvedValue(mockDebt);
      mockDriverRepository.getDriverById.mockResolvedValue(null);
      
      // Act
      const result = await useCase.getDriverDebt(driverId);
      
      // Assert
      expect(result.isSuccess).toBe(false);
      expect(result.isFailure).toBe(true);
      expect(result.getError()).toContain(`No se encontró el chofer con ID ${driverId}`);
    });
  });
});