import { UpdateTravelCostConfigUseCase, UpdateTravelCostConfigInput } from '../../../../application/usecases/update-travel-cost-config-use-case';
import { ConfigRepository } from '../../../../application/ports/config-repository';
import { TravelCostConfig, DEFAULT_CONFIG_ID } from '../../../../domain/config';

describe('UpdateTravelCostConfigUseCase', () => {
  let mockConfigRepository: any;
  let useCase: UpdateTravelCostConfigUseCase;

  beforeEach(() => {
    mockConfigRepository = {
      getTravelCostConfig: jest.fn(),
      saveTravelCostConfig: jest.fn()
    };

    useCase = new UpdateTravelCostConfigUseCase(mockConfigRepository);
  });

  it('should update travel cost config successfully', async () => {
    // Arrange
    const input: UpdateTravelCostConfigInput = {
      baseFare: 100,
      perKilometerRate: 10,
      driverCommissionPercentage: 80,
      updatedBy: 'test-user'
    };

    const expectedConfig: TravelCostConfig = {
      configId: DEFAULT_CONFIG_ID,
      baseFare: 100,
      perKilometerRate: 10,
      driverCommissionPercentage: 80,
      updatedAt: expect.any(Date),
      updatedBy: 'test-user'
    };

    mockConfigRepository.saveTravelCostConfig.mockResolvedValue(expectedConfig);

    // Act
    const result = await useCase.execute(input);

    // Assert
    expect(result.isSuccess).toBe(true);
    expect(result.getValue()).toEqual(expectedConfig);
    expect(mockConfigRepository.saveTravelCostConfig).toHaveBeenCalledWith(expect.objectContaining({
      configId: DEFAULT_CONFIG_ID,
      baseFare: 100,
      perKilometerRate: 10,
      driverCommissionPercentage: 80,
      updatedBy: 'test-user'
    }));
  });

  it('should fail with invalid input - negative baseFare', async () => {
    // Arrange
    const input: UpdateTravelCostConfigInput = {
      baseFare: -100, // Invalid negative value
      perKilometerRate: 10,
      driverCommissionPercentage: 80
    };

    // Act
    const result = await useCase.execute(input);

    // Assert
    expect(result.isFailure).toBe(true);
    expect(result.getError()).toContain('Datos de configuración inválidos');
    expect(mockConfigRepository.saveTravelCostConfig).not.toHaveBeenCalled();
  });

  it('should fail with invalid input - negative perKilometerRate', async () => {
    // Arrange
    const input: UpdateTravelCostConfigInput = {
      baseFare: 100,
      perKilometerRate: -10, // Invalid negative value
      driverCommissionPercentage: 80
    };

    // Act
    const result = await useCase.execute(input);

    // Assert
    expect(result.isFailure).toBe(true);
    expect(result.getError()).toContain('Datos de configuración inválidos');
    expect(mockConfigRepository.saveTravelCostConfig).not.toHaveBeenCalled();
  });

  it('should fail with invalid input - driverCommissionPercentage over 100', async () => {
    // Arrange
    const input: UpdateTravelCostConfigInput = {
      baseFare: 100,
      perKilometerRate: 10,
      driverCommissionPercentage: 110 // Invalid value over 100%
    };

    // Act
    const result = await useCase.execute(input);

    // Assert
    expect(result.isFailure).toBe(true);
    expect(result.getError()).toContain('Datos de configuración inválidos');
    expect(mockConfigRepository.saveTravelCostConfig).not.toHaveBeenCalled();
  });

  it('should handle repository errors', async () => {
    // Arrange
    const input: UpdateTravelCostConfigInput = {
      baseFare: 100,
      perKilometerRate: 10,
      driverCommissionPercentage: 80
    };

    mockConfigRepository.saveTravelCostConfig.mockRejectedValue(new Error('Database error'));

    // Act
    const result = await useCase.execute(input);

    // Assert
    expect(result.isFailure).toBe(true);
    expect(result.getError()).toContain('Error al actualizar configuración');
  });
});