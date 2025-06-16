import { z } from 'zod';

export const TravelCostConfigSchema = z.object({
  configId: z.string(),
  baseFare: z.number().positive(),
  perKilometerRate: z.number().positive(),
  driverCommissionPercentage: z.number().min(0).max(100),
  updatedAt: z.date(),
  updatedBy: z.string().optional()
});

export type TravelCostConfig = z.infer<typeof TravelCostConfigSchema>;

export const DEFAULT_CONFIG_ID = 'TRAVEL_COST_CONFIG';