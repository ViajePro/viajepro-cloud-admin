import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { LoggerFactory } from '../logging/LoggerFactory';
import { ResponseFormatter } from '../api/response-formatter';
import { ApplicationError, ValidationError, NotFoundError, UnauthorizedError, ForbiddenError } from '../../domain/errors';

const logger = LoggerFactory.getLogger('errorHandler');

type LambdaHandler = (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>;

export function withErrorHandler(handler: LambdaHandler): LambdaHandler {
  return async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
      return await handler(event);
    } catch (error: unknown) {
      logger.error('Error no controlado en la aplicación', error);
      
      // Determinar el código de estado HTTP apropiado según el tipo de error
      let statusCode = 500;
      let message = 'Error interno del servidor';
      
      if (error instanceof ValidationError) {
        statusCode = 400;
        message = error.message || 'Error de validación';
      } else if (error instanceof NotFoundError) {
        statusCode = 404;
        message = error.message || 'Recurso no encontrado';
      } else if (error instanceof UnauthorizedError) {
        statusCode = 401;
        message = error.message || 'No autorizado';
      } else if (error instanceof ForbiddenError) {
        statusCode = 403;
        message = error.message || 'Acceso prohibido';
      } else if (error instanceof ApplicationError) {
        statusCode = 400;
        message = error.message || 'Error de aplicación';
      }
      
      return ResponseFormatter.error(message, statusCode, error);
    }
  };
}