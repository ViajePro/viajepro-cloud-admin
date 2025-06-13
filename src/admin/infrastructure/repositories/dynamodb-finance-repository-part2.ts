import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import { DriverDebt, DriverPayment } from '../../domain/finance';
import { FinanceRepository } from '../../application/ports/finance-repository';
import { Logger } from '../logging/LoggerFactory';

export class DynamoDBFinanceRepository {
  // Propiedades necesarias para el contexto
  private readonly docClient: DocumentClient;
  private readonly tableName: string;
  private readonly logger: Logger;

  // Continuación de los métodos del repositorio

  async getAllDriverDebts(): Promise<DriverDebt[]> {
    const params = {
      TableName: this.tableName,
      IndexName: 'GSI2',
      KeyConditionExpression: 'GSI2_PK = :debtType',
      ExpressionAttributeValues: {
        ':debtType': 'DEBT#DRIVER'
      }
    };

    const result = await this.docClient.query(params).promise();
    
    return (result.Items || []).map(item => ({
      driverId: item.driverId,
      totalDebt: item.totalDebt,
      lastUpdated: new Date(item.lastUpdated)
    }));
  }

  async getDriverDebt(driverId: string): Promise<DriverDebt | null> {
    const params = {
      TableName: this.tableName,
      Key: {
        PK: `DRIVER#${driverId}`,
        SK: `DEBT#${driverId}`
      }
    };

    const result = await this.docClient.get(params).promise();
    
    if (!result.Item) {
      return null;
    }

    return {
      driverId,
      totalDebt: result.Item.totalDebt,
      lastUpdated: new Date(result.Item.lastUpdated)
    };
  }
}