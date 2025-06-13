import { lambdaHandler } from '../../app';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

// Mock de los repositorios
jest.mock('../../infrastructure/repositories', () => ({
  financeRepository: {},
  driverRepository: {}
}));

// Mock del controlador
jest.mock('../../infrastructure/controllers/finance-controller', () => {
  return {
    FinanceController: jest.fn().mockImplementation(() => ({
      handleRequest: jest.fn().mockImplementation(async () => ({
        statusCode: 200,
        body: JSON.stringify({ success: true }),
        headers: { 'Content-Type': 'application/json' }
      }))
    }))
  };
});

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

describe('App Lambda Handler', () => {
  let mockEvent: APIGatewayProxyEvent;
  
  beforeEach(() => {
    // Crear un evento mock básico
    mockEvent = {
      httpMethod: 'GET',
      path: '/finance/income-report',
      headers: {},
      multiValueHeaders: {},
      queryStringParameters: { startDate: '2023-01-01', endDate: '2023-01-31' },
      multiValueQueryStringParameters: null,
      pathParameters: null,
      stageVariables: null,
      requestContext: {} as any,
      resource: '',
      body: null,
      isBase64Encoded: false
    };
    
    // Limpiar mocks
    jest.clearAllMocks();
  });
  
  it('debería manejar solicitudes OPTIONS para CORS preflight', async () => {
    // Arrange
    const optionsEvent: APIGatewayProxyEvent = {
      ...mockEvent,
      httpMethod: 'OPTIONS'
    };
    
    // Act
    const result = await lambdaHandler(optionsEvent);
    
    // Assert
    expect(result.statusCode).toBe(200);
    expect(result.headers).toEqual({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
    });
    expect(result.body).toBe('');
  });
  
  it('debería delegar solicitudes no-OPTIONS al controlador', async () => {
    // Act
    const result = await lambdaHandler(mockEvent);
    
    // Assert
    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body)).toEqual({ success: true });
  });
});