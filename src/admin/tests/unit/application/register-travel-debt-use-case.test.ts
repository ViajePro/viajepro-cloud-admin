import { RegisterTravelDebtUseCase, RegisterTravelDebtInput } from '../../../application/usecases/register-travel-debt-use-case';
import { PaymentMethodType, TravelDebtRecord } from '../../../domain/finance';
import { v4 as uuidv4 } from 'uuid';

describe('RegisterTravelDebtUseCase', () => {
  let mockFinanceRepository: any;
  let useCase: RegisterTravelDebtUseCase;

  beforeEach(() => {
    mockFinanceRepository = {
      registerTravelDebt: jest.fn().mockImplementation((debtRecord) => Promise.resolve(debtRecord)),
      updateDriverDebt: jest.fn().mockImplementation((driverId, amount) => Promise.resolve({ driverId, totalDebt: 100, lastUpdated: new Date() }))
    };
    useCase = new RegisterTravelDebtUseCase(mockFinanceRepository);
  });

  it('should register a travel debt successfully', async () => {
    // Arrange
    const input: RegisterTravelDebtInput = {
      travelId: uuidv4(),
      driverId: uuidv4(),
      amount: 100,
      companyCommission: 20,
      paymentMethod: PaymentMethodType.CASH,
      description: 'Test debt'
    };

    // Act
    const result = await useCase.execute(input);

    // Assert
    expect(result.isSuccess).toBe(true);
    expect(mockFinanceRepository.registerTravelDebt).toHaveBeenCalledTimes(1);
    
    const debtRecord = result.getValue();
    expect(debtRecord.travelId).toBe(input.travelId);
    expect(debtRecord.driverId).toBe(input.driverId);
    expect(debtRecord.amount).toBe(input.amount);
    expect(debtRecord.companyCommission).toBe(input.companyCommission);
    expect(debtRecord.paymentMethod).toBe(input.paymentMethod);
    expect(debtRecord.description).toBe(input.description);
  });

  it('should fail with invalid input parameters', async () => {
    // Arrange
    const invalidInput: RegisterTravelDebtInput = {
      travelId: '',
      driverId: uuidv4(),
      amount: 100,
      companyCommission: 20,
      paymentMethod: PaymentMethodType.CASH
    };

    // Act
    const result = await useCase.execute(invalidInput);

    // Assert
    expect(result.isFailure).toBe(true);
    expect(result.getError()).toBe('Invalid input parameters');
    expect(mockFinanceRepository.registerTravelDebt).not.toHaveBeenCalled();
  });

  it('should fail with negative amount', async () => {
    // Arrange
    const invalidInput: RegisterTravelDebtInput = {
      travelId: uuidv4(),
      driverId: uuidv4(),
      amount: -10,
      companyCommission: 20,
      paymentMethod: PaymentMethodType.CASH
    };

    // Act
    const result = await useCase.execute(invalidInput);

    // Assert
    expect(result.isFailure).toBe(true);
    expect(result.getError()).toBe('Invalid input parameters');
    expect(mockFinanceRepository.registerTravelDebt).not.toHaveBeenCalled();
  });

  it('should handle repository errors', async () => {
    // Arrange
    mockFinanceRepository.registerTravelDebt = jest.fn().mockImplementation(() => {
      throw new Error('Database error');
    });

    const input: RegisterTravelDebtInput = {
      travelId: uuidv4(),
      driverId: uuidv4(),
      amount: 100,
      companyCommission: 20,
      paymentMethod: PaymentMethodType.CASH
    };

    // Act
    const result = await useCase.execute(input);

    // Assert
    expect(result.isFailure).toBe(true);
    expect(result.getError()).toContain('Error registering travel debt: Database error');
  });
});