import { APIGatewayProxyEvent } from 'aws-lambda';
import { lambdaHandler } from '../../app';

// Mock de los controladores
jest.mock('../../infrastructure/controllers/finance-controller', () => ({
  financeController: {
    handleRequest: jest.fn()
  }
}));

jest.mock('../../infrastructure/controllers/config-controller', () => ({
  configController: {
    handleRequest: jest.fn()
  }
}));

// Mock del logger
jest.mock('../../infrastructure/logging/LoggerFactory', () => ({
  LoggerFactory: {
    getLogger: jest.fn().mockReturnValue({
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn()
    })
  }
}));

// Importar los mocks después de configurarlos
import { financeController } from '../../infrastructure/controllers/finance-controller';
import { configController } from '../../infrastructure/controllers/config-controller';

describe('App Lambda Handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('debería manejar solicitudes OPTIONS para CORS', async () => {
    // Arrange
    const event = {
      httpMethod: 'OPTIONS',
      path: '/finance/income-report',
      body: null,
      headers: {},
      multiValueHeaders: {},
      isBase64Encoded: false,
      pathParameters: null,
      queryStringParameters: null,
      multiValueQueryStringParameters: null,
      stageVariables: null,
      requestContext: {} as any,
      resource: ''
    } as APIGatewayProxyEvent;

    // Act
    const response = await lambdaHandler(event);

    // Assert
    expect(response.statusCode).toBe(200);
    expect(response.headers).toEqual({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
    });
    expect(response.body).toBe('');
    expect(financeController.handleRequest).not.toHaveBeenCalled();
    expect(configController.handleRequest).not.toHaveBeenCalled();
  });

  it('debería dirigir solicitudes /config al ConfigController', async () => {
    // Arrange
    const event = {
      httpMethod: 'GET',
      path: '/config/travel-cost',
      queryStringParameters: { param: 'value' },
      body: null,
      headers: {},
      multiValueHeaders: {},
      isBase64Encoded: false,
      pathParameters: null,
      multiValueQueryStringParameters: null,
      stageVariables: null,
      requestContext: {} as any,
      resource: ''
    } as APIGatewayProxyEvent;

    const mockResponse = {
      statusCode: 200,
      body: JSON.stringify({ success: true }),
      headers: {}
    };

    (configController.handleRequest as jest.Mock).mockResolvedValue(mockResponse);

    // Act
    const response = await lambdaHandler(event);

    // Assert
    expect(configController.handleRequest).toHaveBeenCalledWith(event);
    expect(financeController.handleRequest).not.toHaveBeenCalled();
    expect(response).toEqual(mockResponse);
  });

  it('debería dirigir otras solicitudes al FinanceController', async () => {
    // Arrange
    const event = {
      httpMethod: 'GET',
      path: '/finance/income-report',
      queryStringParameters: { startDate: '2023-01-01' },
      body: null,
      headers: {},
      multiValueHeaders: {},
      isBase64Encoded: false,
      pathParameters: null,
      multiValueQueryStringParameters: null,
      stageVariables: null,
      requestContext: {} as any,
      resource: ''
    } as APIGatewayProxyEvent;

    const mockResponse = {
      statusCode: 200,
      body: JSON.stringify({ success: true }),
      headers: {}
    };

    (financeController.handleRequest as jest.Mock).mockResolvedValue(mockResponse);

    // Act
    const response = await lambdaHandler(event);

    // Assert
    expect(financeController.handleRequest).toHaveBeenCalledWith(event);
    expect(configController.handleRequest).not.toHaveBeenCalled();
    expect(response).toEqual(mockResponse);
  });
});