import { ResponseFormatter } from '../../../../infrastructure/api/response-formatter';
import { config } from '../../../../config';

describe('ResponseFormatter', () => {
  let originalConfig: any;
  
  beforeEach(() => {
    // Guardar la configuración original
    originalConfig = { ...config };
  });
  
  afterEach(() => {
    // Restaurar la configuración original
    Object.assign(config, originalConfig);
  });
  
  describe('success', () => {
    it('debería formatear una respuesta exitosa con código 200 por defecto', () => {
      // Arrange
      const data = { id: '123', name: 'Test' };
      
      // Act
      const response = ResponseFormatter.success(data);
      
      // Assert
      expect(response.statusCode).toBe(200);
      expect(response.headers).toEqual({
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization'
      });
      expect(JSON.parse(response.body)).toEqual(data);
    });
    
    it('debería permitir especificar un código de estado personalizado', () => {
      // Arrange
      const data = { id: '123', name: 'Test' };
      const statusCode = 201;
      
      // Act
      const response = ResponseFormatter.success(data, statusCode);
      
      // Assert
      expect(response.statusCode).toBe(statusCode);
      expect(JSON.parse(response.body)).toEqual(data);
    });
    
    it('debería manejar datos primitivos', () => {
      // Arrange
      const data = 'Mensaje de éxito';
      
      // Act
      const response = ResponseFormatter.success(data);
      
      // Assert
      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.body)).toBe(data);
    });
    
    it('debería manejar arrays', () => {
      // Arrange
      const data = [{ id: '1', name: 'Item 1' }, { id: '2', name: 'Item 2' }];
      
      // Act
      const response = ResponseFormatter.success(data);
      
      // Assert
      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.body)).toEqual(data);
    });
  });
  
  describe('error', () => {
    it('debería formatear una respuesta de error con código 400 por defecto', () => {
      // Arrange
      const message = 'Error de validación';
      
      // Act
      const response = ResponseFormatter.error(message);
      
      // Assert
      expect(response.statusCode).toBe(400);
      expect(response.headers).toEqual({
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization'
      });
      expect(JSON.parse(response.body)).toEqual({ message });
    });
    
    it('debería permitir especificar un código de estado personalizado', () => {
      // Arrange
      const message = 'No encontrado';
      const statusCode = 404;
      
      // Act
      const response = ResponseFormatter.error(message, statusCode);
      
      // Assert
      expect(response.statusCode).toBe(statusCode);
      expect(JSON.parse(response.body)).toEqual({ message });
    });
    
    it('debería incluir detalles del error en entorno local', () => {
      // Arrange
      const message = 'Error interno';
      const error = new Error('Detalles del error');
      error.stack = 'Stack simulado';
      
      // Simular entorno local
      config.isLocal = true;
      
      // Act
      const response = ResponseFormatter.error(message, 500, error);
      
      // Assert
      expect(response.statusCode).toBe(500);
      const body = JSON.parse(response.body);
      expect(body.message).toBe(message);
      expect(body.error).toBe('Detalles del error');
      expect(body.stack).toBe('Stack simulado');
    });
    
    it('no debería incluir detalles del error en entorno de producción', () => {
      // Arrange
      const message = 'Error interno';
      const error = new Error('Detalles del error');
      
      // Simular entorno de producción
      config.isLocal = false;
      
      // Act
      const response = ResponseFormatter.error(message, 500, error);
      
      // Assert
      expect(response.statusCode).toBe(500);
      const body = JSON.parse(response.body);
      expect(body.message).toBe(message);
      expect(body.error).toBeUndefined();
      expect(body.stack).toBeUndefined();
    });
    
    it('debería manejar errores que no son instancias de Error', () => {
      // Arrange
      const message = 'Error interno';
      const error = { code: 'DB_ERROR', details: 'Conexión perdida' };
      
      // Simular entorno local
      config.isLocal = true;
      
      // Act
      const response = ResponseFormatter.error(message, 500, error);
      
      // Assert
      expect(response.statusCode).toBe(500);
      const body = JSON.parse(response.body);
      expect(body.message).toBe(message);
      expect(body.error).toBeUndefined();
      expect(body.stack).toBeUndefined();
    });
  });
});