import { APIGatewayProxyResult } from 'aws-lambda';
import { config } from '../../config';

export class ResponseFormatter {
  static success<T>(data: T, statusCode: number = 200): APIGatewayProxyResult {
    return {
      statusCode,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization'
      },
      body: JSON.stringify({
        success: true,
        data
      })
    };
  }

  static error(message: string, statusCode: number = 400, error?: unknown): APIGatewayProxyResult {
    const response: any = {
      success: false,
      error: message
    };

    // Incluir detalles del error solo en entorno local o de desarrollo
    if (config.isLocal && error instanceof Error) {
      response.details = error.message;
      response.stack = error.stack;
    }

    return {
      statusCode,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization'
      },
      body: JSON.stringify(response)
    };
  }
}