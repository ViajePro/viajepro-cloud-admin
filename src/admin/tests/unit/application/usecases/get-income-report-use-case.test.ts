import { GetIncomeReportUseCase } from '../../../../application/usecases/get-income-report-use-case';
import { FinanceRepository } from '../../../../application/ports/finance-repository';
import { IncomeReport } from '../../../../domain/finance';
import { Result } from '../../../../domain/Result';

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

describe('GetIncomeReportUseCase', () => {
  let useCase: GetIncomeReportUseCase;
  let mockFinanceRepository: jest.Mocked<FinanceRepository>;
  
  beforeEach(() => {
    // Crear mock del repositorio
    mockFinanceRepository = {
      getIncomeReport: jest.fn(),
      getAllDriverDebts: jest.fn(),
      getDriverDebt: jest.fn(),
      registerDriverPayment: jest.fn(),
      updateDriverDebt: jest.fn(),
      registerTravelDebt: jest.fn()
    } as jest.Mocked<FinanceRepository>;
    
    useCase = new GetIncomeReportUseCase(mockFinanceRepository);
  });
  
  it('debería devolver un reporte de ingresos exitoso', async () => {
    // Arrange
    const startDate = '2023-01-01';
    const endDate = '2023-01-31';
    
    const mockReport: IncomeReport = {
      startDate: startDate,
      endDate: endDate,
      items: [
        {
          date: '2023-01-05',
          totalAmount: 500,
          totalCommission: 100,
          travelCount: 5
        }
      ],
      totalAmount: 500,
      totalCommission: 100,
      totalTravels: 5
    };
    
    mockFinanceRepository.getIncomeReport.mockResolvedValue(mockReport);
    
    // Act
    const result = await useCase.execute(startDate, endDate);
    
    // Assert
    expect(result.isSuccess).toBe(true);
    expect(result.getValue()).toEqual(mockReport);
    expect(mockFinanceRepository.getIncomeReport).toHaveBeenCalledWith(
      new Date(startDate),
      new Date(endDate)
    );
  });
  
  it('debería fallar si la fecha de inicio es posterior a la fecha de fin', async () => {
    // Arrange
    const startDate = '2023-02-01';
    const endDate = '2023-01-01';
    
    // Act
    const result = await useCase.execute(startDate, endDate);
    
    // Assert
    expect(result.isSuccess).toBe(false);
    expect(result.isFailure).toBe(true);
    expect(result.getError()).toBe('La fecha de inicio debe ser anterior a la fecha de fin');
    expect(mockFinanceRepository.getIncomeReport).not.toHaveBeenCalled();
  });
  
  it('debería fallar si las fechas son inválidas', async () => {
    // Arrange
    const startDate = 'fecha-invalida';
    const endDate = '2023-01-31';
    
    // Act
    const result = await useCase.execute(startDate, endDate);
    
    // Assert
    expect(result.isSuccess).toBe(false);
    expect(result.isFailure).toBe(true);
    expect(result.getError()).toBe('Fechas inválidas');
    expect(mockFinanceRepository.getIncomeReport).not.toHaveBeenCalled();
  });
  
  it('debería manejar errores del repositorio', async () => {
    // Arrange
    const startDate = '2023-01-01';
    const endDate = '2023-01-31';
    
    const errorMessage = 'Error de conexión a la base de datos';
    mockFinanceRepository.getIncomeReport.mockRejectedValue(new Error(errorMessage));
    
    // Act
    const result = await useCase.execute(startDate, endDate);
    
    // Assert
    expect(result.isSuccess).toBe(false);
    expect(result.isFailure).toBe(true);
    expect(result.getError()).toContain(errorMessage);
  });
});