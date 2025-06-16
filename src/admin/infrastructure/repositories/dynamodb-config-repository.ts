import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import { TravelCostConfig, DEFAULT_CONFIG_ID } from '../../domain/config';
import { ConfigRepository } from '../../application/ports/config-repository';
import { Logger } from '../logging/LoggerFactory';

export class DynamoDBConfigRepository implements ConfigRepository {
  constructor(
    private readonly docClient: DocumentClient,
    private readonly tableName: string,
    private readonly logger: Logger
  ) {}

  async getTravelCostConfig(): Promise<TravelCostConfig | null> {
    this.logger.info('Obteniendo configuración de costos de viaje');
    
    const params = {
      TableName: this.tableName,
      Key: {
        PK: 'CONFIG',
        SK: DEFAULT_CONFIG_ID
      }
    };

    try {
      const result = await this.docClient.get(params).promise();
      
      if (!result.Item) {
        this.logger.debug('No se encontró configuración de costos de viaje');
        return null;
      }

      return {
        configId: result.Item.configId,
        baseFare: result.Item.baseFare,
        perKilometerRate: result.Item.perKilometerRate,
        driverCommissionPercentage: result.Item.driverCommissionPercentage,
        updatedAt: new Date(result.Item.updatedAt),
        updatedBy: result.Item.updatedBy
      };
    } catch (error: any) {
      this.logger.error('Error al obtener configuración de costos de viaje', error);
      throw error;
    }
  }

  async saveTravelCostConfig(config: TravelCostConfig): Promise<TravelCostConfig> {
    this.logger.info('Guardando configuración de costos de viaje', { 
      baseFare: config.baseFare,
      perKilometerRate: config.perKilometerRate,
      driverCommissionPercentage: config.driverCommissionPercentage
    });
    
    const item = {
      PK: 'CONFIG',
      SK: config.configId,
      configId: config.configId,
      baseFare: config.baseFare,
      perKilometerRate: config.perKilometerRate,
      driverCommissionPercentage: config.driverCommissionPercentage,
      updatedAt: config.updatedAt.toISOString(),
      updatedBy: config.updatedBy
    };

    try {
      await this.docClient.put({
        TableName: this.tableName,
        Item: item
      }).promise();

      this.logger.info('Configuración guardada correctamente');
      return config;
    } catch (error: any) {
      this.logger.error('Error al guardar configuración', error);
      throw error;
    }
  }
}