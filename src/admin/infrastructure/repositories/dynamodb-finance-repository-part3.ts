import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import { DriverDebt, DriverPayment } from '../../domain/finance';
import { Logger } from '../logging/LoggerFactory';
import { DebtNotFoundError } from '../../domain/errors';

export class DynamoDBFinanceRepository {
  // Propiedades necesarias para el contexto
  private readonly docClient: DocumentClient;
  private readonly tableName: string;
  private readonly logger: Logger;
  
  // Método necesario para el contexto
  async getDriverDebt(driverId: string): Promise<DriverDebt | null> {
    // Este método está implementado en dynamodb-finance-repository-part2.ts
    // Aquí solo se declara para evitar errores de TypeScript
    return null;
  }

  // Continuación de los métodos del repositorio

  async registerDriverPayment(payment: DriverPayment): Promise<DriverPayment> {
    const item = {
      PK: `DRIVER#${payment.driverId}`,
      SK: `PAYMENT#${payment.paymentId}`,
      GSI1_PK: `PAYMENT#DRIVER`,
      GSI1_SK: payment.date.toISOString(),
      GSI2_PK: `PAYMENT#${payment.driverId}`,
      GSI2_SK: payment.date.toISOString(),
      paymentId: payment.paymentId,
      driverId: payment.driverId,
      amount: payment.amount,
      date: payment.date.toISOString(),
      description: payment.description,
      createdAt: payment.createdAt.toISOString()
    };

    await this.docClient.put({
      TableName: this.tableName,
      Item: item
    }).promise();

    return payment;
  }

  async updateDriverDebt(driverId: string, amountPaid: number): Promise<DriverDebt> {
    // Primero obtenemos la deuda actual
    const currentDebt = await this.getDriverDebt(driverId);
    
    if (!currentDebt) {
      throw new DebtNotFoundError(driverId);
    }

    // Calculamos la nueva deuda
    const newDebtAmount = Math.max(0, currentDebt.totalDebt - amountPaid);
    const now = new Date();

    const params = {
      TableName: this.tableName,
      Key: {
        PK: `DRIVER#${driverId}`,
        SK: `DEBT#${driverId}`
      },
      UpdateExpression: 'SET totalDebt = :newDebt, lastUpdated = :now, GSI2_SK = :now',
      ExpressionAttributeValues: {
        ':newDebt': newDebtAmount,
        ':now': now.toISOString()
      },
      ReturnValues: 'ALL_NEW'
    };

    await this.docClient.update(params).promise();

    return {
      driverId,
      totalDebt: newDebtAmount,
      lastUpdated: now
    };
  }
}