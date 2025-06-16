import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { GetTravelCostConfigUseCase } from '../../application/usecases/get-travel-cost-config-use-case';
import { UpdateTravelCostConfigUseCase, UpdateTravelCostConfigInput } from '../../application/usecases/update-travel-cost-config-use-case';
import { Logger, LoggerFactory } from '../logging/LoggerFactory';
import { ResponseFormatter } from '../api/response-formatter';

export class ConfigController {
  private logger: Logger;

  constructor(
    private getTravelCostConfigUseCase: GetTravelCostConfigUseCase,
    private updateTravelCostConfigUseCase: UpdateTravelCostConfigUseCase
  ) {
    this.logger = LoggerFactory.getLogger('configController');
  }

  async handleRequest(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
      const path = event.path;
      const method = event.httpMethod;

      this.logger.info('Recibida solicitud', { path, method });

      // Obtener configuración de costos de viaje
      if (path === '/config/travel-cost' && method === 'GET') {
        return await this.getTravelCostConfig();
      }
      
      // Actualizar configuración de costos de viaje
      if (path === '/config/travel-cost' && method === 'PUT') {
        return await this.updateTravelCostConfig(event);
      }

      this.logger.warn('Ruta no encontrada', { path, method });
      return ResponseFormatter.error('Ruta no encontrada', 404);
    } catch (error: any) {
      this.logger.error('Error en ConfigController', error);
      return ResponseFormatter.error('Error interno del servidor', 500, error);
    }
  }

  private async getTravelCostConfig(): Promise<APIGatewayProxyResult> {
    this.logger.debug('Procesando solicitud de obtención de configuración de costos de viaje');
    
    const result = await this.getTravelCostConfigUseCase.execute();

    if (result.isFailure) {
      this.logger.warn('Error al obtener configuración de costos de viaje', { error: result.getError() });
      return ResponseFormatter.error(result.getError(), 404);
    }

    this.logger.info('Configuración de costos de viaje obtenida correctamente');
    return ResponseFormatter.success(result.getValue());
  }

  private async updateTravelCostConfig(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    if (!event.body) {
      this.logger.warn('Cuerpo de solicitud vacío');
      return ResponseFormatter.error('Se requiere cuerpo en la solicitud', 400);
    }

    try {
      const configInput: UpdateTravelCostConfigInput = JSON.parse(event.body);
      this.logger.debug('Procesando solicitud de actualización de configuración', { 
        baseFare: configInput.baseFare,
        perKilometerRate: configInput.perKilometerRate,
        driverCommissionPercentage: configInput.driverCommissionPercentage
      });
      
      // Obtener el usuario que realiza la actualización (si está disponible)
      const user = event.requestContext.authorizer?.claims?.email || 'sistema';
      configInput.updatedBy = user;
      
      const result = await this.updateTravelCostConfigUseCase.execute(configInput);

      if (result.isFailure) {
        this.logger.warn('Error al actualizar configuración', { error: result.getError() });
        return ResponseFormatter.error(result.getError(), 400);
      }

      this.logger.info('Configuración actualizada correctamente');
      
      return ResponseFormatter.success({
        message: 'Configuración actualizada correctamente',
        config: result.getValue()
      });
    } catch (error: any) {
      this.logger.error('Error al procesar solicitud de actualización', error);
      return ResponseFormatter.error('Error al procesar la solicitud', 400, error);
    }
  }
}

// Exportar una instancia para usar en pruebas
export const configController = new ConfigController(
  {} as any,
  {} as any
);