import { RegisterDriverPaymentUseCase, RegisterPaymentInput } from '../../../../application/usecases/register-driver-payment-use-case';
import { FinanceRepository } from '../../../../application/ports/finance-repository';
import { DriverDebt, DriverPayment } from '../../../../domain/finance';
import { DebtNotFoundError, ValidationError } from '../../../../domain/errors';

// Mock de uuid
jest.mock('uuid', () => ({
  v4: jest.fn().mockReturnValue('mocked-uuid')
}));

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

describe('RegisterDriverPaymentUseCase', () => {
  let useCase: RegisterDriverPaymentUseCase;
  let mockFinanceRepository: jest.Mocked<FinanceRepository>;
  let mockDate: Date;
  
  beforeEach(() => {
    // Crear mock del repositorio
    mockFinanceRepository = {
      getIncomeReport: jest.fn(),
      getAllDriverDebts: jest.fn(),
      getDriverDebt: jest.fn(),
      registerDriverPayment: jest.fn(),
      updateDriverDebt: jest.fn()
    } as jest.Mocked<FinanceRepository>;
    
    useCase = new RegisterDriverPaymentUseCase(mockFinanceRepository);
    
    // Mock de Date para tener fechas consistentes en las pruebas
    mockDate = new Date('2023-01-15T12:00:00Z');
    jest.spyOn(global, 'Date').mockImplementation(() => mockDate);
  });
  
  afterEach(() => {
    jest.restoreAllMocks();
  });
  
  it('debería registrar un pago exitosamente', async () => {
    // Arrange
    const input: RegisterPaymentInput = {
      driverId: '123e4567-e89b-12d3-a456-426614174000',
      amount: 500,
      description: 'Pago mensual'
    };
    
    const mockDebt: DriverDebt = {
      driverId: input.driverId,
      totalDebt: 1500,
      lastUpdated: new Date('2023-01-10')
    };
    
    const expectedPayment: DriverPayment = {
      paymentId: 'mocked-uuid',
      driverId: input.driverId,
      amount: input.amount,
      date: mockDate,
      description: input.description,
      createdAt: mockDate
    };
    
    const updatedDebt: DriverDebt = {
      driverId: input.driverId,
      totalDebt: 1000, // 1500 - 500
      lastUpdated: mockDate
    };
    
    mockFinanceRepository.getDriverDebt.mockResolvedValue(mockDebt);
    mockFinanceRepository.registerDriverPayment.mockResolvedValue(expectedPayment);
    mockFinanceRepository.updateDriverDebt.mockResolvedValue(updatedDebt);
    
    // Act
    const result = await useCase.execute(input);
    
    // Assert
    expect(result.isSuccess).toBe(true);
    expect(result.getValue()).toEqual(expectedPayment);
    
    expect(mockFinanceRepository.getDriverDebt).toHaveBeenCalledWith(input.driverId);
    expect(mockFinanceRepository.registerDriverPayment).toHaveBeenCalledWith(expect.objectContaining({
      driverId: input.driverId,
      amount: input.amount,
      description: input.description
    }));
    expect(mockFinanceRepository.updateDriverDebt).toHaveBeenCalledWith(input.driverId, input.amount);
  });
  
  it('debería usar descripción por defecto si no se proporciona', async () => {
    // Arrange
    const input: RegisterPaymentInput = {
      driverId: '123e4567-e89b-12d3-a456-426614174000',
      amount: 500
    };
    
    const mockDebt: DriverDebt = {
      driverId: input.driverId,
      totalDebt: 1500,
      lastUpdated: new Date('2023-01-10')
    };
    
    mockFinanceRepository.getDriverDebt.mockResolvedValue(mockDebt);
    mockFinanceRepository.registerDriverPayment.mockImplementation(async (payment) => payment);
    mockFinanceRepository.updateDriverDebt.mockResolvedValue({
      driverId: input.driverId,
      totalDebt: 1000,
      lastUpdated: mockDate
    });
    
    // Act
    const result = await useCase.execute(input);
    
    // Assert
    expect(result.isSuccess).toBe(true);
    expect(result.getValue().description).toBe('Pago de comisiones');
  });
  
  it('debería fallar si el ID del chofer no se proporciona', async () => {
    // Arrange
    const input: RegisterPaymentInput = {
      driverId: '',
      amount: 500
    };
    
    // Act
    const result = await useCase.execute(input);
    
    // Assert
    expect(result.isSuccess).toBe(false);
    expect(result.isFailure).toBe(true);
    expect(result.getError()).toBe('ID del chofer es requerido');
    
    expect(mockFinanceRepository.getDriverDebt).not.toHaveBeenCalled();
    expect(mockFinanceRepository.registerDriverPayment).not.toHaveBeenCalled();
    expect(mockFinanceRepository.updateDriverDebt).not.toHaveBeenCalled();
  });
  
  it('debería fallar si el monto es cero o negativo', async () => {
    // Arrange
    const input: RegisterPaymentInput = {
      driverId: '123e4567-e89b-12d3-a456-426614174000',
      amount: 0
    };
    
    // Act
    const result = await useCase.execute(input);
    
    // Assert
    expect(result.isSuccess).toBe(false);
    expect(result.isFailure).toBe(true);
    expect(result.getError()).toBe('El monto debe ser mayor a cero');
    
    expect(mockFinanceRepository.getDriverDebt).not.toHaveBeenCalled();
    expect(mockFinanceRepository.registerDriverPayment).not.toHaveBeenCalled();
    expect(mockFinanceRepository.updateDriverDebt).not.toHaveBeenCalled();
  });
  
  it('debería fallar si el chofer no tiene deuda registrada', async () => {
    // Arrange
    const input: RegisterPaymentInput = {
      driverId: '123e4567-e89b-12d3-a456-426614174000',
      amount: 500
    };
    
    mockFinanceRepository.getDriverDebt.mockResolvedValue(null);
    
    // Act
    const result = await useCase.execute(input);
    
    // Assert
    expect(result.isSuccess).toBe(false);
    expect(result.isFailure).toBe(true);
    expect(result.getError()).toContain(`No se encontró deuda para el chofer con ID ${input.driverId}`);
    
    expect(mockFinanceRepository.registerDriverPayment).not.toHaveBeenCalled();
    expect(mockFinanceRepository.updateDriverDebt).not.toHaveBeenCalled();
  });
  
  it('debería fallar si el chofer no tiene deuda pendiente', async () => {
    // Arrange
    const input: RegisterPaymentInput = {
      driverId: '123e4567-e89b-12d3-a456-426614174000',
      amount: 500
    };
    
    const mockDebt: DriverDebt = {
      driverId: input.driverId,
      totalDebt: 0,
      lastUpdated: new Date('2023-01-10')
    };
    
    mockFinanceRepository.getDriverDebt.mockResolvedValue(mockDebt);
    
    // Act
    const result = await useCase.execute(input);
    
    // Assert
    expect(result.isSuccess).toBe(false);
    expect(result.isFailure).toBe(true);
    expect(result.getError()).toBe('El chofer no tiene deuda pendiente');
    
    expect(mockFinanceRepository.registerDriverPayment).not.toHaveBeenCalled();
    expect(mockFinanceRepository.updateDriverDebt).not.toHaveBeenCalled();
  });
  
  it('debería manejar errores del repositorio', async () => {
    // Arrange
    const input: RegisterPaymentInput = {
      driverId: '123e4567-e89b-12d3-a456-426614174000',
      amount: 500
    };
    
    const mockDebt: DriverDebt = {
      driverId: input.driverId,
      totalDebt: 1500,
      lastUpdated: new Date('2023-01-10')
    };
    
    const errorMessage = 'Error de conexión a la base de datos';
    mockFinanceRepository.getDriverDebt.mockResolvedValue(mockDebt);
    mockFinanceRepository.registerDriverPayment.mockRejectedValue(new Error(errorMessage));
    
    // Act
    const result = await useCase.execute(input);
    
    // Assert
    expect(result.isSuccess).toBe(false);
    expect(result.isFailure).toBe(true);
    expect(result.getError()).toContain(errorMessage);
  });
});