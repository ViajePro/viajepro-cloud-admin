import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import { Logger } from '../logging/LoggerFactory';

export interface Driver {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  document: string;
  enabled: boolean;
  debt?: number;
}

export class DynamoDBDriverRepository {
  constructor(
    private readonly docClient: DocumentClient,
    private readonly tableName: string,
    private readonly logger: Logger
  ) {}

  async getDriverById(driverId: string): Promise<Driver | null> {
    this.logger.info('Obteniendo información del chofer', { driverId });
    
    const params = {
      TableName: this.tableName,
      Key: {
        PK: `DRIVER#${driverId}`,
        SK: `METADATA#${driverId}`
      }
    };

    try {
      const result = await this.docClient.get(params).promise();
      
      if (!result.Item) {
        this.logger.debug('No se encontró el chofer', { driverId });
        return null;
      }

      const driver: Driver = {
        id: driverId,
        firstName: result.Item.firstName,
        lastName: result.Item.lastName,
        phone: result.Item.phone,
        document: result.Item.document,
        enabled: result.Item.enabled || false,
        debt: result.Item.debt || 0
      };

      this.logger.debug('Chofer encontrado', { driverId, name: `${driver.firstName} ${driver.lastName}` });
      return driver;
    } catch (error: any) {
      this.logger.error('Error al obtener información del chofer', error);
      throw error;
    }
  }
}