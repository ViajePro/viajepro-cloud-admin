import { TravelCostConfig } from "../../domain/config";

export interface ConfigRepository {
  /**
   * Obtiene la configuración actual de costos de viaje
   */
  getTravelCostConfig(): Promise<TravelCostConfig | null>;
  
  /**
   * Guarda o actualiza la configuración de costos de viaje
   */
  saveTravelCostConfig(config: TravelCostConfig): Promise<TravelCostConfig>;
}