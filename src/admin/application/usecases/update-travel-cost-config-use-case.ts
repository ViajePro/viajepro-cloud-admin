import { TravelCostConfig, DEFAULT_CONFIG_ID, TravelCostConfigSchema } from "../../domain/config";
import { ConfigRepository } from "../ports/config-repository";
import { Result } from "../result";

export interface UpdateTravelCostConfigInput {
  baseFare: number;
  perKilometerRate: number;
  driverCommissionPercentage: number;
  updatedBy?: string;
}

export class UpdateTravelCostConfigUseCase {
  constructor(private configRepository: ConfigRepository) {}

  async execute(input: UpdateTravelCostConfigInput): Promise<Result<TravelCostConfig>> {
    try {
      // Validar input
      const validationResult = TravelCostConfigSchema.safeParse({
        configId: DEFAULT_CONFIG_ID,
        baseFare: input.baseFare,
        perKilometerRate: input.perKilometerRate,
        driverCommissionPercentage: input.driverCommissionPercentage,
        updatedAt: new Date(),
        updatedBy: input.updatedBy
      });

      if (!validationResult.success) {
        return Result.fail<TravelCostConfig>(`Datos de configuración inválidos: ${validationResult.error.message}`);
      }

      const config: TravelCostConfig = {
        configId: DEFAULT_CONFIG_ID,
        baseFare: input.baseFare,
        perKilometerRate: input.perKilometerRate,
        driverCommissionPercentage: input.driverCommissionPercentage,
        updatedAt: new Date(),
        updatedBy: input.updatedBy
      };

      const savedConfig = await this.configRepository.saveTravelCostConfig(config);
      return Result.ok<TravelCostConfig>(savedConfig);
    } catch (error: any) {
      return Result.fail<TravelCostConfig>(`Error al actualizar configuración: ${error.message}`);
    }
  }
}