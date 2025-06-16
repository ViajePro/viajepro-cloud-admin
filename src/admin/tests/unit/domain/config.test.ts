import { TravelCostConfigSchema, DEFAULT_CONFIG_ID } from '../../../domain/config';

describe('Config Domain', () => {
  describe('TravelCostConfigSchema', () => {
    it('should validate a valid config', () => {
      const validConfig = {
        configId: DEFAULT_CONFIG_ID,
        baseFare: 100,
        perKilometerRate: 10,
        driverCommissionPercentage: 80,
        updatedAt: new Date(),
        updatedBy: 'test-user'
      };

      const result = TravelCostConfigSchema.safeParse(validConfig);
      expect(result.success).toBe(true);
    });

    it('should reject negative baseFare', () => {
      const invalidConfig = {
        configId: DEFAULT_CONFIG_ID,
        baseFare: -10,
        perKilometerRate: 10,
        driverCommissionPercentage: 80,
        updatedAt: new Date(),
        updatedBy: 'test-user'
      };

      const result = TravelCostConfigSchema.safeParse(invalidConfig);
      expect(result.success).toBe(false);
    });

    it('should reject negative perKilometerRate', () => {
      const invalidConfig = {
        configId: DEFAULT_CONFIG_ID,
        baseFare: 100,
        perKilometerRate: -5,
        driverCommissionPercentage: 80,
        updatedAt: new Date(),
        updatedBy: 'test-user'
      };

      const result = TravelCostConfigSchema.safeParse(invalidConfig);
      expect(result.success).toBe(false);
    });

    it('should reject driverCommissionPercentage greater than 100', () => {
      const invalidConfig = {
        configId: DEFAULT_CONFIG_ID,
        baseFare: 100,
        perKilometerRate: 10,
        driverCommissionPercentage: 110,
        updatedAt: new Date(),
        updatedBy: 'test-user'
      };

      const result = TravelCostConfigSchema.safeParse(invalidConfig);
      expect(result.success).toBe(false);
    });

    it('should reject negative driverCommissionPercentage', () => {
      const invalidConfig = {
        configId: DEFAULT_CONFIG_ID,
        baseFare: 100,
        perKilometerRate: 10,
        driverCommissionPercentage: -10,
        updatedAt: new Date(),
        updatedBy: 'test-user'
      };

      const result = TravelCostConfigSchema.safeParse(invalidConfig);
      expect(result.success).toBe(false);
    });
  });
});