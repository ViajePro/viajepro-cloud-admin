import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import { DriverDebt, DriverPayment, IncomeReport, IncomeReportItem, TravelIncome } from '../../domain/finance';
import { FinanceRepository } from '../../application/ports/finance-repository';
import { Logger } from '../logging/LoggerFactory';

export class DynamoDBFinanceRepository implements FinanceRepository {
  constructor(
    private readonly docClient: DocumentClient,
    private readonly tableName: string,
    private readonly logger: Logger
  ) {}

  async getIncomeReport(startDate: Date, endDate: Date): Promise<IncomeReport> {
    this.logger.info('Obteniendo reporte de ingresos', { startDate, endDate });
    
    // Consultar viajes completados en el período
    const params = {
      TableName: this.tableName,
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1_PK = :status AND GSI1_SK BETWEEN :startDate AND :endDate',
      ExpressionAttributeValues: {
        ':status': 'STATUS#finished',
        ':startDate': startDate.toISOString(),
        ':endDate': endDate.toISOString()
      }
    };

    try {
      const result = await this.docClient.query(params).promise();
      const travels = result.Items || [];
      
      this.logger.debug('Viajes encontrados', { count: travels.length });

      // Agrupar por fecha
      const reportByDate = new Map<string, IncomeReportItem>();
      let totalAmount = 0;
      let totalCommission = 0;

      travels.forEach(travel => {
        const date = travel.finishedAt.split('T')[0]; // YYYY-MM-DD
        const amount = travel.calculatedCost || 0;
        const commission = travel.companyCommission || 0;

        if (!reportByDate.has(date)) {
          reportByDate.set(date, {
            date,
            totalAmount: 0,
            totalCommission: 0,
            travelCount: 0
          });
        }

        const dateReport = reportByDate.get(date);
        if (dateReport) {
          dateReport.totalAmount += amount;
          dateReport.totalCommission += commission;
          dateReport.travelCount += 1;
        }

        totalAmount += amount;
        totalCommission += commission;
      });

      // Convertir a array y ordenar por fecha
      const items = Array.from(reportByDate.values())
        .sort((a, b) => a.date.localeCompare(b.date));

      const report = {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        items,
        totalAmount,
        totalCommission,
        totalTravels: travels.length
      };

      this.logger.info('Reporte de ingresos generado', { 
        totalAmount, 
        totalCommission,
        totalTravels: travels.length
      });

      return report;
    } catch (error: any) {
      this.logger.error('Error al obtener reporte de ingresos', error);
      throw error;
    }
  }

  async getAllDriverDebts(): Promise<DriverDebt[]> {
    this.logger.info('Obteniendo todas las deudas de choferes');
    
    const params = {
      TableName: this.tableName,
      IndexName: 'GSI2',
      KeyConditionExpression: 'GSI2_PK = :debtType',
      ExpressionAttributeValues: {
        ':debtType': 'DEBT#DRIVER'
      }
    };

    try {
      const result = await this.docClient.query(params).promise();
      const debts = (result.Items || []).map(item => ({
        driverId: item.driverId,
        totalDebt: item.totalDebt,
        lastUpdated: new Date(item.lastUpdated)
      }));
      
      this.logger.debug('Deudas encontradas', { count: debts.length });
      return debts;
    } catch (error: any) {
      this.logger.error('Error al obtener deudas de choferes', error);
      throw error;
    }
  }

  async getDriverDebt(driverId: string): Promise<DriverDebt | null> {
    this.logger.info('Obteniendo deuda de chofer', { driverId });
    
    const params = {
      TableName: this.tableName,
      Key: {
        PK: `DRIVER#${driverId}`,
        SK: `DEBT#${driverId}`
      }
    };

    try {
      const result = await this.docClient.get(params).promise();
      
      if (!result.Item) {
        this.logger.debug('No se encontró deuda para el chofer', { driverId });
        return null;
      }

      return {
        driverId,
        totalDebt: result.Item.totalDebt,
        lastUpdated: new Date(result.Item.lastUpdated)
      };
    } catch (error: any) {
      this.logger.error('Error al obtener deuda del chofer', error);
      throw error;
    }
  }

  async registerDriverPayment(payment: DriverPayment): Promise<DriverPayment> {
    this.logger.info('Registrando pago de chofer', { 
      driverId: payment.driverId, 
      amount: payment.amount 
    });
    
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

    try {
      await this.docClient.put({
        TableName: this.tableName,
        Item: item
      }).promise();

      this.logger.info('Pago registrado correctamente', { paymentId: payment.paymentId });
      return payment;
    } catch (error: any) {
      this.logger.error('Error al registrar pago', error);
      throw error;
    }
  }

  async updateDriverDebt(driverId: string, amountPaid: number): Promise<DriverDebt> {
    this.logger.info('Actualizando deuda de chofer', { driverId, amountPaid });
    
    try {
      // Primero obtenemos la deuda actual
      const currentDebt = await this.getDriverDebt(driverId);
      
      if (!currentDebt) {
        this.logger.info('No existe deuda previa, creando registro', { driverId });
        // Si no existe deuda previa, creamos un registro con deuda 0
        const now = new Date();
        const newDebt: DriverDebt = {
          driverId,
          totalDebt: 0,
          lastUpdated: now
        };
        
        const item = {
          PK: `DRIVER#${driverId}`,
          SK: `DEBT#${driverId}`,
          GSI2_PK: 'DEBT#DRIVER',
          GSI2_SK: now.toISOString(),
          driverId,
          totalDebt: 0,
          lastUpdated: now.toISOString()
        };
        
        await this.docClient.put({
          TableName: this.tableName,
          Item: item
        }).promise();
        
        return newDebt;
      }

      // Calculamos la nueva deuda
      const newDebtAmount = Math.max(0, currentDebt.totalDebt - amountPaid);
      const now = new Date();

      this.logger.debug('Actualizando deuda', { 
        driverId, 
        oldDebt: currentDebt.totalDebt, 
        newDebt: newDebtAmount 
      });

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

      this.logger.info('Deuda actualizada correctamente', { 
        driverId, 
        newDebt: newDebtAmount 
      });

      return {
        driverId,
        totalDebt: newDebtAmount,
        lastUpdated: now
      };
    } catch (error: any) {
      this.logger.error('Error al actualizar deuda del chofer', error);
      throw error;
    }
  }
}