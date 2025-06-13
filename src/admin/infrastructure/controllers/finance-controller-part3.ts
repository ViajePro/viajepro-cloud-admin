import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { RegisterPaymentInput } from '../../application/usecases/register-driver-payment-use-case';

export class FinanceController {
  // Propiedades necesarias para el contexto
  private getDriverDebtsUseCase: any;
  private registerDriverPaymentUseCase: any;

  // Continuación de los métodos del controlador

  private async getDriverDebt(driverId: string): Promise<APIGatewayProxyResult> {
    const result = await this.getDriverDebtsUseCase.getDriverDebt(driverId);

    if (result.isFailure) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: result.getError() })
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify(result.getValue())
    };
  }

  private async registerDriverPayment(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    if (!event.body) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Se requiere cuerpo en la solicitud' })
      };
    }

    try {
      const paymentInput: RegisterPaymentInput = JSON.parse(event.body);
      
      const result = await this.registerDriverPaymentUseCase.execute(paymentInput);

      if (result.isFailure) {
        return {
          statusCode: 400,
          body: JSON.stringify({ message: result.getError() })
        };
      }

      return {
        statusCode: 201,
        body: JSON.stringify({
          message: 'Pago registrado correctamente',
          payment: result.getValue()
        })
      };
    } catch (error: any) {
      return {
        statusCode: 400,
        body: JSON.stringify({ 
          message: 'Error al procesar la solicitud', 
          error: error instanceof Error ? error.message : 'Error desconocido' 
        })
      };
    }
  }
}