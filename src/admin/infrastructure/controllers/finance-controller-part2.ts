import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

export class FinanceController {
  // Propiedades necesarias para el contexto
  private getIncomeReportUseCase: any;
  private getDriverDebtsUseCase: any;

  // Continuación de los métodos del controlador

  private async getIncomeReport(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    const queryParams = event.queryStringParameters || {};
    const startDate = queryParams.startDate || '';
    const endDate = queryParams.endDate || new Date().toISOString().split('T')[0];

    if (!startDate) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Se requiere fecha de inicio (startDate)' })
      };
    }

    const result = await this.getIncomeReportUseCase.execute(startDate, endDate);

    if (result.isFailure) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: result.getError() })
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify(result.getValue())
    };
  }

  private async getDriverDebts(): Promise<APIGatewayProxyResult> {
    const result = await this.getDriverDebtsUseCase.execute();

    if (result.isFailure) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: result.getError() })
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify(result.getValue())
    };
  }
}