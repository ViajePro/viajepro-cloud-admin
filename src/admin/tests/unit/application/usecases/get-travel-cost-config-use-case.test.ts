import { GetTravelCostConfigUseCase } from '../../../../application/usecases/get-travel-cost-config-use-case';
import { TravelCostConfig, DEFAULT_CONFIG_ID } from '../../../../domain/config';

describe('GetTravelCostConfigUseCase', () => {
  let mockConfigRepository: any;
  let useCase: GetTravelCostConfigUseCase;

  beforeEach(() => {
    mockConfigRepository = {
      getTravelCostConfig: jest.fn(),
      saveTravelCostConfig: jest.fn()
    };

    useCase = new GetTravelCostConfigUseCase(mockConfigRepository);
  });

  it('should get travel cost config successfully', async () => {
    // Arrange
    const mockConfig: TravelCostConfig = {
      configId: DEFAULT_CONFIG_ID,
      baseFare: 100,
      perKilometerRate: 10,
      driverCommissionPercentage: 80,
      updatedAt: new Date(),
      updatedBy: 'test-user'
    };

    mockConfigRepository.getTravelCostConfig.mockResolvedValue(mockConfig);

    // Act
    const result = await useCase.execute();

    // Assert
    expect(result.isSuccess).toBe(true);
    expect(result.getValue()).toEqual(mockConfig);
    expect(mockConfigRepository.getTravelCostConfig).toHaveBeenCalled();
  });

  it('should fail when config not found', async () => {
    // Arrange
    mockConfigRepository.getTravelCostConfig.mockResolvedValue(null);

    // Act
    const result = await useCase.execute();

    // Assert
    expect(result.isFailure).toBe(true);
    expect(result.getError()).toContain('No se encontró configuración');
  });

  it('should handle repository errors', async () => {
    // Arrange
    mockConfigRepository.getTravelCostConfig.mockRejectedValue(new Error('Database error'));

    // Act
    const result = await useCase.execute();

    // Assert
    expect(result.isFailure).toBe(true);
    expect(result.getError()).toContain('Error al obtener configuración');
  });
});