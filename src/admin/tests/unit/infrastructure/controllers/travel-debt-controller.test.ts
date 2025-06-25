import { TravelDebtController } from '../../../../infrastructure/controllers/travel-debt-controller';
import { RegisterTravelDebtUseCase } from '../../../../application/usecases/register-travel-debt-use-case';
import { Result } from '../../../../domain/Result';
import { PaymentMethodType, TravelDebtRecord } from '../../../../domain/finance';
import { v4 as uuidv4 } from 'uuid';

describe('TravelDebtController', () => {
  let mockRegisterTravelDebtUseCase: any;
  let controller: TravelDebtController;
  let mockEvent: any;

  beforeEach(() => {
    mockRegisterTravelDebtUseCase = {
      execute: jest.fn()
    };
    controller = new TravelDebtController(mockRegisterTravelDebtUseCase as unknown as RegisterTravelDebtUseCase);
    
    mockEvent = {
      body: JSON.stringify({
        travelId: uuidv4(),
        driverId: uuidv4(),
        amount: 100,
        companyCommission: 20,
        paymentMethod: 'cash'
      })
    };
  });

  it('should handle travel finished event successfully', async () => {
    // Arrange
    const mockDebtRecord: TravelDebtRecord = {
      recordId: uuidv4(),
      travelId: JSON.parse(mockEvent.body).travelId,
      driverId: JSON.parse(mockEvent.body).driverId,
      amount: 100,
      companyCommission: 20,
      paymentMethod: PaymentMethodType.CASH,
      createdAt: new Date(),
      description: 'Test debt'
    };
    
    mockRegisterTravelDebtUseCase.execute.mockResolvedValue(Result.ok(mockDebtRecord));

    // Act
    const response = await controller.handleTravelFinishedEvent(mockEvent as any);

    // Assert
    expect(response.statusCode).toBe(201);
    const body = JSON.parse(response.body);
    expect(body.success).toBe(true);
    expect(body.data.message).toBe('Travel debt registered successfully');
    expect(mockRegisterTravelDebtUseCase.execute).toHaveBeenCalledWith({
      travelId: JSON.parse(mockEvent.body).travelId,
      driverId: JSON.parse(mockEvent.body).driverId,
      amount: 100,
      companyCommission: 20,
      paymentMethod: PaymentMethodType.CASH,
      description: expect.stringContaining('Deuda por viaje')
    });
  });

  it('should handle missing event body', async () => {
    // Arrange
    mockEvent.body = null;

    // Act
    const response = await controller.handleTravelFinishedEvent(mockEvent as any);

    // Assert
    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.body);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Missing event body');
  });

  it('should handle invalid event data', async () => {
    // Arrange
    mockEvent.body = JSON.stringify({
      // Missing required fields
      driverId: uuidv4()
    });

    // Act
    const response = await controller.handleTravelFinishedEvent(mockEvent as any);

    // Assert
    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.body);
    expect(body.success).toBe(false);
    expect(body.error).toContain('Invalid event data');
  });

  it('should handle use case failure', async () => {
    // Arrange
    mockRegisterTravelDebtUseCase.execute.mockResolvedValue(Result.fail('Database error'));

    // Act
    const response = await controller.handleTravelFinishedEvent(mockEvent as any);

    // Assert
    expect(response.statusCode).toBe(500);
    const body = JSON.parse(response.body);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Database error');
  });

  it('should handle unexpected errors', async () => {
    // Arrange
    mockRegisterTravelDebtUseCase.execute.mockImplementation(() => {
      throw new Error('Unexpected error');
    });

    // Act
    const response = await controller.handleTravelFinishedEvent(mockEvent as any);

    // Assert
    expect(response.statusCode).toBe(500);
    const body = JSON.parse(response.body);
    expect(body.success).toBe(false);
    expect(body.error).toContain('Error handling travel finished event');
  });
});