import { TravelCostConfig, DEFAULT_CONFIG_ID } from "../../domain/config";
import { ConfigRepository } from "../ports/config-repository";
import { Result } from "../result";

export class GetTravelCostConfigUseCase {
  constructor(private configRepository: ConfigRepository) {}

  async execute(): Promise<Result<TravelCostConfig>> {
    try {
      const config = await this.configRepository.getTravelCostConfig();
      
      if (!config) {
        return Result.fail<TravelCostConfig>("No se encontró configuración de costos de viaje");
      }
      
      return Result.ok<TravelCostConfig>(config);
    } catch (error: any) {
      return Result.fail<TravelCostConfig>(`Error al obtener configuración: ${error.message}`);
    }
  }
}