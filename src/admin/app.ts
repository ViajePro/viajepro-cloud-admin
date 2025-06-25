import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { GetIncomeReportUseCase } from './application/usecases/get-income-report-use-case';
import { GetDriverDebtsUseCase } from './application/usecases/get-driver-debts-use-case';
import { RegisterDriverPaymentUseCase } from './application/usecases/register-driver-payment-use-case';
import { RegisterTravelDebtUseCase } from './application/usecases/register-travel-debt-use-case';
import { GetTravelCostConfigUseCase } from './application/usecases/get-travel-cost-config-use-case';
import { UpdateTravelCostConfigUseCase } from './application/usecases/update-travel-cost-config-use-case';
import { financeController } from './infrastructure/controllers/finance-controller';
import { configController } from './infrastructure/controllers/config-controller';
import { TravelDebtController } from './infrastructure/controllers/travel-debt-controller';
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
  
  // Determinar qué controlador usar según la ruta
  if (event.path.startsWith('/config')) {
    appLogger.debug('Redirigiendo a ConfigController');
    return await configController.handleRequest(event);
  } else if (event.path.startsWith('/travel-debt')) {
    appLogger.debug('Redirigiendo a TravelDebtController');
    // Inicializar el controlador de deuda por viaje
    const financeRepo = financeController.getFinanceRepository();
    const registerTravelDebtUseCase = new RegisterTravelDebtUseCase(financeRepo);
    const travelDebtController = new TravelDebtController(registerTravelDebtUseCase);
    try {
      return await travelDebtController.handleTravelFinishedEvent(event);
    } catch (error) {
      appLogger.error('Error al procesar evento de deuda por viaje', error);
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type,Authorization'
        },
        body: JSON.stringify({
          success: false,
          error: 'Error interno al procesar evento de deuda por viaje'
        })
      };
    }
  } else {
    appLogger.debug('Redirigiendo a FinanceController');
    return await financeController.handleRequest(event);
  }
};

// Aplicar middleware de manejo de errores
export const lambdaHandler = withErrorHandler(baseHandler);