import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { GetIncomeReportUseCase } from './application/usecases/get-income-report-use-case';
import { GetDriverDebtsUseCase } from './application/usecases/get-driver-debts-use-case';
import { RegisterDriverPaymentUseCase } from './application/usecases/register-driver-payment-use-case';
import { FinanceController } from './infrastructure/controllers/finance-controller';
import { financeRepository, driverRepository } from './infrastructure/repositories';
import { LoggerFactory } from './infrastructure/logging/LoggerFactory';
import { config } from './config';
import { ResponseFormatter } from './infrastructure/api/response-formatter';
import { withErrorHandler } from './infrastructure/middlewares/error-handler';

// Crear logger principal
const appLogger = LoggerFactory.getLogger('app');

appLogger.info('Inicializando aplicación', {
  stage: config.stage,
  isLocal: config.isLocal,
  tableName: config.tableName
});

// Inicializar casos de uso
const getIncomeReportUseCase = new GetIncomeReportUseCase(financeRepository);
const getDriverDebtsUseCase = new GetDriverDebtsUseCase(financeRepository, driverRepository);
const registerDriverPaymentUseCase = new RegisterDriverPaymentUseCase(financeRepository);

// Inicializar controlador
const financeController = new FinanceController(
  getIncomeReportUseCase,
  getDriverDebtsUseCase,
  registerDriverPaymentUseCase
);

// Handler base de Lambda
const baseHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  appLogger.info('Evento recibido', {
    path: event.path,
    method: event.httpMethod,
    queryParams: event.queryStringParameters
  });
  
  // Manejar solicitudes OPTIONS (CORS preflight)
  if (event.httpMethod === 'OPTIONS') {
    appLogger.debug('Procesando solicitud CORS preflight');
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
      },
      body: ''
    };
  }
  
  // Procesar la solicitud con el controlador
  return await financeController.handleRequest(event);
};

// Aplicar middleware de manejo de errores
export const lambdaHandler = withErrorHandler(baseHandler);