import { withErrorHandler } from '../../../../infrastructure/middlewares/error-handler';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ResponseFormatter } from '../../../../infrastructure/api/response-formatter';
import { 
  ApplicationError, 
  ValidationError, 
  NotFoundError, 
  UnauthorizedError, 
  ForbiddenError 
} from '../../../../domain/errors';

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

// Mock del ResponseFormatter
jest.mock('../../../../infrastructure/api/response-formatter', () => ({
  ResponseFormatter: {
    error: jest.fn().mockImplementation((message, statusCode) => ({
      statusCode,
      body: JSON.stringify({ message }),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization'
      }
    }))
  }
}));

describe('Error Handler Middleware', () => {
  let mockEvent: APIGatewayProxyEvent;
  
  beforeEach(() => {
    // Crear un evento mock básico
    mockEvent = {
      httpMethod: 'GET',
      path: '/test',
      headers: {},
      multiValueHeaders: {},
      queryStringParameters: null,
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
  
  it('debería pasar la respuesta del handler si no hay errores', async () => {
    // Arrange
    const expectedResponse: APIGatewayProxyResult = {
      statusCode: 200,
      body: JSON.stringify({ success: true }),
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    const mockHandler = jest.fn().mockResolvedValue(expectedResponse);
    const wrappedHandler = withErrorHandler(mockHandler);
    
    // Act
    const result = await wrappedHandler(mockEvent);
    
    // Assert
    expect(mockHandler).toHaveBeenCalledWith(mockEvent);
    expect(result).toBe(expectedResponse);
    expect(ResponseFormatter.error).not.toHaveBeenCalled();
  });
  
  it('debería manejar ValidationError con código 400', async () => {
    // Arrange
    const errorMessage = 'Datos inválidos';
    const mockHandler = jest.fn().mockImplementation(() => {
      throw new ValidationError(errorMessage);
    });
    
    const wrappedHandler = withErrorHandler(mockHandler);
    
    // Act
    const result = await wrappedHandler(mockEvent);
    
    // Assert
    expect(mockHandler).toHaveBeenCalledWith(mockEvent);
    expect(ResponseFormatter.error).toHaveBeenCalledWith(
      errorMessage,
      400,
      expect.any(ValidationError)
    );
    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body).message).toBe(errorMessage);
  });
  
  it('debería manejar NotFoundError con código 404', async () => {
    // Arrange
    const errorMessage = 'Recurso no encontrado';
    const mockHandler = jest.fn().mockImplementation(() => {
      throw new NotFoundError(errorMessage);
    });
    
    const wrappedHandler = withErrorHandler(mockHandler);
    
    // Act
    const result = await wrappedHandler(mockEvent);
    
    // Assert
    expect(mockHandler).toHaveBeenCalledWith(mockEvent);
    expect(ResponseFormatter.error).toHaveBeenCalledWith(
      errorMessage,
      404,
      expect.any(NotFoundError)
    );
    expect(result.statusCode).toBe(404);
    expect(JSON.parse(result.body).message).toBe(errorMessage);
  });
  
  it('debería manejar UnauthorizedError con código 401', async () => {
    // Arrange
    const errorMessage = 'No autorizado';
    const mockHandler = jest.fn().mockImplementation(() => {
      throw new UnauthorizedError(errorMessage);
    });
    
    const wrappedHandler = withErrorHandler(mockHandler);
    
    // Act
    const result = await wrappedHandler(mockEvent);
    
    // Assert
    expect(mockHandler).toHaveBeenCalledWith(mockEvent);
    expect(ResponseFormatter.error).toHaveBeenCalledWith(
      errorMessage,
      401,
      expect.any(UnauthorizedError)
    );
    expect(result.statusCode).toBe(401);
    expect(JSON.parse(result.body).message).toBe(errorMessage);
  });
  
  it('debería manejar ForbiddenError con código 403', async () => {
    // Arrange
    const errorMessage = 'Acceso prohibido';
    const mockHandler = jest.fn().mockImplementation(() => {
      throw new ForbiddenError(errorMessage);
    });
    
    const wrappedHandler = withErrorHandler(mockHandler);
    
    // Act
    const result = await wrappedHandler(mockEvent);
    
    // Assert
    expect(mockHandler).toHaveBeenCalledWith(mockEvent);
    expect(ResponseFormatter.error).toHaveBeenCalledWith(
      errorMessage,
      403,
      expect.any(ForbiddenError)
    );
    expect(result.statusCode).toBe(403);
    expect(JSON.parse(result.body).message).toBe(errorMessage);
  });
  
  it('debería manejar ApplicationError con código 400', async () => {
    // Arrange
    const errorMessage = 'Error de aplicación';
    const mockHandler = jest.fn().mockImplementation(() => {
      throw new ApplicationError(errorMessage);
    });
    
    const wrappedHandler = withErrorHandler(mockHandler);
    
    // Act
    const result = await wrappedHandler(mockEvent);
    
    // Assert
    expect(mockHandler).toHaveBeenCalledWith(mockEvent);
    expect(ResponseFormatter.error).toHaveBeenCalledWith(
      errorMessage,
      400,
      expect.any(ApplicationError)
    );
    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body).message).toBe(errorMessage);
  });
  
  it('debería manejar errores desconocidos con código 500', async () => {
    // Arrange
    const mockHandler = jest.fn().mockImplementation(() => {
      throw new Error('Error inesperado');
    });
    
    const wrappedHandler = withErrorHandler(mockHandler);
    
    // Act
    const result = await wrappedHandler(mockEvent);
    
    // Assert
    expect(mockHandler).toHaveBeenCalledWith(mockEvent);
    expect(ResponseFormatter.error).toHaveBeenCalledWith(
      'Error interno del servidor',
      500,
      expect.any(Error)
    );
    expect(result.statusCode).toBe(500);
    expect(JSON.parse(result.body).message).toBe('Error interno del servidor');
  });
  
  it('debería manejar errores sin mensaje con mensajes por defecto', async () => {
    // Arrange
    const mockHandler = jest.fn().mockImplementation(() => {
      const error = new ValidationError('');
      error.message = ''; // Forzar mensaje vacío
      throw error;
    });
    
    const wrappedHandler = withErrorHandler(mockHandler);
    
    // Act
    const result = await wrappedHandler(mockEvent);
    
    // Assert
    expect(mockHandler).toHaveBeenCalledWith(mockEvent);
    expect(ResponseFormatter.error).toHaveBeenCalledWith(
      'Error de validación',
      400,
      expect.any(ValidationError)
    );
    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body).message).toBe('Error de validación');
  });
});