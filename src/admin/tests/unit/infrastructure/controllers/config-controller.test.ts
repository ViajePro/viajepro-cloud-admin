import { ConfigController } from '../../../../infrastructure/controllers/config-controller';
import { GetTravelCostConfigUseCase } from '../../../../application/usecases/get-travel-cost-config-use-case';
import { UpdateTravelCostConfigUseCase } from '../../../../application/usecases/update-travel-cost-config-use-case';
import { Result } from '../../../../application/result';
import { TravelCostConfig, DEFAULT_CONFIG_ID } from '../../../../domain/config';
import { APIGatewayProxyEvent } from 'aws-lambda';

// Mock del logger
jest.mock('../../../../infrastructure/logging/LoggerFactory', () => ({
  LoggerFactory: {
    getLogger: jest.fn().mockReturnValue({
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn()
    })
  }
}));

describe('ConfigController', () => {
  let controller: ConfigController;
  let mockGetTravelCostConfigUseCase: any;
  let mockUpdateTravelCostConfigUseCase: any;

  beforeEach(() => {
    mockGetTravelCostConfigUseCase = {
      execute: jest.fn()
    };

    mockUpdateTravelCostConfigUseCase = {
      execute: jest.fn()
    };

    controller = new ConfigController(
      mockGetTravelCostConfigUseCase,
      mockUpdateTravelCostConfigUseCase
    );
  });

  describe('handleRequest', () => {
    it('debería manejar GET /config/travel-cost', async () => {
      // Arrange
      const event = {
        path: '/config/travel-cost',
        httpMethod: 'GET',
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

      const mockConfig: TravelCostConfig = {
        configId: DEFAULT_CONFIG_ID,
        baseFare: 100,
        perKilometerRate: 10,
        driverCommissionPercentage: 80,
        updatedAt: new Date(),
        updatedBy: 'test-user'
      };

      mockGetTravelCostConfigUseCase.execute.mockResolvedValue(Result.ok(mockConfig));

      // Act
      const response = await controller.handleRequest(event);

      // Assert
      expect(response.statusCode).toBe(200);
      const responseBody = JSON.parse(response.body);
      expect(responseBody.success).toBe(true);
      expect(responseBody.data).toEqual(expect.objectContaining({
        configId: DEFAULT_CONFIG_ID,
        baseFare: 100,
        perKilometerRate: 10,
        driverCommissionPercentage: 80
      }));
      expect(mockGetTravelCostConfigUseCase.execute).toHaveBeenCalled();
    });

    it('debería manejar PUT /config/travel-cost', async () => {
      // Arrange
      const configInput = {
        baseFare: 120,
        perKilometerRate: 15,
        driverCommissionPercentage: 75
      };

      const event = {
        path: '/config/travel-cost',
        httpMethod: 'PUT',
        body: JSON.stringify(configInput),
        headers: {},
        multiValueHeaders: {},
        isBase64Encoded: false,
        pathParameters: null,
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
        stageVariables: null,
        requestContext: {
          authorizer: {
            claims: {
              email: 'test@example.com'
            }
          }
        } as any,
        resource: ''
      } as APIGatewayProxyEvent;

      const mockConfig: TravelCostConfig = {
        configId: DEFAULT_CONFIG_ID,
        baseFare: 120,
        perKilometerRate: 15,
        driverCommissionPercentage: 75,
        updatedAt: new Date(),
        updatedBy: 'test@example.com'
      };

      mockUpdateTravelCostConfigUseCase.execute.mockResolvedValue(Result.ok(mockConfig));

      // Act
      const response = await controller.handleRequest(event);

      // Assert
      expect(response.statusCode).toBe(200);
      const responseBody = JSON.parse(response.body);
      expect(responseBody.success).toBe(true);
      expect(responseBody.data).toEqual(expect.objectContaining({
        message: 'Configuración actualizada correctamente',
        config: expect.objectContaining({
          configId: DEFAULT_CONFIG_ID,
          baseFare: 120,
          perKilometerRate: 15,
          driverCommissionPercentage: 75
        })
      }));
      expect(mockUpdateTravelCostConfigUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          baseFare: 120,
          perKilometerRate: 15,
          driverCommissionPercentage: 75,
          updatedBy: 'test@example.com'
        })
      );
    });

    it('debería manejar errores en GET /config/travel-cost', async () => {
      // Arrange
      const event = {
        path: '/config/travel-cost',
        httpMethod: 'GET',
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

      mockGetTravelCostConfigUseCase.execute.mockResolvedValue(
        Result.fail('No se encontró configuración')
      );

      // Act
      const response = await controller.handleRequest(event);

      // Assert
      expect(response.statusCode).toBe(404);
      const responseBody = JSON.parse(response.body);
      expect(responseBody.success).toBe(false);
      expect(responseBody.error).toBe('No se encontró configuración');
    });

    it('debería manejar errores en PUT /config/travel-cost', async () => {
      // Arrange
      const configInput = {
        baseFare: -10, // Valor inválido
        perKilometerRate: 15,
        driverCommissionPercentage: 75
      };

      const event = {
        path: '/config/travel-cost',
        httpMethod: 'PUT',
        body: JSON.stringify(configInput),
        headers: {},
        multiValueHeaders: {},
        isBase64Encoded: false,
        pathParameters: null,
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
        stageVariables: null,
        requestContext: {
          authorizer: {
            claims: {}
          }
        } as any,
        resource: ''
      } as APIGatewayProxyEvent;

      mockUpdateTravelCostConfigUseCase.execute.mockResolvedValue(
        Result.fail('Datos de configuración inválidos')
      );

      // Act
      const response = await controller.handleRequest(event);

      // Assert
      expect(response.statusCode).toBe(400);
      const responseBody = JSON.parse(response.body);
      expect(responseBody.success).toBe(false);
      expect(responseBody.error).toBe('Datos de configuración inválidos');
    });

    it('debería manejar errores de formato JSON en PUT /config/travel-cost', async () => {
      // Arrange
      const event = {
        path: '/config/travel-cost',
        httpMethod: 'PUT',
        body: '{invalid-json',
        headers: {},
        multiValueHeaders: {},
        isBase64Encoded: false,
        pathParameters: null,
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
        stageVariables: null,
        requestContext: {
          authorizer: {
            claims: {}
          }
        } as any,
        resource: ''
      } as APIGatewayProxyEvent;

      // Act
      const response = await controller.handleRequest(event);

      // Assert
      expect(response.statusCode).toBe(400);
      const responseBody = JSON.parse(response.body);
      expect(responseBody.success).toBe(false);
    });

    it('debería manejar solicitudes sin cuerpo en PUT /config/travel-cost', async () => {
      // Arrange
      const event = {
        path: '/config/travel-cost',
        httpMethod: 'PUT',
        body: null,
        headers: {},
        multiValueHeaders: {},
        isBase64Encoded: false,
        pathParameters: null,
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
        stageVariables: null,
        requestContext: {
          authorizer: {
            claims: {}
          }
        } as any,
        resource: ''
      } as APIGatewayProxyEvent;

      // Act
      const response = await controller.handleRequest(event);

      // Assert
      expect(response.statusCode).toBe(400);
      const responseBody = JSON.parse(response.body);
      expect(responseBody.success).toBe(false);
      expect(responseBody.error).toBe('Se requiere cuerpo en la solicitud');
    });

    it('debería devolver 404 para rutas no encontradas', async () => {
      // Arrange
      const event = {
        path: '/config/invalid-path',
        httpMethod: 'GET',
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
      const response = await controller.handleRequest(event);

      // Assert
      expect(response.statusCode).toBe(404);
      const responseBody = JSON.parse(response.body);
      expect(responseBody.success).toBe(false);
      expect(responseBody.error).toBe('Ruta no encontrada');
    });
  });
});