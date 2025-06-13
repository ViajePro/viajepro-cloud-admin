import {
  ApplicationError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  DriverNotFoundError,
  DebtNotFoundError
} from '../../../domain/errors';

describe('Domain Errors', () => {
  describe('ApplicationError', () => {
    it('debería crear un error de aplicación con el mensaje correcto', () => {
      // Arrange & Act
      const message = 'Error de aplicación';
      const error = new ApplicationError(message);
      
      // Assert
      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('ApplicationError');
      expect(error.message).toBe(message);
    });
  });
  
  describe('ValidationError', () => {
    it('debería crear un error de validación con el mensaje correcto', () => {
      // Arrange & Act
      const message = 'Error de validación';
      const error = new ValidationError(message);
      
      // Assert
      expect(error).toBeInstanceOf(ApplicationError);
      expect(error.name).toBe('ValidationError');
      expect(error.message).toBe(message);
      expect(error.details).toBeUndefined();
    });
    
    it('debería crear un error de validación con detalles', () => {
      // Arrange & Act
      const message = 'Error de validación';
      const details = { field: 'nombre', error: 'Campo requerido' };
      const error = new ValidationError(message, details);
      
      // Assert
      expect(error).toBeInstanceOf(ApplicationError);
      expect(error.name).toBe('ValidationError');
      expect(error.message).toBe(message);
      expect(error.details).toEqual(details);
    });
  });
  
  describe('NotFoundError', () => {
    it('debería crear un error de no encontrado con el mensaje correcto', () => {
      // Arrange & Act
      const message = 'Recurso no encontrado';
      const error = new NotFoundError(message);
      
      // Assert
      expect(error).toBeInstanceOf(ApplicationError);
      expect(error.name).toBe('NotFoundError');
      expect(error.message).toBe(message);
    });
  });
  
  describe('UnauthorizedError', () => {
    it('debería crear un error de no autorizado con el mensaje correcto', () => {
      // Arrange & Act
      const message = 'No autorizado';
      const error = new UnauthorizedError(message);
      
      // Assert
      expect(error).toBeInstanceOf(ApplicationError);
      expect(error.name).toBe('UnauthorizedError');
      expect(error.message).toBe(message);
    });
  });
  
  describe('ForbiddenError', () => {
    it('debería crear un error de prohibido con el mensaje correcto', () => {
      // Arrange & Act
      const message = 'Acceso prohibido';
      const error = new ForbiddenError(message);
      
      // Assert
      expect(error).toBeInstanceOf(ApplicationError);
      expect(error.name).toBe('ForbiddenError');
      expect(error.message).toBe(message);
    });
  });
  
  describe('DriverNotFoundError', () => {
    it('debería crear un error de chofer no encontrado con el mensaje correcto', () => {
      // Arrange & Act
      const driverId = '123e4567-e89b-12d3-a456-426614174000';
      const error = new DriverNotFoundError(driverId);
      
      // Assert
      expect(error).toBeInstanceOf(NotFoundError);
      expect(error.name).toBe('NotFoundError');
      expect(error.message).toBe(`No se encontró el chofer con ID ${driverId}`);
    });
  });
  
  describe('DebtNotFoundError', () => {
    it('debería crear un error de deuda no encontrada con el mensaje correcto', () => {
      // Arrange & Act
      const driverId = '123e4567-e89b-12d3-a456-426614174000';
      const error = new DebtNotFoundError(driverId);
      
      // Assert
      expect(error).toBeInstanceOf(NotFoundError);
      expect(error.name).toBe('NotFoundError');
      expect(error.message).toBe(`No se encontró deuda para el chofer con ID ${driverId}`);
    });
  });
});