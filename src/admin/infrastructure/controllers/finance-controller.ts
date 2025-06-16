import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { GetIncomeReportUseCase } from '../../application/usecases/get-income-report-use-case';
import { GetDriverDebtsUseCase } from '../../application/usecases/get-driver-debts-use-case';
import { RegisterDriverPaymentUseCase, RegisterPaymentInput } from '../../application/usecases/register-driver-payment-use-case';
import { Logger, LoggerFactory } from '../logging/LoggerFactory';
import { ResponseFormatter } from '../api/response-formatter';

export class FinanceController {
  private logger: Logger;

  constructor(
    private getIncomeReportUseCase: GetIncomeReportUseCase,
    private getDriverDebtsUseCase: GetDriverDebtsUseCase,
    private registerDriverPaymentUseCase: RegisterDriverPaymentUseCase
  ) {
    this.logger = LoggerFactory.getLogger('financeController');
  }

  async handleRequest(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
      const path = event.path;
      const method = event.httpMethod;

      this.logger.info('Recibida solicitud', { path, method });

      // Reporte de ingresos
      if (path === '/finance/income-report' && method === 'GET') {
        return await this.getIncomeReport(event);
      }
      
      // Deudas de choferes
      if (path === '/finance/driver-debts' && method === 'GET') {
        return await this.getDriverDebts();
      }
      
      // Deuda de un chofer específico
      if (path.match(/^\/finance\/driver-debts\/[^\/]+$/) && method === 'GET') {
        const driverId = path.split('/').pop() || '';
        return await this.getDriverDebt(driverId);
      }
      
      // Registrar pago de chofer
      if (path === '/finance/driver-payments' && method === 'POST') {
        return await this.registerDriverPayment(event);
      }

      this.logger.warn('Ruta no encontrada', { path, method });
      return ResponseFormatter.error('Ruta no encontrada', 404);
    } catch (error: any) {
      this.logger.error('Error en FinanceController', error);
      return ResponseFormatter.error('Error interno del servidor', 500, error);
    }
  }

  private async getIncomeReport(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    const queryParams = event.queryStringParameters || {};
    const startDate = queryParams.startDate || '';
    const endDate = queryParams.endDate || new Date().toISOString().split('T')[0];

    this.logger.debug('Procesando solicitud de reporte de ingresos', { startDate, endDate });

    if (!startDate) {
      this.logger.warn('Falta fecha de inicio en la solicitud');
      return ResponseFormatter.error('Se requiere fecha de inicio (startDate)', 400);
    }

    const result = await this.getIncomeReportUseCase.execute(startDate, endDate);

    if (result.isFailure) {
      this.logger.warn('Error al obtener reporte de ingresos', { error: result.getError() });
      return ResponseFormatter.error(result.getError(), 400);
    }

    this.logger.info('Reporte de ingresos generado correctamente');
    return ResponseFormatter.success(result.getValue());
  }

  private async getDriverDebts(): Promise<APIGatewayProxyResult> {
    this.logger.debug('Procesando solicitud de deudas de choferes');
    
    const result = await this.getDriverDebtsUseCase.execute();

    if (result.isFailure) {
      this.logger.warn('Error al obtener deudas de choferes', { error: result.getError() });
      return ResponseFormatter.error(result.getError(), 400);
    }

    this.logger.info('Deudas de choferes obtenidas correctamente', { count: result.getValue().length });
    return ResponseFormatter.success(result.getValue());
  }

  private async getDriverDebt(driverId: string): Promise<APIGatewayProxyResult> {
    this.logger.debug('Procesando solicitud de deuda de chofer específico', { driverId });
    
    const result = await this.getDriverDebtsUseCase.getDriverDebt(driverId);

    if (result.isFailure) {
      this.logger.warn('Error al obtener deuda del chofer', { driverId, error: result.getError() });
      return ResponseFormatter.error(result.getError(), 404);
    }

    this.logger.info('Deuda de chofer obtenida correctamente', { driverId });
    return ResponseFormatter.success(result.getValue());
  }

  private async registerDriverPayment(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    if (!event.body) {
      this.logger.warn('Cuerpo de solicitud vacío');
      return ResponseFormatter.error('Se requiere cuerpo en la solicitud', 400);
    }

    try {
      const paymentInput: RegisterPaymentInput = JSON.parse(event.body);
      this.logger.debug('Procesando solicitud de registro de pago', { 
        driverId: paymentInput.driverId,
        amount: paymentInput.amount
      });
      
      const result = await this.registerDriverPaymentUseCase.execute(paymentInput);

      if (result.isFailure) {
        this.logger.warn('Error al registrar pago', { error: result.getError() });
        return ResponseFormatter.error(result.getError(), 400);
      }

      this.logger.info('Pago registrado correctamente', { 
        paymentId: result.getValue().paymentId,
        driverId: result.getValue().driverId,
        amount: result.getValue().amount
      });
      
      return ResponseFormatter.success({
        message: 'Pago registrado correctamente',
        payment: result.getValue()
      }, 201);
    } catch (error: any) {
      this.logger.error('Error al procesar solicitud de pago', error);
      return ResponseFormatter.error('Error al procesar la solicitud', 400, error);
    }
  }
}

// Exportar una instancia para usar en pruebas
export const financeController = new FinanceController(
  {} as any,
  {} as any,
  {} as any
);